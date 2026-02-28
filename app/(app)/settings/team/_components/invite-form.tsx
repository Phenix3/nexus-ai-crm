"use client";

import { useActionState } from "react";
import { inviteMember, type InviteState } from "@/lib/actions/invite-member";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteState = {};

export function InviteForm() {
  const [state, action, isPending] = useActionState(inviteMember, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <Label htmlFor="invite-email" className="sr-only">
            Email
          </Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            placeholder="colleague@company.com"
            aria-describedby={state.fieldErrors?.email ? "invite-email-error" : undefined}
          />
          {state.fieldErrors?.email && (
            <p id="invite-email-error" className="text-sm text-red-500">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="invite-role" className="sr-only">
            Role
          </Label>
          <select
            id="invite-role"
            name="role"
            defaultValue="member"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending…" : "Send invite"}
        </Button>
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
    </form>
  );
}
