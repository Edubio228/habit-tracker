"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { HabitDto } from "@/lib/habits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletionToggle } from "@/components/completion-toggle";
import { HabitForm } from "@/components/habit-form";
import { NoteEditor } from "@/components/note-editor";

type HabitCardProps = {
  habit: HabitDto;
  dateKey: string;
  toggleAction: (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;
  noteAction: (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;
  updateAction: (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;
  deleteAction: (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;
};

function goalLabel(habit: HabitDto) {
  return `${habit.goalCount} ${habit.goalUnit}${habit.goalCount === 1 ? "" : "s"} / ${habit.goalType}`;
}

function percentLabel(value: number) {
  return `${value}%`;
}

export function HabitCard({ habit, dateKey, toggleAction, noteAction, updateAction, deleteAction }: HabitCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deleteAction, {});

  useEffect(() => {
    if (deleteState.success) {
      router.refresh();
    }
  }, [deleteState.success, router]);

  return (
    <Card className="space-y-5" style={{ borderLeft: `6px solid ${habit.color}` }}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{habit.name}</CardTitle>
            {habit.description && <CardDescription>{habit.description}</CardDescription>}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing((value) => !value)}>
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <form
              action={deleteFormAction}
              onSubmit={(event) => {
                if (!window.confirm("Delete this habit? This also deletes its logs.")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="habitId" value={habit.id} />
              <Button type="submit" variant="danger" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>

      {isEditing ? (
        <HabitForm
          action={updateAction}
          initialData={habit}
          submitLabel="Update habit"
        />
      ) : (
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Goal</p>
              <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{goalLabel(habit)}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Current streak</p>
              <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{habit.streak} day{habit.streak === 1 ? "" : "s"}</p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">30-day rate</p>
              <p className="mt-1 font-semibold text-zinc-950 dark:text-zinc-100">{percentLabel(habit.completionRate)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <CompletionToggle habitId={habit.id} dateKey={dateKey} completed={habit.todayCompleted} action={toggleAction} />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {habit.todayCompleted ? "Completed today" : "Not completed today"}
            </span>
          </div>

          <NoteEditor habitId={habit.id} dateKey={dateKey} initialNote={habit.todayNote} action={noteAction} />
        </CardContent>
      )}
    </Card>
  );
}
