import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActiveOrgId } from "@/lib/org";
import { SetupWizard } from "./_components/setup-wizard";
import { Zap } from "lucide-react";

interface SetupPageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function SetupPage({ searchParams }: SetupPageProps) {
  const user = await getUser();
  if (!user) redirect("/sign-in");

  const orgId = await getActiveOrgId();
  if (!orgId) redirect("/new-org");

  const { step } = await searchParams;
  const currentStep = Math.min(4, Math.max(1, parseInt(step ?? "1", 10)));

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Nexus CRM</span>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-zinc-500">Step {currentStep} of 4</p>
          <p className="text-xs text-zinc-400">
            {["Profile", "Connect Gmail", "Import contacts", "Create a deal"][currentStep - 1]}
          </p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      <SetupWizard step={currentStep} userId={user.id} orgId={orgId} />
    </div>
  );
}
