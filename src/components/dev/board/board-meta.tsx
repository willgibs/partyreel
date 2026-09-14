/**
 * THE BOARD'S META PANEL: what a board proposes beyond its stages, on the board
 * where it can be ruled on. Generalised from the home hero's ConceptMeta at the
 * review wave (2026-09-14): every exploration board ends in "Rule on", the
 * exact choices Will makes, worded so a ruling is a few words ("ramp B, accent
 * yes at 252, panel at one token"). The Orchestrator quotes these lines in
 * docs/tracks/orchestrator.md under "Waiting on Will".
 */
export type BoardMetaProps = {
  /** The one question the board asks. */
  question: string;
  /** Each candidate in one line: what it is and why it might win. */
  candidates?: { name: string; rationale: string }[];
  /** The choices Will makes, one per line. */
  asks: string[];
  /** Departures from the bible or a standing ruling, flagged rather than buried. */
  departures?: string[];
  /** Assets requested from Will (mirrored in the manifest's Handoff). */
  assets?: string[];
};

export function BoardMeta({
  question,
  candidates = [],
  asks,
  departures = [],
  assets = [],
}: BoardMetaProps) {
  const rows: [string, string[]][] = [
    ["The question", [question]],
    [
      "Candidates",
      candidates.length
        ? candidates.map((c) => `${c.name}: ${c.rationale}`)
        : ["not yet on the board"],
    ],
    ["Rule on", asks.length ? asks : ["nothing yet"]],
    ["Departures", departures.length ? departures : ["none"]],
    ["Assets requested", assets.length ? assets : ["none"]],
  ];
  return (
    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
      {rows.map(([label, lines]) => (
        <div key={label} className="contents">
          <dt className="text-[11px] font-medium text-foreground">{label}</dt>
          <dd className="space-y-0.5">
            {lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
