"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { AuthFormMessage } from "@/components/auth-form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ImportChallengeFormActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ImportChallengeFormProps = {
  shareToken: string;
  defaultStartDate: string;
  action: (previousState: ImportChallengeFormActionState, formData: FormData) => Promise<ImportChallengeFormActionState>;
};

export function ImportChallengeForm({ shareToken, defaultStartDate, action }: ImportChallengeFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      router.push("/challenges");
    }
  }, [router, state.success]);

  return (
    <form action={formAction} className="space-y-4">
      <AuthFormMessage state={state} successMessage="Challenge imported." />
      <input type="hidden" name="shareToken" value={shareToken} />

      <div className="space-y-2">
        <Label htmlFor="importStartDate">Start date</Label>
        <Input id="importStartDate" name="startDate" type="date" defaultValue={defaultStartDate} required />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Importing..." : "Import challenge"}
      </Button>
    </form>
  );
}
