"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  NotFoundError,
  challengeIdSchema,
  challengeTemplateIdSchema,
  deleteChallengeTemplate,
  getPublicChallengeTemplateByToken,
  importChallengeTemplate,
  importChallengeTemplateSchema,
  publishChallengeTemplate,
  publishChallengeTemplateSchema,
  unpublishChallengeTemplate,
} from "@/lib/challenge-templates";
import { requireCurrentUser } from "@/lib/session";

type ChallengeTemplateActionState<T = unknown> = {
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

function actionError(error: unknown): ChallengeTemplateActionState {
  if (error instanceof z.ZodError) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  if (error instanceof NotFoundError || error instanceof Error) {
    return { error: error.message };
  }

  return { error: "Something went wrong. Please try again." };
}

export async function publishChallengeTemplateAction(
  challengeId: string,
  _previousState: ChallengeTemplateActionState,
  formData: FormData,
): Promise<ChallengeTemplateActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = challengeIdSchema.safeParse({ challengeId });

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const templateInput = publishChallengeTemplateSchema.safeParse(formDataValues(formData));

    if (!templateInput.success) {
      return { fieldErrors: templateInput.error.flatten().fieldErrors };
    }

    const data = await publishChallengeTemplate(user.id, parsed.data.challengeId, templateInput.data);
    revalidatePath("/challenges");
    revalidatePath(`/share/${data.shareToken}`);

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function unpublishChallengeTemplateAction(
  _previousState: ChallengeTemplateActionState,
  formData: FormData,
): Promise<ChallengeTemplateActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = challengeTemplateIdSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = await unpublishChallengeTemplate(user.id, parsed.data.templateId);
    revalidatePath("/challenges");
    revalidatePath(`/share/${data.shareToken}`);

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteChallengeTemplateAction(
  _previousState: ChallengeTemplateActionState,
  formData: FormData,
): Promise<ChallengeTemplateActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = challengeTemplateIdSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    await deleteChallengeTemplate(user.id, parsed.data.templateId);
    revalidatePath("/challenges");

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function importChallengeTemplateAction(
  _previousState: ChallengeTemplateActionState,
  formData: FormData,
): Promise<ChallengeTemplateActionState> {
  try {
    const user = await requireCurrentUser();
    const parsed = importChallengeTemplateSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const template = await getPublicChallengeTemplateByToken(parsed.data.shareToken);
    const data = await importChallengeTemplate(user.id, parsed.data.shareToken, parsed.data.startDate);
    revalidatePath("/challenges");
    revalidatePath(`/share/${template.shareToken}`);

    return { success: true, data };
  } catch (error) {
    return actionError(error);
  }
}
