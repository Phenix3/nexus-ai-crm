"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DealForm } from "../../_components/deal-form";
import { CloseDealDialog } from "../../_components/close-deal-dialog";
import { reopenDeal, deleteDeal, type Deal } from "@/lib/actions/deals";
import type { PipelineStage } from "@/lib/actions/pipeline-stages";
import type { Contact } from "@/lib/actions/contacts";

interface DealInfoCardProps {
  deal: Deal;
  stages: PipelineStage[];
  contacts: Contact[];
}

function formatValue(value: string, currency: string): string {
  const num = Number(value);
  if (isNaN(num)) return value;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `${num} ${currency}`;
  }
}

function StatusBadge({ status }: { status: string }) {
  if (status === "won")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-0 hover:bg-emerald-100">
        Won ✅
      </Badge>
    );
  if (status === "lost")
    return <Badge className="bg-red-100 text-red-700 border-0 hover:bg-red-100">Lost ❌</Badge>;
  return <Badge className="bg-blue-100 text-blue-700 border-0 hover:bg-blue-100">Open</Badge>;
}

export function DealInfoCard({ deal, stages, contacts }: DealInfoCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const probColor =
    deal.probability >= 70
      ? "bg-emerald-500"
      : deal.probability >= 40
        ? "bg-amber-500"
        : "bg-zinc-300 dark:bg-zinc-600";

  const contactName = deal.contacts
    ? [deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(" ")
    : null;

  function handleReopen() {
    startTransition(async () => {
      await reopenDeal(deal.id);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${deal.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteDeal(deal.id);
      router.push("/deals");
    });
  }

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                  {deal.title}
                </h2>
                <StatusBadge status={deal.status} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={() => setEditOpen(true)}
              disabled={deal.status !== "open"}
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          </div>

          {/* Value */}
          <div className="mt-4">
            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatValue(deal.value, deal.currency)}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              {deal.pipeline_stages?.name ?? "No stage"} · {deal.probability}% probability
            </p>
          </div>

          {/* Probability bar */}
          <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-1.5 rounded-full transition-all ${probColor}`}
              style={{ width: `${Math.min(deal.probability, 100)}%` }}
            />
          </div>
        </div>

        <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Details */}
        <div className="p-6 pt-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Deal info
          </p>

          <dl className="space-y-2.5 text-sm">
            {deal.pipeline_stages && (
              <div className="flex items-center gap-3">
                <dt className="text-zinc-400">
                  <span
                    className="h-3 w-3 rounded-full inline-block"
                    style={{ backgroundColor: deal.pipeline_stages.color }}
                  />
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{deal.pipeline_stages.name}</dd>
              </div>
            )}

            {(contactName || deal.contacts?.company) && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Building2 className="h-3.5 w-3.5" />
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {contactName}
                  {deal.contacts?.company && (
                    <span className="text-zinc-400"> — {deal.contacts.company}</span>
                  )}
                </dd>
              </div>
            )}

            {deal.expected_close_date && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Calendar className="h-3.5 w-3.5" />
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">
                  {new Date(deal.expected_close_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            )}

            {deal.status === "lost" && deal.lost_reason && (
              <div className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
                <p className="font-semibold mb-0.5">Lost reason</p>
                <p>{deal.lost_reason}</p>
              </div>
            )}
          </dl>
        </div>

        <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Actions */}
        <div className="p-6 pt-4 flex flex-col gap-2">
          {deal.status === "open" && (
            <Button className="w-full gap-1.5" onClick={() => setCloseOpen(true)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Close deal
            </Button>
          )}

          {deal.status !== "open" && (
            <Button
              variant="outline"
              className="w-full gap-1.5"
              onClick={handleReopen}
              disabled={isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen deal
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete deal
          </Button>
        </div>
      </div>

      <DealForm
        open={editOpen}
        onOpenChange={setEditOpen}
        deal={deal}
        stages={stages}
        contacts={contacts}
      />

      <CloseDealDialog
        dealId={deal.id}
        dealTitle={deal.title}
        open={closeOpen}
        onOpenChange={setCloseOpen}
      />
    </>
  );
}
