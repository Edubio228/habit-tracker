"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { AvailableHabitDto, ChallengeDto } from "@/lib/challenges";
import type { ChallengeTemplateDto } from "@/lib/challenge-templates";

import { ChallengePublishPanel } from "@/components/challenge-publish-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChallengeCardActionState = {
  success?: boolean;
  error?: string;
  data?: unknown;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ChallengeCardAction = (previousState: ChallengeCardActionState, formData: FormData) => Promise<ChallengeCardActionState>;
type ChallengePublishAction = (challengeId: string, previousState: ChallengeCardActionState, formData: FormData) => Promise<ChallengeCardActionState>;

type ChallengeCardProps = {
  challenge: ChallengeDto;
  availableHabits: AvailableHabitDto[];
  template: ChallengeTemplateDto | null;
  deleteAction: ChallengeCardAction;
  addHabitAction: ChallengeCardAction;
  removeHabitAction: ChallengeCardAction;
  publishAction: ChallengePublishAction;
  unpublishTemplateAction: ChallengeCardAction;
  deleteTemplateAction: ChallengeCardAction;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function goalLabel(habit: ChallengeDto["habits"][number]["habit"]) {
  return `${habit.goalCount} ${habit.goalUnit}${habit.goalCount === 1 ? "" : "s"} / ${habit.goalType}`;
}

export function ChallengeCard({
  challenge,
  availableHabits,
  template,
  deleteAction,
  addHabitAction,
  removeHabitAction,
  publishAction,
  unpublishTemplateAction,
  deleteTemplateAction,
}: ChallengeCardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState(availableHabits[0]?.id ?? "");
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deleteAction, {});
  const [addState, addFormAction, isAddingHabit] = useActionState(addHabitAction, {});
  const [removeState, removeFormAction, isRemovingHabit] = useActionState(removeHabitAction, {});
  const [publishState] = useActionState((previousState: ChallengeCardActionState, formData: FormData) => publishAction(challenge.id, previousState, formData), {});
  const [unpublishTemplateState] = useActionState(unpublishTemplateAction, {});
  const [deleteTemplateState] = useActionState(deleteTemplateAction, {});
  const accentColor = challenge.habits[0]?.habit.color ?? "#2A9D8F";
  const availableToAdd = availableHabits.filter((habit) => !challenge.habits.some((challengeHabit) => challengeHabit.habit.id === habit.id));
  const selectedHabitIsAvailable = availableToAdd.some((habit) => habit.id === selectedHabitId);

  useEffect(() => {
    if (deleteState.success || addState.success || removeState.success || publishState.success || unpublishTemplateState.success || deleteTemplateState.success) {
      router.refresh();
    }
  }, [addState.success, deleteState.success, publishState.success, removeState.success, router, unpublishTemplateState.success, deleteTemplateState.success]);

  return (
    <Card className="space-y-5" style={{ borderLeft: `6px solid ${accentColor}` }}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{challenge.name}</CardTitle>
            {challenge.description && <CardDescription>{challenge.description}</CardDescription>}
            <CardDescription>
              {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAdding((value) => !value)}>
              {isAdding ? "Close" : "Add habit"}
            </Button>
            <form
              action={deleteFormAction}
              onSubmit={(event) => {
                if (!window.confirm("Delete this challenge? This only removes the challenge grouping, not the habits.")) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="challengeId" value={challenge.id} />
              <Button type="submit" variant="danger" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Habits</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">{challenge.progress.totalHabits}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Completed today</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">{challenge.progress.completedToday}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Today&apos;s completion</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">{challenge.progress.completionRate}%</p>
          </div>
        </div>

        <ChallengePublishPanel
          challengeId={challenge.id}
          challengeName={challenge.name}
          challengeDescription={challenge.description}
          template={template}
          publishAction={publishAction}
          unpublishAction={unpublishTemplateAction}
          deleteTemplateAction={deleteTemplateAction}
        />

        {isAdding ? (
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <form action={addFormAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor={`habit-${challenge.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Habit
                </label>
                <select
                  id={`habit-${challenge.id}`}
                  name="habitId"
                  value={selectedHabitId}
                  onChange={(event) => setSelectedHabitId(event.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/20"
                  disabled={availableToAdd.length === 0 || isAddingHabit}
                >
                  {availableToAdd.length === 0 ? <option value="">No active habits</option> : null}
                  {availableToAdd.map((habit) => (
                      <option key={habit.id} value={habit.id}>
                        {habit.name}
                      </option>
                    ))}
                </select>
              </div>
              <input type="hidden" name="challengeId" value={challenge.id} />
              <Button type="submit" disabled={!selectedHabitIsAvailable || isAddingHabit}>
                {isAddingHabit ? "Adding..." : "Add"}
              </Button>
            </form>
          </div>
        ) : null}

        {challenge.habits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Add habits to start tracking this challenge as a group.
          </p>
        ) : (
          <div className="space-y-3">
            {challenge.habits.map((challengeHabit) => {
              const habit = challengeHabit.habit;

              return (
                <div key={challengeHabit.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
                      <p className="font-medium text-zinc-950 dark:text-zinc-100">{habit.name}</p>
                    </div>
                    {habit.description ? <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{habit.description}</p> : null}
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{goalLabel(habit)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{habit.todayCompleted ? "Completed today" : "Not completed today"}</span>
                    <form action={removeFormAction}>
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <input type="hidden" name="habitId" value={habit.id} />
                      <Button type="submit" variant="secondary" disabled={isRemovingHabit}>
                        {isRemovingHabit ? "Removing..." : "Remove"}
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
