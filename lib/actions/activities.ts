"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export type ActivityType = "email" | "call" | "meeting" | "note" | "stage_change" | "score_update";

export type Activity = {
  id: string;
  organization_id: string;
  contact_id: string | null;
  deal_id: string | null;
  user_id: string | null;
  type: ActivityType;
  subject: string | null;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  users?: { full_name: string | null; avatar_url: string | null } | null;
};

export type ActivityFormState = {
  error?: string;
  fieldErrors?: { subject?: string[]; body?: string[]; type?: string[] };
  success?: boolean;
};

const activitySchema = z.object({
  type: z.enum(["call", "meeting", "email"]),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().max(5000).optional(),
});

export async function getContactActivities(contactId: string): Promise<Activity[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activities")
    .select("*, users(full_name, avatar_url)")
    .eq("contact_id", contactId)
    .eq("organization_id", orgId)
    .order("occurred_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function createActivity(
  contactId: string,
  _prev: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    subject: formData.get("subject"),
    body: formData.get("body") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { type, subject, body } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.from("activities").insert({
    organization_id: orgId,
    contact_id: contactId,
    user_id: user.id,
    type,
    subject,
    body: body || null,
    occurred_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/contacts/${contactId}`);
  return { success: true };
}

export async function deleteActivity(
  activityId: string,
  contactId: string
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/contacts/${contactId}`);
  return {};
}
