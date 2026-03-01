import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { type NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { buildContactContext } from "@/lib/ai/context";
import { trackAiUsage } from "@/lib/ai/usage";

export const maxDuration = 30;

const TONES: Record<string, string> = {
  professional: "professional and formal",
  warm: "warm and friendly",
  direct: "direct and concise",
  persuasive: "persuasive and results-focused",
};

const INTENTS: Record<string, string> = {
  followup: "a follow-up after a previous interaction",
  first_contact: "a first cold outreach to introduce yourself and your solution",
  post_meeting: "a follow-up after a recent meeting or call",
  proposal: "sending a commercial proposal or quote",
  reactivation: "reactivating a contact that has gone cold",
};

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId, intent, tone, additionalContext } = await req.json();

  if (!contactId || !intent || !tone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let contactContext: string;
  try {
    contactContext = await buildContactContext(contactId);
  } catch {
    return NextResponse.json({ error: "Could not load contact context" }, { status: 404 });
  }

  const intentDesc = INTENTS[intent] ?? intent;
  const toneDesc = TONES[tone] ?? tone;

  const model = "gpt-4o-mini";

  const prompt = `Based on the contact profile below, write a sales email.

Email intent: ${intentDesc}
Tone: ${toneDesc}
${additionalContext ? `Additional context from the rep: ${additionalContext}` : ""}

${contactContext}

Output ONLY a JSON object with exactly this structure (no markdown, no explanation):
{
  "subject": "the email subject line",
  "body": "the full email body in plain text, with proper line breaks"
}`;

  const { text, usage } = await generateText({
    model: openai(model),
    prompt,
    maxOutputTokens: 800,
  });

  trackAiUsage({
    feature: "email_draft",
    model,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  });

  // Parse JSON from the response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ subject: parsed.subject, body: parsed.body });
  } catch {
    // Fallback: return raw text
    return NextResponse.json({
      subject: "Email draft",
      body: text,
    });
  }
}
