"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealCard } from "./deal-card";
import { DealForm } from "./deal-form";
import { CloseDealDialog } from "./close-deal-dialog";
import { SetupPipelineButton } from "./setup-pipeline-button";
import { moveDeal, deleteDeal, type Deal } from "@/lib/actions/deals";
import type { PipelineStage } from "@/lib/actions/pipeline-stages";
import type { Contact } from "@/lib/actions/contacts";

interface KanbanBoardProps {
  stages: PipelineStage[];
  dealsByStage: Record<string, Deal[]>;
  contacts: Contact[];
}

function formatValue(value: number, currency: string): string {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  try {
    return formatter.format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function DroppableColumn({
  stage,
  deals,
  onNewDeal,
  onEdit,
  onDelete,
  onClose,
}: {
  stage: PipelineStage;
  deals: Deal[];
  onNewDeal: (stageId: string) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onClose: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const totalValue = deals.reduce((s, d) => s + Number(d.value), 0);
  const currency = deals[0]?.currency ?? "EUR";

  return (
    <div className="flex w-[280px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {stage.name}
          </span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {deals.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-600"
          onClick={() => onNewDeal(stage.id)}
          aria-label="Add deal"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Value summary */}
      {deals.length > 0 && (
        <p className="px-1 text-xs text-zinc-400">{formatValue(totalValue, currency)}</p>
      )}

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors ${
          isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-zinc-50/80 dark:bg-zinc-800/30"
        }`}
      >
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={onClose}
          />
        ))}

        {deals.length === 0 && (
          <button
            type="button"
            onClick={() => onNewDeal(stage.id)}
            className="flex h-16 items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-zinc-200 text-xs text-zinc-400 transition-colors hover:border-zinc-300 hover:text-zinc-500 dark:border-zinc-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add deal
          </button>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ stages, dealsByStage, contacts }: KanbanBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | undefined>();
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>();

  // Close deal dialog
  const [closeOpen, setCloseOpen] = useState(false);
  const [closingDeal, setClosingDeal] = useState<Deal | undefined>();

  // Optimistic board state
  const [localDeals, setLocalDeals] = useState<Record<string, Deal[]>>(dealsByStage);

  // Sync when server data changes (after router.refresh())
  useEffect(() => {
    setLocalDeals(dealsByStage);
  }, [dealsByStage]);

  // DnD
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(event: DragStartEvent) {
    const deal = event.active.data.current?.deal as Deal;
    setActiveDeal(deal ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over || active.id === over.id) return;

    const dealId = String(active.id);
    const newStageId = String(over.id);
    const deal = active.data.current?.deal as Deal;

    if (!deal || deal.stage_id === newStageId) return;

    // Find destination stage for default probability
    const destStage = stages.find((s) => s.id === newStageId);

    // Optimistic update
    setLocalDeals((prev) => {
      const next = { ...prev };
      // Remove from old column
      const oldKey = deal.stage_id ?? "unstaged";
      next[oldKey] = (next[oldKey] ?? []).filter((d) => d.id !== dealId);
      // Add to new column
      const updated: Deal = {
        ...deal,
        stage_id: newStageId,
        probability: destStage?.default_probability ?? deal.probability,
      };
      next[newStageId] = [updated, ...(next[newStageId] ?? [])];
      return next;
    });

    // Server update
    startTransition(async () => {
      await moveDeal(dealId, newStageId, destStage?.default_probability);
      router.refresh();
    });
  }

  function handleNewDeal(stageId: string) {
    setEditDeal(undefined);
    setDefaultStageId(stageId);
    setFormOpen(true);
  }

  function handleEdit(deal: Deal) {
    setEditDeal(deal);
    setDefaultStageId(undefined);
    setFormOpen(true);
  }

  function handleDelete(deal: Deal) {
    if (!confirm(`Delete "${deal.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteDeal(deal.id);
      router.refresh();
    });
  }

  function handleClose(deal: Deal) {
    setClosingDeal(deal);
    setCloseOpen(true);
  }

  if (stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          No pipeline stages yet
        </h2>
        <p className="mt-1 max-w-xs text-sm text-zinc-500 mb-5">
          Click below to create 5 default stages: Prospecting, Qualification, Proposal, Negotiation,
          and Closing.
        </p>
        <SetupPipelineButton />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <DroppableColumn
              key={stage.id}
              stage={stage}
              deals={localDeals[stage.id] ?? []}
              onNewDeal={handleNewDeal}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClose={handleClose}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && (
            <DealCard
              deal={activeDeal}
              onEdit={() => {}}
              onDelete={() => {}}
              onClose={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        deal={editDeal}
        stages={stages}
        contacts={contacts}
        defaultStageId={defaultStageId}
      />

      {closingDeal && (
        <CloseDealDialog
          dealId={closingDeal.id}
          dealTitle={closingDeal.title}
          open={closeOpen}
          onOpenChange={setCloseOpen}
        />
      )}
    </>
  );
}
