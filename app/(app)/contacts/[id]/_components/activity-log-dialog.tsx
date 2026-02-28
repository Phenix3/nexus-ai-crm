"use client";

import { useActionState, useEffect, useRef } from "react";
import { Phone, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createActivity, type ActivityFormState } from "@/lib/actions/activities";

interface ActivityLogDialogProps {
  contactId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: ActivityFormState = {};

const ACTIVITY_TYPES = [
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Calendar },
  { value: "email", label: "Email", icon: Mail },
] as const;

export function ActivityLogDialog({ contactId, open, onOpenChange }: ActivityLogDialogProps) {
  const action = createActivity.bind(null, contactId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      formRef.current?.reset();
    }
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log activity</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-2">
              {ACTIVITY_TYPES.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-zinc-200 p-3 text-center transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 dark:border-zinc-700 dark:has-[:checked]:border-primary"
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    defaultChecked={value === "call"}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4 text-zinc-500" />
                  <span className="text-xs font-medium">{label}</span>
                </label>
              ))}
            </div>
            {state.fieldErrors?.type && (
              <p className="text-xs text-red-500">{state.fieldErrors.type[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" name="subject" placeholder="Called about Q2 pricing…" autoFocus />
            {state.fieldErrors?.subject && (
              <p className="text-xs text-red-500">{state.fieldErrors.subject[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Notes</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Additional details…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Log activity"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
