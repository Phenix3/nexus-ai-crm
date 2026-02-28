"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";

export async function removeMember(targetUserId: string): Promise<void> {
  const membership = await requireRole("admin");

  const supabase = await createClient();

  // Owners cannot be removed (must transfer ownership first)
  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", membership.orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot remove the owner");

  await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", membership.orgId)
    .eq("user_id", targetUserId);
}
