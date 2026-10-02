/**
 * THE CAMERA'S ROLL: how many shots a guest holds at once, and how many she may take, counted by the server.
 *
 * ★ ONE HOME, MIRRORED IN SQL (20261002200000), under parity tests that read the winning bodies (`roll.test.ts`):
 *  - `ROLL_SHOTS`: the roll a camera carries unless its host names fewer, and the most she may name
 *    (`events_reveal_stamp` fills it in, `events_roll_size_range` bounds it);
 *  - `ROLL_RETAKES`: the ceiling's multiple (`c_roll_retakes` in `create_media` and both upload reads).
 * Change each side together.
 *
 * What counts against the roll is her LIVE shots since the period began (`events.sealed_from`): held, approved or
 * hidden (a host's hide keeps the frame taken). One she withdraws, or the host removes, gives its frame back (Will,
 * 2026-10-02: "removing a dispo shot should free a shot slot to take another. Much better UX to ultimately leave your
 * best media collection, dropping the worst along the way"). The churn that opens is bounded twice: the ceiling counts
 * every shot she takes in the period, removed or not, in its own ledger (`camera_rolls`, which the nightly purge of a
 * withdrawn shot leaves standing), and a withdrawn shot is purged that night. A video is one shot (Will, `cost=one`).
 * The host's own uploads are no roll's.
 */
export const ROLL_SHOTS = 24;

/** The ceiling's multiple: a guest takes at most `ROLL_RETAKES` rolls' worth in a period, removed or not. */
export const ROLL_RETAKES = 3;

/** The sentence the shot past the roll meets: the server's own words (create_media raises it; mapCheckViolation reads "roll"). */
export function rollSpentMessage(size: number): string {
  return `You've taken all ${size} shots on your roll.`;
}

/** The sentence the shot past the ceiling meets: the server's own words, as create_media raises them. */
export const ROLL_RETAKES_SPENT_MESSAGE =
  "You've used every retake this roll allows.";

/**
 * The server's roll sentence, when `message` is one of its two (the shot past the roll, at any size, or past the
 * ceiling), else null. The refusal travels as raised, since its number is the album's own roll.
 */
export function rollRefusalSentence(message: string): string | null {
  if (message === ROLL_RETAKES_SPENT_MESSAGE) return message;
  return /^You've taken all \d{1,3} shots on your roll\.$/.test(message)
    ? message
    : null;
}

/** Her roll as an upload read answers it: her live shots of the roll's size, and every shot taken of the ceiling. */
export type RollCount = {
  used: number;
  cap: number;
  taken: number;
  ceiling: number;
};

function whole(value: unknown, min: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= min
    ? value
    : null;
}

/** `roll` off an upload read's jsonb, or null (free uploads, or an answer this code cannot read). */
export function parseRollCount(json: unknown): RollCount | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const used = whole(o.used, 0);
  const cap = whole(o.cap, 1);
  const taken = whole(o.taken, 0);
  const ceiling = whole(o.ceiling, 1);
  if (used === null || cap === null || taken === null || ceiling === null) {
    return null;
  }
  return { used, cap, taken, ceiling };
}

/** The sentence the next shot would meet, or null where the roll has a frame (or there is no roll). The roll first. */
export function rollRefusal(roll: RollCount | null): string | null {
  if (!roll) return null;
  if (roll.used >= roll.cap) return rollSpentMessage(roll.cap);
  if (roll.taken >= roll.ceiling) return ROLL_RETAKES_SPENT_MESSAGE;
  return null;
}

/** Whether the roll has a frame left for her next shot. */
export function rollHasFrame(roll: RollCount | null): boolean {
  return rollRefusal(roll) === null;
}
