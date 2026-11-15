import { activeDB } from "../../apiUtils/dataControl/conn";
import { magicRandomStr } from "../../apiUtils/dataControl/dataUtils";

/*
 * Posts parsed messages into Account / Wallet money in & out.
 * Every posted row carries a signature in link_ref:  SMS|<batch>|<message record_id>[|fee]
 * and the message keeps synced_on / sync_batch / synced_type / synced_id, so a whole sync can be undone.
 */
const T = (n) => `\`${activeDB}\`.\`${n}\``;
const p2 = (n) => String(n).padStart(2, "0");

export const newBatchId = () => {
  const d = new Date();
  return `SYNC-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}-${magicRandomStr(3)}`;
};

async function post(conn, kind, row, amount, category, link, hive) {
  const id = magicRandomStr(7);
  const ref = row.txn_code + (row.ref_no || row.counterparty_name ? ` ${row.ref_no || row.counterparty_name}` : "");
  await conn.execute(
    `INSERT INTO ${T(`accounts_money_${kind}`)} (record_id, date, amount, category, ref_no, account_id, wallet_id, link_ref, hive_site_id, hive_site_name) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, row.sms_date, amount, category, ref, row.account_id || "", row.wallet_id || "", link, hive.id, hive.name]
  );
  if (row.wallet_id) {
    await conn.execute(
      `INSERT INTO ${T(`wallets_money_${kind}`)} (record_id, date, amount, category, ref_no, wallet_id, link_ref, hive_site_id, hive_site_name) VALUES (?,?,?,?,?,?,?,?,?)`,
      [magicRandomStr(7), row.sms_date, amount, category, ref, row.wallet_id, link, hive.id, hive.name]
    );
  }
  return id;
}

// Syncs every pending message that has a direction, an amount and an account.
export async function syncPending(conn, hive) {
  const [rows] = await conn.execute(
    `SELECT record_id, sms_date, direction, amount, txn_cost, category, ref_no, txn_code, counterparty_name, account_id, wallet_id
     FROM ${T("sms_inbox")} WHERE hive_site_id=? AND synced='pending' AND direction IN ('in','out') AND amount>0 AND sms_date IS NOT NULL
       AND txn_code IS NOT NULL AND txn_code<>'' AND (synced_id IS NULL OR synced_id='')`,
    [hive.id]
  );
  // ref (txn code), amount, date and in/out are enough; category, account and wallet may stay empty
  const ready = rows;
  if (!ready.length) return { batch: null, synced: 0, fees: 0, waiting_no_account: 0 };

  const batch = newBatchId();
  let fees = 0;
  await conn.beginTransaction();
  try {
    for (const r of ready) {
      const kind = r.direction === "in" ? "in" : "out";
      const link = `SMS|${batch}|${r.record_id}`;
      const id = await post(conn, kind, r, r.amount, r.category || "", link, hive);
      if (kind === "out" && Number(r.txn_cost) > 0) {
        await post(conn, "out", r, r.txn_cost, "Transaction fee", `${link}|fee`, hive);
        fees++;
      }
      await conn.execute(
        `UPDATE ${T("sms_inbox")} SET synced='synced', synced_type=?, synced_id=?, synced_on=NOW(), sync_batch=? WHERE record_id=? AND hive_site_id=?`,
        [`money_${kind}`, id, batch, r.record_id, hive.id]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  }
  return { batch, synced: ready.length, fees, waiting_no_account: rows.length - ready.length };
}

// batch = a SYNC-... id, or "all" (every SMS-posted row). Removes the money rows and puts the messages back to pending.
export async function undoSync(conn, hive, batch) {
  const like = batch === "all" ? "SMS|%" : `SMS|${batch}|%`;
  await conn.beginTransaction();
  try {
    let removed = 0;
    for (const t of ["accounts_money_in", "accounts_money_out", "wallets_money_in", "wallets_money_out"]) {
      const [r] = await conn.execute(`DELETE FROM ${T(t)} WHERE hive_site_id=? AND link_ref LIKE ?`, [hive.id, like]);
      removed += r.affectedRows;
    }
    const where = batch === "all" ? "sync_batch IS NOT NULL AND sync_batch<>''" : "sync_batch=?";
    const [u] = await conn.execute(
      `UPDATE ${T("sms_inbox")} SET synced='pending', synced_type=NULL, synced_id=NULL, synced_on=NULL, sync_batch=NULL WHERE hive_site_id=? AND synced='synced' AND ${where}`,
      batch === "all" ? [hive.id] : [hive.id, batch]
    );
    await conn.commit();
    return { messages: u.affectedRows, removed };
  } catch (e) {
    await conn.rollback();
    throw e;
  }
}

export async function listBatches(conn, hive) {
  const [rows] = await conn.execute(
    `SELECT sync_batch AS batch, COUNT(*) AS messages, MAX(synced_on) AS synced_on
     FROM ${T("sms_inbox")} WHERE hive_site_id=? AND synced='synced' AND sync_batch IS NOT NULL AND sync_batch<>''
     GROUP BY sync_batch ORDER BY MAX(synced_on) DESC LIMIT 20`,
    [hive.id]
  );
  return rows;
}
