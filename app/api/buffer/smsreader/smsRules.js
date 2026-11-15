import { activeDB } from "../../apiUtils/dataControl/conn";
import { magicRandomStr } from "../../apiUtils/dataControl/dataUtils";

/*
 * Keyword tables (each row = one target + a list of keywords separated by |):
 *   sms_skip_words      keywords                   -> message is skipped
 *   sms_category_words  category,   keywords       -> fills category
 *   sms_account_words   account_id, keywords       -> fills account
 *   sms_wallet_words    wallet_id,  keywords       -> fills wallet
 * Keywords are matched (case-insensitive, "contains") against the message text + counterparty name.
 * The pipe | is the separator so names that contain commas stay intact.
 * When several rows match, the row with the LONGEST matching keyword wins. Fields already filled are never overwritten.
 */

export const TABLES = {
  skip: { name: "sms_skip_words", target: null },
  category: { name: "sms_category_words", target: "category" },
  account: { name: "sms_account_words", target: "account_id" },
  wallet: { name: "sms_wallet_words", target: "wallet_id" },
};
const SEEN_TABLE = "sms_ai_seen";
let ready = false;

const base = (extra) => `
  \`primkey\` int(11) PRIMARY KEY AUTO_INCREMENT,
  \`record_id\` varchar(100) NOT NULL,
  ${extra}
  \`keywords\` text,
  \`hive_site_id\` varchar(100),
  \`hive_site_name\` varchar(255),
  \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
  KEY \`idx_hive\` (\`hive_site_id\`)`;

export async function ensureKeywordTables(conn) {
  if (ready) return;
  const defs = [
    [TABLES.skip.name, ""],
    [TABLES.category.name, "`category` varchar(100),"],
    [TABLES.account.name, "`account_id` varchar(100),"],
    [TABLES.wallet.name, "`wallet_id` varchar(100),"],
  ];
  for (const [name, extra] of defs) {
    await conn.execute(`CREATE TABLE IF NOT EXISTS \`${activeDB}\`.\`${name}\` (${base(extra)})`);
  }
  // names the AI already looked at and could not place - never asked twice
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`${activeDB}\`.\`${SEEN_TABLE}\` (
    \`primkey\` int(11) PRIMARY KEY AUTO_INCREMENT,
    \`name_key\` varchar(255) NOT NULL,
    \`hive_site_id\` varchar(100),
    \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_seen\` (\`hive_site_id\`, \`name_key\`))`);
  ready = true;
}

const BANKS = ["equity", "kcb", "co-op", "cooperative bank", "ncba", "absa", "stanbic", "i&m", "diamond trust", "dtb", "family bank", "standard chartered", "sidian", "hf group", "national bank"];
const SEED_CATEGORIES = {
  "Bank transfer": BANKS,
  Fuel: ["shell", "total energies", "rubis", "petrocity", "kenol"],
  Shopping: ["naivas", "quickmart", "carrefour", "chandarana", "tuskys"],
  Utilities: ["kplc", "kenya power", "nairobi water", "nairobi city water"],
  "Airtime & Data": ["safaricom offers", "airtime"],
  Transport: ["uber", "bolt"],
};

async function seedIfEmpty(conn, hive) {
  for (const t of Object.values(TABLES)) {
    const [[{ n }]] = await conn.execute(`SELECT COUNT(*) n FROM \`${activeDB}\`.\`${t.name}\` WHERE hive_site_id=?`, [hive.id]);
    if (n > 0) return; // the site already has keywords somewhere - never re-seed
  }
  for (const [category, words] of Object.entries(SEED_CATEGORIES)) {
    await conn.execute(
      `INSERT INTO \`${activeDB}\`.\`${TABLES.category.name}\` (record_id, category, keywords, hive_site_id, hive_site_name) VALUES (?,?,?,?,?)`,
      [magicRandomStr(7), category, words.join("|"), hive.id, hive.name]
    );
  }
}

const splitWords = (s) => String(s || "").split("|").map((w) => w.trim()).filter(Boolean);

// -> { skip:[{id,target,words}], category:[...], account:[...], wallet:[...] }
export async function loadKeywords(conn, hive) {
  await ensureKeywordTables(conn);
  await seedIfEmpty(conn, hive);
  const out = {};
  for (const [kind, t] of Object.entries(TABLES)) {
    const [rows] = await conn.execute(`SELECT * FROM \`${activeDB}\`.\`${t.name}\` WHERE hive_site_id=?`, [hive.id]);
    out[kind] = rows.map((r) => ({ id: r.record_id, target: t.target ? r[t.target] : "", words: splitWords(r.keywords) }));
  }
  return out;
}

const squash = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// "KPLC PREPAID 5460.." -> "kplc prepaid"  (digits / punctuation stripped so repeat payers share one keyword)
export function counterpartyKey(name) {
  return String(name || "").toLowerCase().replace(/[\d*#()]+/g, " ").replace(/[^a-z&' ]+/g, " ").replace(/\s+/g, " ").trim();
}

const prep = (text) => ({ raw: squash(text), norm: counterpartyKey(text) });

// length of the match (0 = no match). Tries the text as written, then with digits/punctuation stripped (so "RAILWAYS-NRB(HQ)" still matches "railways nrb hq").
function matchLen(word, t) {
  const w = squash(word);
  if (!w) return 0;
  if (t.raw.includes(w)) return w.length;
  const n = counterpartyKey(word);
  return n.length >= 3 && t.norm.includes(n) ? n.length : 0;
}

// best row = the one holding the longest matching keyword
function best(rows, t) {
  let hit = null, len = 0;
  for (const r of rows) {
    for (const w of r.words) {
      const l = matchLen(w, t);
      if (l > len) { len = l; hit = { row: r, word: w }; }
    }
  }
  return hit;
}

// Everything below is what is already "known" (used by AI analyse so it never asks about a covered name).
export function allKnownWords(kw) {
  return [...kw.category, ...kw.account, ...kw.wallet].flatMap((r) => r.words.map(counterpartyKey)).filter(Boolean);
}

// ctx: {sender, body, counterparty}. Skip first, then category / account / wallet.
export async function enrich(conn, kw, hive, cache, ctx, direction) {
  const out = { synced: "pending", skip_reason: null, category: "", account_id: "", wallet_id: "", rule_id: "" };
  const senderAccount = await resolveSenderAccount(conn, hive.id, hive.name, ctx.sender, cache); // every sender gets an account
  const t = prep(`${ctx.body || ""} ${ctx.counterparty || ""}`);

  const skip = best(kw.skip, t);
  if (skip) {
    Object.assign(out, { synced: "skipped", skip_reason: `Skip word: ${skip.word}`, rule_id: skip.row.id, account_id: senderAccount });
    return { out };
  }
  if (!direction) {
    Object.assign(out, { synced: "skipped", skip_reason: "No transaction detected", account_id: senderAccount });
    return { out };
  }

  const cat = best(kw.category, t), acc = best(kw.account, t), wal = best(kw.wallet, t);
  out.category = cat?.row.target || "";
  out.account_id = acc?.row.target || senderAccount;
  out.wallet_id = wal?.row.target || "";
  out.rule_id = [cat, acc, wal].filter(Boolean).map((h) => h.row.id).join(",");
  return { out };
}

// Account named after the SMS sender (MPESA, EQUITY, I&M ...), created on first sight.
export async function resolveSenderAccount(conn, hiveId, hiveName, sender, cache) {
  const key = squash(sender);
  if (!key) return "";
  if (cache.has(key)) return cache.get(key);
  const [rows] = await conn.execute(
    `SELECT record_id FROM \`${activeDB}\`.\`accounts_list\` WHERE hive_site_id=? AND LOWER(account_name)=? LIMIT 1`,
    [hiveId, key]
  );
  let id = rows[0]?.record_id;
  if (!id) {
    id = magicRandomStr(7);
    const type = /m-?pesa|airtel|t-?kash/.test(key) ? "Mobile Money" : /bank|equity|kcb|i&m|ncba|absa|stanbic|dtb|co-?op|family|sidian|hf/.test(key) ? "Bank" : "Other";
    await conn.execute(
      `INSERT INTO \`${activeDB}\`.\`accounts_list\` (record_id, account_name, account_type, account_code, remark, hive_site_id, hive_site_name)
       VALUES (?,?,?,?,?,?,?)`,
      [id, String(sender).trim(), type, String(sender).trim(), "Auto-created from SMS sender", hiveId, hiveName]
    );
  }
  cache.set(key, id);
  return id;
}

// Appends `word` to the keyword row for (kind, target); creates the row if the target has none yet.
export async function addKeyword(conn, kind, target, word, hive) {
  const t = TABLES[kind];
  const [rows] = await conn.execute(
    `SELECT record_id, keywords FROM \`${activeDB}\`.\`${t.name}\` WHERE hive_site_id=? AND LOWER(${t.target})=? LIMIT 1`,
    [hive.id, String(target).toLowerCase()]
  );
  if (rows.length) {
    const words = splitWords(rows[0].keywords);
    if (words.some((w) => squash(w) === squash(word))) return;
    await conn.execute(`UPDATE \`${activeDB}\`.\`${t.name}\` SET keywords=? WHERE record_id=?`, [[...words, word].join("|"), rows[0].record_id]);
  } else {
    await conn.execute(
      `INSERT INTO \`${activeDB}\`.\`${t.name}\` (record_id, ${t.target}, keywords, hive_site_id, hive_site_name) VALUES (?,?,?,?,?)`,
      [magicRandomStr(7), target, word, hive.id, hive.name]
    );
  }
}

export async function seenKeys(conn, hiveId) {
  await ensureKeywordTables(conn);
  const [rows] = await conn.execute(`SELECT name_key FROM \`${activeDB}\`.\`${SEEN_TABLE}\` WHERE hive_site_id=?`, [hiveId]);
  return new Set(rows.map((r) => r.name_key));
}

export async function markSeen(conn, hiveId, key) {
  await conn.execute(`INSERT IGNORE INTO \`${activeDB}\`.\`${SEEN_TABLE}\` (name_key, hive_site_id) VALUES (?,?)`, [key, hiveId]);
}

// Fresh re-sync of every message not yet synced: the latest keywords win for category, account and wallet. A value is only kept when no keyword matches it.
export async function reapplyForHive(conn, hive) {
  const kw = await loadKeywords(conn, hive);
  const cache = new Map();
  const [rows] = await conn.execute(
    `SELECT primkey, sender, body, counterparty_name, direction, category, account_id, wallet_id
     FROM \`${activeDB}\`.\`sms_inbox\`
     WHERE hive_site_id=? AND synced IN ('pending','skipped') AND (synced_id IS NULL OR synced_id='')`,
    [hive.id]
  );
  let skipped = 0, pending = 0, changed = 0, uncategorised = 0;
  for (const r of rows) {
    const { out: e } = await enrich(conn, kw, hive, cache, { sender: r.sender, body: r.body, counterparty: r.counterparty_name }, r.direction);
    const next = { category: e.category || r.category, account_id: e.account_id || r.account_id, wallet_id: e.wallet_id || r.wallet_id };
    if (next.category !== (r.category || "") || next.account_id !== (r.account_id || "") || next.wallet_id !== (r.wallet_id || "")) changed++;
    if (e.synced !== "skipped" && !next.category) uncategorised++;
    await conn.execute(
      `UPDATE \`${activeDB}\`.\`sms_inbox\` SET synced=?, skip_reason=?, rule_id=?, category=?, account_id=?, wallet_id=? WHERE primkey=?`,
      [e.synced, e.skip_reason, e.rule_id, e.category || r.category, e.account_id || r.account_id, e.wallet_id || r.wallet_id, r.primkey]
    );
    e.synced === "skipped" ? skipped++ : pending++;
  }
  return { processed: rows.length, pending, skipped, changed, uncategorised };
}
