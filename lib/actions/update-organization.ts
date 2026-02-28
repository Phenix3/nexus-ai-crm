"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { organizations } from "@/db/schema";
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

  await db
    .update(organizations)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(organizations.id, orgId));

  revalidatePath("/settings/general");
  return { success: "Settings saved" };
}
