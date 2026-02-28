import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfileSettingsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) return null;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-sm text-zinc-500">Manage your personal information.</p>
      </div>

      <Separator />

      <ProfileForm defaultFullName={user.fullName} email={user.email} avatarUrl={user.avatarUrl} />
    </div>
  );
}
