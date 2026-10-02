/**
 * THE DEVELOP SWEEP (the develop, `20261002200000_disposable_foundation.sql`): each night, every album whose sealed
 * rows disagree with its event's answer (a develop time passed with nobody reading, a straggler nobody read after)
 * develops through `develop_due_sweep`, which runs `develop_due` album by album in event-id order, each ringing its
 * album once. The album's own first read after its develop time does this in the day (the sync route and the page's
 * seed, `lib/disposable/develop.server.ts`); this is the backstop, so an album nobody opens still converges, and its
 * versions, its doorbell and every count agree with the time that passed.
 *
 * WHOLE AND BUDGETED (lifecycle-recovery.md, "The daily purge cron"): one call takes at most `DEVELOP_BATCH` albums and
 * the deadline is asked before each call, never inside one. It drains rather than examines (an album it developed no
 * longer disagrees), so it needs no cursor: a run the deadline stops says how many albums it left, and the next night
 * takes them first.
 *
 * Its own job (`develop_rolls`: a run row, a switch and a card, admin-observability.md): it reveals photographs, so an
 * operator can stop it alone without giving up the night's reclamation.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustCount, QueryFailedError } from "@/lib/db/must-query";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";

/** The albums one call develops. Fifty is a few hundred rows of updates at most, one transaction; the deadline is asked often. */
export const DEVELOP_BATCH = 50;

export type DevelopTally = {
  /** Albums developed this run. */
  events: number;
  /** Sealed rows brought to their event's answer. */
  developed: number;
} & Partial<StoppedEarly>;

/** What one call of `develop_due_sweep` answers. */
type SweepAnswer = { events: number; developed: number; more: boolean };

/** The function's jsonb, read defensively: an answer this code does not know fails the run, never reads as a quiet night. */
export function parseDevelopAnswer(data: unknown): SweepAnswer {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new TypeError("develop_due_sweep: not an object");
  }
  const o = data as Record<string, unknown>;
  const count = (key: string) => {
    const value = o[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      throw new TypeError(`develop_due_sweep: ${key} is not a count`);
    }
    return value;
  };
  if (typeof o.more !== "boolean") {
    throw new TypeError("develop_due_sweep: more is not a boolean");
  }
  return {
    events: count("events"),
    developed: count("developed"),
    more: o.more,
  };
}

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `develop_due_sweep` and `media.sealed_until` arrive with migration
 * 20261002200000, so the calls that name them go through this untyped client (drop the cast then).
 */
function untyped(admin: AdminClient): SupabaseClient {
  return admin as unknown as SupabaseClient;
}

async function developBatch(
  admin: AdminClient,
  limit: number,
): Promise<SweepAnswer> {
  const { data, error } = await untyped(admin).rpc("develop_due_sweep", {
    p_limit: limit,
  });
  if (error) {
    throw new QueryFailedError("cron/purge: develop_due_sweep", error);
  }
  return parseDevelopAnswer(data);
}

/** The albums still holding a sealed row past its time when the deadline stopped the run: the backlog's floor. */
async function countLeft(admin: AdminClient): Promise<number> {
  return mustCount(
    untyped(admin)
      .from("media")
      .select("event_id", { count: "exact", head: true })
      .not("sealed_until", "is", null)
      .lte("sealed_until", new Date().toISOString()),
    "cron/purge: sealed shots past their time",
  );
}

export async function sweepDevelop(
  admin: AdminClient,
  opts: {
    deadline?: Deadline;
    /** Albums a call takes; a test shrinks it. */
    batch?: number;
  } = {},
): Promise<DevelopTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const batch = opts.batch ?? DEVELOP_BATCH;
  const tally = { events: 0, developed: 0 };
  for (;;) {
    if (deadline.passed()) {
      // The shots past their time, not the albums (the count a head read can make): what tomorrow's run starts on.
      return { ...tally, ...stoppedEarly(await countLeft(admin)) };
    }
    const answer = await developBatch(admin, batch);
    tally.events += answer.events;
    tally.developed += answer.developed;
    // A batch that took nothing while more remain would spin: the remainder disagrees in a way develop_due cannot
    // move (it never should), so the run stops and says so rather than looping to its deadline.
    if (!answer.more || answer.events === 0) return tally;
  }
}
