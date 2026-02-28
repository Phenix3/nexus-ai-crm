"use server";

import { z } from "zod";
import { render } from "@react-email/render";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { requireRole } from "@/lib/permissions";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { InviteEmail } from "@/emails/invite";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

export type InviteState = {
  error?: string;
  success?: string;
  fieldErrors?: { email?: string[]; role?: string[] };
};

export async function inviteMember(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  await requireRole("admin");

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organisation" };

  const parsed = schema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, role } = parsed.data;

  const supabase = await createClient();

  // Check if already a member (by looking up user then membership)
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingUser) {
    const { data: alreadyMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", existingUser.id)
      .maybeSingle();

    if (alreadyMember) {
      return { fieldErrors: { email: ["This person is already a member"] } };
    }
  }

  // Check for pending invitation
  const { data: pending } = await supabase
    .from("invitations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", email)
    .maybeSingle();

  if (pending) {
    return { fieldErrors: { email: ["An invitation has already been sent to this address"] } };
  }

  // Fetch org name and inviter name for the email
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: inviter } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await supabase.from("invitations").insert({
    organization_id: orgId,
    email,
    role,
    token,
    invited_by: userId,
    expires_at: expiresAt.toISOString(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;
  const inviterName = inviter?.full_name ?? inviter?.email ?? "Someone";

  const html = await render(InviteEmail({ orgName: org!.name, inviterName, role, inviteUrl }));

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been invited to join ${org!.name} on Nexus CRM`,
    html,
  });

  return { success: `Invitation sent to ${email}` };
}
