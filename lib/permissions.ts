import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

type Role = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export async function getCurrentMembership() {
  const user = await getUser();
  if (!user) return null;
  const userId = user.id;

  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;

  return { role: membership.role as Role, orgId };
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

  if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) {
    throw new Error("Insufficient permissions");
  }

  return membership;
}
