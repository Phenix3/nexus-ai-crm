"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { render } from "@react-email/render";
import { db } from "@/db";
import { invitations, organizationMembers, organizations, users } from "@/db/schema";
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

  // Check if already a member (by looking up user then membership)
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    const alreadyMember = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.userId, existingUser[0].id)
        )
      )
      .limit(1);

    if (alreadyMember.length > 0) {
      return { fieldErrors: { email: ["This person is already a member"] } };
    }
  }

  // Check for pending invitation
  const pending = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.organizationId, orgId),
        eq(invitations.email, email)
        // Only block if not yet accepted
      )
    )
    .limit(1);

  if (pending.length > 0) {
    return { fieldErrors: { email: ["An invitation has already been sent to this address"] } };
  }

  // Fetch org name and inviter name for the email
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId));

  const [inviter] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId));

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(invitations).values({
    organizationId: orgId,
    email,
    role,
    token,
    invitedBy: userId,
    expiresAt,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;
  const inviterName = inviter?.fullName ?? inviter?.email ?? "Someone";

  const html = await render(InviteEmail({ orgName: org.name, inviterName, role, inviteUrl }));

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been invited to join ${org.name} on Nexus CRM`,
    html,
  });

  return { success: `Invitation sent to ${email}` };
}
