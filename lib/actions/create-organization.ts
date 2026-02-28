"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { setActiveOrgId } from "@/lib/org";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
});

export type CreateOrgState = {
  error?: string;
  fieldErrors?: { name?: string[]; slug?: string[] };
};

export async function createOrganization(
  _prev: CreateOrgState,
  formData: FormData
): Promise<CreateOrgState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, slug } = parsed.data;

  const supabase = await createClient();

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return { fieldErrors: { slug: ["This slug is already taken"] } };
  }

  // Create org + add user as owner
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name, slug })
    .select()
    .single();

  if (orgError || !org) {
    return { error: orgError?.message ?? "Failed to create organization" };
  }

  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  await setActiveOrgId(org.id);

  redirect("/dashboard");
}
