import { NextResponse } from "next/server";
import { connectDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";
import { syncPending } from "../syncCore";

// Posts all pending messages into account / wallet money in & out (signed with a batch id for undo).
export async function POST(request) {
  let conn;
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    conn = await connectDB();
    const res = await syncPending(conn, { id: String(auth?.hive_site_id || ""), name: String(auth?.hive_site_name || "") });
    return NextResponse.json({ status: "success", ...res });
  } catch (err) {
    console.error("smsreader sync error:", err);
    return NextResponse.json({ status: "error", code: "SERVER", source: "server", stage: "sync", message: "Could not sync the messages.", fix: "Nothing was changed. Try again.", detail: err.message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}
