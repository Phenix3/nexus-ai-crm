"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface EmailComposeDialogProps {
  contactId: string;
  contactEmail: string | null;
  contactName: string;
  gmailConnected: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailComposeDialog({
  contactId,
  contactEmail,
  contactName,
  gmailConnected,
  open,
  onOpenChange,
}: EmailComposeDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tracking, setTracking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function resetForm() {
    setSubject("");
    setBody("");
    setTracking(true);
    setError(null);
    setSent(false);
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  function handleSend() {
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!body.trim()) {
      setError("Body is required");
      return;
    }
    if (!contactEmail) {
      setError("This contact has no email address");
      return;
    }

    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, contactEmail, subject, body, tracking }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to send email");
        return;
      }

      setSent(true);
      router.refresh();
      setTimeout(() => handleOpenChange(false), 1500);
    });
  }

  if (!gmailConnected) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center space-y-3">
            <p className="text-sm text-zinc-500">
              Connect your Gmail account first to send emails from Nexus CRM.
            </p>
            <Button asChild size="sm">
              <a href="/settings/integrations">Connect Gmail</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send Email to {contactName}
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <Send className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email sent!</p>
            <p className="text-xs text-zinc-500">It has been logged to the contact timeline.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-zinc-600">To</Label>
              <Input
                value={contactEmail ?? "No email on file"}
                readOnly
                className="bg-zinc-50 dark:bg-zinc-800 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-subject" className="text-xs font-medium text-zinc-600">
                Subject
              </Label>
              <Input
                id="email-subject"
                placeholder="Subject…"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isPending}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email-body" className="text-xs font-medium text-zinc-600">
                Message
              </Label>
              <Textarea
                id="email-body"
                placeholder={`Write your message to ${contactName}…`}
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isPending}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="email-tracking"
                checked={tracking}
                onCheckedChange={(v) => setTracking(!!v)}
                disabled={isPending}
              />
              <Label htmlFor="email-tracking" className="text-xs text-zinc-500 cursor-pointer">
                Track opens and clicks
              </Label>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}

        {!sent && (
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={isPending || !contactEmail}
              className="gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send email
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
