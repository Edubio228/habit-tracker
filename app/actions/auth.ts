"use server";

import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { signupSchema } from "@/lib/auth-schemas";
import { prisma } from "@/lib/prisma";

export type AuthActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function formDataValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function actionError(error: unknown): AuthActionState {
  if (error instanceof z.ZodError) {
    return { fieldErrors: error.flatten().fieldErrors };
  }

  return { error: "Something went wrong. Please try again." };
}

export async function createAccountAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    const parsed = signupSchema.safeParse(formDataValues(formData));

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });

    if (existingUser) {
      return { fieldErrors: { email: ["An account with this email already exists."] } };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        password: passwordHash,
        emailVerified: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
