"use client";

type AuthActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export function AuthFormMessage({
  state,
  successMessage,
}: {
  state: AuthActionState;
  successMessage?: string;
}) {
  const fieldErrors = Object.entries(state.fieldErrors ?? {});

  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      )}

      {state.success && successMessage && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
          {successMessage}
        </p>
      )}

      {fieldErrors.map(([name, messages]) => (
        <p key={name} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {messages?.join(" ")}
        </p>
      ))}
    </div>
  );
}
