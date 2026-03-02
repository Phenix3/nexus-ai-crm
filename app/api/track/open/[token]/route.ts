import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyOpenToken } from "@/lib/gmail/tracking";

// 1x1 transparent PNG (base64)
const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const decoded = await verifyOpenToken(decodeURIComponent(token));
  if (decoded) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("activities")
        .select("metadata")
        .eq("id", decoded.activityId)
        .maybeSingle();

      if (data) {
        const existing = (data.metadata as Record<string, unknown>) ?? {};
        const opens = (existing.opens as string[] | undefined) ?? [];
        opens.push(new Date().toISOString());

        await supabase
          .from("activities")
          .update({
            metadata: { ...existing, opens, opened_at: opens[0] },
          })
          .eq("id", decoded.activityId);
      }
    } catch {
      // Silently fail — don't break email rendering
    }
  }

  return new NextResponse(TRANSPARENT_PNG, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}
