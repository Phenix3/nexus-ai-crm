"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export type DealStatus = "open" | "won" | "lost";

export type Deal = {
  id: string;
  organization_id: string;
  title: string;
  value: string;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  stage_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  status: DealStatus;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  pipeline_stages?: { id: string; name: string; color: string; order: number } | null;
  contacts?: { first_name: string | null; last_name: string | null; company: string | null } | null;
  users?: { full_name: string | null } | null;
};

export type DealFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  dealId?: string;
};

export type DealFilters = {
  stageId?: string;
  ownerId?: string;
  status?: DealStatus;
};

export type DealsStats = {
  total: number;
  totalValue: number;
  weightedValue: number;
  wonCount: number;
  wonValue: number;
  overdueCount: number;
  byStage: { stage_id: string | null; count: number; value: number }[];
};

const dealSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  value: z.coerce.number().min(0, "Value must be positive"),
  currency: z.string().min(3).max(3).default("EUR"),
  probability: z.coerce.number().min(0).max(100).default(0),
  stageId: z.string().uuid().optional().or(z.literal("")),
  contactId: z.string().uuid().optional().or(z.literal("")),
  ownerId: z.string().uuid().optional().or(z.literal("")),
  expectedCloseDate: z.string().optional().or(z.literal("")),
});

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getDeals(filters: DealFilters = {}): Promise<Deal[]> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  let query = supabase
    .from("deals")
    .select(
      "*, pipeline_stages(id, name, color, order), contacts(first_name, last_name, company), users(full_name)"
    )
    .eq("organization_id", orgId);

  if (filters.stageId) query = query.eq("stage_id", filters.stageId);
  if (filters.ownerId) query = query.eq("owner_id", filters.ownerId);
  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "open");
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const ps = r.pipeline_stages;
    const co = r.contacts;
    const us = r.users;
    return {
      ...r,
      pipeline_stages: Array.isArray(ps) ? (ps[0] ?? null) : (ps as Deal["pipeline_stages"]),
      contacts: Array.isArray(co) ? (co[0] ?? null) : (co as Deal["contacts"]),
      users: Array.isArray(us) ? (us[0] ?? null) : (us as Deal["users"]),
    } as Deal;
  });
}

export async function getDeal(id: string): Promise<Deal | null> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const { data } = await supabase
    .from("deals")
    .select(
      "*, pipeline_stages(id, name, color, order), contacts(first_name, last_name, company), users(full_name)"
    )
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!data) return null;

  const r = data as Record<string, unknown>;
  const ps = r.pipeline_stages;
  const co = r.contacts;
  const us = r.users;
  return {
    ...r,
    pipeline_stages: Array.isArray(ps) ? (ps[0] ?? null) : (ps as Deal["pipeline_stages"]),
    contacts: Array.isArray(co) ? (co[0] ?? null) : (co as Deal["contacts"]),
    users: Array.isArray(us) ? (us[0] ?? null) : (us as Deal["users"]),
  } as Deal;
}

export async function getDealsStats(): Promise<DealsStats> {
  const orgId = await getActiveOrgId();
  if (!orgId) throw new Error("No active organization");

  const supabase = await createClient();

  const [openRes, wonRes, overdueRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id, value, probability, stage_id")
      .eq("organization_id", orgId)
      .eq("status", "open"),
    supabase.from("deals").select("id, value").eq("organization_id", orgId).eq("status", "won"),
    supabase
      .from("deals")
      .select("id", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("status", "open")
      .lt("expected_close_date", new Date().toISOString().slice(0, 10)),
  ]);

  const openDeals = (openRes.data ?? []) as {
    id: string;
    value: string;
    probability: number;
    stage_id: string | null;
  }[];
  const wonDeals = (wonRes.data ?? []) as { id: string; value: string }[];

  const totalValue = openDeals.reduce((s, d) => s + Number(d.value), 0);
  const weightedValue = openDeals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);

  // Group by stage
  const byStageMap = new Map<string | null, { count: number; value: number }>();
  for (const d of openDeals) {
    const key = d.stage_id;
    const existing = byStageMap.get(key) ?? { count: 0, value: 0 };
    byStageMap.set(key, { count: existing.count + 1, value: existing.value + Number(d.value) });
  }

  return {
    total: openDeals.length,
    totalValue,
    weightedValue,
    wonCount: wonDeals.length,
    wonValue,
    overdueCount: overdueRes.count ?? 0,
    byStage: Array.from(byStageMap.entries()).map(([stage_id, v]) => ({ stage_id, ...v })),
  };
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createDeal(_prev: DealFormState, formData: FormData): Promise<DealFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const rawStageId = formData.get("stageId") as string | null;
  const rawContactId = formData.get("contactId") as string | null;

  const parsed = dealSchema.safeParse({
    title: formData.get("title"),
    value: formData.get("value") || "0",
    currency: formData.get("currency") || "EUR",
    probability: formData.get("probability") || "0",
    stageId: rawStageId === "none" ? "" : rawStageId || "",
    contactId: rawContactId === "none" ? "" : rawContactId || "",
    ownerId: formData.get("ownerId") || "",
    expectedCloseDate: formData.get("expectedCloseDate") || "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, value, currency, probability, stageId, contactId, ownerId, expectedCloseDate } =
    parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .insert({
      organization_id: orgId,
      title,
      value: value.toString(),
      currency,
      probability,
      stage_id: stageId || null,
      contact_id: contactId || null,
      owner_id: ownerId || user.id,
      expected_close_date: expectedCloseDate || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return { success: true, dealId: data.id };
}

export async function updateDeal(
  id: string,
  _prev: DealFormState,
  formData: FormData
): Promise<DealFormState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const rawStageId2 = formData.get("stageId") as string | null;
  const rawContactId2 = formData.get("contactId") as string | null;

  const parsed = dealSchema.safeParse({
    title: formData.get("title"),
    value: formData.get("value") || "0",
    currency: formData.get("currency") || "EUR",
    probability: formData.get("probability") || "0",
    stageId: rawStageId2 === "none" ? "" : rawStageId2 || "",
    contactId: rawContactId2 === "none" ? "" : rawContactId2 || "",
    ownerId: formData.get("ownerId") || "",
    expectedCloseDate: formData.get("expectedCloseDate") || "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { title, value, currency, probability, stageId, contactId, ownerId, expectedCloseDate } =
    parsed.data;

  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({
      title,
      value: value.toString(),
      currency,
      probability,
      stage_id: stageId || null,
      contact_id: contactId || null,
      owner_id: ownerId || null,
      expected_close_date: expectedCloseDate || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { success: true, dealId: id };
}

export async function moveDeal(
  dealId: string,
  stageId: string,
  probability?: number
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {
    stage_id: stageId,
    updated_at: new Date().toISOString(),
  };
  if (probability !== undefined) {
    updatePayload.probability = probability;
  }

  const { error } = await supabase
    .from("deals")
    .update(updatePayload)
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return {};
}

export async function closeDeal(
  dealId: string,
  status: "won" | "lost",
  lostReason?: string
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({
      status,
      probability: status === "won" ? 100 : 0,
      lost_reason: lostReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return {};
}

export async function reopenDeal(dealId: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({ status: "open", lost_reason: null, updated_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return {};
}

export async function deleteDeal(id: string): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organization" };

  const supabase = await createClient();

  const { error } = await supabase.from("deals").delete().eq("id", id).eq("organization_id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  return {};
}
