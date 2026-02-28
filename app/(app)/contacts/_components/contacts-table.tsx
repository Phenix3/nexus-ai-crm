"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Building2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { FiltersBar } from "./filters-bar";
import { deleteContact } from "@/lib/actions/contacts";
import { addTagToContact } from "@/lib/actions/contact-tags";
import type { Contact, ContactFilters, OrgMember } from "@/lib/actions/contacts";
import type { Tag } from "@/lib/actions/tags";

interface ContactsTableProps {
  contacts: Contact[];
  tags: Tag[];
  members: OrgMember[];
  activeFilters: ContactFilters;
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

type SortField = "first_name" | "last_name" | "score" | "created_at" | "updated_at";

function SortableHeader({
  field,
  label,
  currentSort,
  currentDir,
  onSort,
}: {
  field: SortField;
  label: string;
  currentSort?: string;
  currentDir?: string;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentSort === field;
  const Icon = isActive ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 group/sort text-xs font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
    >
      {label}
      <Icon
        className={`h-3 w-3 ${isActive ? "opacity-100 text-primary" : "opacity-0 group-hover/sort:opacity-60"}`}
      />
    </button>
  );
}

export function ContactsTable({ contacts, tags, members, activeFilters }: ContactsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleEdit(contact: Contact) {
    setEditTarget(contact);
    setFormOpen(true);
  }

  function handleNewContact() {
    setEditTarget(undefined);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this contact? This action cannot be undone.")) return;
    startTransition(async () => {
      await deleteContact(id);
      router.refresh();
    });
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function toggleSelectAll() {
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  }

  function handleBulkDelete() {
    if (
      !confirm(
        `Delete ${selected.size} contact${selected.size !== 1 ? "s" : ""}? This cannot be undone.`
      )
    )
      return;
    const ids = Array.from(selected);
    startTransition(async () => {
      await Promise.all(ids.map((id) => deleteContact(id)));
      setSelected(new Set());
      router.refresh();
    });
  }

  function handleBulkAddTag(tagId: string) {
    const ids = Array.from(selected);
    startTransition(async () => {
      await Promise.all(ids.map((id) => addTagToContact(id, tagId)));
      setBulkTagOpen(false);
      router.refresh();
    });
  }

  function handleSort(field: SortField) {
    const params = new URLSearchParams(searchParams.toString());
    const currentSort = params.get("sort");
    const currentDir = params.get("dir") ?? "asc";

    if (currentSort === field) {
      params.set("dir", currentDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("dir", "asc");
    }
    router.replace(`/contacts?${params.toString()}`);
  }

  const currentSort = activeFilters.sort;
  const currentDir = activeFilters.dir ?? "asc";
  const allSelected = contacts.length > 0 && selected.size === contacts.length;
  const someSelected = selected.size > 0 && selected.size < contacts.length;

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <FiltersBar
        tags={tags}
        members={members}
        activeFilters={activeFilters}
        onNewContact={handleNewContact}
      />

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900/50 dark:border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
              <TableHead className="w-[40px] pr-0">
                <Checkbox
                  checked={allSelected || (someSelected ? "indeterminate" : false)}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[260px]">
                <SortableHeader
                  field="first_name"
                  label="Name"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Company
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Email
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Tags
              </TableHead>
              <TableHead className="w-[80px]">
                <SortableHeader
                  field="score"
                  label="Score"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[48px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <Users className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium">No contacts found</p>
                    <p className="text-xs">
                      {activeFilters.q ||
                      activeFilters.tagId ||
                      activeFilters.scoreMin !== undefined
                        ? "Try adjusting your filters."
                        : "Create your first contact to get started."}
                    </p>
                    {!activeFilters.q &&
                      !activeFilters.tagId &&
                      activeFilters.scoreMin === undefined && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-1"
                          onClick={handleNewContact}
                        >
                          <Users className="mr-1.5 h-3.5 w-3.5" />
                          Add contact
                        </Button>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className={`group border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                    selected.has(contact.id) ? "bg-primary/5 dark:bg-primary/10" : ""
                  }`}
                >
                  <TableCell className="pr-0">
                    <Checkbox
                      checked={selected.has(contact.id)}
                      onCheckedChange={() => toggleSelect(contact.id)}
                      aria-label={`Select ${getDisplayName(contact)}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>

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
                    {contact.tags && contact.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            +{contact.tags.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-700">—</span>
                    )}
                  </TableCell>

                  <TableCell>
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

      {contacts.length > 0 && selected.size === 0 && (
        <p className="text-xs text-zinc-400">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-xl dark:bg-zinc-900 dark:border-zinc-700">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {selected.size} selected
          </span>

          {tags.length > 0 && (
            <Popover open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm">
                  <TagIcon className="h-3.5 w-3.5" />
                  Add tag
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="start" side="top">
                <Command>
                  <CommandList>
                    <CommandEmpty>No tags.</CommandEmpty>
                    <CommandGroup>
                      {tags.map((tag) => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleBulkAddTag(tag.id)}
                          className="gap-2"
                          disabled={isPending}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={handleBulkDelete}
            disabled={isPending}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete {selected.size}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-zinc-500"
            onClick={() => setSelected(new Set())}
          >
            Cancel
          </Button>
        </div>
      )}

      <ContactForm open={formOpen} onOpenChange={setFormOpen} contact={editTarget} allTags={tags} />
    </div>
  );
}
