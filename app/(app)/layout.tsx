import { getUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const authUser = await getUser();

  let userName: string | null = null;
  let userEmail: string | null = null;
  let userAvatarUrl: string | null = null;

  if (authUser) {
    const { data: dbUser } = await supabase
      .from("auth.users")
      .select("*")
      .eq("id", authUser.id)
      .limit(1)
      .single();
    console.log(dbUser);
    if (dbUser) {
      userName = dbUser.full_name;
      userEmail = dbUser.email;
      userAvatarUrl = dbUser.avatar_url;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={userName} userEmail={userEmail} userAvatarUrl={userAvatarUrl} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
