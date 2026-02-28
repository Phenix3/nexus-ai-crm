"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createContact,
  updateContact,
  type ContactFormState,
  type Contact,
} from "@/lib/actions/contacts";
import { setContactTags } from "@/lib/actions/contact-tags";
import { TagsEditor } from "./tags-editor";
import type { Tag } from "@/lib/actions/tags";

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  allTags: Tag[];
}

const initialState: ContactFormState = {};

export function ContactForm({ open, onOpenChange, contact, allTags }: ContactFormProps) {
  const isEdit = !!contact;

  const action = isEdit ? updateContact.bind(null, contact.id) : createContact;

  const [state, formAction, isPending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    contact?.tags?.map((t) => t.id) ?? []
  );

  // Reset selected tags when contact changes (edit vs new)
  useEffect(() => {
    setSelectedTagIds(contact?.tags?.map((t) => t.id) ?? []);
  }, [contact]);

  useEffect(() => {
    if (state.success && state.contactId) {
      // Assign tags after save
      setContactTags(state.contactId, selectedTagIds).catch(() => {});
      onOpenChange(false);
      formRef.current?.reset();
      setSelectedTagIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.contactId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit contact" : "New contact"}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={contact?.first_name ?? ""}
                placeholder="Jane"
              />
              {state.fieldErrors?.firstName && (
                <p className="text-xs text-red-500">{state.fieldErrors.firstName[0]}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={contact?.last_name ?? ""}
                placeholder="Smith"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={contact?.email ?? ""}
              placeholder="jane@company.com"
            />
            {state.fieldErrors?.email && (
              <p className="text-xs text-red-500">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contact?.phone ?? ""}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                defaultValue={contact?.company ?? ""}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              defaultValue={contact?.job_title ?? ""}
              placeholder="Head of Sales"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={contact?.linkedin_url ?? ""}
              placeholder="https://linkedin.com/in/..."
            />
            {state.fieldErrors?.linkedinUrl && (
              <p className="text-xs text-red-500">{state.fieldErrors.linkedinUrl[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagsEditor
              allTags={allTags}
              selectedTagIds={selectedTagIds}
              onChangeTagIds={setSelectedTagIds}
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
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
