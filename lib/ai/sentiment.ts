import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";

export type SentimentResult = {
  sentiment: "positive" | "neutral" | "negative" | "urgent";
  intention: "purchase" | "question" | "objection" | "blocker" | "disinterest";
  urgency: boolean;
};

const MODEL = "gpt-4o-mini";

const PROMPT = `Analyze this email body and return ONLY a JSON object (no markdown, no explanation):
{
  "sentiment": "positive" | "neutral" | "negative" | "urgent",
  "intention": "purchase" | "question" | "objection" | "blocker" | "disinterest",
  "urgency": true | false
}

Rules:
- "positive": interest, enthusiasm, agreement, intent to move forward
- "urgent": explicit deadline, immediate need, time pressure
- "negative": dissatisfaction, rejection, complaint
- "neutral": informational, no clear signal
- "urgency": true if they mention a specific deadline or immediate action required

Email body:`;

export async function analyzeEmailSentiment(body: string): Promise<SentimentResult> {
  const truncated = body.slice(0, 1500); // Limit to control cost

  const { text, usage } = await generateText({
    model: openai(MODEL),
    prompt: `${PROMPT}\n\n${truncated}`,
    maxOutputTokens: 100,
  });

  // Non-blocking usage tracking (no org context in cron — skip)
  void usage;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]) as SentimentResult;
    // Validate fields
    const validSentiments = ["positive", "neutral", "negative", "urgent"] as const;
    const validIntentions = [
      "purchase",
      "question",
      "objection",
      "blocker",
      "disinterest",
    ] as const;
    if (!validSentiments.includes(parsed.sentiment)) parsed.sentiment = "neutral";
    if (!validIntentions.includes(parsed.intention)) parsed.intention = "question";
    return parsed;
  } catch {
    return { sentiment: "neutral", intention: "question", urgency: false };
  }
}

/**
 * Analyze sentiment for up to `limit` email activities in an org
 * that don't yet have sentiment metadata.
 */
export async function analyzePendingEmailSentiments(orgId: string, limit = 10): Promise<number> {
  const supabase = await createClient();

  const { data: activities } = await supabase
    .from("activities")
    .select("id, body, metadata")
    .eq("organization_id", orgId)
    .eq("type", "email")
    .not("body", "is", null)
    .limit(limit * 3); // Fetch more so we can filter already-analyzed

  if (!activities || activities.length === 0) return 0;

  // Filter those without sentiment
  const pending = activities
    .filter((a) => {
      const meta = a.metadata as Record<string, unknown> | null;
      return !meta?.sentiment;
    })
    .slice(0, limit);

  let analyzed = 0;
  for (const activity of pending) {
    if (!activity.body) continue;
    try {
      const result = await analyzeEmailSentiment(activity.body);
      const existingMeta = (activity.metadata as Record<string, unknown>) ?? {};
      await supabase
        .from("activities")
        .update({ metadata: { ...existingMeta, ...result } })
        .eq("id", activity.id);
      analyzed++;
    } catch {
      // Skip on error
    }
  }

  return analyzed;
}
