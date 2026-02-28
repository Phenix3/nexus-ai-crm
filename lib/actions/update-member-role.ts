"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { getActiveOrgId } from "@/lib/org";
import { requireRole } from "@/lib/permissions";

const schema = z.object({
  targetUserId: z.string(),
  role: z.enum(["admin", "member"]),
});

export async function updateMemberRole(
  targetUserId: string,
  role: "admin" | "member"
): Promise<void> {
  const membership = await requireRole("owner");

  schema.parse({ targetUserId, role });

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
  if (target.role === "owner") throw new Error("Cannot change the owner's role");

  await db
    .update(organizationMembers)
    .set({ role })
    .where(
      and(
        eq(organizationMembers.organizationId, membership.orgId),
        eq(organizationMembers.userId, targetUserId)
      )
    );
}
