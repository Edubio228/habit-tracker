type SocialProofStatsProps = {
  totalImports: number;
  activeParticipants: number;
  averageCompletionRate: number;
};

export function SocialProofStats({ totalImports, activeParticipants, averageCompletionRate }: SocialProofStatsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Imports" value={totalImports.toString()} />
      <Stat label="Active participants" value={activeParticipants.toString()} />
      <Stat label="Average completion" value={`${averageCompletionRate}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">{value}</p>
    </div>
  );
}
