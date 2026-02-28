"use client";

import { useState, useTransition } from "react";
import { Phone, Calendar, Mail, Plus, Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogDialog } from "./activity-log-dialog";
import { deleteActivity, type Activity as ActivityType } from "@/lib/actions/activities";
import { useRouter } from "next/navigation";

interface ActivityTimelineProps {
  contactId: string;
  activities: ActivityType[];
}

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
    dotClass: "bg-blue-500",
  },
  meeting: {
    icon: Calendar,
    label: "Meeting",
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
    dotClass: "bg-violet-500",
  },
  email: {
    icon: Mail,
    label: "Email",
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  note: {
    icon: Activity,
    label: "Note",
    iconClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dotClass: "bg-zinc-400",
  },
  stage_change: {
    icon: Activity,
    label: "Stage change",
    iconClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dotClass: "bg-zinc-400",
  },
  score_update: {
    icon: Activity,
    label: "Score update",
    iconClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    dotClass: "bg-zinc-400",
  },
} as const;

export function ActivityTimeline({ contactId, activities }: ActivityTimelineProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function toggleExpand(id: string) {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  }

  function handleDelete(activityId: string) {
    if (!confirm("Delete this activity?")) return;
    startTransition(async () => {
      await deleteActivity(activityId, contactId);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Activity</h3>
          {activities.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {activities.length}
            </span>
          )}
        </div>
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

      <div className="p-5">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500">No activities logged yet.</p>
            <p className="text-xs text-zinc-400">Track calls, meetings, and emails.</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 gap-1 text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Log first activity
            </Button>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-100 dark:bg-zinc-800" />

            {activities.map((activity, idx) => {
              const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.note;
              const Icon = config.icon;
              const isExpanded = expandedIds.has(activity.id);

              return (
                <div key={activity.id} className="group relative flex gap-3 pb-5 last:pb-0">
                  {/* Icon dot */}
                  <div
                    className={`relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${config.iconClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            {config.label}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {timeAgo(activity.occurred_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-snug">
                          {activity.subject}
                        </p>
                        {activity.body && (
                          <>
                            <p
                              className={`mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed ${
                                !isExpanded && activity.body.length > 120 ? "line-clamp-2" : ""
                              }`}
                            >
                              {activity.body}
                            </p>
                            {activity.body.length > 120 && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(activity.id)}
                                className="mt-0.5 text-xs text-primary hover:underline"
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </>
                        )}
                        {activity.users?.full_name && (
                          <p className="mt-1 text-xs text-zinc-400">
                            by {activity.users.full_name}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                        onClick={() => handleDelete(activity.id)}
                        disabled={isPending}
                        aria-label="Delete activity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ActivityLogDialog contactId={contactId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
