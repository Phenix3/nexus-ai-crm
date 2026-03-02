"use client";

import { useState, useEffect, useActionState, useRef, useTransition } from "react";
import {
  Phone,
  Calendar,
  Mail,
  StickyNote,
  ArrowRightLeft,
  TrendingUp,
  Activity,
  Plus,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ActivityLogDialog } from "./activity-log-dialog";
import { EmailComposeDialog } from "./email-compose-dialog";
import {
  deleteActivity,
  pinActivity,
  type TimelineItem,
  type TimelineActivity,
  type TimelineNote,
} from "@/lib/actions/activities";
import { createNote, deleteNote, type NoteFormState } from "@/lib/actions/notes";
import { useRouter } from "next/navigation";

interface UnifiedTimelineProps {
  contactId: string;
  contactEmail?: string | null;
  contactName?: string;
  gmailConnected?: boolean;
  items: TimelineItem[];
}

type FilterType = "all" | "call" | "meeting" | "email" | "note" | "stage_change" | "score_update";

function timeAgo(date: string): string {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

const ACTIVITY_CONFIG = {
  call: {
    icon: Phone,
    label: "Call",
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  },
  meeting: {
    icon: Calendar,
    label: "Meeting",
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  },
  email: {
    icon: Mail,
    label: "Email",
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  note: {
    icon: StickyNote,
    label: "Note",
    iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  },
  stage_change: {
    icon: ArrowRightLeft,
    label: "Stage change",
    iconClass: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
  },
  score_update: {
    icon: TrendingUp,
    label: "Score update",
    iconClass: "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
  },
} as const;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "call", label: "Calls" },
  { key: "meeting", label: "Meetings" },
  { key: "email", label: "Emails" },
  { key: "note", label: "Notes" },
  { key: "stage_change", label: "Stage" },
  { key: "score_update", label: "Score" },
];

const initialNoteState: NoteFormState = {};

export function ActivityTimeline({
  contactId,
  contactEmail,
  contactName = "Contact",
  gmailConnected = false,
  items = [],
}: UnifiedTimelineProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const noteFormRef = useRef<HTMLFormElement>(null);

  const noteAction = createNote.bind(null, contactId);
  const [noteState, noteFormAction, isNoteSubmitting] = useActionState(
    noteAction,
    initialNoteState
  );

  useEffect(() => {
    if (noteState.success) {
      noteFormRef.current?.reset();
      // setNoteFormOpen(false);
    }
  }, [noteState.success]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteActivity(activityId: string) {
    if (!confirm("Delete this activity?")) return;
    startTransition(async () => {
      await deleteActivity(activityId, contactId);
      router.refresh();
    });
  }

  function handleDeleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteNote(noteId, contactId);
      router.refresh();
    });
  }

  function handlePin(activityId: string, currentlyPinned: boolean) {
    startTransition(async () => {
      await pinActivity(activityId, contactId, !currentlyPinned);
      router.refresh();
    });
  }

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    if (item.kind === "note") return filter === "note";
    return item.type === filter;
  });

  return (
    <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Timeline</h3>
          {items.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setNoteFormOpen((v) => !v);
              setDialogOpen(false);
            }}
          >
            <StickyNote className="h-3 w-3" />
            Note
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => setEmailDialogOpen(true)}
          >
            <Mail className="h-3 w-3" />
            Send email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Log activity
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 border-b px-5 py-2.5 dark:border-zinc-800 overflow-x-auto">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              filter === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Inline note form */}
        {noteFormOpen && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
            <form ref={noteFormRef} action={noteFormAction} className="space-y-2">
              <Textarea
                name="content"
                placeholder="Write a note…"
                rows={3}
                autoFocus
                className="resize-none text-sm bg-white dark:bg-zinc-900 border-amber-200 dark:border-amber-800/40 focus-visible:ring-amber-400/30"
              />
              {noteState.fieldErrors?.content && (
                <p className="text-xs text-red-500">{noteState.fieldErrors.content[0]}</p>
              )}
              {noteState.error && <p className="text-xs text-red-500">{noteState.error}</p>}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isNoteSubmitting}
                  className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                  {isNoteSubmitting ? "Saving…" : "Save note"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNoteFormOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500">
              {filter === "all"
                ? "No activity yet."
                : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} yet.`}
            </p>
            {filter === "all" && (
              <p className="text-xs text-zinc-400">Track calls, meetings, emails, and notes.</p>
            )}
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical connector line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-100 dark:bg-zinc-800" />

            {filtered.map((item) =>
              item.kind === "note" ? (
                <NoteItem
                  key={item.id}
                  note={item}
                  expanded={expandedIds.has(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                  onDelete={handleDeleteNote}
                  isPending={isPending}
                />
              ) : (
                <ActivityItem
                  key={item.id}
                  activity={item}
                  expanded={expandedIds.has(item.id)}
                  onToggleExpand={() => toggleExpand(item.id)}
                  onDelete={handleDeleteActivity}
                  onPin={handlePin}
                  isPending={isPending}
                />
              )
            )}
          </div>
        )}
      </div>

      <ActivityLogDialog contactId={contactId} open={dialogOpen} onOpenChange={setDialogOpen} />
      <EmailComposeDialog
        contactId={contactId}
        contactEmail={contactEmail ?? null}
        contactName={contactName}
        gmailConnected={gmailConnected}
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
      />
    </div>
  );
}

// ── Note item ─────────────────────────────────────────────────────────────────

function NoteItem({
  note,
  expanded,
  onToggleExpand,
  onDelete,
  isPending,
}: {
  note: TimelineNote;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const config = ACTIVITY_CONFIG.note;
  const Icon = config.icon;
  const isTruncatable = note.content.length > 200;

  return (
    <div className="group relative flex gap-3 pb-5 last:pb-0">
      <div
        className={`relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                Note
              </span>
              <span className="text-[10px] text-zinc-400">{timeAgo(note.occurred_at)}</span>
            </div>
            <p
              className={`mt-1 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed ${
                !expanded && isTruncatable ? "line-clamp-3" : ""
              }`}
            >
              {note.content}
            </p>
            {isTruncatable && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="mt-0.5 text-xs text-primary hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            onClick={() => onDelete(note.id)}
            disabled={isPending}
            aria-label="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Activity item ─────────────────────────────────────────────────────────────

const PINNABLE_TYPES = new Set<string>(["call", "meeting", "email"]);

function ActivityItem({
  activity,
  expanded,
  onToggleExpand,
  onDelete,
  onPin,
  isPending,
}: {
  activity: TimelineActivity;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  isPending: boolean;
}) {
  const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.note;
  const Icon = config.icon;
  const isPinned = (activity.metadata as Record<string, unknown>)?.pinned === true;
  const isPinnable = PINNABLE_TYPES.has(activity.type);

  return (
    <div className="group relative flex gap-3 pb-5 last:pb-0">
      <div
        className={`relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 pt-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                {config.label}
              </span>
              <span className="text-[10px] text-zinc-400">{timeAgo(activity.occurred_at)}</span>
              {isPinned && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-500">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </span>
              )}
            </div>
            {activity.subject && (
              <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                {activity.subject}
              </p>
            )}
            {activity.type === "email" &&
              (() => {
                const meta = activity.metadata as Record<string, unknown> | null;
                const sentiment = meta?.sentiment as string | undefined;
                if (!sentiment || sentiment === "neutral") return null;
                const badgeClass =
                  {
                    positive:
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                    urgent:
                      "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
                    negative: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                  }[sentiment] ?? "bg-zinc-100 text-zinc-500";
                return (
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${badgeClass}`}
                  >
                    {sentiment}
                  </span>
                );
              })()}
            {activity.body && (
              <>
                <p
                  className={`mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed ${
                    !expanded && activity.body.length > 120 ? "line-clamp-2" : ""
                  }`}
                >
                  {activity.body}
                </p>
                {activity.body.length > 120 && (
                  <button
                    type="button"
                    onClick={onToggleExpand}
                    className="mt-0.5 text-xs text-primary hover:underline"
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}
              </>
            )}
            {activity.users?.full_name && (
              <p className="mt-1 text-xs text-zinc-400">by {activity.users.full_name}</p>
            )}
          </div>

          {/* Action buttons — always hover-reveal, pin button also visible when pinned */}
          <div
            className={`flex items-center gap-0.5 transition-opacity ${
              isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {isPinnable && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 shrink-0 transition-all ${
                  isPinned
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    : "text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
                onClick={() => onPin(activity.id, isPinned)}
                disabled={isPending}
                aria-label={isPinned ? "Unpin" : "Pin"}
              >
                {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(activity.id)}
              disabled={isPending}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
