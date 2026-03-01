"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export type PipelineStage = {
  id: string;
  organization_id: string;
  name: string;
  order: number;
  color: string;
  default_probability: number;
  created_at: string;
};

const DEFAULT_STAGES = [
  { name: "Prospecting", order: 1, color: "#94a3b8", default_probability: 10 },
  { name: "Qualification", order: 2, color: "#6366f1", default_probability: 25 },
  { name: "Proposal", order: 3, color: "#f59e0b", default_probability: 50 },
  { name: "Negotiation", order: 4, color: "#f97316", default_probability: 75 },
  { name: "Closing", order: 5, color: "#10b981", default_probability: 90 },
];

export async function getPipelineStages(): Promise<PipelineStage[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .select()
    .eq("organization_id", orgId)
    .order("order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PipelineStage[];
}

export async function seedDefaultStages(orgId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("pipeline_stages")
    .insert(DEFAULT_STAGES.map((s) => ({ ...s, organization_id: orgId })));
}

export async function seedDefaultStagesForCurrentOrg(): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  // Only seed if no stages exist yet
  const { count } = await supabase
    .from("pipeline_stages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if ((count ?? 0) > 0) return {};

  await seedDefaultStages(orgId);

  revalidatePath("/deals");
  return {};
}

export async function createStage(
  name: string,
  color: string,
  defaultProbability: number
): Promise<{ stage?: PipelineStage; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const trimmed = name.trim();
  if (!trimmed) return { error: "Stage name is required" };

  const supabase = await createClient();

  // Get current max order
  const { data: existing } = await supabase
    .from("pipeline_stages")
    .select("order")
    .eq("organization_id", orgId)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (existing?.order ?? 0) + 1;

  const { data, error } = await supabase
    .from("pipeline_stages")
    .insert({
      organization_id: orgId,
      name: trimmed,
      color,
      default_probability: defaultProbability,
      order: nextOrder,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return { stage: data as PipelineStage };
}

export async function updateStage(
  stageId: string,
  updates: { name?: string; color?: string; default_probability?: number }
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("pipeline_stages")
    .update(updates)
    .eq("id", stageId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return {};
}

export async function deleteStage(stageId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", stageId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return {};
}

export async function reorderStages(stageIds: string[]): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  await Promise.all(
    stageIds.map((id, idx) =>
      supabase
        .from("pipeline_stages")
        .update({ order: idx + 1 })
        .eq("id", id)
        .eq("organization_id", orgId)
    )
  );

  revalidatePath("/deals");
  return {};
}
