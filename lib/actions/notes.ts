"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { notes } from "@/db/schema";
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

export async function getContactNotes(contactId: string) {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  return db
    .select()
    .from(notes)
    .where(and(eq(notes.contactId, contactId), eq(notes.organizationId, orgId)))
    .orderBy(desc(notes.createdAt));
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

  await db.insert(notes).values({
    organizationId: orgId,
    contactId,
    userId,
    content: parsed.data.content,
  });

  revalidatePath(`/contacts/${contactId}`);
  return { success: true };
}

export async function deleteNote(noteId: string, contactId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.organizationId, orgId)));

  revalidatePath(`/contacts/${contactId}`);
  return {};
}
