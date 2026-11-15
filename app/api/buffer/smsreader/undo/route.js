import { NextResponse } from "next/server";
import { connectDB } from "../../../apiUtils/dataControl/conn";
import { processAuthToken } from "../../../auth/authManager";
import { undoSync, listBatches } from "../syncCore";

// { list: true } -> recent sync batches.  { batch: "SYNC-..." | "all" } -> reverses that sync.
export async function POST(request) {
  let conn;
  try {
    const { valid, reason, data: auth } = processAuthToken(request);
    if (!valid) return NextResponse.json({ status: "unauthorized", message: reason }, { status: 403 });
    const hive = { id: String(auth?.hive_site_id || ""), name: String(auth?.hive_site_name || "") };
    let body = {};
    try { body = JSON.parse((await request.text()) || "{}"); } catch {}
    conn = await connectDB();
    if (body.list) return NextResponse.json({ status: "success", batches: await listBatches(conn, hive) });
    const batch = String(body.batch || "");
    if (!batch) return NextResponse.json({ status: "error", code: "NO_BATCH", source: "server", message: "Pick which sync to undo.", fix: "Choose one from the list." }, { status: 400 });
    return NextResponse.json({ status: "success", ...(await undoSync(conn, hive, batch)) });
  } catch (err) {
    console.error("smsreader undo error:", err);
    return NextResponse.json({ status: "error", code: "SERVER", source: "server", stage: "undo", message: "Could not undo the sync.", fix: "Nothing was changed. Try again.", detail: err.message }, { status: 500 });
  } finally {
    if (conn) await conn.end();
  }
}
