import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { type NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { buildContactContext, SYSTEM_PROMPT } from "@/lib/ai/context";
import { trackAiUsage } from "@/lib/ai/usage";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, contactId } = await req.json();

  if (!contactId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing contactId or messages" }, { status: 400 });
  }

  let contactContext: string;
  try {
    contactContext = await buildContactContext(contactId);
  } catch {
    return NextResponse.json({ error: "Could not load contact context" }, { status: 404 });
  }

  const model = "gpt-4o-mini";

  const result = streamText({
    model: openai(model),
    system: SYSTEM_PROMPT + "\n\n" + contactContext,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1024,
    onFinish: ({ usage }) => {
      trackAiUsage({
        feature: "contact_chat",
        model,
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
