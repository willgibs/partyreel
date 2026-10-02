/**
 * ONE EXPORT'S OUTCOME, AS THE PORTAL SAYS IT (`export-ends`; ROADMAP: "/admin/exports counts mints only").
 *
 * A row once said "Downloaded" the moment the app signed a token, whatever happened next. Now it says the
 * furthest thing anyone saw: the mint's own refusal, or for a mint, the Worker's word (`export_log`'s
 * Worker columns, from `/api/export/report`): how the stream ended, that it is still going, what its check
 * found, or only that it started, where no word came (an older Worker, a laptop it cannot reach, a walk
 * left before its check). Pure, so the page and its test read the same words.
 */
import type { BadgeTone } from "@/lib/admin/tone";
import type { WorkerWord } from "@/lib/db/queries/exports";
import { formatCount } from "@/lib/format/count";

import type { TableTone } from "@/components/ui/table";

/** The mint's own refusals (the mint route's vocabulary). */
const REFUSED: Record<string, string> = {
  rejected_mode: "Paused",
  rejected_cap: "Too large",
  rejected_empty: "Empty",
  rate_limited: "Rate limited",
};

export type OutcomeWord = {
  label: string;
  badge: BadgeTone;
  /** The row's tint: only where something went wrong, so the one to look at stands out. */
  row?: TableTone;
};

export function outcomeWord(row: {
  outcome: string;
  itemCount: number;
  worker: WorkerWord;
}): OutcomeWord {
  if (row.outcome !== "minted") {
    return {
      label: REFUSED[row.outcome] ?? row.outcome,
      badge: "warning",
      row: "warning",
    };
  }
  const w = row.worker;
  const of = (n: number) =>
    `${formatCount(n)} of ${formatCount(row.itemCount)}`;
  switch (w.streamOutcome) {
    case "saved":
      return { label: "Saved", badge: "success" };
    case "short":
      return {
        label: `Short, ${formatCount(w.streamMissing.length)} gone`,
        badge: "warning",
        row: "warning",
      };
    case "stopped":
      return {
        label: `Stopped at ${of(w.streamFiles ?? 0)}`,
        badge: "warning",
      };
    case "failed":
      return {
        label: `Failed at ${of(w.streamFiles ?? 0)}`,
        badge: "destructive",
        row: "destructive",
      };
    case "empty":
      return { label: "Nothing left", badge: "warning", row: "warning" };
  }
  if (w.streamStartedAt) return { label: "Downloading", badge: "info" };
  if (w.checkedAt) {
    if (w.checkFound === null) {
      return {
        label: "Check failed",
        badge: "destructive",
        row: "destructive",
      };
    }
    if (w.checkFound === 0) {
      return { label: "Nothing left", badge: "warning", row: "warning" };
    }
    if (w.checkFound < row.itemCount) {
      return {
        label: `Checked, ${of(w.checkFound)}`,
        badge: "warning",
        row: "warning",
      };
    }
    return { label: "Checked", badge: "outline" };
  }
  return { label: "Started", badge: "outline" };
}
