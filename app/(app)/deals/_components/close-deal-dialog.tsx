"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { closeDeal } from "@/lib/actions/deals";
import { useRouter } from "next/navigation";

interface CloseDealDialogProps {
  dealId: string;
  dealTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseDealDialog({ dealId, dealTitle, open, onOpenChange }: CloseDealDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"won" | "lost">("won");
  const [lostReason, setLostReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "lost" && !lostReason.trim()) {
      setError("Please provide a reason for losing this deal.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await closeDeal(dealId, status, lostReason || undefined);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-zinc-500">
            Mark <span className="font-medium text-zinc-800 dark:text-zinc-200">{dealTitle}</span>{" "}
            as:
          </p>

          {/* Won / Lost toggle */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus("won")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                status === "won"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <CheckCircle2
                className={`h-7 w-7 ${status === "won" ? "text-emerald-500" : "text-zinc-300"}`}
              />
              <span
                className={`text-sm font-semibold ${
                  status === "won" ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500"
                }`}
              >
                Won ✅
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatus("lost")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                status === "lost"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <XCircle
                className={`h-7 w-7 ${status === "lost" ? "text-red-500" : "text-zinc-300"}`}
              />
              <span
                className={`text-sm font-semibold ${
                  status === "lost" ? "text-red-700 dark:text-red-400" : "text-zinc-500"
                }`}
              >
                Lost ❌
              </span>
            </button>
          </div>

          {/* Lost reason */}
          {status === "lost" && (
            <div className="space-y-1.5">
              <Label htmlFor="lostReason">Reason for losing *</Label>
              <Textarea
                id="lostReason"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="e.g. Budget cut, went with competitor, bad timing…"
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={
                status === "won"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isPending ? "Saving…" : status === "won" ? "Mark as won" : "Mark as lost"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
