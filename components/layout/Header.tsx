"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus, AlertCircle, Info, AlertTriangle, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AlertItem } from "@/lib/actions/alerts";

const breadcrumbs: Record<string, { label: string; sub?: Record<string, string> }> = {
  "/dashboard": { label: "Dashboard" },
  "/contacts": {
    label: "Contacts",
    sub: { new: "New Contact" },
  },
  "/deals": { label: "Deals" },
  "/inbox": { label: "Inbox" },
  "/alerts": { label: "Alerts" },
  "/settings": {
    label: "Settings",
    sub: {
      general: "General",
      profile: "Profile",
      team: "Team",
      billing: "Billing",
      integrations: "Integrations",
      privacy: "Privacy & Data",
    },
  },
};

function getTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  for (const [base, config] of Object.entries(breadcrumbs)) {
    const baseSegment = base.replace("/", "");
    if (segments[0] === baseSegment) {
      if (segments[1] && config.sub?.[segments[1]]) {
        return config.sub[segments[1]];
      }
      return config.label;
    }
  }

  return "Nexus CRM";
}

const quickCreateHref: Record<string, string> = {
  "/contacts": "/contacts",
};

const SEVERITY_CONFIG = {
  urgent: {
    icon: AlertCircle,
    className: "text-red-500",
    badge: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-orange-500",
    badge: "bg-orange-500",
  },
  info: {
    icon: Info,
    className: "text-blue-500",
    badge: "bg-blue-500",
  },
} as const;

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface HeaderProps {
  unreadAlerts?: AlertItem[];
}

export function Header({ unreadAlerts = [] }: HeaderProps) {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const parent = segments.length > 1 ? breadcrumbs[`/${segments[0]}`]?.label : null;
  const unreadCount = unreadAlerts.length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white/80 px-4 lg:px-6 backdrop-blur-sm dark:bg-zinc-950/80">
      {/* Logo on mobile / Breadcrumb on desktop */}
      <div className="flex items-center gap-2 text-sm">
        {/* Mobile: show logo */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <Zap className="h-3 w-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</span>
        </div>
        {/* Desktop: show breadcrumb */}
        <div className="hidden lg:flex items-center gap-2">
          {parent && (
            <>
              <span className="text-zinc-400">{parent}</span>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
            </>
          )}
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {quickCreateHref[pathname] && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <a href={quickCreateHref[pathname]}>
              <Plus className="h-3.5 w-3.5" />
              New
            </a>
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs text-zinc-400">{unreadCount} unread</span>
              )}
            </div>

            {unreadAlerts.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
                <p className="text-sm text-zinc-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-zinc-800">
                {unreadAlerts.map((alert) => {
                  const config = SEVERITY_CONFIG[alert.severity];
                  const SeverityIcon = config.icon;
                  const contactName = alert.contacts
                    ? [alert.contacts.first_name, alert.contacts.last_name]
                        .filter(Boolean)
                        .join(" ") || null
                    : null;

                  return (
                    <div
                      key={alert.id}
                      className="flex gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <SeverityIcon className={cn("mt-0.5 h-4 w-4 shrink-0", config.className)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 leading-snug">
                          {alert.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">{alert.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {contactName && alert.contact_id && (
                            <Link
                              href={`/contacts/${alert.contact_id}`}
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              {contactName}
                            </Link>
                          )}
                          <span className="text-[10px] text-zinc-400">
                            {timeAgo(alert.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border-t px-4 py-2.5">
              <Link
                href="/alerts"
                className="block text-center text-xs font-medium text-primary hover:underline"
              >
                View all alerts
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
