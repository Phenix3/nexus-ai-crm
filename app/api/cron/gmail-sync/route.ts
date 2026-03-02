import { NextRequest, NextResponse } from "next/server";
import { syncAllOrgs } from "@/lib/gmail/sync";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel Pro max for cron

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await syncAllOrgs();
    const totalSynced = results.reduce((acc, r) => acc + r.synced, 0);
    const totalErrors = results.flatMap((r) => r.errors);

    return NextResponse.json({
      ok: true,
      orgs: results.length,
      totalSynced,
      errors: totalErrors.slice(0, 20), // cap error list
    });
  } catch (e) {
    console.error("Gmail cron error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
