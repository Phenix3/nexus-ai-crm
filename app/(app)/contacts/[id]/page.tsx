import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getContact } from "@/lib/actions/contacts";
import { getContactTimeline } from "@/lib/actions/activities";
import { getTags } from "@/lib/actions/tags";
import { getGmailIntegration } from "@/lib/actions/integrations";
import { createClient } from "@/lib/supabase/server";
import { ContactInfoCard } from "./_components/contact-info-card";
import { ActivityTimeline } from "./_components/activity-timeline";
import { AiChatPanel } from "./_components/ai-chat-panel";
import { ContactAiActions } from "./_components/contact-ai-actions";
import { ScoreHistoryChart } from "./_components/score-history-chart";

interface ContactPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { id } = await params;
  const contact = await getContact(id);
  if (!contact) return { title: "Contact not found" };
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";
  return { title: `${name} — Nexus CRM` };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { id } = await params;

  async function getScoreHistory(contactId: string) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("activities")
      .select("occurred_at, metadata")
      .eq("contact_id", contactId)
      .eq("type", "score_update")
      .order("occurred_at", { ascending: true })
      .limit(30);

    return (data ?? []).map((a) => ({
      date: new Date((a as { occurred_at: string }).occurred_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: Number((a as { metadata: Record<string, unknown> }).metadata?.new_score ?? 0),
    }));
  }

  const [contact, timelineItems, tags, gmailIntegration, scoreHistory] = await Promise.all([
    getContact(id),
    getContactTimeline(id),
    getTags(),
    getGmailIntegration(),
    getScoreHistory(id),
  ]);

  if (!contact) notFound();

  const contactName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href="/contacts"
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to contacts
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <ContactInfoCard contact={contact} allTags={tags} />
          <ScoreHistoryChart data={scoreHistory} currentScore={contact.score ?? 0} />
          <ContactAiActions contactId={contact.id} contactName={contactName} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <AiChatPanel contactId={contact.id} contactName={contactName} />
          <ActivityTimeline
            contactId={contact.id}
            contactEmail={contact.email}
            contactName={contactName}
            gmailConnected={!!gmailIntegration}
            items={timelineItems}
          />
        </div>
      </div>
    </div>
  );
}
