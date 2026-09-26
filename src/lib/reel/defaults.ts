/**
 * THE REEL'S EVENT-WIDE DEFAULTS: THE HOLD'S STEPS, AND WHAT A HOST MAY SET.
 *
 * Will, reel-host `style=both` (2026-09-25): a host sets the look and the hold every viewer STARTS
 * on, from the view ("Set for everyone") and from Settings' Highlight reel section. Each viewer can
 * still change either on their own device, and that choice never travels. The event keeps the
 * defaults in three columns, NULL meaning the product's own: `show_reel` (on), `reel_style_id` (the
 * default mood) and `reel_hold_sec` (`DEFAULT_HOLD_SEC`).
 *
 * This module is the one home of the hold's steps and of the pure checks the write path runs:
 * `validation/event.ts` builds its schema on them and `defaults-action.ts` is the one write. Pure:
 * no DOM, no React, no Supabase, so a client control and the server read the same steps.
 *
 * ★ THE STEPS LIVE HERE; THE DATABASE HOLDS ONLY AN ENVELOPE. `events_reel_hold_sec_range` refuses a
 * flicker, a stall, NaN and Infinity (0.5 to 30 s) and nothing finer, so a new step needs no
 * migration, only a place inside the envelope, which `defaults.test.ts` reads off the migration.
 */
import { STYLE_CATALOG } from "@/lib/reel/engine/style-registry";

/**
 * The Hold control's steps, in seconds: brisk holds for a phone in the hand (1, 1.5 and 2.2) and
 * calmer ones for a wall (3.6, 5 and 7), with the 3 s default among them.
 */
export const HOLD_STEPS_SEC = [1, 1.5, 2.2, 3, 3.6, 5, 7] as const;
export const DEFAULT_HOLD_SEC = 3;

/**
 * The looks a host may make the default: the eight MOODS, in the catalog's order. The live reel
 * plays moods only (a treatment id falls back to the default mood on every device), so a treatment
 * saved here would be a default nobody ever sees.
 */
export const REEL_MOOD_IDS: readonly string[] = STYLE_CATALOG.filter(
  (entry) => entry.kind === "mood",
).map((entry) => entry.id);

/** Is this a look a host may set for everyone? */
export function isReelMoodId(value: unknown): value is string {
  return typeof value === "string" && REEL_MOOD_IDS.includes(value);
}

/** Is this exactly one of the hold's steps? A near miss (2.5) is refused, never rounded. */
export function isHoldStep(value: unknown): value is number {
  return (
    typeof value === "number" &&
    (HOLD_STEPS_SEC as readonly number[]).includes(value)
  );
}

/** The step a stored or odd value belongs to (a future step list never strands an old choice). */
export function nearestHoldStep(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_HOLD_SEC;
  let best: number = HOLD_STEPS_SEC[0];
  for (const step of HOLD_STEPS_SEC) {
    if (Math.abs(step - seconds) < Math.abs(best - seconds)) best = step;
  }
  return best;
}

/**
 * The hold an event starts every viewer on: the host's stored step, or the default.
 *
 * ★ NULL IS THE DEFAULT, NEVER ZERO SECONDS. `reel_hold_sec` is NULL until a host sets it, yet the
 * generated type of `get_event_by_qr_token`'s RETURNS TABLE reads it as a plain `number` (PostgREST
 * types every such column non-null, `reel_style_id` too). So this takes the nullable value the
 * column really holds: `nearestHoldStep(Number(null))` would answer the 1 s step.
 */
export function resolveHoldSec(stored: number | null | undefined): number {
  return typeof stored === "number"
    ? nearestHoldStep(stored)
    : DEFAULT_HOLD_SEC;
}
