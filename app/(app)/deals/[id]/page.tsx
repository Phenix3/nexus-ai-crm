import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getDeal } from "@/lib/actions/deals";
import { getPipelineStages } from "@/lib/actions/pipeline-stages";
import { getContacts } from "@/lib/actions/contacts";
import { getContactTimeline } from "@/lib/actions/activities";
import { DealInfoCard } from "./_components/deal-info-card";
import { ActivityTimeline } from "../../contacts/[id]/_components/activity-timeline";

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DealPageProps) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) return { title: "Deal not found" };
  return { title: `${deal.title} — Nexus CRM` };
}

export default async function DealPage({ params }: DealPageProps) {
  const { id } = await params;

  const [deal, stages, contacts] = await Promise.all([
    getDeal(id),
    getPipelineStages(),
    getContacts(),
  ]);

  if (!deal) notFound();

  // If deal is linked to a contact, fetch unified timeline
  const timelineItems = await (deal.contact_id
    ? getContactTimeline(deal.contact_id)
    : Promise.resolve([]));

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/deals"
        className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 w-fit"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to pipeline
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left — deal info */}
        <DealInfoCard deal={deal} stages={stages} contacts={contacts} />

        {/* Right — contact notes + activities */}
        <div className="flex flex-col gap-6">
          {deal.contact_id ? (
            <ActivityTimeline contactId={deal.contact_id} items={timelineItems} />
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-700">
              <div>
                <p className="text-sm font-medium text-zinc-500">No contact linked</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Edit the deal to link a contact and see their activity.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
