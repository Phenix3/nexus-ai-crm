import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyClickToken } from "@/lib/gmail/tracking";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const decoded = await verifyClickToken(decodeURIComponent(token));

  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // Log the click
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("activities")
      .select("metadata")
      .eq("id", decoded.activityId)
      .maybeSingle();

    if (data) {
      const existing = (data.metadata as Record<string, unknown>) ?? {};
      const clicks = (existing.clicks as { url: string; at: string }[] | undefined) ?? [];
      clicks.push({ url: decoded.originalUrl, at: new Date().toISOString() });

      await supabase
        .from("activities")
        .update({ metadata: { ...existing, clicks } })
        .eq("id", decoded.activityId);
    }
  } catch {
    // Silently fail
  }

  return NextResponse.redirect(decoded.originalUrl, { status: 302 });
}
