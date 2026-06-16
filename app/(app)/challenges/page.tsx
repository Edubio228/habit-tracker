import {
  addHabitToChallengeAction,
  createChallengeAction,
  deleteChallengeAction,
  removeHabitFromChallengeAction,
} from "@/app/actions/challenges";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChallengeCard } from "@/components/challenge-card";
import { ChallengeForm } from "@/components/challenge-form";
import { getAvailableHabits, getChallengeDashboardData } from "@/lib/challenges";
import { requireCurrentUser } from "@/lib/session";

export default async function ChallengesPage() {
  const user = await requireCurrentUser();
  const [challenges, availableHabits] = await Promise.all([getChallengeDashboardData(user.id), getAvailableHabits(user.id)]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">Challenges</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Group existing habits into focused challenges like 75 Hard, then track the group in one place.</p>
      </div>

      <ChallengeForm action={createChallengeAction} availableHabits={availableHabits} submitLabel="Create challenge" />

      {challenges.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No challenges yet</CardTitle>
            <CardDescription>Create a challenge above and choose the habits that belong to it.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              availableHabits={availableHabits}
              deleteAction={deleteChallengeAction}
              addHabitAction={(previousState, formData) => addHabitToChallengeAction(challenge.id, previousState, formData)}
              removeHabitAction={(previousState, formData) => removeHabitFromChallengeAction(challenge.id, previousState, formData)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
