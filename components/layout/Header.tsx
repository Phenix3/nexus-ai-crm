"use client";

import { usePathname } from "next/navigation";
import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const breadcrumbs: Record<string, { label: string; sub?: Record<string, string> }> = {
  "/dashboard": { label: "Dashboard" },
  "/contacts": {
    label: "Contacts",
    sub: { new: "New Contact" },
  },
  "/deals": { label: "Deals" },
  "/settings": {
    label: "Settings",
    sub: {
      general: "General",
      profile: "Profile",
      team: "Team",
      billing: "Billing",
      integrations: "Integrations",
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

export function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const parent = segments.length > 1 ? breadcrumbs[`/${segments[0]}`]?.label : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-sm dark:bg-zinc-950/80">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {parent && (
          <>
            <span className="text-zinc-400">{parent}</span>
            <span className="text-zinc-300 dark:text-zinc-600">/</span>
          </>
        )}
        <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
