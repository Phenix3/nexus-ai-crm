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
  contactId?: string;
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
  tags?: { id: string; name: string; color: string }[];
};

export type ContactFilters = {
  q?: string;
  tagId?: string;
  scoreMin?: number;
  scoreMax?: number;
  ownerId?: string;
  sort?: "first_name" | "last_name" | "score" | "created_at" | "updated_at";
  dir?: "asc" | "desc";
};

export type OrgMember = {
  user_id: string;
  full_name: string | null;
  email: string;
};

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getContacts(filters: ContactFilters = {}): Promise<Contact[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { q, tagId, scoreMin, scoreMax, ownerId, sort = "first_name", dir = "asc" } = filters;

  // Build select — always include tags
  let selectStr = "*, contact_tags(tags(id, name, color))";
  if (tagId) {
    // inner join to filter by tag
    selectStr = "*, contact_tags!inner(tag_id, tags(id, name, color))";
  }

  let query = supabase.from("contacts").select(selectStr).eq("organization_id", orgId);

  if (tagId) {
    query = query.eq("contact_tags.tag_id", tagId);
  }

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`
    );
  }

  if (scoreMin !== undefined) {
    query = query.gte("score", scoreMin);
  }
  if (scoreMax !== undefined) {
    query = query.lte("score", scoreMax);
  }

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  query = query.order(sort, { ascending: dir === "asc" });
  if (sort !== "first_name") {
    query = query.order("first_name", { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Flatten nested tags shape from Supabase join
  type RawRow = Record<string, unknown> & {
    contact_tags?: { tags: { id: string; name: string; color: string } | null }[] | null;
  };
  const contacts = (data as unknown as RawRow[]).map((row) => {
    const contactTags = row.contact_tags ?? [];
    const tags = contactTags
      .map((ct) => ct.tags)
      .filter((t): t is { id: string; name: string; color: string } => t !== null);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contact_tags: _ct, ...rest } = row;
    return { ...rest, tags } as Contact;
  });

  return contacts;
}

export async function getContact(id: string): Promise<Contact | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data } = await supabase
    .from("contacts")
    .select("*, contact_tags(tags(id, name, color))")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!data) return null;

  type RawRow = Record<string, unknown> & {
    contact_tags?: { tags: { id: string; name: string; color: string } | null }[] | null;
  };
  const row = data as unknown as RawRow;
  const contactTags = row.contact_tags ?? [];
  const tags = contactTags
    .map((ct) => ct.tags)
    .filter((t): t is { id: string; name: string; color: string } => t !== null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contact_tags: _ct, ...rest } = row;
  return { ...rest, tags } as Contact;
}

export async function getOrgMembers(): Promise<OrgMember[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("user_id, users(full_name, email)")
    .eq("organization_id", orgId);

  if (error) throw new Error(error.message);

  type RawMember = {
    user_id: string;
    users:
      | { full_name: string | null; email: string }
      | { full_name: string | null; email: string }[]
      | null;
  };
  return ((data ?? []) as unknown as RawMember[]).map((m) => {
    const users = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      user_id: m.user_id,
      full_name: users?.full_name ?? null,
      email: users?.email ?? "",
    };
  });
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

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: orgId,
      first_name: firstName,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      company: company || null,
      job_title: jobTitle || null,
      linkedin_url: linkedinUrl || null,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return { success: true, contactId: data.id };
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
  return { success: true, contactId: id };
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
