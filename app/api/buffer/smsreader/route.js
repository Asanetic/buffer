import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../auth/authManager";
import { loadKeywords, enrich } from "./smsRules";
import { syncPending } from "./syncCore";
import { magicRandomStr } from "../../apiUtils/dataControl/dataUtils";

const TABLE = "sms_inbox";
const LOG_TABLE = "sms_reader_logs";
let tableReady = false;
let logTableReady = false;

async function writeLog(l, ip) {
  let c;
  try {
    c = await connectDB();
    if (!logTableReady) {
      await c.execute(`CREATE TABLE IF NOT EXISTS \`${activeDB}\`.\`${LOG_TABLE}\` (
        \`primkey\` int(11) PRIMARY KEY AUTO_INCREMENT,
        \`record_id\` varchar(100) NOT NULL,
        \`status\` varchar(30),
        \`http_code\` int,
        \`message\` text,
        \`sender\` varchar(100),
        \`received\` int DEFAULT 0,
        \`inserted\` int DEFAULT 0,
        \`duplicates\` int DEFAULT 0,
        \`failed\` int DEFAULT 0,
        \`ip_address\` varchar(64),
        \`duration_ms\` int,
        \`hive_site_id\` varchar(100),
        \`hive_site_name\` varchar(255),
        \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP
      )`);
      logTableReady = true;
    }
    await c.execute(
      `INSERT INTO \`${activeDB}\`.\`${LOG_TABLE}\`
       (record_id, status, http_code, message, sender, received, inserted, duplicates, failed, ip_address, duration_ms, hive_site_id, hive_site_name)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [magicRandomStr(7), l.status, l.http, String(l.message || "").slice(0, 1000), l.sender, l.received, l.inserted,
       l.duplicates, l.failed, ip, Date.now() - l.t0, l.hive_site_id, l.hive_site_name]
    );
  } catch (e) {
    console.error("smsreader log error:", e.message);
  } finally {
    if (c) await c.end();
  }
}

async function ensureTable(conn) {
  if (tableReady) return;
  await conn.execute(`CREATE TABLE IF NOT EXISTS \`${activeDB}\`.\`${TABLE}\` (
    \`primkey\` int(11) PRIMARY KEY AUTO_INCREMENT,
    \`record_id\` varchar(100) NOT NULL,
    \`sender\` varchar(100),
    \`sms_id\` varchar(100),
    \`sms_hash\` varchar(64) NOT NULL,
    \`body\` text,
    \`sms_date\` datetime NULL,
    \`txn_code\` varchar(50),
    \`txn_type\` varchar(30),
    \`amount\` decimal(15,2),
    \`counterparty_name\` varchar(255),
    \`counterparty_phone\` varchar(30),
    \`balance\` decimal(15,2),
    \`parsed\` tinyint(1) DEFAULT 0,
    \`direction\` varchar(10),
    \`txn_cost\` decimal(15,2) DEFAULT 0.00,
    \`category\` varchar(100),
    \`ref_no\` varchar(100),
    \`account_id\` varchar(100),
    \`wallet_id\` varchar(100),
    \`synced\` varchar(20) DEFAULT 'pending',
    \`synced_type\` varchar(20),
    \`synced_id\` varchar(100),
    \`synced_on\` datetime NULL,
    \`sync_batch\` varchar(100),
    \`rule_id\` varchar(255),
    \`skip_reason\` varchar(255),
    \`hive_site_id\` varchar(100),
    \`hive_site_name\` varchar(255),
    \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY \`uq_sms_hash\` (\`sms_hash\`),
    KEY \`idx_txn_code\` (\`txn_code\`),
    KEY \`idx_synced_id\` (\`synced_id\`),
    KEY \`idx_sync_batch\` (\`sync_batch\`)
  )`);
  // upgrade tables created before these columns existed
  for (const [col, def] of [["hive_site_id", "varchar(100)"], ["hive_site_name", "varchar(255)"], ["direction", "varchar(10)"], ["txn_cost", "decimal(15,2) DEFAULT 0.00"], ["category", "varchar(100)"], ["ref_no", "varchar(100)"], ["account_id", "varchar(100)"], ["wallet_id", "varchar(100)"], ["synced", "varchar(20) DEFAULT 'pending'"], ["synced_type", "varchar(20)"], ["synced_id", "varchar(100)"], ["synced_on", "datetime NULL"], ["sync_batch", "varchar(100)"], ["rule_id", "varchar(255)"], ["skip_reason", "varchar(255)"]]) {
    const [r] = await conn.execute(`SHOW COLUMNS FROM \`${activeDB}\`.\`${TABLE}\` LIKE '${col}'`);
    if (!r.length) await conn.execute(`ALTER TABLE \`${activeDB}\`.\`${TABLE}\` ADD COLUMN \`${col}\` ${def}`);
  }
  tableReady = true;
}

const num = (s) => (s == null ? null : Number(String(s).replace(/,/g, "")));

// Parses M-PESA messages. Amount regex fragment reused below.
const AMT = "Ksh\\s?([\\d,]+(?:\\.\\d+)?)";
const rx = (src) => new RegExp(src.replace(/AMT/g, AMT), "i");
const IN_TYPES = new Set(["received", "reversal"]);

// Order matters: most specific first.
const PATTERNS = [
  ["received", rx("received\\s*AMT\\s*from\\s+(.+?)\\s+([\\d*]{4,14})\\s+on"), (m) => ({ name: m[2], phone: m[3] })],
  ["reversal", rx("reversal.*?AMT"), () => ({})],
  ["paybill", rx("AMT\\s*sent to\\s+(.+?)\\s+for account\\s+(\\S+)"), (m) => ({ name: m[2], account: m[3] })],
  ["sent", rx("AMT\\s*sent to\\s+(.+?)\\s+(\\d{9,12})"), (m) => ({ name: m[2], phone: m[3] })],
  ["paid", rx("AMT\\s*paid to\\s+(.+?)\\.?\\s+on\\s"), (m) => ({ name: m[2] })],
  ["transfer_out", rx("AMT\\s*transferred to\\s+(.+?)(?:\\s+(\\d{1,6}))?\\s+\\d{1,2}\\/\\d{1,2}\\/\\d{2}"), (m) => ({ name: m[2], phone: m[3] })],
  ["withdraw", rx("Withdraw\\s*AMT\\s*from\\s+(.+?)\\s+New"), (m) => ({ name: m[2] })],
  ["airtime", rx("(?:bought\\s*)?AMT\\s*of airtime(?:\\s*for\\s*(\\d{9,12}))?"), (m) => ({ phone: m[2] })],
  ["fuliza_repay", rx("AMT\\s*from your M-PESA has been used to .*?Fuliza"), () => ({ name: "Fuliza" })],
];

function parseMpesa(body = "") {
  const out = { txn_code: null, txn_type: null, amount: null, counterparty_name: null, counterparty_phone: null, account_ref: null, balance: null, txn_cost: 0, direction: null, parsed: 0 };
  const text = body.replace(/\s+/g, " ").trim();
  const bal = (t) => num(t.match(/M-PESA balance is\s*Ksh\s?([\d,]+(?:\.\d+)?)/i)?.[1]);

  const cancelled = text.match(rx("cancelled the transaction of\\s*AMT"));
  if (cancelled) {
    Object.assign(out, { txn_type: "cancelled", amount: num(cancelled[1]), balance: bal(text), parsed: 1 });
    return out;
  }

  const code = text.match(/^([A-Z0-9]{8,12})\s+Confirmed/i);
  if (!code) return out;
  out.txn_code = code[1].toUpperCase();
  out.balance = bal(text);

  for (const [type, re, pick] of PATTERNS) {
    const m = text.match(re);
    if (!m) continue;
    const x = pick(m);
    out.txn_type = type;
    out.amount = num(m[1]);
    out.counterparty_name = x.name ? x.name.trim() : null;
    out.counterparty_phone = x.phone || null;
    out.account_ref = x.account || null;
    break;
  }

  out.txn_cost = num(text.match(rx("Transaction cost,?\\s*AMT"))?.[1]) || 0;
  out.direction = out.txn_type ? (IN_TYPES.has(out.txn_type) ? "in" : "out") : null;
  out.parsed = out.txn_type ? 1 : 0;
  return out;
}

const toSqlDate = (v) => {
  const d = new Date(Number(v) || v);
  if (isNaN(d)) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export async function POST(request) {
  let conn;
  const log = { t0: Date.now(), status: "error", http: 500, message: "", sender: "", received: 0, inserted: 0, duplicates: 0, failed: 0, hive_site_id: "", hive_site_name: "" };
  const ip = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "").split(",")[0].trim();
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) {
      Object.assign(log, { status: "unauthorized", http: 403, message: reason });
      return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    }

    let payload;
    try {
      payload = JSON.parse(await request.text());
    } catch {
      Object.assign(log, { http: 400, message: "Empty or invalid JSON body" });
      return NextResponse.json({ status: "error", message: "Request body must be valid JSON" }, { status: 400 });
    }
    const sender = String(payload?.sender || "");
    const hiveId = String(auth?.hive_site_id || "");
    const hiveName = String(auth?.hive_site_name || "");
    const messages = Array.isArray(payload?.messages) ? payload.messages : [];
    Object.assign(log, { sender, hive_site_id: hiveId, hive_site_name: hiveName, received: messages.length });
    if (!messages.length) {
      Object.assign(log, { http: 400, message: "No messages supplied" });
      return NextResponse.json({ status: "error", message: "No messages supplied" }, { status: 400 });
    }

    conn = await connectDB();
    await ensureTable(conn);

    const { createHash } = await import("crypto");
    let inserted = 0, duplicates = 0, failed = 0;
    const keywords = await loadKeywords(conn, { id: hiveId, name: hiveName });
    const acctCache = new Map();

    for (const msg of messages) {
      try {
        const body = String(msg?.body || "");
        const msgSender = String(msg?.sender || sender);
        const smsDate = toSqlDate(msg?.date);
        if (!body) { failed++; continue; }

        const p = parseMpesa(body);
        // dedupe: txn code when present, otherwise sender+date+body
        const hash = createHash("sha256")
          .update(p.txn_code ? `${hiveId}|${msgSender}|${p.txn_code}` : `${hiveId}|${msgSender}|${msg?.date}|${body}`)
          .digest("hex");

        const { out: e } = await enrich(conn, keywords, { id: hiveId, name: hiveName }, acctCache,
          { sender: msgSender, body, counterparty: p.counterparty_name }, p.direction);
        const defaultRef = p.account_ref ? `${p.counterparty_name} (${p.account_ref})` : (p.counterparty_name || "");

        const [res] = await conn.execute(
          `INSERT IGNORE INTO \`${activeDB}\`.\`${TABLE}\`
           (record_id, sender, sms_id, sms_hash, body, sms_date, txn_code, txn_type, amount, counterparty_name, counterparty_phone, balance, parsed, direction, txn_cost, ref_no, synced, category, account_id, wallet_id, rule_id, skip_reason, hive_site_id, hive_site_name)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [magicRandomStr(7), msgSender, String(msg?.id ?? ""), hash, body, smsDate,
           p.txn_code, p.txn_type, p.amount, p.counterparty_name, p.counterparty_phone, p.balance, p.parsed,
           p.direction, p.txn_cost, defaultRef, e.synced, e.category, e.account_id, e.wallet_id, e.rule_id, e.skip_reason,
           hiveId, hiveName]
        );
        res.affectedRows ? inserted++ : duplicates++;
      } catch (e) {
        console.error("smsreader insert error:", e.message);
        failed++;
      }
    }

    // auto-sync: post every ready message into account / wallet money in & out, signed with a batch id so it can be undone
    let sync = null;
    try { if (inserted) sync = await syncPending(conn, { id: hiveId, name: hiveName }); } catch (e) { console.error("smsreader autosync error:", e.message); }

    Object.assign(log, { status: "success", http: 200, inserted, duplicates, failed });
    return NextResponse.json({ status: "success", received: messages.length, inserted, duplicates, failed, synced: sync?.synced || 0, sync_batch: sync?.batch || null });
  } catch (err) {
    console.error("smsreader error:", err);
    log.message = err.message;
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
    await writeLog(log, ip);
  }
}
