"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Tag as TagIcon,
  UserCircle,
  X,
  Download,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/actions/tags";
import type { OrgMember, ContactFilters } from "@/lib/actions/contacts";

interface FiltersBarProps {
  tags: Tag[];
  members: OrgMember[];
  activeFilters: ContactFilters;
  onNewContact: () => void;
}

const SCORE_OPTIONS = [
  { label: "Any score", value: "" },
  { label: "Hot (70+)", value: "70" },
  { label: "Warm (40–69)", value: "40-69" },
  { label: "Cold (<40)", value: "0-39" },
];

export function FiltersBar({ tags, members, activeFilters, onNewContact }: FiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(activeFilters.q ?? "");
  const [tagOpen, setTagOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync search value when navigating back
  useEffect(() => {
    setSearchValue(activeFilters.q ?? "");
  }, [activeFilters.q]);

  function buildUrl(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    return `/contacts?${params.toString()}`;
  }

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.replace(buildUrl({ q: value || undefined }));
      }, 300);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams]
  );

  function setTag(tagId: string | undefined) {
    router.replace(buildUrl({ tag: tagId }));
    setTagOpen(false);
  }

  function setScore(value: string) {
    if (!value) {
      router.replace(buildUrl({ score_min: undefined, score_max: undefined }));
    } else if (value === "70") {
      router.replace(buildUrl({ score_min: "70", score_max: undefined }));
    } else if (value === "40-69") {
      router.replace(buildUrl({ score_min: "40", score_max: "69" }));
    } else if (value === "0-39") {
      router.replace(buildUrl({ score_min: "0", score_max: "39" }));
    }
  }

  function setOwner(userId: string | undefined) {
    router.replace(buildUrl({ owner: userId }));
    setOwnerOpen(false);
  }

  function clearAll() {
    setSearchValue("");
    router.replace("/contacts");
  }

  const activeTag = tags.find((t) => t.id === activeFilters.tagId);
  const activeOwner = members.find((m) => m.user_id === activeFilters.ownerId);

  const scoreLabel =
    activeFilters.scoreMin !== undefined
      ? (SCORE_OPTIONS.find((o) => {
          if (activeFilters.scoreMin === 70) return o.value === "70";
          if (activeFilters.scoreMin === 40) return o.value === "40-69";
          if (activeFilters.scoreMin === 0) return o.value === "0-39";
          return false;
        })?.label ?? "Score")
      : "Score";

  const hasFilters =
    !!activeFilters.q ||
    !!activeFilters.tagId ||
    activeFilters.scoreMin !== undefined ||
    !!activeFilters.ownerId;

  // Build export URL with same filters
  const exportParams = new URLSearchParams(searchParams.toString());
  const exportUrl = `/api/contacts/export?${exportParams.toString()}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-72">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          className="h-9 pl-9 text-sm"
          placeholder="Search contacts…"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Tag filter */}
      <Popover open={tagOpen} onOpenChange={setTagOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm font-normal",
              activeTag && "border-primary/50 bg-primary/5 text-primary"
            )}
          >
            {activeTag ? (
              <>
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeTag.color }}
                />
                {activeTag.name}
              </>
            ) : (
              <>
                <TagIcon className="h-3.5 w-3.5" />
                Tag
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags…" />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {activeTag && (
                  <CommandItem onSelect={() => setTag(undefined)} className="gap-2">
                    <X className="h-3.5 w-3.5 text-zinc-400" />
                    Clear filter
                  </CommandItem>
                )}
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.name}
                    onSelect={() => setTag(tag.id)}
                    className="gap-2"
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

      {/* Score filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-1.5 text-sm font-normal",
              activeFilters.scoreMin !== undefined && "border-primary/50 bg-primary/5 text-primary"
            )}
          >
            {scoreLabel}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SCORE_OPTIONS.map((opt) => (
            <DropdownMenuItem key={opt.value} onClick={() => setScore(opt.value)}>
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Owner filter */}
      {members.length > 1 && (
        <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 gap-1.5 text-sm font-normal",
                activeOwner && "border-primary/50 bg-primary/5 text-primary"
              )}
            >
              <UserCircle className="h-3.5 w-3.5" />
              {activeOwner ? (activeOwner.full_name ?? activeOwner.email) : "Owner"}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search members…" />
              <CommandList>
                <CommandEmpty>No members found.</CommandEmpty>
                <CommandGroup>
                  {activeOwner && (
                    <CommandItem onSelect={() => setOwner(undefined)} className="gap-2">
                      <X className="h-3.5 w-3.5 text-zinc-400" />
                      Clear filter
                    </CommandItem>
                  )}
                  {members.map((m) => (
                    <CommandItem
                      key={m.user_id}
                      value={m.full_name ?? m.email}
                      onSelect={() => setOwner(m.user_id)}
                    >
                      {m.full_name ?? m.email}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-sm text-zinc-500"
          onClick={clearAll}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Export CSV */}
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-sm" asChild>
          <a href={exportUrl} download>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </Button>

        {/* New contact */}
        <Button size="sm" className="h-9 gap-2" onClick={onNewContact}>
          <UserPlus className="h-3.5 w-3.5" />
          New contact
        </Button>
      </div>
    </div>
  );
}
