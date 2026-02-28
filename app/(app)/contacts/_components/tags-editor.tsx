"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Plus, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { createTag, type Tag } from "@/lib/actions/tags";

const PRESET_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Violet", value: "#8b5cf6" },
];

interface TagsEditorProps {
  allTags: Tag[];
  selectedTagIds: string[];
  onChangeTagIds: (ids: string[]) => void;
}

export function TagsEditor({ allTags, selectedTagIds, onChangeTagIds }: TagsEditorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0].value);
  const [localTags, setLocalTags] = useState<Tag[]>(allTags);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedTags = localTags.filter((t) => selectedTagIds.includes(t.id));

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChangeTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChangeTagIds([...selectedTagIds, tagId]);
    }
  }

  function handleCreateTag() {
    const name = search.trim();
    if (!name) return;
    setCreateError(null);

    startTransition(async () => {
      const result = await createTag(name, newColor);
      if (result.error) {
        setCreateError(result.error);
        return;
      }
      if (result.tag) {
        setLocalTags((prev) => [...prev, result.tag!].sort((a, b) => a.name.localeCompare(b.name)));
        onChangeTagIds([...selectedTagIds, result.tag.id]);
        setSearch("");
      }
    });
  }

  const filteredTags = localTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const exactMatch = localTags.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-2">
      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="hover:opacity-80 transition-opacity ml-0.5"
                aria-label={`Remove ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-normal text-zinc-500"
          >
            <TagIcon className="h-3.5 w-3.5" />
            {selectedTags.length === 0 ? "Add tags" : "Edit tags"}
            <ChevronsUpDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search or create tag…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {search.trim() ? (
                  <p className="px-3 py-2 text-xs text-zinc-400">No tags found.</p>
                ) : (
                  <p className="px-3 py-2 text-xs text-zinc-400">No tags yet.</p>
                )}
              </CommandEmpty>
              {filteredTags.length > 0 && (
                <CommandGroup heading="Tags">
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={() => toggleTag(tag.id)}
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {search.trim() && !exactMatch && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Create new">
                    {createError && <p className="px-3 py-1 text-xs text-red-500">{createError}</p>}
                    <div className="px-3 py-2 space-y-2">
                      <div className="flex gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => setNewColor(c.value)}
                            title={c.label}
                            className={cn(
                              "h-5 w-5 rounded-full transition-all",
                              newColor === c.value && "ring-2 ring-offset-1 ring-zinc-400"
                            )}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full h-7 text-xs gap-1"
                        disabled={isPending}
                        onClick={handleCreateTag}
                      >
                        <Plus className="h-3 w-3" />
                        Create &ldquo;{search.trim()}&rdquo;
                      </Button>
                    </div>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
