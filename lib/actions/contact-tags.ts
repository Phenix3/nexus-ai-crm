"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export async function addTagToContact(
  contactId: string,
  tagId: string
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  // Verify contact belongs to org
  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!contact) return { error: "Contact not found" };

  const { error } = await supabase
    .from("contact_tags")
    .insert({ contact_id: contactId, tag_id: tagId })
    .select()
    .maybeSingle();

  // Ignore duplicate key error (23505)
  if (error && error.code !== "23505") return { error: error.message };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return {};
}

export async function removeTagFromContact(
  contactId: string,
  tagId: string
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId)
    .eq("tag_id", tagId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return {};
}

export async function setContactTags(
  contactId: string,
  tagIds: string[]
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  // Verify contact belongs to org
  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!contact) return { error: "Contact not found" };

  // Delete all existing tags for this contact
  const { error: delError } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId);

  if (delError) return { error: delError.message };

  // Insert new tags if any
  if (tagIds.length > 0) {
    const { error: insError } = await supabase
      .from("contact_tags")
      .insert(tagIds.map((tagId) => ({ contact_id: contactId, tag_id: tagId })));

    if (insError) return { error: insError.message };
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return {};
}
