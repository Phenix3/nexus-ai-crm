"use client";

import { useActionState, useState } from "react";
import { createOrganization, type CreateOrgState } from "@/lib/actions/create-organization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const initialState: CreateOrgState = {};

export function CreateOrgForm() {
  const [state, action, isPending] = useActionState(createOrganization, initialState);
  const [slug, setSlug] = useState("");

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Organisation name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Inc."
          autoFocus
          onChange={(e) => setSlug(slugify(e.target.value))}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-sm text-red-500">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="acme-inc"
          aria-describedby="slug-hint"
        />
        <p id="slug-hint" className="text-xs text-zinc-500">
          Used in URLs — lowercase letters, numbers and hyphens only.
        </p>
        {state.fieldErrors?.slug && (
          <p className="text-sm text-red-500">{state.fieldErrors.slug[0]}</p>
        )}
      </div>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create organisation"}
      </Button>
    </form>
  );
}
