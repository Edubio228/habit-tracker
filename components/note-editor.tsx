"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { AuthFormMessage } from "@/components/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UpdateNoteAction = (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;

type NoteEditorProps = {
  habitId: string;
  dateKey: string;
  initialNote?: string | null;
  action: UpdateNoteAction;
};

export function NoteEditor({ habitId, dateKey, initialNote, action }: NoteEditorProps) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote ?? "");
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="dateKey" value={dateKey} />

      <AuthFormMessage state={state} successMessage="Note saved." />

      <div className="space-y-2">
        <Label htmlFor={`note-${habitId}`}>Today&apos;s note</Label>
        <Input
          key={`${habitId}-${initialNote ?? ""}`}
          id={`note-${habitId}`}
          name="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a short note"
          maxLength={1000}
        />
      </div>

      <Button type="submit" variant="secondary" disabled={isPending}>
        {isPending ? "Saving note..." : "Save note"}
      </Button>
    </form>
  );
}
