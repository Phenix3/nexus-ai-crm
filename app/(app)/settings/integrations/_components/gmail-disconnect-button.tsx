"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { disconnectGmail } from "@/lib/actions/integrations";
import { useRouter } from "next/navigation";

export function GmailDisconnectButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDisconnect() {
    if (!confirm("Disconnect Gmail? Email sync will stop.")) return;
    startTransition(async () => {
      await disconnectGmail();
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
      onClick={handleDisconnect}
      disabled={isPending}
    >
      {isPending ? "Disconnecting…" : "Disconnect"}
    </Button>
  );
}
