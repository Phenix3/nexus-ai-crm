"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Search,
  Mail,
  Phone,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactForm } from "./contact-form";
import { deleteContact } from "@/lib/actions/contacts";
import type { Contact } from "@/lib/actions/contacts";

interface ContactsTableProps {
  contacts: Contact[];
}

function getInitials(contact: Contact) {
  const first = contact.first_name?.[0] ?? "";
  const last = contact.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(contact: Contact) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";
}

function ScoreCell({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      : score >= 40
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${cls}`}
    >
      {score}
    </span>
  );
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | undefined>();
  const [isPending, startTransition] = useTransition();

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      false
    );
  });

  function handleEdit(contact: Contact) {
    setEditTarget(contact);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this contact? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteContact(id);
      router.refresh();
    });
  }

  function handleNewContact() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            className="h-9 pl-9 text-sm"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button onClick={handleNewContact} size="sm" className="h-9 gap-2">
            <UserPlus className="h-3.5 w-3.5" />
            New contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="w-[260px] text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Company
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Phone
              </TableHead>
              <TableHead className="w-[72px] text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Score
              </TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  {contacts.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium">No contacts yet</p>
                      <p className="text-xs">Create your first contact to get started.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={handleNewContact}
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        Add contact
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">No contacts match your search.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="group border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                >
                  <TableCell>
                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                          {getDisplayName(contact)}
                        </p>
                        {contact.job_title && (
                          <p className="truncate text-xs text-zinc-400">{contact.job_title}</p>
                        )}
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell>
                    {contact.company ? (
                      <span className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                        {contact.company}
                      </span>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-primary dark:text-zinc-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                        <span className="truncate max-w-[180px]">{contact.email}</span>
                      </a>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 text-sm text-zinc-600 transition-colors hover:text-primary dark:text-zinc-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <ScoreCell score={contact.score} />
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleEdit(contact)}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400"
                          onClick={() => handleDelete(contact.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-zinc-400">
          {filtered.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </p>
      )}

      <ContactForm open={formOpen} onOpenChange={setFormOpen} contact={editTarget} />
    </div>
  );
}
