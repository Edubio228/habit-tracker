"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  NotFoundError,
  addHabitToChallenge,
  challengeHabitIdSchema,
  challengeIdSchema,
  challengeSchema,
  createChallenge,
  deleteChallenge,
  removeHabitFromChallenge,
} from "@/lib/challenges";
import { requireCurrentUser } from "@/lib/session";

type ChallengeActionState<T = unknown> = {
  success?: boolean;
  error?: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
};

function formDataValues(formData: FormData) {
  const values: Record<string, string | string[]> = {};

  for (const [key, value] of formData.entries()) {
    const stringValue = typeof value === "string" ? value : "";

    if (values[key] === undefined) {
      values[key] = stringValue;
      continue;
    }

    const currentValue = values[key];

    if (Array.isArray(currentValue)) {
      currentValue.push(stringValue);
    } else {
      values[key] = [currentValue, stringValue];
    }
  }

  return values;
}

function actionError(error: unknown): ChallengeActionState {
  if (error instanceof z.ZodError) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  if (error instanceof NotFoundError) {
    return { error: error.message };
  }

  return { error: "Something went wrong. Please try again." };
}

export async function createChallengeAction(_previousState: ChallengeActionState, formData: FormData): Promise<ChallengeActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = challengeSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await createChallenge(user.id, parsed.data);
    revalidatePath("/challenges");

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteChallengeAction(_previousState: ChallengeActionState, formData: FormData): Promise<ChallengeActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = challengeIdSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await deleteChallenge(user.id, parsed.data.challengeId);
    revalidatePath("/challenges");

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function addHabitToChallengeAction(challengeId: string, _previousState: ChallengeActionState, formData: FormData): Promise<ChallengeActionState> {
  try {
    const user = await requireCurrentUser();
    const values = formDataValues(formData);
    const parsed = challengeHabitIdSchema.safeParse({
      ...values,
      challengeId,
    });

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await addHabitToChallenge(user.id, parsed.data.challengeId, parsed.data.habitId);
    revalidatePath("/challenges");

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeHabitFromChallengeAction(challengeId: string, _previousState: ChallengeActionState, formData: FormData): Promise<ChallengeActionState> {
  try {
    const user = await requireCurrentUser();
    const values = formDataValues(formData);
    const parsed = challengeHabitIdSchema.safeParse({
      ...values,
      challengeId,
    });

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await removeHabitFromChallenge(user.id, parsed.data.challengeId, parsed.data.habitId);
    revalidatePath("/challenges");

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}
