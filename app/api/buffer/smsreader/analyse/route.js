import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";
import { ensureKeywordTables, loadKeywords, allKnownWords, seenKeys, markSeen, addKeyword, counterpartyKey, reapplyForHive } from "../smsRules";

// "Analyse transactions": asks AI (OpenAI) to work out category / account / wallet for counterparties
// that no rule knows yet, and saves every answer as a rule so the same name is never asked twice.
//
// Token discipline:
//  - one entry per UNIQUE normalised counterparty (not per message), max SMS_AI_MAX_NAMES per run
//  - names already covered by ANY rule (even an "unsure" one) are skipped -> repeat runs cost nothing
//  - only name / direction / type / amount band are sent (no message text, phone numbers or balances)
//  - ids are sent as short numbers; the reply is a compact JSON object; cheapest model, thinking off

const MODEL = process.env.OPENAI_SMS_MODEL || "gpt-4o-mini";
const MAX_NAMES = Number(process.env.SMS_AI_MAX_NAMES || 40);
const MIN_CONFIDENCE = 60;
const DEFAULT_CATEGORIES = ["Fuel", "Shopping", "Groceries", "Utilities", "Airtime & Data", "Transport", "Medical", "Rent", "Salary", "Bank transfer", "Savings", "Food & Dining", "Education", "Entertainment", "Family & Friends", "Business"];

const SCHEMA = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          k: { type: "integer" },
          category: { type: "string" },
          account: { type: "integer" },
          wallet: { type: "integer" },
          confidence: { type: "integer" },
        },
        required: ["k", "category", "account", "wallet", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["results"],
  additionalProperties: false,
};

const SYSTEM = `You classify Kenyan M-PESA and bank transactions for a money-tracking ledger.
Each input line is: k|counterparty|direction(in/out)|type|amount band|messages.
For every line return: category, account, wallet, confidence (0-100).
- category: pick from the category list when one fits; otherwise a short new Title Case category.
- account / wallet: the NUMBER from the lists below, or 0 when you cannot tell. Never invent numbers.
- Be conservative: a private person's name with no other clue is "Family & Friends" with confidence below 60. Use confidence 60+ only when the name clearly points to the answer.
Return every k exactly once.`;

const band = (a) => {
  const n = Number(a) || 0;
  return n < 500 ? "<500" : n < 5000 ? "500-5k" : n < 50000 ? "5k-50k" : "50k+";
};

const compact = (rows, fields) => rows.map((r, i) => `${i + 1}=${fields.map((f) => String(r[f] || "").trim()).filter(Boolean).join(" / ")}`).join("\n");

class AiError extends Error {
  constructor(code, message, fix, detail) { super(detail || message); Object.assign(this, { code, userMessage: message, fix }); }
}

// One batched request -> { text, stop, tokens }
async function askAi(system, user, nameCount) {
  const maxOut = Math.min(8000, 400 + nameCount * 60);

  {
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(90000),
        body: JSON.stringify({
          model: MODEL,
          max_completion_tokens: maxOut,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          response_format: { type: "json_schema", json_schema: { name: "sms_classification", strict: true, schema: SCHEMA } },
        }),
      });
    } catch (e) {
      throw new AiError("AI_NETWORK", "The server could not reach the AI service.", "Check the server's internet connection and try again.", e.message);
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const em = body?.error?.message || `HTTP ${res.status}`;
      const ec = body?.error?.code || "";
      if (res.status === 401 || res.status === 403) throw new AiError("AI_AUTH", "The AI key was rejected.", "Ask your administrator to check OPENAI_API_KEY on the server.", em);
      if (ec === "insufficient_quota" || /quota|billing/i.test(em)) throw new AiError("AI_CREDIT", "The AI account has run out of credit.", "Add credit at platform.openai.com/settings/organization/billing, then try again.", em);
      if (res.status === 429) throw new AiError("AI_RATE_LIMIT", "The AI is busy right now.", "Wait a minute and try again.", em);
      if (res.status === 404) throw new AiError("AI_MODEL", "The AI model name is not valid.", "Check OPENAI_SMS_MODEL on the server.", em);
      if (res.status >= 500) throw new AiError("AI_DOWN", "The AI service is having problems.", "This is on their side. Try again in a few minutes.", em);
      throw new AiError("AI_REQUEST", "The AI could not accept this request.", "Try again. If it keeps failing, send the technical details to support.", em);
    }
    const choice = body?.choices?.[0];
    return {
      text: choice?.message?.content || "{}",
      stop: choice?.message?.refusal ? "refusal" : choice?.finish_reason === "length" ? "max_tokens" : "ok",
      tokens: (body?.usage?.prompt_tokens || 0) + (body?.usage?.completion_tokens || 0),
    };
  }

}

// Structured failure: the screen shows `message` + `fix`, and `detail` behind a "Technical details" toggle.
const fail = (status, code, source, stage, message, fix, detail = "") =>
  NextResponse.json({ status: "error", code, source, stage, message, fix, detail: String(detail).slice(0, 600) }, { status });

// AI errors -> something a person can act on.
function explainAiError(err) {
  return err instanceof AiError ? [err.code, err.userMessage, err.fix] : null;
}

export async function POST(request) {
  let conn;
  let stage = "starting";
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    const keyName = "OPENAI_API_KEY";
    if (!process.env[keyName]) {
      return fail(500, "AI_NOT_CONFIGURED", "server", stage, "AI is not set up yet.", `Ask your administrator to add ${keyName} to the server settings.`);
    }

    const hive = { id: String(auth?.hive_site_id || ""), name: String(auth?.hive_site_name || "") };
    stage = "database";
    conn = await connectDB();
    await ensureKeywordTables(conn);

    // 1. unresolved messages -> unique counterparties
    const [rows] = await conn.execute(
      `SELECT counterparty_name, direction, txn_type, amount FROM \`${activeDB}\`.\`sms_inbox\`
       WHERE hive_site_id=? AND synced='pending' AND direction IS NOT NULL AND counterparty_name<>''
         AND (category IS NULL OR category='' OR wallet_id IS NULL OR wallet_id='') LIMIT 5000`,
      [hive.id]
    );
    const groups = new Map();
    for (const r of rows) {
      const key = counterpartyKey(r.counterparty_name);
      if (key.length < 3) continue;
      const g = groups.get(key) || { key, name: r.counterparty_name, direction: r.direction, type: r.txn_type, amount: r.amount, n: 0 };
      g.n++;
      groups.set(key, g);
    }

    // 2. drop names the keyword tables already cover (or that AI already looked at and could not place)
    const kw = await loadKeywords(conn, hive);
    const knownTexts = allKnownWords(kw);
    const seen = await seenKeys(conn, hive.id);
    const todo = [...groups.values()]
      .filter((g) => !seen.has(g.key) && !knownTexts.some((t) => g.key.includes(t)))
      .sort((a, b) => b.n - a.n)
      .slice(0, MAX_NAMES);

    if (!todo.length) {
      const res = await reapplyForHive(conn, hive);
      return NextResponse.json({ status: "success", analysed: 0, saved: 0, unsure: 0, tokens: 0, ...res, message: "Nothing new to analyse — all names are already known." });
    }

    // 3. the user's options (short numbered lists)
    const [accounts] = await conn.execute(`SELECT record_id, account_name, account_type, remark FROM \`${activeDB}\`.\`accounts_list\` WHERE hive_site_id=? LIMIT 100`, [hive.id]);
    const [wallets] = await conn.execute(`SELECT record_id, wallet_name, wallet_type, remark FROM \`${activeDB}\`.\`wallets_list\` WHERE hive_site_id=? LIMIT 100`, [hive.id]);
    const [cats] = await conn.execute(
      `SELECT DISTINCT category FROM (
         SELECT category, hive_site_id FROM \`${activeDB}\`.\`sms_category_words\`
         UNION SELECT category, hive_site_id FROM \`${activeDB}\`.\`accounts_money_out\`
         UNION SELECT category, hive_site_id FROM \`${activeDB}\`.\`accounts_money_in\`
         UNION SELECT category, hive_site_id FROM \`${activeDB}\`.\`wallets_money_out\`
         UNION SELECT category, hive_site_id FROM \`${activeDB}\`.\`wallets_money_in\`) c
       WHERE hive_site_id=? AND category IS NOT NULL AND category<>'' LIMIT 60`,
      [hive.id]
    );
    const categories = [...new Set([...cats.map((c) => c.category), ...DEFAULT_CATEGORIES])].slice(0, 60);

    const system = `${SYSTEM}\n\nCATEGORIES: ${categories.join(", ")}\n\nACCOUNTS:\n${compact(accounts, ["account_name", "account_type", "remark"]) || "(none)"}\n\nWALLETS:\n${compact(wallets, ["wallet_name", "wallet_type", "remark"]) || "(none)"}`;
    const user = todo.map((g, i) => `${i + 1}|${g.name}|${g.direction}|${g.type}|${band(g.amount)}|${g.n}`).join("\n");

    // 4. one batched call
    stage = "ai";
    const ai = await askAi(system, user, todo.length);
    if (ai.stop !== "ok") {
      const refused = ai.stop === "refusal";
      return fail(502, refused ? "AI_REFUSED" : "AI_TRUNCATED", "ai", stage,
        refused ? "The AI declined to answer." : "The AI ran out of room before finishing.",
        refused ? "Try again. If it keeps happening, send the technical details to support." : "Try again. Fewer new names are sent each time.",
        `stop: ${ai.stop}`);
    }
    let results;
    try {
      results = JSON.parse(ai.text).results || [];
    } catch (e) {
      return fail(502, "AI_BAD_JSON", "ai", stage, "The AI sent back an answer we could not read.", "Try again.", e.message);
    }
    stage = "saving";

    // 5. save every answer into the keyword tables (memory). Unsure names are remembered so they are never asked twice.
    let saved = 0, unsure = 0;
    for (const r of results) {
      const g = todo[r.k - 1];
      if (!g) continue;
      const category = String(r.category || "").trim().slice(0, 100);
      const accountId = accounts[r.account - 1]?.record_id || "";
      const walletId = wallets[r.wallet - 1]?.record_id || "";
      if (r.confidence >= MIN_CONFIDENCE && (category || accountId || walletId)) {
        if (category) await addKeyword(conn, "category", category, g.key, hive);
        if (accountId) await addKeyword(conn, "account", accountId, g.key, hive);
        if (walletId) await addKeyword(conn, "wallet", walletId, g.key, hive);
        saved++;
      } else {
        await markSeen(conn, hive.id, g.key);
        unsure++;
      }
    }

    // 6. apply the new keywords to the waiting messages
    stage = "applying";
    const applied = await reapplyForHive(conn, hive);
    const tokens = ai.tokens;
    console.log(`smsreader analyse [${MODEL}]: ${todo.length} names, ${saved} saved, ${unsure} unsure, ${tokens} tokens`);

    return NextResponse.json({ status: "success", analysed: todo.length, saved, unsure, tokens, ...applied });
  } catch (err) {
    console.error("smsreader analyse error:", err);
    const ai = stage === "ai" ? explainAiError(err) : null;
    if (ai) return fail(502, ai[0], "ai", stage, ai[1], ai[2], err.message);
    if (stage === "database" || stage === "saving" || stage === "applying") {
      return fail(500, "DB", "server", stage, "Something went wrong while reading or saving your data.", "Try again. If it keeps failing, send the technical details to support.", err.message);
    }
    return fail(500, "SERVER", "server", stage, "Something unexpected went wrong.", "Try again. If it keeps failing, send the technical details to support.", err.message);
  } finally {
    if (conn) await conn.end();
  }
}
