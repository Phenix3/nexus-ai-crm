"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import { Calendar, Building2, MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Deal } from "@/lib/actions/deals";

interface DealCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onClose: (deal: Deal) => void;
  isDragging?: boolean;
}

function formatValue(value: string, currency: string): string {
  const num = Number(value);
  if (isNaN(num)) return value;
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  try {
    return formatter.format(num);
  } catch {
    return `${num} ${currency}`;
  }
}

function isOverdue(date: string | null): boolean {
  if (!date) return false;
  return new Date(date) < new Date(new Date().toDateString());
}

export function DealCard({ deal, onEdit, onDelete, onClose, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndDragging,
  } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const contactName = deal.contacts
    ? [deal.contacts.first_name, deal.contacts.last_name].filter(Boolean).join(" ")
    : null;

  const overdue = isOverdue(deal.expected_close_date);

  const probColor =
    deal.probability >= 70
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
      : deal.probability >= 40
        ? "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
        : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border bg-white p-3.5 shadow-sm transition-shadow dark:bg-zinc-900 dark:border-zinc-800 ${
        dndDragging || isDragging
          ? "opacity-50 shadow-md ring-2 ring-primary/30"
          : "hover:shadow-md cursor-grab active:cursor-grabbing"
      }`}
      {...listeners}
      {...attributes}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/deals/${deal.id}`}
          className="min-w-0 flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 hover:text-primary transition-colors">
            {deal.title}
          </p>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-0.5"
              onClick={(e) => e.stopPropagation()}
              aria-label="Deal actions"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onEdit(deal)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClose(deal)}>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
              Close deal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDelete(deal)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact / company */}
      {(contactName || deal.contacts?.company) && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{contactName || deal.contacts?.company}</span>
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
          {formatValue(deal.value, deal.currency)}
        </span>

        <div className="flex items-center gap-1.5">
          {deal.expected_close_date && (
            <span
              className={`flex items-center gap-0.5 text-[10px] font-medium ${
                overdue ? "text-red-500" : "text-zinc-400"
              }`}
            >
              <Calendar className="h-2.5 w-2.5" />
              {new Date(deal.expected_close_date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${probColor}`}
          >
            {deal.probability}%
          </span>
        </div>
      </div>
    </div>
  );
}
