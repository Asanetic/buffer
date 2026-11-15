import { NextResponse } from "next/server";
import { connectDB, activeDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";

// Deletes this site's SMS inbox messages.
// Default: only messages that are NOT synced (keeps the undo trail of posted records).
// include_synced=true: removes synced messages too.
export async function POST(request) {
  let conn;
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });

    const hiveId = String(auth?.hive_site_id || "");
    if (!hiveId) return NextResponse.json({ status: "error", message: "No hive site on token" }, { status: 400 });

    let includeSynced = false;
    try { includeSynced = !!(await request.json())?.include_synced; } catch {}

    conn = await connectDB();
    const t = `\`${activeDB}\`.\`sms_inbox\``;
    const [res] = await conn.execute(
      `DELETE FROM ${t} WHERE hive_site_id=? ${includeSynced ? "" : "AND (synced IS NULL OR synced<>'synced')"}`,
      [hiveId]
    );
    const [[{ n }]] = await conn.execute(`SELECT COUNT(*) n FROM ${t} WHERE hive_site_id=? AND synced='synced'`, [hiveId]);
    return NextResponse.json({ status: "success", deleted: res.affectedRows, synced_remaining: n });
  } catch (err) {
    console.error("smsreader deleteall error:", err);
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}
