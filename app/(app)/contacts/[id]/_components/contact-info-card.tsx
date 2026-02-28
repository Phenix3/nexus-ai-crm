"use client";

import { useState } from "react";
import { Pencil, Mail, Phone, Building2, Briefcase, Linkedin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactForm } from "../../_components/contact-form";
import type { Contact } from "@/lib/actions/contacts";

interface ContactInfoCardProps {
  contact: Contact;
}

function getInitials(contact: Contact) {
  const first = contact.first_name?.[0] ?? "";
  const last = contact.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(contact: Contact) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";
}

export function ContactInfoCard({ contact }: ContactInfoCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border bg-white p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700">
              {getInitials(contact)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">{getDisplayName(contact)}</h2>
            {contact.job_title && <p className="text-sm text-zinc-500">{contact.job_title}</p>}
            {contact.company && (
              <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                <Building2 className="h-3.5 w-3.5" />
                {contact.company}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium">{contact.score}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Details */}
        <dl className="space-y-3 text-sm">
          {contact.email && (
            <div className="flex items-center gap-3">
              <dt className="shrink-0">
                <Mail className="h-4 w-4 text-zinc-400" />
              </dt>
              <dd>
                <a href={`mailto:${contact.email}`} className="hover:underline text-zinc-700">
                  {contact.email}
                </a>
              </dd>
            </div>
          )}

          {contact.phone && (
            <div className="flex items-center gap-3">
              <dt className="shrink-0">
                <Phone className="h-4 w-4 text-zinc-400" />
              </dt>
              <dd>
                <a href={`tel:${contact.phone}`} className="hover:underline text-zinc-700">
                  {contact.phone}
                </a>
              </dd>
            </div>
          )}

          {contact.company && (
            <div className="flex items-center gap-3">
              <dt className="shrink-0">
                <Building2 className="h-4 w-4 text-zinc-400" />
              </dt>
              <dd className="text-zinc-700">{contact.company}</dd>
            </div>
          )}

          {contact.job_title && (
            <div className="flex items-center gap-3">
              <dt className="shrink-0">
                <Briefcase className="h-4 w-4 text-zinc-400" />
              </dt>
              <dd className="text-zinc-700">{contact.job_title}</dd>
            </div>
          )}

          {contact.linkedin_url && (
            <div className="flex items-center gap-3">
              <dt className="shrink-0">
                <Linkedin className="h-4 w-4 text-zinc-400" />
              </dt>
              <dd>
                <a
                  href={contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-zinc-700"
                >
                  LinkedIn profile
                </a>
              </dd>
            </div>
          )}
        </dl>

        {/* Score badge */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium">
              Lead score
            </span>
            <Badge
              className={
                contact.score >= 70
                  ? "bg-green-100 text-green-700"
                  : contact.score >= 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-zinc-100 text-zinc-600"
              }
            >
              {contact.score} / 100
            </Badge>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100">
            <div
              className={`h-1.5 rounded-full transition-all ${
                contact.score >= 70
                  ? "bg-green-500"
                  : contact.score >= 40
                    ? "bg-yellow-500"
                    : "bg-zinc-300"
              }`}
              style={{ width: `${Math.min(contact.score, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <ContactForm open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </>
  );
}
