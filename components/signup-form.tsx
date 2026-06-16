"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { createAccountAction, type AuthActionState } from "@/app/actions/auth";
import { signupSchema } from "@/lib/auth-schemas";
import { AuthFormMessage } from "@/components/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formDataValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(signup, {});

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-5">
      <AuthFormMessage state={state} successMessage="Account created." />

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-950 underline dark:text-zinc-100">
          Sign in
        </Link>
      </p>
    </form>
  );
}

async function signup(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(formDataValues(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const accountResult = await createAccountAction(_previousState, formData);

  if (!accountResult.success) {
    return accountResult;
  }

  const result = await signIn("credentials", {
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    redirect: false,
    callbackUrl: "/dashboard",
  });

  if (result?.error) {
    return { error: "Account created. Sign in to continue." };
  }

  return { success: true };
}
