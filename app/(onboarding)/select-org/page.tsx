import { redirect } from "next/navigation";
import { Zap, ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setActiveOrganization } from "@/lib/actions/set-active-organization";

export default async function SelectOrgPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) redirect("/new-org");

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Nexus CRM</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Select a workspace
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Choose the organisation you want to access.
        </p>
      </div>

      <div className="space-y-2">
        {memberships.map((m) => {
          const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
          if (!org) return null;
          const initials = org.name.slice(0, 2).toUpperCase();
          return (
            <form
              key={org.id}
              action={async () => {
                "use server";
                await setActiveOrganization(org.id);
              }}
            >
              <button
                type="submit"
                className="group flex w-full items-center gap-4 rounded-xl border bg-white px-4 py-3.5 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-primary/30 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-900 group-hover:text-primary transition-colors dark:text-zinc-50">
                    {org.name}
                  </p>
                  <p className="text-xs text-zinc-400">Your role: {m.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {m.role}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-primary transition-colors" />
                </div>
              </button>
            </form>
          );
        })}

        <div className="pt-2">
          <Button variant="outline" className="w-full h-10 gap-2 text-sm" asChild>
            <a href="/new-org">
              <Plus className="h-4 w-4" />
              Create a new organisation
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
