"use server";

import { updateTag } from "next/cache";
import { z } from "zod";

import {
  NotFoundError,
  createHabit,
  deleteHabit,
  habitIdSchema,
  habitSchema,
  noteSchema,
  toggleCompletionSchema,
  toggleLogForDate,
  updateHabit,
  updateHabitSchema,
  updateLogNote,
} from "@/lib/habits";
import { dashboardCacheTag, requireCurrentUser } from "@/lib/session";

type HabitActionState<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
};

function formDataValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function actionError(error: unknown): HabitActionState {
  if (error instanceof z.ZodError) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  if (error instanceof NotFoundError) {
    return { error: "Habit not found." };
  }

  return { error: "Something went wrong. Please try again." };
}

export async function createHabitAction(_previousState: HabitActionState, formData: FormData): Promise<HabitActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = habitSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await createHabit(user.id, parsed.data);
    updateTag(dashboardCacheTag(user.id));

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateHabitAction(habitId: string, _previousState: HabitActionState, formData: FormData): Promise<HabitActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = updateHabitSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await updateHabit(user.id, habitId, parsed.data);
    updateTag(dashboardCacheTag(user.id));

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteHabitAction(_previousState: HabitActionState, formData: FormData): Promise<HabitActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = habitIdSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await deleteHabit(user.id, parsed.data.habitId);
    updateTag(dashboardCacheTag(user.id));

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function toggleCompletionAction(_previousState: HabitActionState, formData: FormData): Promise<HabitActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = toggleCompletionSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await toggleLogForDate(user.id, parsed.data.habitId, parsed.data.dateKey);
    updateTag(dashboardCacheTag(user.id));

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateNoteAction(_previousState: HabitActionState, formData: FormData): Promise<HabitActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = noteSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await updateLogNote(user.id, parsed.data.habitId, parsed.data.dateKey, parsed.data.note ?? "");
    updateTag(dashboardCacheTag(user.id));

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}
