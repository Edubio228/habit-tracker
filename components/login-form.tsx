"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { loginSchema } from "@/lib/auth-schemas";
import { AuthFormMessage } from "@/components/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function formDataValues(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, {});

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-5">
      <AuthFormMessage state={state} successMessage="Signed in." />

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Need an account?{" "}
        <Link href="/signup" className="font-medium text-zinc-950 underline dark:text-zinc-100">
          Sign up
        </Link>
      </p>
    </form>
  );
}

async function login(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(formDataValues(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const result = await signIn("credentials", {
    email: parsed.data.email.toLowerCase(),
    password: parsed.data.password,
    redirect: false,
    callbackUrl: "/dashboard",
  });

  if (result?.error) {
    return { error: "Invalid email or password." };
  }

  return { success: true };
}
