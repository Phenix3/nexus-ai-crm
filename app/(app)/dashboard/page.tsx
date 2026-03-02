import {
  Users,
  TrendingUp,
  Target,
  Activity,
  ArrowUpRight,
  AlertCircle,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";

async function getDashboardStats() {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [contactsRes, openDealsRes, wonDealsRes, overdueRes, activitiesRes] = await Promise.all([
    supabase.from("contacts").select("id, score", { count: "exact" }).eq("organization_id", orgId),
    supabase
      .from("deals")
      .select("id, value, probability")
      .eq("organization_id", orgId)
      .eq("status", "open"),
    supabase.from("deals").select("id, value").eq("organization_id", orgId).eq("status", "won"),
    supabase
      .from("deals")
      .select("id", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("status", "open")
      .lt("expected_close_date", today),
    supabase
      .from("activities")
      .select("id", { count: "exact" })
      .eq("organization_id", orgId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const contacts = contactsRes.data ?? [];
  const openDeals = (openDealsRes.data ?? []) as {
    id: string;
    value: string;
    probability: number;
  }[];
  const wonDeals = (wonDealsRes.data ?? []) as { id: string; value: string }[];

  const avgScore =
    contacts.length > 0
      ? Math.round(contacts.reduce((s, c) => s + (c.score ?? 0), 0) / contacts.length)
      : 0;

  const totalPipelineValue = openDeals.reduce((s, d) => s + Number(d.value), 0);
  const weightedValue = openDeals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);

  return {
    totalContacts: contactsRes.count ?? contacts.length,
    totalOpenDeals: openDeals.length,
    totalPipelineValue,
    weightedValue,
    wonCount: wonDeals.length,
    wonValue,
    avgScore,
    overdueDeals: overdueRes.count ?? 0,
    recentActivities: activitiesRes.count ?? 0,
  };
}

function formatCurrency(value: number, currency = "XAF"): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${Math.round(value)} ${currency}`;
  }
}

export default async function DashboardPage() {
  // const user = await getUser();
  const stats = await getDashboardStats();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  })();

  const statCards = [
    {
      label: "Total contacts",
      value: String(stats?.totalContacts ?? 0),
      icon: Users,
      href: "/contacts",
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
    {
      label: "Open deals",
      value: String(stats?.totalOpenDeals ?? 0),
      sub: stats?.totalPipelineValue ? formatCurrency(stats.totalPipelineValue) : undefined,
      icon: TrendingUp,
      href: "/deals",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      label: "Avg. lead score",
      value: String(stats?.avgScore ?? 0),
      sub: "/ 100",
      icon: Target,
      href: "/contacts",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      label: "Activities (7d)",
      value: String(stats?.recentActivities ?? 0),
      icon: Activity,
      href: "/contacts",
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {greeting} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-900/60 dark:border-zinc-800"
          >
            <div className="flex items-start justify-between">
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                {value}
                {sub && <span className="ml-1 text-sm font-normal text-zinc-400">{sub}</span>}
              </p>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline summary + alerts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pipeline health */}
        <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pipeline</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Total value</span>
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(stats?.totalPipelineValue ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Weighted forecast</span>
              <span className="text-sm font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                {formatCurrency(stats?.weightedValue ?? 0)}
              </span>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Trophy className="h-3 w-3 text-emerald-500" />
                Won this year
              </span>
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(stats?.wonValue ?? 0)}
              </span>
            </div>
            {(stats?.overdueDeals ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
                <Link
                  href="/deals"
                  className="text-sm font-semibold tabular-nums text-red-500 hover:underline"
                >
                  {stats?.overdueDeals} deal{(stats?.overdueDeals ?? 0) !== 1 ? "s" : ""}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick actions</h2>
          <div className="mt-4 space-y-2">
            {[
              { href: "/contacts", label: "Add a contact", icon: Users },
              { href: "/deals", label: "Create a deal", icon: TrendingUp },
              { href: "/settings/team", label: "Invite a team member", icon: Activity },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Getting started */}
        <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900/60 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Getting started</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                step: "1",
                label: "Add your first contact",
                done: (stats?.totalContacts ?? 0) > 0,
                href: "/contacts",
              },
              {
                step: "2",
                label: "Create a deal in the pipeline",
                done: (stats?.totalOpenDeals ?? 0) > 0 || (stats?.wonCount ?? 0) > 0,
                href: "/deals",
              },
              {
                step: "3",
                label: "Invite your team",
                done: false,
                href: "/settings/team",
              },
            ].map(({ step, label, done, href }) => (
              <Link
                key={step}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    done
                      ? "bg-primary text-white"
                      : "border-2 border-zinc-200 text-zinc-400 dark:border-zinc-700"
                  }`}
                >
                  {done ? "✓" : step}
                </div>
                <span
                  className={`text-sm ${
                    done
                      ? "text-zinc-400 line-through dark:text-zinc-600"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
