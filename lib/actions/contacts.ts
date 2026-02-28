"use server";

import { auth } from "@clerk/nextjs/server";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { getActiveOrgId } from "@/lib/org";

// ── Schemas ──────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().default(""),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(50).optional().default(""),
  company: z.string().max(200).optional().default(""),
  jobTitle: z.string().max(200).optional().default(""),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type ContactFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof contactSchema>, string[]>>;
  success?: boolean;
};

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getContacts(search?: string) {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const query = db
    .select()
    .from(contacts)
    .where(
      search
        ? and(
            eq(contacts.organizationId, orgId),
            or(
              ilike(contacts.firstName, `%${search}%`),
              ilike(contacts.lastName, `%${search}%`),
              ilike(contacts.email, `%${search}%`),
              ilike(contacts.company, `%${search}%`)
            )
          )
        : eq(contacts.organizationId, orgId)
    )
    .orderBy(asc(contacts.firstName), asc(contacts.lastName));

  return query;
}

export async function getContact(id: string) {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const [contact] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, orgId)))
    .limit(1);

  return contact ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    jobTitle: formData.get("jobTitle"),
    linkedinUrl: formData.get("linkedinUrl"),
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, phone, company, jobTitle, linkedinUrl } = parsed.data;

  await db.insert(contacts).values({
    organizationId: orgId,
    firstName,
    lastName: lastName || null,
    email: email || null,
    phone: phone || null,
    company: company || null,
    jobTitle: jobTitle || null,
    linkedinUrl: linkedinUrl || null,
    ownerId: userId,
  });

  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContact(
  id: string,
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    company: formData.get("company"),
    jobTitle: formData.get("jobTitle"),
    linkedinUrl: formData.get("linkedinUrl"),
  };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, phone, company, jobTitle, linkedinUrl } = parsed.data;

  await db
    .update(contacts)
    .set({
      firstName,
      lastName: lastName || null,
      email: email || null,
      phone: phone || null,
      company: company || null,
      jobTitle: jobTitle || null,
      linkedinUrl: linkedinUrl || null,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.id, id), eq(contacts.organizationId, orgId)));

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true };
}

export async function deleteContact(id: string): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.organizationId, orgId)));

  revalidatePath("/contacts");
  return {};
}
