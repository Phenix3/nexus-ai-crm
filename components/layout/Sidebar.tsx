"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Inbox,
  Bell,
  Settings,
  LogOut,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/deals", label: "Deals", icon: TrendingUp },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

interface SidebarProps {
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
      )}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active
            ? "text-primary"
            : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
        )}
      />
      {label}
    </Link>
  );
}

export function Sidebar({ userName, userEmail, userAvatarUrl }: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-zinc-50 dark:bg-zinc-950/80">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Nexus CRM
        </span>
      </div>

      <div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-800" />

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Workspace
        </p>
        {mainNav.map(({ href, label, icon }) => (
          <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href)} />
        ))}

        <div className="my-2 mx-1 h-px bg-zinc-200 dark:bg-zinc-800" />

        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          Account
        </p>
        <NavItem
          href="/settings/general"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith("/settings")}
        />
      </nav>

      {/* User section */}
      <div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex items-center gap-2.5 px-3 py-3.5">
        <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary/20">
          {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userName ?? "User"} />}
          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {userName ?? "User"}
          </p>
          <p className="truncate text-[11px] leading-tight text-zinc-400">{userEmail ?? ""}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sign out"
            className="cursor-pointer rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
