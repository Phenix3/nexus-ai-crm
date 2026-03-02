import { createClient } from "@/lib/supabase/server";

export interface AlertGenerationResult {
  created: number;
}

type AlertType =
  | "email_opened_multiple"
  | "deal_stale"
  | "score_increased"
  | "score_decreased"
  | "meeting_tomorrow"
  | "email_replied";

type AlertSeverity = "info" | "warning" | "urgent";

interface AlertCandidate {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  contactId?: string;
  dealId?: string;
}

export async function generateAlertsForOrg(orgId: string): Promise<AlertGenerationResult> {
  const supabase = await createClient();
  const now = new Date();

  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // ── Existing alerts in last 24h for deduplication ─────────────────────────
  const { data: recentAlerts } = await supabase
    .from("alerts")
    .select("type, contact_id")
    .eq("organization_id", orgId)
    .gte("created_at", since24h);

  const existingKeys = new Set((recentAlerts ?? []).map((a) => `${a.type}::${a.contact_id ?? ""}`));

  const candidates: AlertCandidate[] = [];

  // ── 1. Email opened 3+ times in 24h ──────────────────────────────────────
  const { data: emailActivities } = await supabase
    .from("activities")
    .select("id, contact_id, subject, metadata")
    .eq("organization_id", orgId)
    .eq("type", "email")
    .gte("occurred_at", since24h);

  for (const activity of emailActivities ?? []) {
    const meta = activity.metadata as Record<string, unknown> | null;
    const opens = meta?.opens as unknown[];
    if (Array.isArray(opens) && opens.length >= 3 && activity.contact_id) {
      const key = `email_opened_multiple::${activity.contact_id}`;
      if (!existingKeys.has(key)) {
        candidates.push({
          type: "email_opened_multiple",
          severity: "urgent",
          title: "Email opened multiple times",
          message: `The email "${activity.subject ?? "Untitled"}" was opened ${opens.length} times in the last 24h`,
          contactId: activity.contact_id,
        });
        existingKeys.add(key);
      }
    }
  }

  // ── 2. Deal stale (no stage change in 14 days) ────────────────────────────
  const { data: openDeals } = await supabase
    .from("deals")
    .select("id, title, contact_id, updated_at")
    .eq("organization_id", orgId)
    .eq("status", "open");

  for (const deal of openDeals ?? []) {
    const lastUpdate = deal.updated_at ?? "";
    if (lastUpdate < since14d) {
      const key = `deal_stale::${deal.contact_id ?? deal.id}`;
      if (!existingKeys.has(key)) {
        const daysSince = Math.floor(
          (now.getTime() - new Date(lastUpdate).getTime()) / (24 * 60 * 60 * 1000)
        );
        candidates.push({
          type: "deal_stale",
          severity: "warning",
          title: "Stale deal",
          message: `Deal "${deal.title}" has had no activity for ${daysSince} days`,
          contactId: deal.contact_id ?? undefined,
          dealId: deal.id,
        });
        existingKeys.add(key);
      }
    }
  }

  // ── 3. Score jumped 20+ points ────────────────────────────────────────────
  const { data: scoreUpdates } = await supabase
    .from("activities")
    .select("id, contact_id, metadata")
    .eq("organization_id", orgId)
    .eq("type", "score_update")
    .gte("occurred_at", since24h);

  for (const activity of scoreUpdates ?? []) {
    const meta = activity.metadata as Record<string, unknown> | null;
    const oldScore = Number(meta?.old_score ?? 0);
    const newScore = Number(meta?.new_score ?? 0);
    const delta = newScore - oldScore;

    if (Math.abs(delta) >= 20 && activity.contact_id) {
      const isIncrease = delta > 0;
      const type: AlertType = isIncrease ? "score_increased" : "score_decreased";
      const key = `${type}::${activity.contact_id}`;
      if (!existingKeys.has(key)) {
        candidates.push({
          type,
          severity: "info",
          title: isIncrease ? "Score surged" : "Score dropped",
          message: `Lead score ${isIncrease ? "increased" : "decreased"} by ${Math.abs(delta)} points (${oldScore} → ${newScore})`,
          contactId: activity.contact_id,
        });
        existingKeys.add(key);
      }
    }
  }

  // ── 4. Meeting tomorrow ───────────────────────────────────────────────────
  const tomorrowStart = new Date(now);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: tomorrowMeetings } = await supabase
    .from("activities")
    .select("id, contact_id, subject")
    .eq("organization_id", orgId)
    .eq("type", "meeting")
    .gte("occurred_at", tomorrowStart.toISOString())
    .lte("occurred_at", tomorrowEnd.toISOString());

  for (const activity of tomorrowMeetings ?? []) {
    if (!activity.contact_id) continue;
    const key = `meeting_tomorrow::${activity.contact_id}`;
    if (!existingKeys.has(key)) {
      candidates.push({
        type: "meeting_tomorrow",
        severity: "info",
        title: "Meeting tomorrow",
        message: `You have a meeting scheduled: "${activity.subject ?? "Meeting"}"`,
        contactId: activity.contact_id,
      });
      existingKeys.add(key);
    }
  }

  // ── Insert all candidates ─────────────────────────────────────────────────
  if (candidates.length === 0) return { created: 0 };

  const rows = candidates.map((c) => ({
    organization_id: orgId,
    contact_id: c.contactId ?? null,
    deal_id: c.dealId ?? null,
    type: c.type,
    title: c.title,
    message: c.message,
    severity: c.severity,
    is_read: false,
  }));

  const { error } = await supabase.from("alerts").insert(rows);
  if (error) {
    console.error("Failed to insert alerts:", error);
    return { created: 0 };
  }

  return { created: candidates.length };
}
