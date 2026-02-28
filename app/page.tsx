import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";

export default async function LandingPage() {
  const user = await getUser();
  const userId = user?.id;

  if (userId) {
    const orgId = await getActiveOrgId();
    redirect(orgId ? "/dashboard" : "/new-org");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Nexus CRM
        </h1>
        <p className="mt-4 text-xl text-zinc-500 dark:text-zinc-400">
          The AI-powered sales CRM built for modern B2B teams.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/sign-in">Commencer</Link>
      </Button>
    </div>
  );
}
