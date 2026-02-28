import { getUser } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./_components/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const authUser = await getUser();
  if (!authUser) return null;

  const { data: user } = await supabase
    .from("users")
    .select("full_name, email, avatar_url")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-zinc-500">Manage your personal information.</p>
      </div>

      <Separator />

      <ProfileForm
        defaultFullName={user.full_name}
        email={user.email ?? authUser.email ?? ""}
        avatarUrl={user.avatar_url}
      />
    </div>
  );
}
