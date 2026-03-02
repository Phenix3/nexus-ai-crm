import { createClient } from "@/lib/supabase/server";

// ── Scoring weights ────────────────────────────────────────────────────────
const WEIGHTS = {
  emailInbound7d: 20,
  emailOpened3d: 5,
  linkClicked3d: 10,
  meeting14d: 25,
  stageChange30d: 30,
  sentimentPositive: 10,
  sentimentUrgent: 15,
  sentimentNegative: -5,
  inactivityPerDay: -5, // applied after 7d of inactivity, capped at -25
  dealOverdue: -15,
} as const;

export interface ScoreSignal {
  key: string;
  delta: number;
  reason: string;
}

export interface ComputedScore {
  score: number;
  signals: ScoreSignal[];
}

export async function computeContactScore(
  contactId: string,
  orgId: string
): Promise<ComputedScore> {
  const supabase = await createClient();
  const now = new Date();

  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent activities
  const { data: activities } = await supabase
    .from("activities")
    .select("id, type, occurred_at, metadata")
    .eq("contact_id", contactId)
    .eq("organization_id", orgId)
    .gte("occurred_at", since30d)
    .order("occurred_at", { ascending: false });

  // Fetch deals linked to this contact to check overdue
  const { data: deals } = await supabase
    .from("deals")
    .select("id, status, expected_close_date")
    .eq("contact_id", contactId)
    .eq("status", "open");

  const acts = activities ?? [];
  const signals: ScoreSignal[] = [];
  let raw = 0;

  // ── Email inbound in last 7d ──────────────────────────────────────────────
  const emailInbound = acts.filter(
    (a) =>
      a.type === "email" &&
      a.occurred_at >= since7d &&
      (a.metadata as Record<string, unknown>)?.direction === "inbound"
  );
  if (emailInbound.length > 0) {
    raw += WEIGHTS.emailInbound7d;
    signals.push({
      key: "email_inbound_7d",
      delta: WEIGHTS.emailInbound7d,
      reason: "Inbound email in last 7 days",
    });
  }

  // ── Email opened in last 3d ───────────────────────────────────────────────
  const emailOpened = acts.filter(
    (a) =>
      a.type === "email" &&
      a.occurred_at >= since3d &&
      (a.metadata as Record<string, unknown>)?.opened_at != null
  );
  if (emailOpened.length > 0) {
    raw += WEIGHTS.emailOpened3d;
    signals.push({
      key: "email_opened_3d",
      delta: WEIGHTS.emailOpened3d,
      reason: "Email opened in last 3 days",
    });
  }

  // ── Link clicked in last 3d ───────────────────────────────────────────────
  const linkClicked = acts.filter((a) => {
    const meta = a.metadata as Record<string, unknown> | null;
    const clicks = meta?.clicks as unknown[];
    return (
      a.type === "email" && a.occurred_at >= since3d && Array.isArray(clicks) && clicks.length > 0
    );
  });
  if (linkClicked.length > 0) {
    raw += WEIGHTS.linkClicked3d;
    signals.push({
      key: "link_clicked_3d",
      delta: WEIGHTS.linkClicked3d,
      reason: "Link clicked in last 3 days",
    });
  }

  // ── Meeting in last 14d ───────────────────────────────────────────────────
  const hasMeeting = acts.some((a) => a.type === "meeting" && a.occurred_at >= since14d);
  if (hasMeeting) {
    raw += WEIGHTS.meeting14d;
    signals.push({
      key: "meeting_14d",
      delta: WEIGHTS.meeting14d,
      reason: "Meeting in last 14 days",
    });
  }

  // ── Stage change in last 30d ──────────────────────────────────────────────
  const hasStageChange = acts.some((a) => a.type === "stage_change");
  if (hasStageChange) {
    raw += WEIGHTS.stageChange30d;
    signals.push({
      key: "stage_change_30d",
      delta: WEIGHTS.stageChange30d,
      reason: "Deal stage change in last 30 days",
    });
  }

  // ── Sentiment bonuses ─────────────────────────────────────────────────────
  const sentimentActs = acts.filter(
    (a) => a.type === "email" && (a.metadata as Record<string, unknown>)?.sentiment != null
  );
  for (const a of sentimentActs) {
    const sentiment = (a.metadata as Record<string, unknown>)?.sentiment as string;
    if (sentiment === "positive" && !signals.some((s) => s.key === "sentiment_positive")) {
      raw += WEIGHTS.sentimentPositive;
      signals.push({
        key: "sentiment_positive",
        delta: WEIGHTS.sentimentPositive,
        reason: "Positive email sentiment",
      });
    } else if (sentiment === "urgent" && !signals.some((s) => s.key === "sentiment_urgent")) {
      raw += WEIGHTS.sentimentUrgent;
      signals.push({
        key: "sentiment_urgent",
        delta: WEIGHTS.sentimentUrgent,
        reason: "Urgent email detected",
      });
    } else if (sentiment === "negative" && !signals.some((s) => s.key === "sentiment_negative")) {
      raw += WEIGHTS.sentimentNegative;
      signals.push({
        key: "sentiment_negative",
        delta: WEIGHTS.sentimentNegative,
        reason: "Negative email sentiment",
      });
    }
  }

  // ── Inactivity penalty ────────────────────────────────────────────────────
  const latestActivity = acts[0];
  if (!latestActivity) {
    // No activity at all — max penalty
    raw += -25;
    signals.push({ key: "inactivity", delta: -25, reason: "No activity in 30 days" });
  } else {
    const daysSinceLast = Math.floor(
      (now.getTime() - new Date(latestActivity.occurred_at).getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceLast > 7) {
      const penalty = Math.max(-25, WEIGHTS.inactivityPerDay * (daysSinceLast - 7));
      raw += penalty;
      signals.push({
        key: "inactivity",
        delta: penalty,
        reason: `${daysSinceLast} days since last activity`,
      });
    }
  }

  // ── Deal overdue ──────────────────────────────────────────────────────────
  const today = now.toISOString().slice(0, 10);
  const hasOverdue = (deals ?? []).some(
    (d) => d.expected_close_date && d.expected_close_date < today
  );
  if (hasOverdue) {
    raw += WEIGHTS.dealOverdue;
    signals.push({
      key: "deal_overdue",
      delta: WEIGHTS.dealOverdue,
      reason: "Linked deal past close date",
    });
  }

  // Clamp to 0–100
  const score = Math.min(100, Math.max(0, raw));
  return { score, signals };
}

export interface OrgScoreResult {
  updated: number;
  total: number;
}

export async function recalculateOrgScores(orgId: string): Promise<OrgScoreResult> {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, score")
    .eq("organization_id", orgId);

  if (!contacts || contacts.length === 0) return { updated: 0, total: 0 };

  let updated = 0;

  for (const contact of contacts) {
    const { score: newScore, signals } = await computeContactScore(contact.id, orgId);
    const oldScore = contact.score ?? 0;

    if (newScore === oldScore) continue;

    // Update contact score
    await supabase.from("contacts").update({ score: newScore }).eq("id", contact.id);

    // Log score_update activity
    await supabase.from("activities").insert({
      organization_id: orgId,
      contact_id: contact.id,
      type: "score_update",
      subject: `Score ${oldScore > newScore ? "decreased" : "increased"}: ${oldScore} → ${newScore}`,
      occurred_at: new Date().toISOString(),
      metadata: {
        old_score: oldScore,
        new_score: newScore,
        signals,
      },
    });

    updated++;
  }

  return { updated, total: contacts.length };
}
