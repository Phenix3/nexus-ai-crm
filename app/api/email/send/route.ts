import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { resend, FROM_EMAIL } from "@/lib/resend";
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

  // Create activity first (to get ID for tracking pixel)
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
        from: FROM_EMAIL,
        tracked: false, // updated after tracking injection
      },
    })
    .select("id")
    .single();

  if (activityError || !activity) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }

  // Build HTML with optional open/click tracking
  let htmlBody = body.body.replace(/\n/g, "<br />");
  let tracked = false;
  if (body.tracking) {
    try {
      htmlBody = await injectTracking(htmlBody, activity.id, body.contactId);
      tracked = true;
    } catch {
      // ENCRYPTION_KEY not set — send without tracking
    }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: body.contactEmail,
      subject: body.subject,
      html: htmlBody,
    });

    if (tracked) {
      await supabase
        .from("activities")
        .update({
          metadata: {
            direction: "outbound",
            to: body.contactEmail,
            from: FROM_EMAIL,
            tracked: true,
          },
        })
        .eq("id", activity.id);
    }

    return NextResponse.json({ ok: true, activityId: activity.id });
  } catch (e) {
    // Roll back orphaned activity
    await supabase.from("activities").delete().eq("id", activity.id);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
