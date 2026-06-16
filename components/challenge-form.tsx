"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { AvailableHabitDto } from "@/lib/challenges";
import { AuthFormMessage } from "@/components/auth-form-message";
import { InfoTooltip } from "@/components/info-tooltip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChallengeFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ChallengeFormAction = (previousState: ChallengeFormState, formData: FormData) => Promise<ChallengeFormState>;

type ChallengeFormProps = {
  action: ChallengeFormAction;
  availableHabits: AvailableHabitDto[];
  submitLabel?: string;
  className?: string;
};

export function ChallengeForm({ action, availableHabits, submitLabel = "Create challenge", className = "" }: ChallengeFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <Card className={className}>
      <form action={formAction} className="space-y-5">
        <AuthFormMessage state={state} successMessage="Challenge created." />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="challengeName">Name</Label>
            <Input id="challengeName" name="name" placeholder="75 Hard" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="challengeDescription">Description</Label>
            <Input id="challengeDescription" name="description" placeholder="Optional rules or notes" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              Start date
              <InfoTooltip content="The first day of the challenge." />
            </Label>
            <Input id="startDate" name="startDate" type="date" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="flex items-center gap-2">
              End date
              <InfoTooltip content="The final day of the challenge." />
            </Label>
            <Input id="endDate" name="endDate" type="date" required />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="flex items-center gap-2">
              Habits
              <InfoTooltip content="Choose the existing habits that count toward this challenge. You can add or remove habits after creating it." />
            </Label>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Select the habits you want grouped under this challenge.</p>
          </div>

          {availableHabits.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Create active habits first, then add them to a challenge.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {availableHabits.map((habit) => (
                <label key={habit.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <input type="checkbox" name="habitIds" value={habit.id} className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:text-zinc-100" />
                  <span className="flex-1">
                    <span className="font-medium text-zinc-950 dark:text-zinc-100">{habit.name}</span>
                    {habit.description ? <span className="block text-zinc-500 dark:text-zinc-400">{habit.description}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input type="hidden" name="active" value="false" />
          <input type="checkbox" name="active" value="true" defaultChecked className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:text-zinc-100" />
          Active
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
