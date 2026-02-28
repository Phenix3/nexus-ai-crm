import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getUser();

  let userName: string | null = null;
  let userEmail: string | null = null;
  let userAvatarUrl: string | null = null;

  if (authUser) {
    const [dbUser] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (dbUser) {
      userName = dbUser.fullName;
      userEmail = dbUser.email;
      userAvatarUrl = dbUser.avatarUrl;
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
