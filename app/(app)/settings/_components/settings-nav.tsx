"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2, User, Users, CreditCard, Plug, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/settings/general", label: "General", icon: Settings2 },
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/privacy", label: "Privacy & Data", icon: Shield },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary dark:bg-primary/15"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-zinc-400")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
