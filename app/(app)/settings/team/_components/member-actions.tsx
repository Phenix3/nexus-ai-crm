"use client";

import { useTransition } from "react";
import { removeMember } from "@/lib/actions/remove-member";
import { updateMemberRole } from "@/lib/actions/update-member-role";
import { Button } from "@/components/ui/button";

type Props = {
  targetUserId: string;
  currentRole: "owner" | "admin" | "member";
  canManage: boolean;
};

export function MemberActions({ targetUserId, currentRole, canManage }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!canManage || currentRole === "owner") return null;

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={currentRole}
        disabled={isPending}
        onChange={(e) => {
          const role = e.target.value as "admin" | "member";
          startTransition(() => updateMemberRole(targetUserId, role));
        }}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>

      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-red-500 hover:text-red-600"
        onClick={() => startTransition(() => removeMember(targetUserId))}
      >
        Remove
      </Button>
    </div>
  );
}
