"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Trash2, StickyNote } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote, deleteNote, type NoteFormState, type Note } from "@/lib/actions/notes";

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
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <h3 className="font-medium flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-zinc-400" />
        Notes
        {notes.length > 0 && (
          <span className="text-xs text-zinc-400 font-normal">({notes.length})</span>
        )}
      </h3>

      {/* Add note form */}
      <form ref={formRef} action={formAction} className="space-y-2">
        <Textarea
          name="content"
          placeholder="Add a note…"
          rows={3}
          className="resize-none text-sm"
        />
        {state.fieldErrors?.content && (
          <p className="text-xs text-red-500">{state.fieldErrors.content[0]}</p>
        )}
        {state.error && <p className="text-xs text-red-500">{state.error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Add note"}
        </Button>
      </form>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          {notes.map((note) => (
            <div key={note.id} className="group flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-zinc-400 mt-1">{timeAgo(note.created_at)}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500"
                onClick={() => handleDelete(note.id)}
                disabled={isDeleting}
                aria-label="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && <p className="text-sm text-zinc-400">No notes yet.</p>}
    </div>
  );
}
