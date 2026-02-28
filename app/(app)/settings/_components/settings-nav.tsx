"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/settings/general", label: "General" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
  { href: "/settings/integrations", label: "Integrations" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
