"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", membership.orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) throw new Error("Member not found");
  if (target.role === "owner") throw new Error("Cannot change the owner's role");

  await supabase
    .from("organization_members")
    .update({ role })
    .eq("organization_id", membership.orgId)
    .eq("user_id", targetUserId);
}
