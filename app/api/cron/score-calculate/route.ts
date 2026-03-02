import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recalculateOrgScores } from "@/lib/scoring/engine";
import { generateAlertsForOrg } from "@/lib/scoring/alerts";
import { analyzePendingEmailSentiments } from "@/lib/ai/sentiment";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get distinct org IDs that have contacts
    const { data: rows } = await supabase.from("contacts").select("organization_id").limit(1000);

    const orgIds = [...new Set((rows ?? []).map((r) => r.organization_id))];

    const results = [];
    for (const orgId of orgIds) {
      // 1. Analyze sentiment for pending emails (before scoring so signals are current)
      await analyzePendingEmailSentiments(orgId, 10);
      // 2. Recalculate scores
      const scoreResult = await recalculateOrgScores(orgId);
      // 3. Generate alerts based on new scores
      const alertResult = await generateAlertsForOrg(orgId);
      results.push({ orgId, ...scoreResult, alertsCreated: alertResult.created });
    }

    return NextResponse.json({ ok: true, orgs: results.length, results });
  } catch (e) {
    console.error("Score cron error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
