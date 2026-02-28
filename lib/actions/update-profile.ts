"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { error } = await supabase
    .from("users")
    .update({ full_name: parsed.data.fullName, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings/profile");
  return { success: "Profile updated" };
}
