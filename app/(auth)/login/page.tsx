import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">Sign in</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Track your habits with a private account.</p>
      </div>

      <LoginForm />
    </div>
  );
}
