import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { importChallengeTemplateAction } from "@/app/actions/challenge-templates";
import { ChallengeShareCard } from "@/components/challenge-share-card";
import { ImportChallengeForm } from "@/components/import-challenge-form";
import { ShareButtons } from "@/components/share-buttons";
import { SocialProofStats } from "@/components/social-proof-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicChallengeTemplateByToken, getTemplateCreatorDisplayName, hasImportedChallengeTemplate } from "@/lib/challenge-templates";
import { getTodayKey } from "@/lib/habits";
import { getCurrentUser } from "@/lib/session";

type ShareTemplatePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function generateMetadata({ params }: ShareTemplatePageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    const template = await getPublicChallengeTemplateByToken(token);

    return {
      title: `${template.title} | Habit Tracker`,
      description: template.description ?? `${template.durationDays}-day habit challenge`,
      openGraph: {
        title: template.title,
        description: template.description ?? `${template.durationDays}-day habit challenge`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Challenge not found | Habit Tracker",
    };
  }
}

export default async function ShareTemplatePage({ params }: ShareTemplatePageProps) {
  const { token } = await params;
  const template = await getPublicChallengeTemplateByToken(token).catch(() => null);

  if (!template) {
    notFound();
  }

  const user = await getCurrentUser();
  const alreadyImported = user ? await hasImportedChallengeTemplate(user.id, token) : false;
  const defaultStartDate = getTodayKey();

  return (
    <main className="min-h-full bg-zinc-50 px-4 py-8 dark:bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/dashboard" className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Habit Tracker
        </Link>
        {user ? (
          <Link href="/challenges" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100">
            My challenges
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100">
            Sign in
          </Link>
        )}
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {template.durationDays}-day challenge by {getTemplateCreatorDisplayName(template.creator)}
              </p>
              <CardTitle>{template.title}</CardTitle>
              {template.description ? <CardDescription>{template.description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="space-y-6">
              <SocialProofStats
                totalImports={template.totalImports}
                activeParticipants={template.activeParticipants}
                averageCompletionRate={template.averageCompletionRate}
              />
              <ShareButtons shareToken={template.shareToken} />
            </CardContent>
          </Card>

          <ChallengeShareCard template={template} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{alreadyImported ? "Already imported" : user ? "Import this challenge" : "Sign in to import"}</CardTitle>
              <CardDescription>
                {alreadyImported
                  ? "This template is already in your challenge library."
                  : user
                    ? "Importing creates an independent copy in your account."
                    : "Create an account or sign in to add this challenge to your habits."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {alreadyImported ? (
                <Button asChild className="w-full">
                  <Link href="/challenges">View my challenges</Link>
                </Button>
              ) : user ? (
                <ImportChallengeForm shareToken={template.shareToken} defaultStartDate={defaultStartDate} action={importChallengeTemplateAction} />
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="flex-1">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="secondary" className="flex-1">
                    <Link href="/signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How sharing works</CardTitle>
              <CardDescription>Published templates are snapshots. Your private challenge stays private.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Importing copies habits into your account.</li>
                <li>You choose your own start date.</li>
                <li>Future edits to either challenge stay independent.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
