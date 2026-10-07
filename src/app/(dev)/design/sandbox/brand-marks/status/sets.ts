/**
 * THE STATUS SETS ON THE TABLE, AS TOKENS AND ONE ATOM'S POINT: a state is a
 * point and its word (brand r1, settled), so a set is three colours per
 * ground and the Badge's point, and production's `Badge` wears it whole
 * through the frame's paste.
 *
 * ★ GIVEN IN EVERY SET, NEVER ASKED: a count that needs her is the tally
 * (event-header r6), the camera's red the palette holds, solid, its count in
 * white on it (`--needs`, the name the event-header wiring lands it under);
 * Standby is half-lit in the ground's own ink with no hue; and no point ever
 * glows, since the glow is the light's (production's Badge lights its LED
 * with a glow today, which every set takes away).
 *
 * ★ THE BADGE'S VARIANTS FOLD INTO THE SET (the fix at its source): `success`
 * is Ready, `destructive` is Fault, and the hues production lit for waiting
 * (`info`'s blue for sending, `warning`'s amber for paused) and its unlit
 * rings (`secondary`, `outline`) are all Standby; `live` is the tally's red,
 * the one point that breathes (the board's carried call).
 */

export type StatusSetId = "pilot" | "ink" | "amber";

export type Pair = { readonly paper: string; readonly room: string };

export type StatusSet = {
  readonly id: StatusSetId;
  readonly ready: Pair;
  readonly fault: Pair;
};

/** The ground's own ink: Standby, and Ready where it has no hue. */
export const INK: Pair = {
  paper: "oklch(0.14 0.004 286)",
  room: "oklch(0.97 0.002 286)",
};

/** The tally, given: a fill a white count reads on, on both grounds. */
export const NEEDS: Pair = {
  paper: "oklch(0.56 0.21 27)",
  room: "oklch(0.585 0.2 26)",
};

const GREEN: Pair = {
  paper: "oklch(0.6 0.16 150)",
  room: "oklch(0.72 0.17 150)",
};

const RED: Pair = {
  paper: "oklch(0.56 0.21 27)",
  room: "oklch(0.68 0.2 24)",
};

/** An amber deep enough to stand as a point on white (3:1), bright in the room. */
const AMBER: Pair = {
  paper: "oklch(0.64 0.15 62)",
  room: "oklch(0.82 0.15 78)",
};

export const STATUS_SETS: Record<StatusSetId, StatusSet> = {
  pilot: { id: "pilot", ready: GREEN, fault: RED },
  ink: { id: "ink", ready: INK, fault: RED },
  amber: { id: "amber", ready: GREEN, fault: AMBER },
};

export const statusSetOf = (v: unknown): StatusSetId =>
  v === "pilot" || v === "amber" ? v : "ink";

/**
 * THE PASTE: the set's tokens on each ground, and production's Badge drawn
 * to it: its point solid and hard-edged (no glow), Standby half-lit, each
 * variant folded into its state. `--needs` rides along for the tally the
 * board draws beside it.
 */
export function statusPaste(set: StatusSet): string {
  // ★ READY IS PRODUCTION'S SUCCESS AT ITS SOURCE: the meter's fill, the
  // checks and the toasts' lit glyph all read `--success`, so the set's Ready
  // is that token, its words' colour with it.
  const ground = (g: keyof Pair) =>
    `--status-standby: ${INK[g]}; --status-ready: ${set.ready[g]}; --status-fault: ${set.fault[g]}; --needs: ${NEEDS[g]}; --success: ${set.ready[g]}; --success-foreground: ${g === "paper" ? "oklch(0.99 0 0)" : "oklch(0.13 0 0)"};`;
  const badge = '[data-slot="badge"]';
  return [
    `:root, .surface-paper { ${ground("paper")} }`,
    `.dark, .surface-ink, .surface-display { ${ground("room")} }`,
    `${badge}::before { box-shadow: none !important; width: 7px; height: 7px; }`,
    `${badge}[data-variant="success"] { --dot: var(--status-ready); }`,
    `${badge}[data-variant="destructive"] { --dot: var(--status-fault); }`,
    `${badge}[data-variant="live"] { --dot: var(--needs); }`,
    `${badge}:is([data-variant="info"], [data-variant="warning"], [data-variant="secondary"], [data-variant="outline"], [data-variant="ghost"]) { --dot: var(--status-standby); }`,
    `${badge}:is([data-variant="info"], [data-variant="warning"], [data-variant="secondary"], [data-variant="outline"], [data-variant="ghost"])::before { background: linear-gradient(90deg, var(--dot) 50%, transparent 50%) !important; box-shadow: inset 0 0 0 1.5px var(--dot) !important; }`,
    // The dashboard card's waiting count: the tally, given (its amber retires with the event-header wiring).
    `[data-media-tile] > div[style*="--warning"] { background: var(--needs) !important; color: oklch(1 0 0) !important; }`,
  ].join("\n");
}
