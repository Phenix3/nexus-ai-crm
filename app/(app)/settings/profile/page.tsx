import { getUser } from "@/lib/auth";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./_components/profile-form";
import { createClient } from "@/lib/supabase/client";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const authUser = await getUser();
  if (!authUser) return null;
  const userId = authUser.id;

  const { data: user } = await supabase
    .from("auth.users")
    .select("*")
    .eq("id", userId)
    .limit(1)
    .single();

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-zinc-500">Manage your personal information.</p>
      </div>

      <Separator />

      <ProfileForm
        defaultFullName={user.user_metadata.full_name}
        email={user.email}
        avatarUrl={user.avatar_url}
      />
    </div>
  );
}
