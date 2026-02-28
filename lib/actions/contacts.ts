"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
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

export type Contact = {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  score: number;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getContacts(search?: string): Promise<Contact[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  let query = supabase
    .from("contacts")
    .select()
    .eq("organization_id", orgId)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Contact[];
}

export async function getContact(id: string): Promise<Contact | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data } = await supabase
    .from("contacts")
    .select()
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();

  return (data as Contact) ?? null;
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

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

  const supabase = await createClient();

  const { error } = await supabase.from("contacts").insert({
    organization_id: orgId,
    first_name: firstName,
    last_name: lastName || null,
    email: email || null,
    phone: phone || null,
    company: company || null,
    job_title: jobTitle || null,
    linkedin_url: linkedinUrl || null,
    owner_id: userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return { success: true };
}

export async function updateContact(
  id: string,
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

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

  const supabase = await createClient();

  const { error } = await supabase
    .from("contacts")
    .update({
      first_name: firstName,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      company: company || null,
      job_title: jobTitle || null,
      linkedin_url: linkedinUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true };
}

export async function deleteContact(id: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return {};
}
