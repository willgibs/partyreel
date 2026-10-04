/**
 * A DEVELOP TIME IS SAVED ONLY WHEN IT IS PLAINLY MEANT (crumbs-60, the date field's twin).
 *
 * ★ A SAVE OF A TIME AT OR BEFORE THE DATABASE'S NOW IS DEVELOP NOW, and nothing takes it back: `events_reveal_stamp`
 * stores a develop time under a minute ahead of its own clock as its own now, and `events_develops_rewrite` opens every
 * sealed row in that same save. So the field's save of a time she typed is a develop whenever the time is not ahead, and a
 * year left half typed is such a time (Chrome types 2027 into a year as 0002, 0020, 0202 on the way, each a whole date, so
 * a field left at 0202 developed the album for every guest, measured on Chrome 154). This judges what she finished, once,
 * and answers one of four things:
 *   - `same`: the time the field already held (a field left as it was, or put back to what it was).
 *   - `refuse`: not a time that can be saved, said in words under the field: blank or half filled, a year outside the
 *     window a day may name (`isSaneDay`, the date field's own rule, read and never forked), beyond what a develop may
 *     reach (`developTimeWithinReach`), or already past on an album that has developed.
 *   - `ask`: a time the database would store as now, on an album that still waits: Develop now's own question, which is
 *     the only way such a time is written (and what it writes is now, never the time she typed).
 *   - `save`: finished, plainly meant and ahead.
 *
 * Pure and node-safe, like `lib/disposable/reveal.ts` it reads.
 */
import { developState, developTimeWithinReach } from "@/lib/disposable/reveal";
import { isSaneDay } from "@/lib/events/dates";
import { DATE_OUT_OF_RANGE } from "@/lib/validation/event";

/**
 * HOW CLOSE TO THE DATABASE'S NOW A DEVELOP TIME IS STORED AS ITS OWN NOW, in ms: `events_reveal_stamp` writes `now()` for
 * a `develops_at` under `now() + interval '1 minute'` (before it, or within the minute), which is Develop now. Mirrored by
 * the SQL and pinned to it in `camera-settings-develop-time.test.ts`.
 */
export const DEVELOPS_NOW_WITHIN_MS = 60_000;

/** Develop now's own question, word for word the hub's (`event-hub-head-cover.tsx`, pinned in the tests). */
export const DEVELOP_NOW_QUESTION =
  "Every photo added so far shows now, to every guest. New ones show straight away.";

/** A blank field, or one with a segment cleared and not typed again: either reads empty, and neither is a time. */
export const TIME_UNFINISHED = "Finish the time, or pick another.";
/** Past what a develop may reach (`DEVELOP_MAX_AHEAD_DAYS`), or a time no calendar holds. */
export const TIME_OUT_OF_REACH = "Pick a time within a year.";
/** A past time on an album that has developed: nothing waits there, so Develop now would show nothing new. */
export const TIME_HAS_PASSED = "That time has passed. Pick one ahead.";

export type DevelopTimeVerdict =
  | { kind: "same" }
  | { kind: "refuse"; words: string }
  | { kind: "ask" }
  | { kind: "save"; iso: string };

export function judgeDevelopTime(input: {
  /** What the field holds: `YYYY-MM-DDTHH:mm` in her own zone, or "" when it is blank or half filled. */
  typed: string;
  /** The saved time as the field shows it (`""` before there is one). */
  shown: string;
  /** The saved develop time (ISO): whether the album still waits decides what a past time means. */
  developsAt: string | null;
  nowMs: number;
}): DevelopTimeVerdict {
  const { typed, shown, developsAt, nowMs } = input;
  if (typed === shown) return { kind: "same" };
  if (!typed) return { kind: "refuse", words: TIME_UNFINISHED };

  // The day first, and by the date field's own window: a year typed half way (0202) is a real time to a Date, and a
  // past one, which is exactly what must never be asked about as if she meant it.
  const [day] = typed.split("T");
  if (!isSaneDay(day)) return { kind: "refuse", words: DATE_OUT_OF_RANGE };

  const at = new Date(typed);
  if (!Number.isFinite(at.getTime())) {
    return { kind: "refuse", words: TIME_OUT_OF_REACH };
  }
  const iso = at.toISOString();
  if (!developTimeWithinReach(iso, nowMs)) {
    return { kind: "refuse", words: TIME_OUT_OF_REACH };
  }
  if (at.getTime() < nowMs + DEVELOPS_NOW_WITHIN_MS) {
    return developState(developsAt, nowMs).kind === "waiting"
      ? { kind: "ask" }
      : { kind: "refuse", words: TIME_HAS_PASSED };
  }
  return { kind: "save", iso };
}
