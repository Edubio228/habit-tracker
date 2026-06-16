import type { ChallengeTemplateDto, PublicChallengeTemplateDto } from "@/lib/challenge-templates";

import { SocialProofStats } from "@/components/social-proof-stats";

type ChallengeShareCardProps = {
  template: ChallengeTemplateDto | PublicChallengeTemplateDto;
};

export function ChallengeShareCard({ template }: ChallengeShareCardProps) {
  const creatorName = getCreatorDisplayName(template.creator);
  const accentColor = template.habits[0]?.color ?? "#2A9D8F";

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="h-3" style={{ backgroundColor: accentColor }} />
      <div className="space-y-6 p-6">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{template.durationDays}-day challenge by {creatorName}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">{template.title}</h2>
          {template.description ? <p className="mt-3 text-zinc-600 dark:text-zinc-400">{template.description}</p> : null}
        </div>

        <SocialProofStats
          totalImports={template.totalImports}
          activeParticipants={template.activeParticipants}
          averageCompletionRate={template.averageCompletionRate}
        />

        <div>
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-100">Included habits</h3>
          {template.habits.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              This challenge does not include any habits yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {template.habits.map((habit) => (
                <li key={habit.id} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: habit.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-950 dark:text-zinc-100">{habit.name}</span>
                    {habit.description ? <span className="block text-sm text-zinc-500 dark:text-zinc-400">{habit.description}</span> : null}
                    <span className="block text-sm text-zinc-500 dark:text-zinc-400">
                      {habit.goalCount} {habit.goalUnit}
                      {habit.goalCount === 1 ? "" : "s"} / {habit.goalType}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function getCreatorDisplayName(creator: { name: string | null; email: string | null }) {
  return creator.name?.trim() || creator.email || "Anonymous creator";
}

