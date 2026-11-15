import { NextResponse } from "next/server";
import { connectDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";
import { reapplyForHive } from "../smsRules";

// Re-runs the rules over messages that are not synced yet. Synced rows are never touched.
export async function POST(request) {
  let conn;
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    conn = await connectDB();
    const res = await reapplyForHive(conn, { id: String(auth?.hive_site_id || ""), name: String(auth?.hive_site_name || "") });
    return NextResponse.json({ status: "success", ...res });
  } catch (err) {
    console.error("smsreader reapply error:", err);
    return NextResponse.json({ status: "error", message: err.message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}
