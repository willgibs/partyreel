/**
 * THE CAMERA'S ROLL: how many shots a guest holds at once, and how many she may take, counted by the server.
 *
 * ★ ONE HOME, MIRRORED IN SQL (20261002200000, 20261005190000), under parity tests that read the winning bodies
 * (`roll.test.ts`):
 *  - `ROLL_SHOTS`: the roll a camera carries unless its host names another (`events_reveal_stamp` fills it in);
 *  - `ROLL_MIN` and `ROLL_MAX`: the sizes a host may name, two digits on the camera's count (customize r1, Will's
 *    `roll=both`: film's 12, 24 and 36, or any count from 1 to 99; `events_roll_size_range` bounds it);
 *  - `ROLL_RETAKES`: the ceiling's multiple (`c_roll_retakes` in `create_media` and both upload reads).
 * Change each side together.
 *
 * ★ HER ROLL OUTLIVES THE CAMERA (20261005190000): the row keeps the size she named while the album takes free
 * uploads, so a style switch, or the camera turned off and on, comes back to her roll and never to 24. A free-upload
 * album's `roll_size` is therefore no sign of a camera: every reader asks `capture` first (`developFactsOf`, the SQL's
 * `v_event.capture = 'camera'`), and only Settings reads the kept size (`rollSizeOf`).
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

/** The fewest shots a host may name: a roll of one, the whole night in a single frame. */
export const ROLL_MIN = 1;

/** The most a host may name: two digits on the camera's count (`events_roll_size_range`'s upper bound). */
export const ROLL_MAX = 99;

/** Film's three sizes, the scale every disposable and every roll of 35 mm was sold in: the boxes a host picks from. */
export const FILM_ROLLS = [12, 24, 36] as const;

/** Whether a value is a roll a host may name: a whole number of shots from `ROLL_MIN` to `ROLL_MAX`. */
export function isRollSize(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= ROLL_MIN &&
    value <= ROLL_MAX
  );
}

/** A count brought inside the bounds, whole: what a stepper lands on, whatever it was handed. */
export function clampRoll(n: number): number {
  if (!Number.isFinite(n)) return ROLL_SHOTS;
  return Math.min(ROLL_MAX, Math.max(ROLL_MIN, Math.round(n)));
}

/** The size a row names, or null where it names none this code can read (a free-upload album that never had one). */
export function rollSizeOf(value: unknown): number | null {
  return isRollSize(value) ? value : null;
}

/** "12 shots", "1 shot": a roll as a sentence and a box say it. */
export function rollShots(n: number): string {
  return `${n} ${n === 1 ? "shot" : "shots"}`;
}

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
