import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { decrypt } from "@/lib/gmail/encrypt";
import { refreshAccessToken } from "@/lib/gmail/auth";
import { encrypt } from "@/lib/gmail/encrypt";
import { sendMessage, encodeEmail } from "@/lib/gmail/client";
import { injectTracking } from "@/lib/gmail/tracking";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = await getActiveOrgId();
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const body = (await request.json()) as {
    contactId: string;
    contactEmail: string;
    subject: string;
    body: string;
    tracking?: boolean;
  };

  if (!body.contactId || !body.contactEmail || !body.subject || !body.body) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch Gmail token
  const { data: tokenRow } = await supabase
    .from("oauth_tokens")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  // Refresh token if needed
  let accessToken: string;
  const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;

  if (expiresAt - Date.now() < 5 * 60 * 1000 && tokenRow.refresh_token) {
    try {
      const refreshTokenPlain = await decrypt(tokenRow.refresh_token as string);
      const refreshed = await refreshAccessToken(refreshTokenPlain);
      const encryptedNew = await encrypt(refreshed.access_token);
      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

      await supabase
        .from("oauth_tokens")
        .update({
          access_token: encryptedNew,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tokenRow.id);

      accessToken = refreshed.access_token;
    } catch {
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 });
    }
  } else {
    try {
      accessToken = await decrypt(tokenRow.access_token as string);
    } catch {
      return NextResponse.json({ error: "Failed to decrypt token" }, { status: 500 });
    }
  }

  // Create activity first (to get ID for tracking)
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      organization_id: orgId,
      contact_id: body.contactId,
      user_id: user.id,
      type: "email",
      subject: body.subject,
      body: body.body,
      occurred_at: new Date().toISOString(),
      metadata: {
        direction: "outbound",
        to: body.contactEmail,
        from: tokenRow.email,
        tracked: body.tracking ?? false,
      },
    })
    .select("id")
    .single();

  if (activityError || !activity) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }

  // Build email HTML with optional tracking
  let htmlBody = body.body.replace(/\n/g, "<br />");
  if (body.tracking) {
    htmlBody = await injectTracking(htmlBody, activity.id, body.contactId);
  }

  // Encode and send
  const raw = encodeEmail({
    to: body.contactEmail,
    from: tokenRow.email as string,
    subject: body.subject,
    body: body.body,
    htmlBody,
  });

  try {
    const result = await sendMessage(accessToken, raw);

    // Store Gmail message ID
    const existingMetadata =
      ((await supabase.from("activities").select("metadata").eq("id", activity.id).single()).data
        ?.metadata as Record<string, unknown>) ?? {};

    await supabase
      .from("activities")
      .update({ metadata: { ...existingMetadata, gmailId: result.id } })
      .eq("id", activity.id);

    return NextResponse.json({ ok: true, activityId: activity.id });
  } catch (e) {
    // Delete orphaned activity
    await supabase.from("activities").delete().eq("id", activity.id);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
