"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, organizationMembers } from "@/db/schema";
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

  // Check slug uniqueness
  const existing = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return { fieldErrors: { slug: ["This slug is already taken"] } };
  }

  // Create org + add user as owner
  const [org] = await db.insert(organizations).values({ name, slug }).returning();

  await db.insert(organizationMembers).values({
    organizationId: org.id,
    userId,
    role: "owner",
  });

  await setActiveOrgId(org.id);

  redirect("/dashboard");
}
