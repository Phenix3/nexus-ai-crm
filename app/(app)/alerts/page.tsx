import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, Bell, CheckCheck } from "lucide-react";
import { getAlerts, markAllAlertsRead } from "@/lib/actions/alerts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertsPageProps {
  searchParams: Promise<{ filter?: string }>;
}

const SEVERITY_CONFIG = {
  urgent: {
    icon: AlertCircle,
    className: "text-red-500 bg-red-50 dark:bg-red-950/30",
    label: "Urgent",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-orange-500 bg-orange-50 dark:bg-orange-950/30",
    label: "Warning",
  },
  info: {
    icon: Info,
    className: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    label: "Info",
  },
} as const;

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const { filter = "all" } = await searchParams;
  const validFilter = ["all", "unread", "urgent"].includes(filter)
    ? (filter as "all" | "unread" | "urgent")
    : "all";

  const alerts = await getAlerts(validFilter);
  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const filters = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "urgent", label: "Urgent" },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Alerts</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAlertsRead}>
            <Button type="submit" variant="outline" size="sm" className="gap-1.5 text-xs">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={`/alerts?filter=${key}`}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              validFilter === key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white py-16 text-center dark:bg-zinc-900 dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Bell className="h-5 w-5 text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No alerts</p>
          <p className="text-xs text-zinc-400">
            {validFilter === "unread"
              ? "No unread alerts"
              : validFilter === "urgent"
                ? "No urgent alerts"
                : "Alerts will appear here when there is activity to review"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];
            const SeverityIcon = config.icon;
            const contactName = alert.contacts
              ? [alert.contacts.first_name, alert.contacts.last_name].filter(Boolean).join(" ") ||
                null
              : null;

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex gap-4 rounded-xl border bg-white p-4 transition-colors dark:bg-zinc-900 dark:border-zinc-800",
                  !alert.is_read && "border-l-4 border-l-primary"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    config.className
                  )}
                >
                  <SeverityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {alert.title}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {alert.message}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {timeAgo(alert.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {contactName && alert.contact_id && (
                      <Link
                        href={`/contacts/${alert.contact_id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View contact: {contactName}
                      </Link>
                    )}
                    {alert.deal_id && (
                      <Link
                        href={`/deals`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View deal
                      </Link>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        alert.severity === "urgent"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : alert.severity === "warning"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      )}
                    >
                      {config.label}
                    </span>
                    {!alert.is_read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
