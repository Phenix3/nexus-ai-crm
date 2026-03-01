import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";

export type ContactContext = {
  contact: Record<string, unknown>;
  activities: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  deals: Record<string, unknown>[];
};

export async function buildContactContext(contactId: string): Promise<string> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const [contactRes, activitiesRes, notesRes, dealsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("*, contact_tags(tags(name, color))")
      .eq("id", contactId)
      .eq("organization_id", orgId)
      .maybeSingle(),

    supabase
      .from("activities")
      .select("type, subject, body, occurred_at, users(full_name)")
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(10),

    supabase
      .from("notes")
      .select("content, created_at")
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("deals")
      .select(
        "title, value, currency, probability, status, expected_close_date, pipeline_stages(name)"
      )
      .eq("contact_id", contactId)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const c = contactRes.data as Record<string, unknown> | null;
  if (!c) throw new Error("Contact not found");

  const tags = ((c.contact_tags as { tags: { name: string } | null }[] | null) ?? [])
    .map((ct) => ct.tags?.name)
    .filter(Boolean)
    .join(", ");

  const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";

  let context = `## Contact Profile\n`;
  context += `Name: ${name}\n`;
  if (c.job_title) context += `Job Title: ${c.job_title}\n`;
  if (c.company) context += `Company: ${c.company}\n`;
  if (c.email) context += `Email: ${c.email}\n`;
  if (c.phone) context += `Phone: ${c.phone}\n`;
  if (c.linkedin_url) context += `LinkedIn: ${c.linkedin_url}\n`;
  context += `Lead Score: ${c.score ?? 0}/100\n`;
  if (tags) context += `Tags: ${tags}\n`;

  const activities = activitiesRes.data ?? [];
  if (activities.length > 0) {
    context += `\n## Recent Activities (${activities.length})\n`;
    for (const a of activities as Record<string, unknown>[]) {
      const date = new Date(a.occurred_at as string).toLocaleDateString("fr-FR");
      const user = (a.users as { full_name?: string } | null)?.full_name;
      context += `- [${date}] ${String(a.type).toUpperCase()}: ${a.subject}`;
      if (a.body) context += ` — "${String(a.body).slice(0, 100)}"`;
      if (user) context += ` (by ${user})`;
      context += "\n";
    }
  } else {
    context += `\n## Recent Activities\nNo activities logged yet.\n`;
  }

  const notes = notesRes.data ?? [];
  if (notes.length > 0) {
    context += `\n## Recent Notes (${notes.length})\n`;
    for (const n of notes as Record<string, unknown>[]) {
      const date = new Date(n.created_at as string).toLocaleDateString("fr-FR");
      context += `- [${date}] ${String(n.content).slice(0, 200)}\n`;
    }
  }

  const deals = dealsRes.data ?? [];
  if (deals.length > 0) {
    context += `\n## Associated Deals (${deals.length})\n`;
    for (const d of deals as Record<string, unknown>[]) {
      const stage = (d.pipeline_stages as { name?: string } | null)?.name ?? "No stage";
      const closeDate = d.expected_close_date
        ? new Date(d.expected_close_date as string).toLocaleDateString("fr-FR")
        : "No date";
      context += `- "${d.title}" | ${d.value} ${d.currency} | ${stage} | ${d.probability}% | Close: ${closeDate} | Status: ${d.status}\n`;
    }
  } else {
    context += `\n## Associated Deals\nNo deals linked.\n`;
  }

  return context;
}

export const SYSTEM_PROMPT = `You are an expert B2B sales assistant integrated into Nexus CRM.
Your role is to help sales representatives:
- Understand their contacts and their situation
- Identify the next best actions to take
- Draft personalized emails and messages
- Analyze risks and opportunities in deals
- Prepare for upcoming meetings

Always be:
- Concise and actionable (avoid long generic advice)
- Specific to the contact's context provided
- Practical and results-oriented
- Professional yet human

Respond in the same language as the user's question (French or English).`;
