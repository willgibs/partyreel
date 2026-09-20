import type { JobHealth } from "@/app/admin/jobs/catalog";
import type { TableTone } from "@/components/ui/table";

/**
 * HOW FAR A STATE'S COLOUR TRAVELS, in one module (`colour=rows`, Will
 * 2026-09-20, with his note: "Makes it a bit harder to miss").
 *
 * The portal had exactly two state colours: the shipped `--destructive` red,
 * which /admin/jobs gave to "Overdue" and "Last run failed", and grey for
 * everything else — so healthy, paused, running and never-run all spoke with
 * one voice. His answer opens three more AND lets the strongest of them reach
 * the row. Both halves live here so a chip and the row under it can never
 * disagree about what a state is.
 *
 * ★ A ROW IS TINTED ONLY WHERE THE TINT EARNS ITS KEEP. Four tones in a chip is
 * a vocabulary; four tinted rows is a spreadsheet with a highlighter through
 * it, and the thing you are scrolling for stops standing out. So `rowTone`
 * answers for a FAILURE and an OVERDUE run and nothing else: green on every
 * healthy row would hide the one red among forty.
 */

export type BadgeTone =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info";

/** Every job health, as the chip that says it. */
export const HEALTH_BADGE: Record<JobHealth, BadgeTone> = {
  ok: "success",
  // Blue: the board's fourth colour, and the one state that is neither good
  // nor bad but simply in progress.
  running: "info",
  // Paused stays achromatic on purpose: it is a decision an operator made, not
  // a state of the machine, and colouring it would make a switch look broken.
  paused: "outline",
  missed: "warning",
  attention: "warning",
  failed: "destructive",
  never: "outline",
};

/** Every job health, as the tint its row takes. Undefined = no tint at all. */
export const HEALTH_ROW: Partial<Record<JobHealth, TableTone>> = {
  failed: "destructive",
  missed: "warning",
};

/** A single heartbeat run's outcome, as the chip that says it. */
export const RUN_BADGE: Record<string, BadgeTone> = {
  running: "info",
  ok: "success",
  error: "destructive",
  skipped: "outline",
};

/** A single heartbeat run's outcome, as the tint its row takes. */
export const RUN_ROW: Record<string, TableTone | undefined> = {
  running: undefined,
  ok: undefined,
  error: "destructive",
  skipped: undefined,
};

export function healthBadge(health: JobHealth): BadgeTone {
  return HEALTH_BADGE[health];
}

export function healthRow(health: JobHealth): TableTone | undefined {
  return HEALTH_ROW[health];
}

export function runBadge(status: string): BadgeTone {
  return RUN_BADGE[status] ?? "outline";
}

export function runRow(status: string): TableTone | undefined {
  return RUN_ROW[status];
}
