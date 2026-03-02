"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { clearActiveOrgId } from "@/lib/org";

export async function deleteAccount(): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Remove org memberships (cascade will clean up if user is only member)
  await supabase.from("organization_members").delete().eq("user_id", user.id);

  // Delete the user row
  await supabase.from("users").delete().eq("id", user.id);

  // Sign out from Supabase Auth
  await supabase.auth.signOut();

  // Clear org cookie
  await clearActiveOrgId();

  redirect("/sign-in");
}
