"use server";

import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { invitations, organizationMembers } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { setActiveOrgId } from "@/lib/org";

export async function acceptInvitation(token: string): Promise<{ error: string } | never> {
  const user = await getUser();
  if (!user) redirect(`/sign-in?redirect_url=/invite/${token}`);
  const userId = user.id;

  const [invite] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.token, token),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    return { error: "This invitation is invalid or has expired." };
  }

  // Add member (ignore conflict if already a member)
  await db
    .insert(organizationMembers)
    .values({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    })
    .onConflictDoNothing();

  // Mark invitation as accepted
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invite.id));

  await setActiveOrgId(invite.organizationId);

  redirect("/dashboard");
}
