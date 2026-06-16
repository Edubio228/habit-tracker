"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { HabitDto } from "@/lib/habits";
import { AuthFormMessage } from "@/components/auth-form-message";
import { InfoTooltip } from "@/components/info-tooltip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HabitFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  data?: unknown;
};

type HabitFormAction = (previousState: HabitFormState, formData: FormData) => Promise<HabitFormState>;

type HabitFormProps = {
  action: HabitFormAction;
  initialData?: Partial<HabitDto>;
  submitLabel?: string;
  className?: string;
};

export function HabitForm({ action, initialData, submitLabel = "Save habit", className = "" }: HabitFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <Card className={className}>
      <form action={formAction} className="space-y-4">
        <AuthFormMessage state={state} successMessage={initialData ? "Habit updated." : "Habit created."} />

        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            Name
            <InfoTooltip content="Use a short, specific name that makes the habit easy to recognize." />
          </Label>
          <Input id="name" name="name" defaultValue={initialData?.name ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            Description
            <InfoTooltip content="Optional context, reminders, or rules for completing the habit." />
          </Label>
          <Input id="description" name="description" defaultValue={initialData?.description ?? ""} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="goalType" className="flex items-center gap-2">
              Goal type
              <InfoTooltip content="This MVP tracks daily habits. Weekly, monthly, and custom cadences are not stored yet." />
            </Label>
            <Input id="goalType" name="goalType" value="daily" readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalCount" className="flex items-center gap-2">
              Goal count
              <InfoTooltip content="The number of units required for one daily completion." />
            </Label>
            <Input id="goalCount" name="goalCount" type="number" min="1" max="100" defaultValue={initialData?.goalCount ?? 1} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goalUnit" className="flex items-center gap-2">
              Goal unit
              <InfoTooltip content="The unit for the goal count, such as day, minute, page, or glass." />
            </Label>
            <Input id="goalUnit" name="goalUnit" defaultValue={initialData?.goalUnit ?? "day"} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="color" className="flex items-center gap-2">
              Color
              <InfoTooltip content="Used as the visual accent for this habit on the dashboard." />
            </Label>
            <Input id="color" name="color" type="color" defaultValue={initialData?.color ?? "#2A9D8F"} />
          </div>

          <label className="flex items-center gap-3 pt-7 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input type="hidden" name="active" value="false" />
            <input
              type="checkbox"
              name="active"
              value="true"
              defaultChecked={initialData?.active ?? true}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:text-zinc-100"
            />
            Active
            <InfoTooltip content="Active habits appear on the dashboard. Inactive habits are kept but hidden from the main list." />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
