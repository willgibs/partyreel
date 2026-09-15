/** The count tiles a page opens with (rules, contracts, boards); one shape for all. */
export function StatRow({ stats }: { stats: [string, number | string][] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map(([label, n]) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-4 py-3"
        >
          <p className="font-heading text-2xl tabular-nums">{n}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
