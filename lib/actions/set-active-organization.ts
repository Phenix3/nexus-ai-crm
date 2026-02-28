"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { setActiveOrgId } from "@/lib/org";

export async function setActiveOrganization(orgId: string): Promise<void> {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const userId = user.id;

  // Verify the user is actually a member of this org
  const membership = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.userId, userId))
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error("You are not a member of this organisation");
  }

  await setActiveOrgId(orgId);
  redirect("/dashboard");
}
