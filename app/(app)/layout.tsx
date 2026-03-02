import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { getUnreadAlerts } from "@/lib/actions/alerts";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getUser();

  let userName: string | null = null;
  let userEmail: string | null = null;
  let userAvatarUrl: string | null = null;

  if (authUser) {
    const supabase = await createClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("full_name, email, avatar_url")
      .eq("id", authUser.id)
      .maybeSingle();

    if (dbUser) {
      userName = dbUser.full_name;
      userEmail = dbUser.email;
      userAvatarUrl = dbUser.avatar_url;
    }
  }

  const unreadAlerts = await getUnreadAlerts(5).catch(() => []);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar userName={userName} userEmail={userEmail} userAvatarUrl={userAvatarUrl} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header unreadAlerts={unreadAlerts} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
