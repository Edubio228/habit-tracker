"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import type { ChallengeTemplateDto } from "@/lib/challenge-templates";

import { AuthFormMessage } from "@/components/auth-form-message";
import { ChallengeShareCard } from "@/components/challenge-share-card";
import { ShareButtons } from "@/components/share-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ChallengePublishPanelActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type ChallengePublishAction = (challengeId: string, previousState: ChallengePublishPanelActionState, formData: FormData) => Promise<ChallengePublishPanelActionState>;
type ChallengeTemplateAction = (previousState: ChallengePublishPanelActionState, formData: FormData) => Promise<ChallengePublishPanelActionState>;

type ChallengePublishPanelProps = {
  challengeId: string;
  challengeName: string;
  challengeDescription: string | null;
  template: ChallengeTemplateDto | null;
  publishAction: ChallengePublishAction;
  unpublishAction: ChallengeTemplateAction;
  deleteTemplateAction: ChallengeTemplateAction;
};

export function ChallengePublishPanel({
  challengeId,
  challengeName,
  challengeDescription,
  template,
  publishAction,
  unpublishAction,
  deleteTemplateAction,
}: ChallengePublishPanelProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [publishState, publishFormAction, isPublishing] = useActionState((previousState: ChallengePublishPanelActionState, formData: FormData) => publishAction(challengeId, previousState, formData), {});
  const [unpublishState, unpublishFormAction, isUnpublishing] = useActionState(unpublishAction, {});
  const [deleteState, deleteTemplateFormAction, isDeletingTemplate] = useActionState(deleteTemplateAction, {});

  useEffect(() => {
    if (publishState.success || unpublishState.success || deleteState.success) {
      router.refresh();
    }
  }, [deleteState.success, publishState.success, router, unpublishState.success]);

  const state = publishState.success ? publishState : unpublishState.success ? unpublishState : deleteState;

  if (!template) {
    return (
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium text-zinc-950 dark:text-zinc-100">Share this challenge</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Publish a snapshot that others can preview and import without changing your private challenge.</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? "Close" : "Publish"}
          </Button>
        </div>

        {isExpanded ? (
          <PublishTemplateForm
            state={state}
            formAction={publishFormAction}
            challengeId={challengeId}
            challengeName={challengeName}
            challengeDescription={challengeDescription}
            isPending={isPublishing}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium text-zinc-950 dark:text-zinc-100">Published share template</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Edits to your private challenge will not change this published snapshot.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIsExpanded((value) => !value)}>
          {isExpanded ? "Hide settings" : "Edit template"}
        </Button>
      </div>

      {isExpanded ? (
        <PublishTemplateForm
          state={state}
          formAction={publishFormAction}
          challengeId={challengeId}
          challengeName={challengeName}
          challengeDescription={challengeDescription}
          template={template}
          isPending={isPublishing}
        />
      ) : null}

      <ChallengeShareCard template={template} />

      <div className="space-y-3">
        <ShareButtons shareToken={template.shareToken} />
        <div className="flex flex-wrap gap-2">
          <form action={unpublishFormAction} onSubmit={(event) => { if (!window.confirm("Unpublish this challenge template? Existing imports stay in place.")) event.preventDefault(); }}>
            <input type="hidden" name="templateId" value={template.id} />
            <Button type="submit" variant="secondary" disabled={isUnpublishing}>
              {isUnpublishing ? "Unpublishing..." : "Unpublish"}
            </Button>
          </form>
          <form action={deleteTemplateFormAction} onSubmit={(event) => { if (!window.confirm("Delete this share template? Existing imports stay in place.")) event.preventDefault(); }}>
            <input type="hidden" name="templateId" value={template.id} />
            <Button type="submit" variant="danger" disabled={isDeletingTemplate}>
              {isDeletingTemplate ? "Deleting..." : "Delete template"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PublishTemplateForm({
  state,
  formAction,
  challengeId,
  challengeName,
  challengeDescription,
  template,
  isPending,
}: {
  state: ChallengePublishPanelActionState;
  formAction: (formData: FormData) => void;
  challengeId: string;
  challengeName: string;
  challengeDescription: string | null;
  template?: ChallengeTemplateDto;
  isPending: boolean;
}) {
  return (
    <form action={formAction} className="mt-4 space-y-4">
      <AuthFormMessage state={state} successMessage={template ? "Share template updated." : "Share template published."} />
      <input type="hidden" name="challengeId" value={challengeId} />

      <div className="space-y-2">
        <Label htmlFor={`template-title-${challengeId}`}>Template title</Label>
        <Input id={`template-title-${challengeId}`} name="title" defaultValue={template?.title ?? challengeName} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`template-description-${challengeId}`}>Description</Label>
        <Input id={`template-description-${challengeId}`} name="description" defaultValue={template?.description ?? challengeDescription ?? ""} placeholder="Optional rules or notes" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`template-slug-${challengeId}`}>Optional slug</Label>
        <Input id={`template-slug-${challengeId}`} name="slug" defaultValue={template?.slug ?? ""} placeholder="fitness-reset" />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : template ? "Update template" : "Publish template"}
      </Button>
    </form>
  );
}
