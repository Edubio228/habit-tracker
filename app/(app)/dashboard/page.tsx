import {
  createHabitAction,
  deleteHabitAction,
  toggleCompletionAction,
  updateHabitAction,
  updateNoteAction,
} from "@/app/actions/habits";
import { getTodayKey, getDashboardData } from "@/lib/habits";
import { requireCurrentUser } from "@/lib/session";
import { HabitCard } from "@/components/habit-card";
import { HabitForm } from "@/components/habit-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const dashboard = await getDashboardData(user.id);
  const dateKey = getTodayKey();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">Dashboard</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">Review today, update notes, and keep your streaks moving.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Active habits" value={dashboard.summary.totalHabits.toString()} />
        <SummaryCard label="Completed today" value={dashboard.summary.completedToday.toString()} />
        <SummaryCard label="Today&apos;s completion" value={`${dashboard.summary.completionRate}%`} />
        <SummaryCard label="Average streak" value={`${dashboard.summary.averageStreak} days`} />
      </div>

      <HabitForm action={createHabitAction} submitLabel="Create habit" />

      {dashboard.habits.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No habits yet</CardTitle>
            <CardDescription>Create your first habit above to start tracking progress.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {dashboard.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              dateKey={dateKey}
              toggleAction={toggleCompletionAction}
              noteAction={updateNoteAction}
              updateAction={updateHabitAction.bind(null, habit.id)}
              deleteAction={deleteHabitAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-zinc-950 dark:text-zinc-100">{value}</p>
      </CardContent>
    </Card>
  );
}
