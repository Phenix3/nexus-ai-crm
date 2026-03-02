"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { revalidatePath } from "next/cache";

export type AlertItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "urgent";
  is_read: boolean;
  created_at: string;
  contact_id: string | null;
  deal_id: string | null;
  contacts?: { first_name: string | null; last_name: string | null } | null;
};

export async function getUnreadAlerts(limit = 10): Promise<AlertItem[]> {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from("alerts")
    .select("*, contacts(first_name, last_name)")
    .eq("organization_id", orgId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AlertItem[];
}

export async function getAlerts(filter: "all" | "unread" | "urgent" = "all"): Promise<AlertItem[]> {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return [];

  let query = supabase
    .from("alerts")
    .select("*, contacts(first_name, last_name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter === "unread") {
    query = query.eq("is_read", false);
  } else if (filter === "urgent") {
    query = query.eq("severity", "urgent");
  }

  const { data } = await query;
  return (data ?? []) as AlertItem[];
}

export async function markAlertRead(alertId: string): Promise<void> {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return;

  await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("id", alertId)
    .eq("organization_id", orgId);

  revalidatePath("/alerts");
}

export async function markAllAlertsRead(): Promise<void> {
  const supabase = await createClient();
  const orgId = await getActiveOrgId();
  if (!orgId) return;

  await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("organization_id", orgId)
    .eq("is_read", false);

  revalidatePath("/alerts");
}
