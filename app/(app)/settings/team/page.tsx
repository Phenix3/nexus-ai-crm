import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitations, organizationMembers, organizations, users } from "@/db/schema";
import { getActiveOrgId } from "@/lib/org";
import { getCurrentMembership } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InviteForm } from "./_components/invite-form";
import { MemberActions } from "./_components/member-actions";

export default async function TeamPage() {
  const { userId } = await auth();
  const orgId = await getActiveOrgId();

  if (!userId || !orgId) return null;

  const [membership, members, pendingInvites, org] = await Promise.all([
    getCurrentMembership(),
    db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, orgId)),
    db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(eq(invitations.organizationId, orgId))
      .orderBy(invitations.createdAt),
    db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1),
  ]);

  const canManage = membership?.role === "owner" || membership?.role === "admin";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Team</h2>
        <p className="text-sm text-zinc-500">{org[0]?.name}</p>
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
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.fullName ?? m.email}</p>
                {m.fullName && <p className="truncate text-xs text-zinc-500">{m.email}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={m.role === "owner" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {m.role}
                </Badge>
                <MemberActions
                  targetUserId={m.userId}
                  currentRole={m.role}
                  canManage={canManage && m.userId !== userId}
                />
              </div>
            </li>
          ))}
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
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
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
