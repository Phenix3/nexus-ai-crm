"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import { requireRole } from "@/lib/permissions";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  timezone: z.string().min(1),
  currency: z.string().length(3),
});

export type UpdateOrgState = {
  error?: string;
  success?: string;
  fieldErrors?: { name?: string[]; timezone?: string[]; currency?: string[] };
};

export async function updateOrganization(
  _prev: UpdateOrgState,
  formData: FormData
): Promise<UpdateOrgState> {
  await requireRole("admin");

  const orgId = await getActiveOrgId();
  if (!orgId) return { error: "No active organisation" };

  const parsed = schema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("organizations")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath("/settings/general");
  return { success: "Settings saved" };
}
