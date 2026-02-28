"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { setActiveOrgId } from "@/lib/org";

export async function acceptInvitation(token: string): Promise<{ error: string } | never> {
  const user = await getUser();
  if (!user) redirect(`/sign-in?redirect_url=/invite/${token}`);
  const userId = user.id;

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("invitations")
    .select()
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!invite) {
    return { error: "This invitation is invalid or has expired." };
  }

  // Add member (ignore conflict if already a member)
  await supabase
    .from("organization_members")
    .upsert(
      { organization_id: invite.organization_id, user_id: userId, role: invite.role },
      { ignoreDuplicates: true }
    );

  // Mark invitation as accepted
  await supabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await setActiveOrgId(invite.organization_id);

  redirect("/dashboard");
}
