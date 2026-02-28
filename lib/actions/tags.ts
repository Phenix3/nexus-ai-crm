"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export type Tag = {
  id: string;
  organization_id: string;
  name: string;
  color: string;
  created_at: string;
};

export async function getTags(): Promise<Tag[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select()
    .eq("organization_id", orgId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as Tag[];
}

export async function createTag(
  name: string,
  color: string
): Promise<{ tag?: Tag; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Tag name is required" };
  if (trimmed.length > 50) return { error: "Tag name is too long" };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .insert({ organization_id: orgId, name: trimmed, color })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return { error: "A tag with this name already exists" };
    return { error: error.message };
  }

  revalidatePath("/contacts");
  return { tag: data as Tag };
}

export async function deleteTag(tagId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/contacts");
  return {};
}
