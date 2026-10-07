/**
 * THE STATUS SETS ON THE TABLE, AS PRODUCTION'S OWN TOKENS AND ONE ATOM'S
 * POINT: a state is a point and its word (brand r1, settled), so a set is a
 * Ready and a Fault per ground and the Badge's point, and production's `Badge`
 * (with every other reader of those tokens) wears it whole through the
 * frame's paste. The paste uses production's names, so it is the wiring's own
 * diff in miniature: Ready lands as `--success`, Fault as `--destructive` (or
 * the amber set's new `--fault`), the tally as `--needs-you`, live as
 * `--signal`, and Standby needs no token at all: it is lit in its own word's
 * ink (`currentColor`, the Badge's `--foreground`).
 *
 * ★ GIVEN IN EVERY SET, NEVER ASKED: a count that needs her is the tally
 * (event-header r6), the camera's red the palette holds, solid, its count in
 * white on it, under the name and values the event-header wiring lands
 * (`--needs-you`, `--needs-you-foreground`; re-declared here only so the board
 * shows it before that wiring merges, and a no-op after). Standby is half-lit
 * in the ground's own ink with no hue; no point ever glows, since the glow is
 * the light's (production's Badge lights its LED with a glow today, which
 * every set takes away); live is the tally's red and the one point that
 * breathes. ★ As a point, that red is `--signal` on both grounds: the room's
 * tally fill steps deeper (0.585) only to carry its white figure, and a point
 * carries none, so it keeps the signal's lit 0.68 on near-black.
 *
 * ★ PRODUCTION'S BADGE VARIANTS FOLD BY WHAT THEIR CALL SITES SAY, not by
 * their hue: `info` is "in progress" (Drive's sending, a job running) and is
 * Standby; `success` is Ready; `destructive` is Fault, and so is `warning`,
 * since its words all wait on someone (Needs you, Lost access, At limit,
 * Tripped, N stuck, Drive's Paused); `live` is live. The unlit rings
 * (`secondary`, `outline`, `ghost`) stay unlit: production gives them labels
 * and an operator's own decisions (a tier, an audience, a job he paused,
 * `lib/admin/tone.ts`), which are no state at all, so Standby's half-lit point
 * must never be read off them.
 *
 * ★ THE POINT IS 8px, NOT PRODUCTION'S 7: in the Badge's 20px row an 8px
 * point sits on whole pixels at dpr 1 (7 straddles a half pixel and blurs),
 * it is the readout's cap height (12px Inter caps stand 8.7px), and Standby's
 * half-lit drawing needs the pixel: at 7px and dpr 1 its open half closes
 * into a blot. Measured on this board's own frames, 2026-10-06.
 */

export type StatusSetId = "pilot" | "ink" | "amber";

export type Pair = { readonly paper: string; readonly room: string };

export type StatusSet = {
  readonly id: StatusSetId;
  /** Ready's point per ground; it lands as production's `--success`. */
  readonly ready: Pair;
  /** Fault's point per ground, and the token it lands as. */
  readonly fault: Pair & { readonly token: "--destructive" | "--fault" };
};

/**
 * The ground's own ink, Ready's in the ink set. Read off the ground where the
 * point stands, so a slab, the display and the room each light it in their
 * own ink rather than a value typed for one of them.
 */
const INK: Pair = { paper: "var(--foreground)", room: "var(--foreground)" };

/**
 * A CAMERA'S GREEN (pilot and amber): production's `--success`, tuned a step
 * deeper and purer on paper (3.68:1 on the body, 3.43:1 on the mat, where
 * today's 0.6 stood at 3.16:1) and lit brighter in the room (9.6:1, from
 * today's minty 0.7), short of brand r2's 0.79, because the same token fills
 * the meter's twelve frames and a neon bar is paint.
 */
const GREEN: Pair = {
  paper: "oklch(0.58 0.165 148)",
  room: "oklch(0.74 0.17 148)",
};

/** Production's red, unchanged: `--destructive` per ground (and the display's own). */
const RED: StatusSet["fault"] = {
  token: "--destructive",
  paper: "oklch(0.56 0.21 27)",
  room: "oklch(0.68 0.2 24)",
};

/**
 * ★ AN AMBER THAT STANDS ON WHITE MUST TURN ORANGE. A point needs 3:1 on
 * paper, and an amber that dark is either mustard (the dull yellow Will
 * called out: production's `--warning` stands at 1.75:1, so it was never a
 * point) or, leaning its hue toward orange, a vivid burnt orange at the sRGB
 * edge: 3.24:1 on the body, 3.44:1 on a card, 3.02:1 on the mat. The room
 * keeps a true amber lamp (10:1), far more saturated than today's 0.84 0.14
 * 82. A token of its own (`--fault`), because `--warning` is also the fill a
 * dark word sits on (the code's corner, a notice) and the hide action's hue,
 * which this darker value would break.
 */
const AMBER: StatusSet["fault"] = {
  token: "--fault",
  paper: "oklch(0.64 0.15 60)",
  room: "oklch(0.78 0.165 68)",
};

export const STATUS_SETS: Record<StatusSetId, StatusSet> = {
  pilot: { id: "pilot", ready: GREEN, fault: RED },
  ink: { id: "ink", ready: INK, fault: RED },
  amber: { id: "amber", ready: GREEN, fault: AMBER },
};

export const statusSetOf = (v: unknown): StatusSetId =>
  v === "pilot" || v === "amber" ? v : "ink";

/** A check on a filled Ready disc: paper's white, the room's near-black (production's own pair). */
const ON_READY: Pair = { paper: "oklch(0.99 0 0)", room: "oklch(0.13 0 0)" };

/**
 * THE PASTE: the set's tokens on each ground, then every reader a paste can
 * reach, each drawn to the set.
 *
 * ★ WHAT IT REACHES: the Badge (its point 8px, solid and hard-edged, its
 * variants folded as above, live breathing); `--success` and so every reader
 * of Ready (the meter's fill, the checks, `bg-success` discs, the success
 * toast's glyph; in the ink set, chrome over a photograph reads it in white);
 * the toasts' error and info glyphs (and, in the amber set, the warning
 * glyph); a failed meter; the dashboard card's waiting count as the tally;
 * the dashboard's live dot (green with a ping today) as live; an album tile's
 * Drive light.
 *
 * ★ WHAT IT CANNOT REACH (a wiring's, named in the handoff): Drive's `paused`
 * tone holds both a send that waits on her (Drive full, disconnected) and one
 * that waits on Google (the daily limit), so the moments table must split it
 * before a light can say which; `toast.warning` holds the hide act beside
 * Drive's refusals, so in pilot and ink its glyph keeps production's amber
 * until those call sites move (the hide to a success, the refusals to an
 * error); the review counts drawn by hand in amber (the feed's Review head,
 * the events row, the dashboard stage's waiting mark) and marketing's green
 * live dots are their components' own; and approve's action hue is
 * `--success`, so in the ink set approve loses its green with Ready.
 */
export function statusPaste(set: StatusSet): string {
  const fault = `var(${set.fault.token})`;
  const ground = (g: keyof Pair) =>
    [
      `--success: ${set.ready[g]};`,
      `--success-foreground: ${ON_READY[g]};`,
      set.fault.token === "--fault" ? `--fault: ${set.fault[g]};` : "",
    ].join(" ");
  const badge = '[data-slot="badge"]';
  const lit = [
    "default",
    "success",
    "destructive",
    "warning",
    "info",
    "live",
  ].map((v) => `[data-variant="${v}"]`);
  const toast = "[data-sonner-toaster] [data-sonner-toast]";
  return [
    // The tally, given: the event-header wiring's own two lines.
    `:root, .surface-paper { --needs-you: var(--signal); --needs-you-foreground: oklch(1 0 0); }`,
    `.dark { --needs-you: oklch(0.585 0.2 26); --needs-you-foreground: oklch(1 0 0); }`,
    // The set, per ground: a dark slab and the display read the room's lights.
    `:root, .surface-paper { ${ground("paper")} }`,
    `.dark, .surface-ink, .surface-display { ${ground("room")} }`,
    // ★ IN INK, CHROME OVER A PHOTOGRAPH READS READY IN THE PHOTOGRAPH'S WHITE:
    // a tile's kept approve, the selection's check and the review verdict sit
    // on glass in both themes, where paper's near-black ink would vanish.
    set.id === "ink"
      ? `[data-media-tile], [data-surface="photo"], .glass { --success: oklch(1 0 0); --success-foreground: oklch(0.13 0 0); }`
      : "",
    // The point: 8px, solid, hard-edged; no lit variant glows.
    `${badge}::before { width: 8px; height: 8px; }`,
    `${badge}:is(${lit.join(", ")})::before { box-shadow: none; }`,
    `${badge}:is([data-variant="destructive"], [data-variant="warning"], [aria-invalid="true"]) { --dot: ${fault}; }`,
    // Standby: the left half lit in its word's own ink, a 1px ring round the rest.
    `${badge}[data-variant="info"] { --dot: currentColor; }`,
    `${badge}[data-variant="info"]::before { background: linear-gradient(90deg, var(--dot) 50%, transparent 50%); box-shadow: inset 0 0 0 1px var(--dot); }`,
    // ★ LIVE BREATHES AS A POINT, NEVER AS A RING OF LIGHT: production's own
    // keyframe redrawn (the Badge's `animate-live-signal` keeps running it),
    // the point dimming to half and back. Reduced motion stands it lit.
    `@keyframes live-signal { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }`,
    `${badge}[data-variant="live"]::before { animation: live-signal 2s ease-in-out infinite; }`,
    // The toasts' lit glyphs: Ready follows `--success` already.
    `${toast}[data-type="error"] [data-icon] { color: ${fault}; }`,
    `${toast}[data-type="info"] [data-icon] { color: var(--foreground); }`,
    set.fault.token === "--fault"
      ? `${toast}[data-type="warning"] [data-icon] { color: ${fault}; }`
      : "",
    // A meter that failed fills in the Fault.
    `[data-slot="progress"][aria-invalid="true"] > [data-slot="progress-indicator"] { background-color: ${fault}; }`,
    // The dashboard card's waiting count: the tally (inline amber today, so !important).
    `[data-media-tile] > div[style*="--warning"] { background: var(--needs-you) !important; color: var(--needs-you-foreground) !important; }`,
    // The dashboard's live dot: live's red, breathing, its ping gone.
    `[data-live-dot] > span:first-child { display: none; }`,
    `[data-live-dot] > span:last-child { background-color: var(--signal); animation: live-signal 2s ease-in-out infinite; }`,
    // An album tile's Drive light: Standby in the glass's own white (its
    // currentColor), Ready and Fault as everywhere (ink's Ready is white on glass, above).
    `[data-drive-tile] > span[aria-hidden] { width: 8px; height: 8px; }`,
    `[data-drive-tile="sending"] > span[aria-hidden] { background: linear-gradient(90deg, currentColor 50%, transparent 50%); box-shadow: inset 0 0 0 1px currentColor; }`,
    `[data-drive-tile="paused"] > span[aria-hidden] { background: ${fault}; }`,
    `[data-drive-tile="done"] > span[aria-hidden] { background: var(--success); }`,
  ]
    .filter(Boolean)
    .join("\n");
}
