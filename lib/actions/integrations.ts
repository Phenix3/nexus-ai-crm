"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export type GmailIntegration = {
  id: string;
  email: string | null;
  connected_at: string;
  last_synced_at: string | null;
};

export async function getGmailIntegration(): Promise<GmailIntegration | null> {
  const user = await getUser();
  if (!user) return null;

  const orgId = await getActiveOrgId();
  if (!orgId) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("id, email, created_at, last_synced_at")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("provider", "gmail")
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    connected_at: data.created_at,
    last_synced_at: data.last_synced_at,
  };
}

export async function disconnectGmail(): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("oauth_tokens")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("provider", "gmail");

  if (error) return { error: error.message };

  revalidatePath("/settings/integrations");
  return {};
}
