"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { getActiveOrgId } from "@/lib/org";
import { requireRole } from "@/lib/permissions";

export async function removeMember(targetUserId: string): Promise<void> {
  const membership = await requireRole("admin");

  // Owners cannot be removed (must transfer ownership first)
  const [target] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, membership.orgId),
        eq(organizationMembers.userId, targetUserId)
      )
    )
    .limit(1);

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot remove the owner");

  await db
    .delete(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, membership.orgId),
        eq(organizationMembers.userId, targetUserId)
      )
    );
}
