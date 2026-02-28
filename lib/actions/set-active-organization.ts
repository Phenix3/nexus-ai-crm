"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { setActiveOrgId } from "@/lib/org";

export async function setActiveOrganization(orgId: string): Promise<void> {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  const userId = user.id;

  const supabase = await createClient();

  // Verify the user is actually a member of this org
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    throw new Error("You are not a member of this organisation");
  }

  await setActiveOrgId(orgId);
  redirect("/dashboard");
}
