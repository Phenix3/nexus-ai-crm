"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedDefaultStagesForCurrentOrg } from "@/lib/actions/pipeline-stages";

export function SetupPipelineButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSetup() {
    startTransition(async () => {
      await seedDefaultStagesForCurrentOrg();
      router.refresh();
    });
  }

  return (
    <Button onClick={handleSetup} disabled={isPending} className="gap-2">
      <Layers className="h-4 w-4" />
      {isPending ? "Setting up…" : "Set up default pipeline"}
    </Button>
  );
}
