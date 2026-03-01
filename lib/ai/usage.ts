import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { getUser } from "@/lib/auth";

// GPT-4o-mini pricing (per 1M tokens, as of 2025)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini-2024-07-18": { input: 0.15, output: 0.6 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? PRICING["gpt-4o-mini"];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

export async function trackAiUsage({
  feature,
  model,
  inputTokens,
  outputTokens,
}: {
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  try {
    const [orgId, user] = await Promise.all([getActiveOrgId(), getUser()]);
    if (!orgId) return;

    const supabase = await createClient();
    await supabase.from("ai_usage").insert({
      organization_id: orgId,
      user_id: user?.id ?? null,
      feature,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost_usd: estimateCost(model, inputTokens, outputTokens).toFixed(6),
    });
  } catch {
    // Non-blocking — don't fail the request if usage tracking fails
  }
}
