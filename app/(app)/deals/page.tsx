import { getPipelineStages } from "@/lib/actions/pipeline-stages";
import { getDeals, type Deal } from "@/lib/actions/deals";
import { getContacts } from "@/lib/actions/contacts";
import { KanbanBoard } from "./_components/kanban-board";

export const metadata = { title: "Deals — Nexus CRM" };

export default async function DealsPage() {
  const [stages, deals, contacts] = await Promise.all([
    getPipelineStages(),
    getDeals(),
    getContacts(),
  ]);

  // Group deals by stage_id
  const dealsByStage: Record<string, Deal[]> = {};
  for (const stage of stages) {
    dealsByStage[stage.id] = [];
  }
  for (const deal of deals) {
    const key = deal.stage_id ?? "";
    if (key && dealsByStage[key] !== undefined) {
      dealsByStage[key].push(deal);
    }
  }

  const totalValue = deals.reduce((s, d) => s + Number(d.value), 0);
  const weightedValue = deals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);

  const currency = deals[0]?.currency ?? "EUR";
  function fmt(v: number) {
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(v);
    } catch {
      return `${v}`;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {deals.length} open deal{deals.length !== 1 ? "s" : ""} ·{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{fmt(totalValue)}</span>{" "}
          total · <span className="text-zinc-500">{fmt(Math.round(weightedValue))} weighted</span>
        </p>
      </div>

      {/* Kanban */}
      <KanbanBoard stages={stages} dealsByStage={dealsByStage} contacts={contacts} />
    </div>
  );
}
