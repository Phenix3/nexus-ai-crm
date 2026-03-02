import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { render } from "@react-email/render";
import { AlertDigest } from "@/emails/AlertDigest";
import { resend, FROM_EMAIL } from "@/lib/resend";

export const runtime = "nodejs";
export const maxDuration = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://nexuscrm.io";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get all orgs that have unread alerts
    const { data: alertRows } = await supabase
      .from("alerts")
      .select("organization_id, title, message, severity, created_at")
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (!alertRows || alertRows.length === 0) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Group alerts by org
    const byOrg = new Map<string, typeof alertRows>();
    for (const alert of alertRows) {
      const existing = byOrg.get(alert.organization_id) ?? [];
      existing.push(alert);
      byOrg.set(alert.organization_id, existing);
    }

    let totalSent = 0;

    for (const [orgId, orgAlerts] of byOrg) {
      // Get org name
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();

      // Get all members with emails
      const { data: members } = await supabase
        .from("organization_members")
        .select("user_id, users(email, full_name)")
        .eq("organization_id", orgId);

      if (!members || members.length === 0) continue;

      const digestAlerts = orgAlerts.slice(0, 20).map((a) => ({
        title: a.title,
        message: a.message,
        severity: a.severity as "info" | "warning" | "urgent",
        createdAt: a.created_at,
      }));

      for (const member of members) {
        const user = member.users as unknown as { email: string; full_name: string | null } | null;
        if (!user?.email) continue;

        const html = await render(
          AlertDigest({
            orgName: org?.name ?? "Your organization",
            recipientName: user.full_name?.split(" ")[0] ?? "there",
            alerts: digestAlerts,
            appUrl: APP_URL,
          })
        );

        await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: `[Nexus CRM] ${orgAlerts.length} alert${orgAlerts.length !== 1 ? "s" : ""} need your attention`,
          html,
        });

        totalSent++;
      }
    }

    return NextResponse.json({ ok: true, sent: totalSent, orgs: byOrg.size });
  } catch (e) {
    console.error("Alert digest cron error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
