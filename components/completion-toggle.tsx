"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type ToggleCompletionAction = (previousState: Record<string, unknown>, formData: FormData) => Promise<Record<string, unknown>>;

type CompletionToggleProps = {
  habitId: string;
  dateKey: string;
  completed: boolean;
  action: ToggleCompletionAction;
};

export function CompletionToggle({ habitId, dateKey, completed, action }: CompletionToggleProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form action={formAction}>
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="dateKey" value={dateKey} />
      <Button type="submit" variant={completed ? "secondary" : "primary"} disabled={isPending}>
        {isPending ? "Updating..." : completed ? "Mark incomplete" : "Mark complete"}
      </Button>
    </form>
  );
}
