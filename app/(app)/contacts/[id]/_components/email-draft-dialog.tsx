"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EmailDraftDialogProps {
  contactId: string;
  contactName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTENTS = [
  { value: "followup", label: "Follow-up" },
  { value: "first_contact", label: "First contact" },
  { value: "post_meeting", label: "Post-meeting follow-up" },
  { value: "proposal", label: "Commercial proposal" },
  { value: "reactivation", label: "Reactivation" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm & friendly" },
  { value: "direct", label: "Direct & concise" },
  { value: "persuasive", label: "Persuasive" },
];

export function EmailDraftDialog({
  contactId,
  contactName,
  open,
  onOpenChange,
}: EmailDraftDialogProps) {
  const [intent, setIntent] = useState("followup");
  const [tone, setTone] = useState("professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    setDraft(null);

    try {
      const res = await fetch("/api/ai/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, intent, tone, additionalContext }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setDraft({ subject: data.subject, body: data.body });
    } catch {
      setError("Failed to generate email. Please check your OpenAI API key.");
    } finally {
      setIsGenerating(false);
    }
  }

  function copyToClipboard(text: string, type: "subject" | "body") {
    navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  }

  function handleClose() {
    if (!isGenerating) {
      onOpenChange(false);
      setTimeout(() => {
        setDraft(null);
        setError(null);
        setAdditionalContext("");
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            AI Email Draft for {contactName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configuration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Intent</Label>
              <Select value={intent} onValueChange={setIntent} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTENTS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="additionalContext">Additional context (optional)</Label>
            <Textarea
              id="additionalContext"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g. We met at a conference last week, they're interested in our enterprise plan..."
              rows={2}
              className="resize-none text-sm"
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {draft ? "Regenerate" : "Generate email"}
              </>
            )}
          </Button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          {/* Draft result */}
          {draft && (
            <div className="space-y-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-800/50 dark:border-zinc-700">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Mail className="h-3 w-3" />
                Generated email
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Subject</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs text-zinc-400 hover:text-zinc-600"
                    onClick={() => copyToClipboard(draft.subject, "subject")}
                  >
                    {copiedSubject ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="text-sm bg-white dark:bg-zinc-900"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Body</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs text-zinc-400 hover:text-zinc-600"
                    onClick={() => copyToClipboard(draft.body, "body")}
                  >
                    {copiedBody ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  rows={10}
                  className="text-sm resize-none bg-white dark:bg-zinc-900 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
