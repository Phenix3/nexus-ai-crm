import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return NextResponse.json({ error: "No active organization" }, { status: 400 });

  const [contacts, deals, activities, notes] = await Promise.all([
    supabase
      .from("contacts")
      .select("first_name, last_name, email, phone, company, job_title, score, created_at")
      .eq("organization_id", orgId),
    supabase
      .from("deals")
      .select("title, value, currency, status, expected_close_date, created_at")
      .eq("organization_id", orgId),
    supabase
      .from("activities")
      .select("type, subject, occurred_at, created_at")
      .eq("organization_id", orgId),
    supabase.from("notes").select("content, created_at").eq("organization_id", orgId),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    exportedBy: user.email,
    organizationId: orgId,
    data: {
      contacts: contacts.data ?? [],
      deals: deals.data ?? [],
      activities: activities.data ?? [],
      notes: notes.data ?? [],
    },
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="nexus-crm-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
