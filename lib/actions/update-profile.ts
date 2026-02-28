"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser } from "@/lib/auth";

const schema = z.object({
  fullName: z.string().min(1, "Name is required").max(100),
});

export type UpdateProfileState = {
  error?: string;
  success?: string;
  fieldErrors?: { fullName?: string[] };
};

export async function updateProfile(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };
  const userId = user.id;

  const parsed = schema.safeParse({ fullName: formData.get("fullName") });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(users)
    .set({ fullName: parsed.data.fullName, updatedAt: new Date() })
    .where(eq(users.id, userId));

  revalidatePath("/settings/profile");
  return { success: "Profile updated" };
}
