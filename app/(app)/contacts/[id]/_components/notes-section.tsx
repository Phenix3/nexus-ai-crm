"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2, StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createNote, deleteNote, type NoteFormState, type Note } from "@/lib/actions/notes";

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

interface NotesSectionProps {
  contactId: string;
  notes: Note[];
}

const initialState: NoteFormState = {};

export function NotesSection({ contactId, notes }: NotesSectionProps) {
  const action = createNote.bind(null, contactId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  function handleDelete(noteId: string) {
    startDelete(async () => {
      await deleteNote(noteId, contactId);
    });
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notes</h3>
          {notes.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {notes.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Add note form */}
        <form ref={formRef} action={formAction} className="space-y-2">
          <Textarea
            name="content"
            placeholder="Add a note…"
            rows={3}
            className="resize-none text-sm bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus-visible:ring-primary/30"
          />
          {state.fieldErrors?.content && (
            <p className="text-xs text-red-500">{state.fieldErrors.content[0]}</p>
          )}
          {state.error && <p className="text-xs text-red-500">{state.error}</p>}
          <Button type="submit" size="sm" disabled={isPending} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {isPending ? "Saving…" : "Add note"}
          </Button>
        </form>

        {/* Notes list */}
        {notes.length > 0 ? (
          <div className="space-y-3 border-t pt-4 dark:border-zinc-800">
            {notes.map((note) => (
              <div key={note.id} className="group flex gap-3">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                    N
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{timeAgo(note.created_at)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  onClick={() => handleDelete(note.id)}
                  disabled={isDeleting}
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center border-t dark:border-zinc-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <StickyNote className="h-4 w-4 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500">No notes yet.</p>
            <p className="text-xs text-zinc-400">Add your first note above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
