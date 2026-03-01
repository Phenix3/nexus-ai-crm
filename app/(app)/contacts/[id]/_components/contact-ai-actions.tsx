"use client";

import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailDraftDialog } from "./email-draft-dialog";

interface ContactAiActionsProps {
  contactId: string;
  contactName: string;
}

export function ContactAiActions({ contactId, contactName }: ContactAiActionsProps) {
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            AI Actions
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-sm h-9"
            onClick={() => setEmailOpen(true)}
          >
            <Mail className="h-3.5 w-3.5 text-violet-500" />
            Draft an email with AI
          </Button>
        </div>
      </div>

      <EmailDraftDialog
        contactId={contactId}
        contactName={contactName}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
    </>
  );
}
