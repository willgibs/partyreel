// The prune's memory between runs (durability-backups.md, "The deletion-aware prune"): where the last run stopped in
// the backup's listing, what the last runs found gone, and a hold. PURE: the Durable Object that stores it
// (prune-state.ts) is a get and a put; every decision about what the ledger says lives here, under test.
//
// WHY A LEDGER AT ALL: a run that starts at the head of the listing every week never examines anything past what
// one run can reach, so once the backup outgrows a run, its tail keeps every deleted byte for good (PRICING.md,
// "The backup"). The cursor makes each run carry on where the last one stopped, and a pass that reaches the end
// starts again at the head.
//
// WHY A HOLD: the volume clamp used to be 500 media a run, which bounded a disaster (rows and objects deleted
// together by a bug or a stolen key, so both existence checks agree) but also bounded honest churn far below what a
// single heavy host deletes. Any FIXED number does one or the other. So the clamp is sized to the deletions
// themselves: a run that finds more gone than ten times the usual (the median of the last runs, never under a
// party's worth) deletes NOTHING and reads "Needs a look" on /admin/jobs, with a Sentry warning and the ops mail.
// ★ A HOLD NEVER RELEASES ITSELF (the Advisor's Q20): a backlog that may be a disaster waits for a person, however
// long, because a clock that lets it through deletes the last copy of whatever nobody looked at. The person's act is
// Release the hold on the prune's card, a stamp the job heartbeat's start answer carries (`releasedAtMs`); the pause
// switch stays the brake. Honest growth moves the median; one big clear-out costs Infrequent Access storage until
// someone presses the release, and nothing else.

/** A run's verdict on its backlog, recorded so the next runs know what usual looks like. */
export type PruneRunRecord = {
  /** When the run started (epoch ms). */
  atMs: number;
  /** Media the run confirmed gone (row gone, primary absent, past the age gate): what it deleted or would have. */
  goneMedia: number;
  /** Whether it was a live run; dry runs count toward the usual too, so the launch switch starts with one. */
  live: boolean;
};

/** A live run's held backlog: deletes nothing until an operator's release stamped after `sinceMs`. */
export type PruneHold = { sinceMs: number; goneMedia: number };

export type PruneLedger = {
  v: 1;
  /**
   * The backup listing's position: the next run lists after this key. Null is the head: the first run, and every
   * run after a pass that reached the end of the listing.
   */
  cursor: string | null;
  /** The last runs' records, oldest first, at most `PRUNE_HOLD_HISTORY_RUNS`. */
  history: PruneRunRecord[];
  hold: PruneHold | null;
};

export const EMPTY_LEDGER: PruneLedger = {
  v: 1,
  cursor: null,
  history: [],
  hold: null,
};

/** Runs of history the usual is read from: two months of weekly runs. */
export const PRUNE_HOLD_HISTORY_RUNS = 8;

/** A backlog this many times the usual holds. The spend watch's 10x: growth is never a 10x week. */
export const PRUNE_HOLD_MULTIPLIER = 10;

/**
 * The hold's floor, in media: about one reference party (PRICING.md: 2,000 photographs and 100 clips). Below it a
 * backlog never holds, so a quiet history (a few media a week) cannot hold every ordinary clear-out.
 */
export const PRUNE_HOLD_FLOOR_MEDIA = 2_000;

/** The longest cursor kept: a backup key is far shorter (about 100 characters); anything longer is not ours. */
const MAX_CURSOR_LENGTH = 1024;

const MEDIA_PREFIX = "events/";

/**
 * What the store held, made safe to act on. Anything unreadable becomes the empty ledger (the head of the listing,
 * no history, no hold), and the note says so. Every fallback is the SAFE direction: a lost cursor re-examines from
 * the head (it can never skip a key), a lost history leaves only the floor (a big backlog holds), and a lost hold
 * means the next anomalous run holds afresh rather than going ahead.
 */
export function parseLedger(raw: unknown): {
  ledger: PruneLedger;
  note?: string;
} {
  if (raw === null || raw === undefined) return { ledger: EMPTY_LEDGER };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ledger: EMPTY_LEDGER,
      note: "Prune ledger unreadable; started from the head.",
    };
  }
  const r = raw as Record<string, unknown>;
  const notes: string[] = [];

  let cursor: string | null = null;
  if (r.cursor !== null && r.cursor !== undefined) {
    if (isCursor(r.cursor)) cursor = r.cursor;
    else notes.push("Prune cursor unreadable; started from the head.");
  }

  const history: PruneRunRecord[] = [];
  if (Array.isArray(r.history)) {
    for (const entry of r.history) {
      const rec = asRecord(entry);
      if (rec) history.push(rec);
    }
  }

  let hold: PruneHold | null = null;
  if (r.hold !== null && r.hold !== undefined) {
    const h = r.hold as Record<string, unknown>;
    if (isCount(h?.sinceMs) && isCount(h?.goneMedia)) {
      hold = { sinceMs: h.sinceMs, goneMedia: h.goneMedia };
    } else {
      notes.push("Prune hold unreadable; dropped.");
    }
  }

  return {
    ledger: {
      v: 1,
      cursor,
      history: history.slice(-PRUNE_HOLD_HISTORY_RUNS),
      hold,
    },
    note: notes.length ? notes.join(" ") : undefined,
  };
}

function isCursor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(MEDIA_PREFIX) &&
    value.length <= MAX_CURSOR_LENGTH &&
    // No control characters: a position is a key, and every key we write is printable.
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function asRecord(entry: unknown): PruneRunRecord | null {
  if (!entry || typeof entry !== "object") return null;
  const e = entry as Record<string, unknown>;
  if (
    !isCount(e.atMs) ||
    !isCount(e.goneMedia) ||
    typeof e.live !== "boolean"
  ) {
    return null;
  }
  return { atMs: e.atMs, goneMedia: e.goneMedia, live: e.live };
}

/** The usual backlog: the median of the recorded runs (one big clear-out does not move it), 0 with none. */
export function usualGoneMedia(history: readonly PruneRunRecord[]): number {
  if (history.length === 0) return 0;
  const sorted = history.map((h) => h.goneMedia).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The backlog above which a run holds. */
export function holdThreshold(history: readonly PruneRunRecord[]): number {
  return Math.max(
    PRUNE_HOLD_FLOOR_MEDIA,
    Math.ceil(PRUNE_HOLD_MULTIPLIER * usualGoneMedia(history)),
  );
}

export type HoldDecision = {
  /**
   * `proceed`: the backlog is usual (or the run is dry and it is). `hold`: delete nothing this run (a dry run only
   * reports that a live one would). `released`: an operator released this hold after it began, so it goes ahead.
   */
  verdict: "proceed" | "hold" | "released";
  threshold: number;
  usual: number;
  /** The hold the ledger keeps after this run. A dry run never sets, clears or releases a live hold. */
  nextHold: PruneHold | null;
};

/**
 * Decide what a run that confirmed `goneMedia` gone may do with them. `releasedAtMs` is the last "Release the hold"
 * pressed on /admin/jobs (null for none), honoured only when it is newer than the standing hold: a press made before
 * a hold began, or before any hold, never lets a later one through, so every hold needs its own press.
 */
export function decideHold(input: {
  goneMedia: number;
  ledger: PruneLedger;
  nowMs: number;
  live: boolean;
  releasedAtMs: number | null;
}): HoldDecision {
  const { goneMedia, ledger, nowMs, live, releasedAtMs } = input;
  const usual = usualGoneMedia(ledger.history);
  const threshold = holdThreshold(ledger.history);
  if (goneMedia <= threshold) {
    return {
      verdict: "proceed",
      threshold,
      usual,
      nextHold: live ? null : ledger.hold,
    };
  }
  if (!live) {
    return { verdict: "hold", threshold, usual, nextHold: ledger.hold };
  }
  if (
    ledger.hold &&
    releasedAtMs !== null &&
    releasedAtMs > ledger.hold.sinceMs
  ) {
    return { verdict: "released", threshold, usual, nextHold: null };
  }
  return {
    verdict: "hold",
    threshold,
    usual,
    nextHold: ledger.hold ?? { sinceMs: nowMs, goneMedia },
  };
}

/** The ledger a run leaves behind: its cursor, its record appended (oldest dropped), its hold. */
export function nextLedger(
  prev: PruneLedger,
  run: {
    cursor: string | null;
    record: PruneRunRecord;
    hold: PruneHold | null;
  },
): PruneLedger {
  return {
    v: 1,
    cursor: run.cursor,
    history: [...prev.history, run.record].slice(-PRUNE_HOLD_HISTORY_RUNS),
    hold: run.hold,
  };
}
