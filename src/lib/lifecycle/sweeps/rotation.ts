/**
 * THE ROTATING LOOP for the sweeps that EXAMINE accounts rather than delete them (the pass recompute,
 * renewal nudges, over-capacity): their candidates are read whole, then taken in id order starting
 * after the cursor the last run stopped at (`rotateAfter`), each isolated (`forEachIsolated`), until
 * the deadline. Such a sweep changes nothing about most of its candidates, so without the rotation a
 * list longer than one night's budget would be re-read from the same head every night and its tail
 * never reached.
 *
 * The cursor it hands back is the id of the last candidate it attempted, stored on the run row under
 * `RESUME_KEY` (`src/lib/jobs/sweep-tally.ts`) and read back by the next run; null once every
 * candidate has had its turn this run (the next run starts again from the lowest id).
 */
import {
  forEachIsolated,
  type IsolateOptions,
  type IsolatedTally,
} from "@/lib/jobs/isolate";
import { RESUME_KEY } from "@/lib/jobs/sweep-tally";
import { rotateAfter, type Deadline } from "@/lib/lifecycle/sweep-budget";

export type Rotation = {
  tally: IsolatedTally;
  /** Where the next run starts (after this id), or null when the whole list was attempted. */
  resumeAfter: string | null;
};

export async function forEachInRotation<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
  resumeAfter: string | null,
  deadline: Deadline,
  body: (row: T) => Promise<void>,
  onError: IsolateOptions<T>["onError"],
): Promise<Rotation> {
  const queue = rotateAfter(rows, resumeAfter, keyOf);
  const tally = await forEachIsolated(queue, body, {
    onError,
    stopWhen: () => deadline.passed(),
  });
  if (tally.unreached === 0 && tally.skipped === 0) {
    return { tally, resumeAfter: null };
  }
  const attempted = tally.processed + tally.failed;
  // Stopped before its first candidate: keep the old cursor, so no time at all never resets the turn.
  return {
    tally,
    resumeAfter: attempted > 0 ? keyOf(queue[attempted - 1]) : resumeAfter,
  };
}

/** The cursor as the run row stores it (`RESUME_KEY`), or nothing once the turn is complete. */
export function resumeFields(resumeAfter: string | null): {
  [RESUME_KEY]?: string;
} {
  return resumeAfter ? { [RESUME_KEY]: resumeAfter } : {};
}
