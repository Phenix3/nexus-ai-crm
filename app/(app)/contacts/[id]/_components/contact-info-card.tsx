"use client";

import { useState } from "react";
import { Pencil, Mail, Phone, Building2, Briefcase, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactForm } from "../../_components/contact-form";
import { TagsEditor } from "../../_components/tags-editor";
import { setContactTags } from "@/lib/actions/contact-tags";
import { useRouter } from "next/navigation";
import type { Contact } from "@/lib/actions/contacts";
import type { Tag } from "@/lib/actions/tags";

interface ContactInfoCardProps {
  contact: Contact;
  allTags: Tag[];
}

function getInitials(contact: Contact) {
  const first = contact.first_name?.[0] ?? "";
  const last = contact.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(contact: Contact) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70)
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
        Hot · {score}
      </Badge>
    );
  if (score >= 40)
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
        Warm · {score}
      </Badge>
    );
  return (
    <Badge className="bg-zinc-100 text-zinc-600 hover:bg-zinc-100 border-0">Cold · {score}</Badge>
  );
}

export function ContactInfoCard({ contact, allTags }: ContactInfoCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(contact.tags?.map((t) => t.id) ?? []);

  const scoreColor =
    contact.score >= 70
      ? "bg-emerald-500"
      : contact.score >= 40
        ? "bg-amber-500"
        : "bg-zinc-300 dark:bg-zinc-600";

  async function handleTagChange(ids: string[]) {
    setTagIds(ids);
    await setContactTags(contact.id, ids);
    router.refresh();
  }

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 shrink-0 ring-4 ring-primary/10">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {getInitials(contact)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                  {getDisplayName(contact)}
                </h2>
                {contact.job_title && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{contact.job_title}</p>
                )}
                {contact.company && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <Building2 className="h-3.5 w-3.5" />
                    {contact.company}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="shrink-0 h-8 text-xs"
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          </div>

          {/* Score */}
          <div className="mt-4 flex items-center justify-between">
            <ScoreBadge score={contact.score} />
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-1.5 rounded-full transition-all ${scoreColor}`}
              style={{ width: `${Math.min(contact.score, 100)}%` }}
            />
          </div>
        </div>

        <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Tags */}
        <div className="px-6 pt-4 pb-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Tags
          </p>
          <TagsEditor allTags={allTags} selectedTagIds={tagIds} onChangeTagIds={handleTagChange} />
        </div>

        <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Contact details */}
        <div className="p-6 pt-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Contact info
          </p>
          <dl className="space-y-2.5 text-sm">
            {contact.email && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                </dt>
                <dd>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-zinc-700 transition-colors hover:text-primary dark:text-zinc-300"
                  >
                    {contact.email}
                  </a>
                </dd>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Phone className="h-3.5 w-3.5" />
                </dt>
                <dd>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-zinc-700 transition-colors hover:text-primary dark:text-zinc-300"
                  >
                    {contact.phone}
                  </a>
                </dd>
              </div>
            )}

            {contact.company && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Building2 className="h-3.5 w-3.5" />
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{contact.company}</dd>
              </div>
            )}

            {contact.job_title && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Briefcase className="h-3.5 w-3.5" />
                </dt>
                <dd className="text-zinc-700 dark:text-zinc-300">{contact.job_title}</dd>
              </div>
            )}

            {contact.linkedin_url && (
              <div className="flex items-center gap-3">
                <dt className="shrink-0 text-zinc-400">
                  <Linkedin className="h-3.5 w-3.5" />
                </dt>
                <dd>
                  <a
                    href={contact.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary transition-opacity hover:opacity-80"
                  >
                    LinkedIn profile
                  </a>
                </dd>
              </div>
            )}

            {!contact.email && !contact.phone && !contact.company && !contact.job_title && (
              <p className="text-xs text-zinc-400 italic">No contact info added yet.</p>
            )}
          </dl>
        </div>
      </div>

      <ContactForm open={editOpen} onOpenChange={setEditOpen} contact={contact} allTags={allTags} />
    </>
  );
}
