"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { setActiveOrgId } from "@/lib/org";

export async function setActiveOrganization(orgId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

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
