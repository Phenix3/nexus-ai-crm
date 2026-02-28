"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
  defaultFullName: string | null;
  email: string;
  avatarUrl: string | null;
};

const initialState: UpdateProfileState = {};

export function ProfileForm({ defaultFullName, email, avatarUrl }: Props) {
  const [state, action, isPending] = useActionState(updateProfile, initialState);
  const initials = defaultFullName
    ? defaultFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email[0].toUpperCase();

  return (
    <form action={action} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={defaultFullName ?? email} />}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{defaultFullName ?? email}</p>
          <p className="text-xs text-zinc-500">
            Avatar is managed via your Clerk account settings.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultFullName ?? ""} maxLength={100} />
        {state.fieldErrors?.fullName && (
          <p className="text-sm text-red-500">{state.fieldErrors.fullName[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled className="bg-zinc-50 dark:bg-zinc-800" readOnly />
        <p className="text-xs text-zinc-400">Email is managed via your Clerk account settings.</p>
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
