import { Users, TrendingUp, Target, Activity, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

async function getDashboardStats() {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const [contactsRes, dealsRes, activitiesRes] = await Promise.all([
    supabase.from("contacts").select("id, score", { count: "exact" }).eq("organization_id", orgId),
    supabase.from("deals").select("id, value", { count: "exact" }).eq("organization_id", orgId),
    supabase
      .from("activities")
      .select("id", { count: "exact" })
      .eq("organization_id", orgId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const contacts = contactsRes.data ?? [];
  const deals = dealsRes.data ?? [];

  const avgScore =
    contacts.length > 0
      ? Math.round(contacts.reduce((s, c) => s + (c.score ?? 0), 0) / contacts.length)
      : 0;

  const pipelineValue = deals.reduce((s, d) => s + (d.value ?? 0), 0);

  return {
    totalContacts: contactsRes.count ?? contacts.length,
    totalDeals: dealsRes.count ?? deals.length,
    avgScore,
    pipelineValue,
    recentActivities: activitiesRes.count ?? 0,
  };
}

export default async function DashboardPage() {
  const user = await getUser();
  const stats = await getDashboardStats();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const statCards = [
    {
      label: "Total contacts",
      value: stats?.totalContacts ?? 0,
      icon: Users,
      href: "/contacts",
      trend: null,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400",
    },
    {
      label: "Open deals",
      value: stats?.totalDeals ?? 0,
      icon: TrendingUp,
      href: "/deals",
      trend: null,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      label: "Avg. lead score",
      value: stats?.avgScore ?? 0,
      suffix: "/ 100",
      icon: Target,
      href: "/contacts",
      trend: null,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      label: "Activities (7d)",
      value: stats?.recentActivities ?? 0,
      icon: Activity,
      href: "/contacts",
      trend: null,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {greeting}
          {user ? "" : ""} 👋
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening in your workspace today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, suffix, icon: Icon, href, color }) => (
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
                {suffix && <span className="ml-1 text-sm font-normal text-zinc-400">{suffix}</span>}
              </p>
              <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="rounded-xl border bg-white p-5 dark:bg-zinc-900/60 dark:border-zinc-800 sm:col-span-1 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Getting started</h2>
          <div className="mt-4 space-y-3">
            {[
              {
                step: "1",
                label: "Import or add your first contacts",
                done: (stats?.totalContacts ?? 0) > 0,
                href: "/contacts",
              },
              {
                step: "2",
                label: "Set up your sales pipeline",
                done: (stats?.totalDeals ?? 0) > 0,
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
