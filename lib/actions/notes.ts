"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

const noteSchema = z.object({
  content: z.string().min(1, "Note cannot be empty").max(5000),
});

export type NoteFormState = {
  error?: string;
  fieldErrors?: { content?: string[] };
  success?: boolean;
};

export type Note = {
  id: string;
  organization_id: string;
  contact_id: string | null;
  deal_id: string | null;
  user_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function getContactNotes(contactId: string): Promise<Note[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select()
    .eq("contact_id", contactId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Note[];
}

export async function createNote(
  contactId: string,
  _prev: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const parsed = noteSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("notes").insert({
    organization_id: orgId,
    contact_id: contactId,
    user_id: userId,
    content: parsed.data.content,
  });

  if (error) return { error: error.message };

  revalidatePath(`/contacts/${contactId}`);
  return { success: true };
}

export async function deleteNote(noteId: string, contactId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/contacts/${contactId}`);
  return {};
}
