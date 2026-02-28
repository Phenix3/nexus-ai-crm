import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { getCurrentMembership } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InviteForm } from "./_components/invite-form";
import { MemberActions } from "./_components/member-actions";

export default async function TeamPage() {
  const authUser = await getUser();
  const orgId = await getActiveOrgId();

  if (!authUser || !orgId) return null;
  const userId = authUser.id;

  const supabase = await createClient();

  const [membership, membersResult, pendingResult, orgResult] = await Promise.all([
    getCurrentMembership(),

    // Members with their user details via FK join
    supabase
      .from("organization_members")
      .select("user_id, role, users(full_name, email, avatar_url)")
      .eq("organization_id", orgId),

    // Pending invitations (not yet accepted)
    supabase
      .from("invitations")
      .select("id, email, role, expires_at")
      .eq("organization_id", orgId)
      .is("accepted_at", null)
      .order("created_at", { ascending: true }),

    // Organisation name
    supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
  ]);

  const members = membersResult.data ?? [];
  const pendingInvites = pendingResult.data ?? [];
  const org = orgResult.data;

  const canManage = membership?.role === "owner" || membership?.role === "admin";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Team</h2>
        <p className="text-sm text-zinc-500">{org?.name}</p>
      </div>

      {/* Invite */}
      {canManage && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium">Invite a member</h3>
          <InviteForm />
        </section>
      )}

      <Separator />

      {/* Members */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">Members ({members.length})</h3>
        <ul className="divide-y rounded-lg border">
          {members.map((m) => {
            const user = Array.isArray(m.users) ? m.users[0] : m.users;
            return (
              <li key={m.user_id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user?.full_name ?? user?.email}</p>
                  {user?.full_name && (
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={m.role === "owner" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {m.role}
                  </Badge>
                  <MemberActions
                    targetUserId={m.user_id}
                    currentRole={m.role}
                    canManage={canManage && m.user_id !== userId}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Pending invitations ({pendingInvites.length})</h3>
            <ul className="divide-y rounded-lg border">
              {pendingInvites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm">{inv.email}</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {inv.role}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      Expires {new Date(inv.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
