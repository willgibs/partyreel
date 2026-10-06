// The reconcile's memory between runs (durability-backups.md, "The reconcile"): where its pass through the two
// listings stands, how far that pass has come, and when the last pass reached the end. PURE: the Durable Object that
// stores it (prune-state.ts) is a get and a put; what a stored record means, and what a damaged one falls back to, is
// decided here under test.
//
// WHY A CURSOR AT ALL: a run that starts at the head of the listing every day never compares anything past what one
// run can reach, so once the bucket, or a backlog of copies the live queue missed, outgrows a run, the tail is never
// backed up (the old reconcile's 5,000-object cap had exactly that hole, and its HEAD per object made the cut long
// before). The cursor makes each run carry on where the last stopped, and a pass that reaches the end starts the next
// at the head. A listing merge fits a pass in one run well past 100,000 objects, so the cursor is a backstop, not the
// rhythm: the card reads a pass that spans runs as "Needs a look".

/** The pass a run carries on: when it began, and how many of the primary's keys it has compared so far. */
export type ReconcilePass = { startedAtMs: number; walked: number };

/** The last pass that reached the end of both listings: when it ended, and how many of the primary's keys it compared. */
export type ReconcileLastPass = { atMs: number; walked: number };

/** A key no run can copy: its copy started with a whole run ahead of it and still could not finish. */
export type ReconcileTooLarge = { key: string; size: number };

export type ReconcileLedger = {
  v: 1;
  /** The next run lists after this key; null starts a new pass at the head. */
  cursor: string | null;
  /** The pass in progress, or null when the next run starts a new one. */
  pass: ReconcilePass | null;
  last: ReconcileLastPass | null;
  /**
   * The keys past one run's copy reach, as last seen (at most `MAX_TOO_LARGE`): said on every run that meets them,
   * never tried again while their size stands, so one huge video cannot spend the first run of every pass. A key leaves
   * once a run meets it in the backup (copied by hand) or not at all (deleted).
   */
  tooLarge: ReconcileTooLarge[];
};

export const EMPTY_RECONCILE_LEDGER: ReconcileLedger = {
  v: 1,
  cursor: null,
  pass: null,
  last: null,
  tooLarge: [],
};

/** The most keys past one run's reach kept: a handful is a person's afternoon; a hundred is the whole-bucket restore. */
export const MAX_TOO_LARGE = 100;

/** The longest cursor kept: a media key is far shorter (about 100 characters); anything longer is not ours. */
const MAX_CURSOR_LENGTH = 1024;

const MEDIA_PREFIX = "events/";

/**
 * What the store held, made safe to act on. Every fallback is the SAFE direction: a cursor or a pass that cannot be
 * read starts a new pass at the head (it re-compares, it can never skip a key, and the pass's count stays whole), and
 * a last pass that cannot be read is no last pass (the card says none is recorded, never a date it made up).
 */
export function parseReconcileLedger(raw: unknown): {
  ledger: ReconcileLedger;
  note?: string;
} {
  if (raw === null || raw === undefined)
    return { ledger: EMPTY_RECONCILE_LEDGER };
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ledger: EMPTY_RECONCILE_LEDGER,
      note: "Reconcile ledger unreadable; started a new pass at the head.",
    };
  }
  const r = raw as Record<string, unknown>;
  const notes: string[] = [];

  let last: ReconcileLastPass | null = null;
  if (r.last !== null && r.last !== undefined) {
    const l = r.last as Record<string, unknown>;
    if (isTime(l?.atMs) && isCount(l?.walked)) {
      last = { atMs: l.atMs, walked: l.walked };
    } else {
      notes.push("Reconcile's last pass unreadable; dropped.");
    }
  }

  let cursor: string | null = null;
  let pass: ReconcilePass | null = null;
  const cursorOk =
    r.cursor === null || r.cursor === undefined || isCursor(r.cursor);
  const p = r.pass as Record<string, unknown> | null | undefined;
  const passOk =
    p === null ||
    p === undefined ||
    (isTime(p?.startedAtMs) && isCount(p?.walked));
  if (!cursorOk || !passOk) {
    notes.push("Reconcile cursor unreadable; started a new pass at the head.");
  } else if (isCursor(r.cursor)) {
    if (p && isTime(p.startedAtMs) && isCount(p.walked)) {
      cursor = r.cursor;
      pass = { startedAtMs: p.startedAtMs, walked: p.walked };
    } else {
      // A position with no pass to count it against: a new pass, so its count is never short.
      notes.push("Reconcile pass unreadable; started a new pass at the head.");
    }
  }

  // An unreadable entry is dropped: its key is simply tried again, and said again if it still cannot be copied.
  const tooLarge: ReconcileTooLarge[] = [];
  if (Array.isArray(r.tooLarge)) {
    for (const entry of r.tooLarge.slice(-MAX_TOO_LARGE)) {
      const e = entry as Record<string, unknown> | null;
      if (e && isCursor(e.key) && isCount(e.size)) {
        tooLarge.push({ key: e.key, size: e.size });
      }
    }
  }

  return {
    ledger: { v: 1, cursor, pass, last, tooLarge },
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

function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
