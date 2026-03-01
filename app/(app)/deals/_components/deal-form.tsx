"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDeal, updateDeal, type DealFormState, type Deal } from "@/lib/actions/deals";
import type { PipelineStage } from "@/lib/actions/pipeline-stages";
import type { Contact } from "@/lib/actions/contacts";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal;
  stages: PipelineStage[];
  contacts: Contact[];
  defaultStageId?: string;
}

const initialState: DealFormState = {};

const CURRENCIES = ["EUR", "USD", "GBP", "MAD", "XOF", "TND", "DZD"];

export function DealForm({
  open,
  onOpenChange,
  deal,
  stages,
  contacts,
  defaultStageId,
}: DealFormProps) {
  const isEdit = !!deal;
  const action = isEdit ? updateDeal.bind(null, deal.id) : createDeal;

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit deal" : "New deal"}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Deal title *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={deal?.title ?? ""}
              placeholder="Enterprise contract — Acme"
              autoFocus
            />
            {state.fieldErrors?.title && (
              <p className="text-xs text-red-500">{state.fieldErrors.title[0]}</p>
            )}
          </div>

          {/* Value + currency */}
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue={deal?.value ?? "0"}
                placeholder="10000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={deal?.currency ?? "EUR"}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage + probability */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stageId">Stage</Label>
              <Select name="stageId" defaultValue={deal?.stage_id ?? defaultStageId ?? "none"}>
                <SelectTrigger id="stageId">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No stage</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={deal?.probability ?? 0}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <Label htmlFor="contactId">Contact (optional)</Label>
            <Select name="contactId" defaultValue={deal?.contact_id ?? "none"}>
              <SelectTrigger id="contactId">
                <SelectValue placeholder="Link a contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed"}
                    {c.company ? ` — ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expected close date */}
          <div className="space-y-1.5">
            <Label htmlFor="expectedCloseDate">Expected close date</Label>
            <Input
              id="expectedCloseDate"
              name="expectedCloseDate"
              type="date"
              defaultValue={deal?.expected_close_date ?? ""}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
