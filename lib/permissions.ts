import { and, eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { createClient } from "@/lib/supabase/client";

type Role = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export async function getCurrentMembership() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) return null;
  const userId = user.id;

  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .limit(1);

  return membership ? { ...membership, orgId } : null;
}

/**
 * Throws if the current user doesn't have at least `minRole` in the active org.
 * Use in Server Actions and Route Handlers.
 */
export async function requireRole(minRole: Role) {
  const membership = await getCurrentMembership();

  if (!membership) {
    throw new Error("Not a member of this organisation");
  }

  if (ROLE_HIERARCHY[membership.role as Role] < ROLE_HIERARCHY[minRole]) {
    throw new Error("Insufficient permissions");
  }

  return membership;
}
