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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { Contact } from "@/db/schema/contacts";

interface ContactsTableProps {
  contacts: Contact[];
}

function getInitials(contact: Contact) {
  const first = contact.firstName?.[0] ?? "";
  const last = contact.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function getDisplayName(contact: Contact) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed";
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
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
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
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            className="pl-8"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ml-auto">
          <Button onClick={handleNewContact} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            New contact
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[260px]">Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[80px] text-center">Score</TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-zinc-400">
                  {contacts.length === 0
                    ? "No contacts yet. Create your first contact to get started."
                    : "No contacts match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((contact) => (
                <TableRow key={contact.id} className="group">
                  <TableCell>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                          {getInitials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{getDisplayName(contact)}</p>
                        {contact.jobTitle && (
                          <p className="truncate text-xs text-zinc-500">{contact.jobTitle}</p>
                        )}
                      </div>
                    </Link>
                  </TableCell>

                  <TableCell>
                    {contact.company ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {contact.company}
                      </span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        contact.score >= 70
                          ? "bg-green-100 text-green-700"
                          : contact.score >= 40
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-zinc-100 text-zinc-600"
                      }
                    >
                      {contact.score}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(contact)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
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

      <p className="text-xs text-zinc-400">
        {filtered.length} of {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
      </p>

      <ContactForm open={formOpen} onOpenChange={setFormOpen} contact={editTarget} />
    </div>
  );
}
