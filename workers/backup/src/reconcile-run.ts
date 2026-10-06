/**
 * THE RECONCILE'S RUN (durability-backups.md, "The reconcile"): the media backup's daily backstop, one run's worth of a
 * pass over both buckets from where the last run stopped. PURE over its ports (the two buckets' listings, a copy, the
 * app's named question, the lone copies' table, a clock), so the same code runs in the Worker against its R2 bindings,
 * in the tests against fakes, and in a dry run against the real buckets over the S3 API.
 *
 * ★ A LISTING MERGE, NOT A HEAD PER OBJECT. The old reconcile HEADed the backup for every object in the primary, a
 * request an object: on 2026-10-04 it took 715 s over 3,419 objects (about 209 ms each), and the next day's never
 * closed, cut off by the platform at a cron's 15 minutes. This run walks the primary's and the backup's listings side
 * by side, a thousand keys a page each (both are lexicographic, so the keys line up, the prune's own pattern), and
 * compares by key, size and checksum: a run costs two listings a thousand keys. A key the primary lists and the backup
 * does not is copied; a key on both whose copies differ is said, never overwritten; a key the backup lists and the
 * primary does not is the prune's when it is past its 36-day gate, and judged here when it is younger.
 *
 * ★ THE YOUNG LONE COPIES. The prune judges absent keys past its gate only, so a primary object lost in its first five
 * weeks went unseen until then. Each young key the backup holds and the primary does not is asked of the app (does a
 * live row still NAME it, named.ts: a deleted item's key, or a phone copy its row let go of, is named by none), and
 * the named ones go into the lone copies' table (lone-store.ts) on its young side, whose restore copies them back
 * under its own three guards and RESTORE_MODE. A run reports the table's whole count, as the prune and the restore do.
 *
 * ITS CAPS ARE ITS BUDGET, AND IT CARRIES ON: no new page or copy starts past its deadline, nothing past its subrequest
 * budget, and a run that stops keeps a cursor (reconcile-ledger.ts) at the first thing it did not finish, so the next
 * run carries on. At 100,000 objects a pass is about two hundred listings, well inside one run; the cursor is the
 * backstop for a backlog of copies the live queue missed, or a bucket far past that.
 */
import type { LoneFound, LoneWalk } from "./lone-store";
import { NAMED_BATCH, type NamedAnswer } from "./named";
import { LONE_KEYS_PER_RUN, PRIMARY_MISSING_KEY } from "./prune-run";
import { PRUNE_LOCK_MIN_AGE_MS, parseMediaIdFromKey } from "./prune-strategy";
import {
  MAX_TOO_LARGE,
  type ReconcileLastPass,
  type ReconcileLedger,
  type ReconcilePass,
  type ReconcileTooLarge,
} from "./reconcile-ledger";
import type { RestoreMode } from "./restore-run";
import { copySubrequests } from "./strategy";

/** One listed object: what a listing says of it, which is all the merge compares. An `R2Object` is one as it stands. */
export type ReconcileListed = {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
};
export type ReconcilePage = { objects: ReconcileListed[]; truncated: boolean };
export type ReconcileListOptions = {
  prefix: string;
  startAfter?: string;
  limit: number;
};

export interface ReconcileBucket {
  list(options: ReconcileListOptions): Promise<ReconcilePage>;
}

/**
 * What one copy did: copied; there already (the live queue got there first); gone from the primary (a delete raced
 * it); or deferred (a multipart copy that would have outrun the run: its upload aborted, nothing written).
 */
export type CopyOutcome = "copied" | "exists" | "missing" | "deferred";

export type ReconcilePorts = {
  primary: ReconcileBucket;
  backup: ReconcileBucket;
  /**
   * Copy one key the backup lacks from the primary (index.ts's backupOne). `keepGoing` is asked before each part of a
   * multipart copy; false aborts it as `deferred`. Throws on a transfer error.
   */
  copy(
    key: string,
    size: number,
    keepGoing: () => boolean,
  ): Promise<CopyOutcome>;
  /** Which of these young absent keys a live row still names (named.ts, the confirm route's `loneKeys` question). */
  named(keys: string[]): Promise<NamedAnswer>;
  /**
   * The lone copies' table (lone-store.ts, in the prune's Durable Object): settles this run's range on the young side
   * of the gate (null: settles nothing, reads the count) and answers the whole backup's count after it and how many
   * keys were new to it. Absent: the run keeps nothing and reports no count.
   */
  lone?: {
    settle(walk: LoneWalk | null): Promise<{ held: number; added: number }>;
  };
  /** The wall clock the deadlines are read from (injected so a test can walk it). */
  now(): number;
};

export type ReconcileLimits = {
  /** No new page or copy starts this long after the run began. */
  deadlineMs: number;
  /** A multipart copy starts no new part this long after the run began: it aborts, deferred to the next run. */
  partHorizonMs: number;
  /** A copy deferred though it started this early can fit no run at all: it is said, and the walk moves past it. */
  earlyMs: number;
  /** The last named question is asked no later than this, so the table and the report always fit the invocation. */
  judgeHorizonMs: number;
  /** The run's own subrequest count stays at or under this, its copies counted at their most. */
  subrequests: number;
  /** Copies in flight at once. */
  copyConcurrency: number;
  /** Copies queued before they are made, and the most a stop can leave behind. */
  copyBatch: number;
  /** The most young lone copies one run keeps for the restore; past it the run stops judging and says so. */
  loneKeys: number;
};

/**
 * A cron invocation may run 15 minutes of wall time, and a daily cron 15 minutes of CPU
 * (developers.cloudflare.com/workers/platform/limits, "Duration" and "CPU time", read 2026-10-05). The listing merge
 * of 100,000 objects is about 200 list calls, a minute or two; these stops are for a backlog of copies.
 */
export const RECONCILE_RUN_DEADLINE_MS = 11 * 60 * 1000;
/** A part in flight at this point (32 MiB) has two minutes and a half before the cut. */
export const RECONCILE_PART_HORIZON_MS = 12.5 * 60 * 1000;
export const RECONCILE_EARLY_MS = 2 * 60 * 1000;
export const RECONCILE_JUDGE_HORIZON_MS = 13 * 60 * 1000;
/** wrangler.jsonc raises the Worker's limit to 100,000; the prune keeps the same margin under it. */
export const RECONCILE_SUBREQUEST_BUDGET = 95_000;
/**
 * A copy holds two of the six connections a Worker may have waiting at once (the source's GET streaming into the
 * backup's put), so three copies fill them.
 */
export const RECONCILE_COPY_CONCURRENCY = 3;
export const RECONCILE_COPY_BATCH = 30;

export const RECONCILE_LIMITS: ReconcileLimits = {
  deadlineMs: RECONCILE_RUN_DEADLINE_MS,
  partHorizonMs: RECONCILE_PART_HORIZON_MS,
  earlyMs: RECONCILE_EARLY_MS,
  judgeHorizonMs: RECONCILE_JUDGE_HORIZON_MS,
  subrequests: RECONCILE_SUBREQUEST_BUDGET,
  copyConcurrency: RECONCILE_COPY_CONCURRENCY,
  copyBatch: RECONCILE_COPY_BATCH,
  loneKeys: LONE_KEYS_PER_RUN,
};

export type ReconcileInput = {
  /** What the last runs left (reconcile-ledger.ts), already parsed. */
  ledger: ReconcileLedger;
  /** The age gate's reference and the record time. */
  startedAtMs: number;
  /** `RESTORE_MODE` (restore-run.ts), reported beside the lone copies so the card and the mail say what happens next. */
  restoreMode?: RestoreMode;
  limits?: Partial<ReconcileLimits>;
};

export type ReconcileResult = {
  status: "ok" | "error";
  note: string;
  /** The heartbeat's `counts`: what the run did, its pass and the card's flags. */
  counts: Record<string, number | string | boolean>;
  /** The ledger to store, or null to leave the stored one as it is (a doubt, or no progress). */
  ledger: ReconcileLedger | null;
  /** Lone copies new to the table: a restore pass is worth asking for now, not tomorrow. */
  askRestore: boolean;
};

/**
 * ★ THE KEYS THE CARD READS (src/app/admin/jobs/reconcile-view.ts): a cross-package contract, since the packages cannot
 * import each other, so each side's suite asserts the same strings. `checked` keeps the old reconcile's name for the
 * primary's keys a run compared.
 */
export const RECONCILE_COUNT_KEYS = {
  checked: "checked",
  copied: "copied",
  failed: "failed",
  tooLarge: "too_large",
  copiesLeft: "copies_left",
  mismatched: "mismatched",
  absent: "absent_from_primary",
  youngAbsent: "young_absent",
  loneFound: "lone_found",
  loneUnjudged: "lone_unjudged",
  passComplete: "pass_complete",
  passWalked: "pass_walked",
  passStartedAt: "pass_started_at",
  lastPassAt: "last_pass_at",
  lastPassWalked: "last_pass_walked",
  stoppedEarly: "stopped_early",
  breakerTripped: "breaker_tripped",
} as const;

const MEDIA_PREFIX = "events/";

/** R2's largest page. */
const PAGE = 1000;

/** At most this many keys of each finding are logged by key a run (Workers Logs); the counts are whole. */
const LOGGED = 200;

type Stop = "deadline" | "subrequests";

const STOP_WORDS: Record<Stop, string> = {
  deadline: "deadline",
  subrequests: "subrequest budget",
};

/** A reason to settle nothing at all this run: a listing the merge cannot trust. */
class Doubt extends Error {}

/** A key the backup lacks, queued for its copy, and where the walk stood just before it (null: the head). */
type PendingCopy = {
  key: string;
  size: number;
  from: string | null;
  /** The primary's keys compared before this one: what the run counts as compared if it stops here. */
  checkedBefore: number;
};

/** A young key the backup holds alone in the listing, waiting for the app's word on whether a live row names it. */
type Candidate = { key: string; uploadedMs: number; from: string | null };

/** One side's listing, a page at a time: the merge takes keys in order and lists the next page when the page is spent. */
class Pager {
  private page: ReconcileListed[] = [];
  private at = 0;
  private more = true;
  private after: string | null;

  constructor(
    private readonly bucket: ReconcileBucket,
    private readonly side: "primary" | "backup",
    after: string | null,
  ) {
    this.after = after;
  }

  /** The page is spent and the listing has more. */
  needsPage(): boolean {
    return this.at >= this.page.length && this.more;
  }

  async fill(): Promise<void> {
    const page = await this.bucket.list({
      prefix: MEDIA_PREFIX,
      startAfter: this.after ?? undefined,
      limit: PAGE,
    });
    if (page.objects.length === 0 && page.truncated) {
      throw new Doubt(
        `The ${this.side}'s listing came back empty but unfinished.`,
      );
    }
    let prev = this.after;
    for (const obj of page.objects) {
      if (prev !== null && !(obj.key > prev)) {
        throw new Doubt(`The ${this.side}'s listing did not move forward.`);
      }
      prev = obj.key;
    }
    this.page = page.objects;
    this.at = 0;
    this.more = page.truncated;
    if (prev !== null) this.after = prev;
  }

  peek(): ReconcileListed | null {
    return this.at < this.page.length ? this.page[this.at] : null;
  }

  take(): void {
    this.at += 1;
  }
}

/**
 * Do the two copies of a key differ? Size always; the checksum only when both are a single upload's (an MD5), since a
 * multipart upload's etag is the hash of its parts' hashes and a part count (developers.cloudflare.com/r2/objects/
 * upload-objects, "ETags", read 2026-10-05): the backup copies a large object in its own 32 MiB parts, so the same
 * bytes carry different multipart etags on the two sides.
 */
export function copiesDiffer(
  primary: Pick<ReconcileListed, "size" | "etag">,
  backup: Pick<ReconcileListed, "size" | "etag">,
): "size" | "checksum" | null {
  if (primary.size !== backup.size) return "size";
  const p = plainEtag(primary.etag);
  const b = plainEtag(backup.etag);
  if (p !== null && b !== null && p !== b) return "checksum";
  return null;
}

/** A single upload's etag (32 hex digits, quotes dropped), or null for a multipart one or none. */
function plainEtag(etag: string): string | null {
  const bare = etag.replaceAll('"', "").trim().toLowerCase();
  return /^[0-9a-f]{32}$/.test(bare) ? bare : null;
}

export async function runReconcile(
  ports: ReconcilePorts,
  input: ReconcileInput,
): Promise<ReconcileResult> {
  const limits: ReconcileLimits = { ...RECONCILE_LIMITS, ...input.limits };
  const runStartMs = ports.now();
  const elapsed = () => ports.now() - runStartMs;
  const inTime = () => elapsed() < limits.deadlineMs;
  // The gate the prune judges by: a backup copy taken after this is young, the reconcile's to judge.
  const cutMs = input.startedAtMs - PRUNE_LOCK_MIN_AGE_MS;

  // THE BUDGET. Every call is counted, a copy at its most, and a call is made only when it fits beside the run's closing
  // calls (the table, and the last named question), so a run never dies of "Too many subrequests" with work half done.
  let used = 0;
  const closing = (ports.lone ? 1 : 0) + 1;
  const afford = (calls: number) =>
    used + calls + closing <= limits.subrequests;

  // The keys a run before found past one run's copy reach: said again, never tried again while their size stands.
  const knownTooLarge = new Map(
    input.ledger.tooLarge.map((t) => [t.key, t.size] as const),
  );
  const metTooLarge = new Map<string, number>();

  const startCursor = input.ledger.cursor;
  const pass: ReconcilePass =
    startCursor !== null && input.ledger.pass
      ? input.ledger.pass
      : { startedAtMs: input.startedAtMs, walked: 0 };

  const tally = {
    checked: 0,
    matched: 0,
    mismatched: 0,
    copied: 0,
    exists: 0,
    vanished: 0,
    failed: 0,
    tooLarge: 0,
    absent: 0,
    youngAbsent: 0,
    unjudged: 0,
  };
  let firstFailure: string | null = null;
  let walkPos: string | null = startCursor;
  let reachedEnd = false;
  let stop: Stop | null = null;
  /** Set when work at or after a key was left: the next run's cursor (null is the head). */
  let resumeFrom: string | null | undefined;
  let checkedAtResume = 0;
  let copiesLeft = 0;

  const pending: PendingCopy[] = [];
  const candidates: Candidate[] = [];
  const found: LoneFound[] = [];
  let judging = true;
  /** Set when judging stopped: the table is settled only through here (null: the head, nothing). */
  let judgedThrough: string | null | undefined;
  let judgeTrouble: string | null = null;
  let capped = false;

  const backupOnly = (b: ReconcileListed, before: string | null) => {
    tally.absent += 1;
    // Not our layout: no row could ever name it, so it is never a lone copy.
    if (!parseMediaIdFromKey(b.key)) return;
    const uploadedMs = b.uploaded.getTime();
    // Past the gate: the prune's to judge, weekly.
    if (!(uploadedMs > cutMs)) return;
    tally.youngAbsent += 1;
    if (judging) candidates.push({ key: b.key, uploadedMs, from: before });
    else tally.unjudged += 1;
  };

  const both = (p: ReconcileListed, b: ReconcileListed) => {
    tally.checked += 1;
    const why = copiesDiffer(p, b);
    if (!why) {
      tally.matched += 1;
      return;
    }
    tally.mismatched += 1;
    if (tally.mismatched <= LOGGED) {
      // Never overwritten: a key is written once, so either the primary was rewritten in place (a deliberate fix) or
      // one copy is damaged, and only a person can say which is the good one.
      console.error(
        "reconcile: the two copies differ; left as they are, never overwritten",
        {
          key: p.key,
          why,
          primarySize: p.size,
          backupSize: b.size,
        },
      );
    }
  };

  /** Make the queued copies, three in flight, until one is left: a stop then rewinds the cursor to it. */
  async function flushCopies(): Promise<void> {
    if (pending.length === 0 || resumeFrom !== undefined) return;
    const batch = pending.splice(0, pending.length);
    const done = batch.map(() => false);
    let next = 0;
    let halt: Stop | null = null;
    const lane = async (): Promise<void> => {
      while (halt === null && next < batch.length) {
        const item = batch[next];
        const cost = copySubrequests(item.size);
        if (!inTime()) {
          halt = "deadline";
          return;
        }
        if (!afford(cost)) {
          halt = "subrequests";
          return;
        }
        const index = next;
        next += 1;
        used += cost;
        const startedAt = elapsed();
        let outcome: CopyOutcome;
        try {
          outcome = await ports.copy(
            item.key,
            item.size,
            () => elapsed() < limits.partHorizonMs,
          );
        } catch (err) {
          // Counted, and the next pass tries it again: a run that copied nothing because every copy threw never
          // closes as a green ok.
          tally.failed += 1;
          firstFailure ??= String(err).slice(0, 120);
          console.error("reconcile: copy failed", {
            key: item.key,
            err: String(err),
          });
          done[index] = true;
          continue;
        }
        if (outcome === "deferred") {
          if (startedAt < limits.earlyMs) {
            // It started with the whole run ahead of it and still could not finish: no run ever will. Remembered,
            // so the next pass says it without spending its first run on it again.
            tally.tooLarge += 1;
            metTooLarge.set(item.key, item.size);
            console.error(
              "reconcile: past one run's copy reach; copy it by hand",
              { key: item.key, bytes: item.size },
            );
            done[index] = true;
          } else {
            halt = "deadline";
          }
          continue;
        }
        if (outcome === "copied") {
          tally.copied += 1;
          if (tally.copied <= LOGGED) {
            // Its time beside its bytes: the copy rate a run can count on, measured where the copies run, which
            // decides what is past one run's reach.
            console.log("reconcile: copied a key the live queue missed", {
              key: item.key,
              bytes: item.size,
              ms: elapsed() - startedAt,
            });
          }
        } else if (outcome === "exists") tally.exists += 1;
        else tally.vanished += 1;
        done[index] = true;
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.max(1, Math.min(limits.copyConcurrency, batch.length)) },
        lane,
      ),
    );
    const left = done.indexOf(false);
    if (left !== -1) {
      stop = halt ?? "deadline";
      resumeFrom = batch[left].from;
      checkedAtResume = batch[left].checkedBefore;
      copiesLeft = done.filter((d) => !d).length;
    }
  }

  /** Stop judging at this candidate: the table is settled only up to it, and every young key after it is counted. */
  function stopJudging(at: Candidate, why: string | null): void {
    judging = false;
    judgedThrough = at.from;
    const index = candidates.indexOf(at);
    tally.unjudged += index === -1 ? 1 : candidates.length - index;
    candidates.length = 0;
    if (why) judgeTrouble = why;
  }

  /** Ask the app which waiting candidates a live row names: whole batches as they fill, the rest at the end. */
  async function judge(final: boolean): Promise<void> {
    while (
      judging &&
      candidates.length > 0 &&
      (final || candidates.length >= NAMED_BATCH)
    ) {
      const batch = candidates.slice(0, NAMED_BATCH);
      const timely = final ? elapsed() < limits.judgeHorizonMs : inTime();
      // The last question spends the slot the budget kept for it; any before it must fit beside that slot.
      const room = final
        ? used + 1 + (ports.lone ? 1 : 0) <= limits.subrequests
        : afford(1);
      if (!timely || !room) {
        // A whole batch past the walk's deadline waits for the last question; past that, the run says it stopped.
        if (!final) return;
        stopJudging(
          batch[0],
          !timely ? "out of time to ask" : "out of subrequests to ask",
        );
        return;
      }
      used += 1;
      const answer = await ports.named(batch.map((c) => c.key));
      if (answer.kind === "unavailable") {
        stopJudging(batch[0], answer.detail);
        return;
      }
      candidates.splice(0, batch.length);
      const named = new Set(answer.named);
      for (let i = 0; i < batch.length; i += 1) {
        const c = batch[i];
        if (!named.has(c.key)) continue; // a deleted item's key, or one its row let go of
        if (found.length >= limits.loneKeys) {
          capped = true;
          // The rest of this batch is unjudged too: put it back so stopJudging counts it.
          candidates.unshift(...batch.slice(i));
          stopJudging(c, null);
          return;
        }
        found.push({ key: c.key, uploadedMs: c.uploadedMs });
        if (found.length <= LOGGED) {
          console.error(
            "reconcile: held by the backup alone, young (its row names it, its primary object is gone); the restore copies it back",
            { key: c.key },
          );
        }
      }
    }
  }

  try {
    // An empty primary is no source to compare against: a wiped bucket or a listing fault, and either way nothing a
    // copy or a count could be trusted on.
    used += 1;
    const probe = await ports.primary.list({ prefix: MEDIA_PREFIX, limit: 1 });
    if (probe.objects.length === 0) {
      used += 1;
      const backupProbe = await ports.backup.list({
        prefix: MEDIA_PREFIX,
        limit: 1,
      });
      if (backupProbe.objects.length > 0) {
        throw new Doubt(
          "The primary lists nothing under events/ while the backup holds keys: a wiped primary or a listing fault. Copied and judged nothing.",
        );
      }
    }

    const P = new Pager(ports.primary, "primary", startCursor);
    const B = new Pager(ports.backup, "backup", startCursor);
    for (;;) {
      const dry = [P, B].filter((side) => side.needsPage());
      if (dry.length > 0) {
        // A window's copies go before the next page is listed, so a stop never leaves more than a page behind.
        await flushCopies();
        if (resumeFrom !== undefined) break;
        if (!inTime()) {
          stop = "deadline";
          break;
        }
        if (!afford(dry.length)) {
          stop = "subrequests";
          break;
        }
        used += dry.length;
        await Promise.all(dry.map((side) => side.fill()));
        continue;
      }
      const p = P.peek();
      const b = B.peek();
      if (!p && !b) {
        reachedEnd = true;
        break;
      }
      const before = walkPos;
      if (p && (!b || p.key < b.key)) {
        if (knownTooLarge.get(p.key) === p.size) {
          // A run before found it past one run's reach: said again, not tried again.
          tally.tooLarge += 1;
          metTooLarge.set(p.key, p.size);
          console.error(
            "reconcile: past one run's copy reach; copy it by hand",
            { key: p.key, bytes: p.size },
          );
        } else {
          pending.push({
            key: p.key,
            size: p.size,
            from: before,
            checkedBefore: tally.checked,
          });
        }
        tally.checked += 1;
        P.take();
        walkPos = p.key;
      } else if (b && (!p || b.key < p.key)) {
        backupOnly(b, before);
        B.take();
        walkPos = b.key;
      } else if (p && b) {
        both(p, b);
        P.take();
        B.take();
        walkPos = p.key;
      }
      if (pending.length >= limits.copyBatch) {
        await flushCopies();
        if (resumeFrom !== undefined) break;
      }
      if (candidates.length >= NAMED_BATCH) await judge(false);
    }
    await flushCopies();
  } catch (err) {
    if (!(err instanceof Doubt)) throw err;
    console.error(`reconcile: ${err.message}`);
    return {
      status: "error",
      note: err.message,
      counts: {
        [RECONCILE_COUNT_KEYS.checked]: tally.checked,
        ...(tally.copied > 0
          ? { [RECONCILE_COUNT_KEYS.copied]: tally.copied }
          : {}),
        ...(tally.failed > 0
          ? { [RECONCILE_COUNT_KEYS.failed]: tally.failed }
          : {}),
        ...passCounts(pass, input.ledger.last, false, pass.walked),
      },
      ledger: null,
      askRestore: false,
    };
  }

  // Candidates past where the run stops are the next run's: judged now, they would be judged again.
  const settledTo = settledThrough();
  if (settledTo !== "none" && settledTo !== null) {
    while (candidates.length > 0 && candidates.at(-1)!.key > settledTo) {
      candidates.pop();
    }
  } else if (settledTo === "none") {
    candidates.length = 0;
  }
  await judge(true);

  /** Where this run settled through: a key, null for the end of the listing, or "none" for nothing at all. */
  function settledThrough(): string | null | "none" {
    if (resumeFrom !== undefined) {
      return resumeFrom === null || resumeFrom === startCursor
        ? "none"
        : resumeFrom;
    }
    if (reachedEnd) return null;
    return walkPos === null || walkPos === startCursor ? "none" : walkPos;
  }

  // THE YOUNG LONE COPIES, SETTLED: this run's range, on the young side of the gate, through where judging held.
  let tableThrough: string | null | "none" = settledTo;
  if (judgedThrough !== undefined && tableThrough !== "none") {
    if (judgedThrough === null || judgedThrough === startCursor) {
      tableThrough = "none";
    } else if (tableThrough === null || judgedThrough < tableThrough) {
      tableThrough = judgedThrough;
    }
  }
  const inTable = (key: string) =>
    tableThrough !== "none" &&
    (startCursor === null || key > startCursor) &&
    (tableThrough === null || key <= tableThrough);
  const kept = found.filter((f) => inTable(f.key));
  const walk: LoneWalk | null =
    tableThrough === "none"
      ? null
      : {
          after: startCursor,
          through: tableThrough,
          found: kept,
          judged: { side: "young", cutMs },
        };
  let held: number | null = null;
  let added = 0;
  let tableFailed = false;
  if (ports.lone) {
    used += 1;
    try {
      const answer = await ports.lone.settle(walk);
      held = answer.held;
      added = answer.added;
    } catch (err) {
      tableFailed = true;
      console.error("reconcile: the lone copies' table was not written", {
        err: String(err),
      });
    }
  }

  // The keys past one run's reach the next runs keep saying: every one this run met, and those outside the range it
  // settled (another run's to meet). One in its range it did not meet is in the backup now, or gone: it leaves.
  const settledIn = (k: string) =>
    settledTo !== "none" &&
    (startCursor === null || k > startCursor) &&
    (settledTo === null || k <= settledTo);
  const tooLarge: ReconcileTooLarge[] = [
    ...input.ledger.tooLarge.filter(
      (t) => !settledIn(t.key) && !metTooLarge.has(t.key),
    ),
    ...[...metTooLarge].map(([k, size]) => ({ key: k, size })),
  ].slice(-MAX_TOO_LARGE);

  const passComplete = reachedEnd && resumeFrom === undefined;
  const checkedThisRun =
    resumeFrom !== undefined ? checkedAtResume : tally.checked;
  const walkedTotal = pass.walked + checkedThisRun;
  const cursorAfter =
    resumeFrom !== undefined ? resumeFrom : reachedEnd ? null : walkPos;
  const noProgress = !passComplete && cursorAfter === startCursor;
  const endMs = ports.now();
  const last: ReconcileLastPass | null = passComplete
    ? { atMs: endMs, walked: walkedTotal }
    : input.ledger.last;

  const counts: Record<string, number | string | boolean> = {
    [RECONCILE_COUNT_KEYS.checked]: checkedThisRun,
    [RECONCILE_COUNT_KEYS.copied]: tally.copied,
  };
  if (tally.failed > 0) counts[RECONCILE_COUNT_KEYS.failed] = tally.failed;
  if (tally.tooLarge > 0)
    counts[RECONCILE_COUNT_KEYS.tooLarge] = tally.tooLarge;
  if (copiesLeft > 0) counts[RECONCILE_COUNT_KEYS.copiesLeft] = copiesLeft;
  if (tally.mismatched > 0) {
    counts[RECONCILE_COUNT_KEYS.mismatched] = tally.mismatched;
    // A person's call, like a tripped breaker: the card reads Needs a look, never Healthy beside it.
    counts[RECONCILE_COUNT_KEYS.breakerTripped] = true;
  }
  if (tally.absent > 0) counts[RECONCILE_COUNT_KEYS.absent] = tally.absent;
  if (tally.youngAbsent > 0) {
    counts[RECONCILE_COUNT_KEYS.youngAbsent] = tally.youngAbsent;
  }
  counts[RECONCILE_COUNT_KEYS.loneFound] = kept.length;
  if (tally.unjudged > 0) {
    counts[RECONCILE_COUNT_KEYS.loneUnjudged] = tally.unjudged;
  }
  // The whole backup's lone copies, as the table holds them after this run: the reading the prune and the restore
  // report too. No table, no count: a count of this run's young keys alone would read as the whole backup's.
  if (held !== null) counts[PRIMARY_MISSING_KEY] = held;
  if (input.restoreMode !== undefined) counts.restore_mode = input.restoreMode;
  Object.assign(counts, passCounts(pass, last, passComplete, walkedTotal));
  if (stop) counts[RECONCILE_COUNT_KEYS.stoppedEarly] = true;
  counts.subrequests = used;

  const lines: string[] = [];
  if (passComplete) {
    lines.push(
      `The pass reached the end: ${plural(walkedTotal, "key")} compared with the backup's` +
        (tally.copied > 0
          ? `, ${fmt(tally.copied)} copied that the live queue missed.`
          : tally.failed + tally.tooLarge > 0
            ? "."
            : ", every one backed up."),
    );
  } else if (noProgress) {
    lines.push(
      `It made no progress: stopped at its ${STOP_WORDS[stop ?? "deadline"]} before it settled a key; the next run tries again from the same place.`,
    );
  } else {
    lines.push(
      `Stopped at its ${STOP_WORDS[stop ?? "deadline"]} with ${plural(walkedTotal, "key")} compared so far this pass` +
        (tally.copied > 0 ? ` (${fmt(tally.copied)} copied)` : "") +
        "; the next run carries on.",
    );
  }
  // Second, so a long note's cut never takes it: what the backup alone holds.
  if (kept.length > 0) {
    lines.push(
      `${plural(kept.length, "young key")} ${kept.length === 1 ? "is" : "are"} held by the backup alone: ` +
        `${kept.length === 1 ? "its row names it, its primary object is" : "their rows name them, their primary objects are"} gone. ` +
        RESTORE_WORDS[input.restoreMode ?? "unset"],
    );
  }
  if (tally.failed > 0) {
    lines.push(
      `${plural(tally.failed, "key")} failed to copy (${firstFailure}): the next pass tries again.`,
    );
  }
  if (tally.tooLarge > 0) {
    lines.push(
      `${plural(tally.tooLarge, "key")} ${tally.tooLarge === 1 ? "is" : "are"} past one run's copy reach: copy by hand; this run's log names each.`,
    );
  }
  if (tally.mismatched > 0) {
    lines.push(
      `${plural(tally.mismatched, "key")} ${tally.mismatched === 1 ? "differs" : "differ"} between the buckets (size or checksum): left as they are, never overwritten; this run's log names each.`,
    );
  }
  if (judgeTrouble) {
    lines.push(
      `Could not ask the app which young keys a live row names (${judgeTrouble}), so ${plural(tally.unjudged, "young key")} wait for the next pass.`,
    );
  }
  if (capped) {
    lines.push(
      `It stopped judging at ${fmt(limits.loneKeys)} young lone copies; ${fmt(tally.unjudged)} more wait: copy the bucket back whole (durability-backups.md, Restore).`,
    );
  }
  if (tableFailed) {
    lines.push(
      "The lone copies' table could not be written: this run's log names the young keys it found.",
    );
  }

  return {
    status:
      tally.failed > 0 ||
      tally.tooLarge > 0 ||
      judgeTrouble !== null ||
      tableFailed ||
      noProgress
        ? "error"
        : "ok",
    note: lines.join(" ").slice(0, 500),
    counts,
    ledger: noProgress
      ? null
      : passComplete
        ? { v: 1, cursor: null, pass: null, last, tooLarge }
        : {
            v: 1,
            cursor: cursorAfter,
            pass: { startedAtMs: pass.startedAtMs, walked: walkedTotal },
            last,
            tooLarge,
          },
    askRestore: added > 0,
  };
}

/** The pass on the card: whether this run ended it, how far it has come, when it began, and the last one that ended. */
function passCounts(
  pass: ReconcilePass,
  last: ReconcileLastPass | null,
  complete: boolean,
  walked: number,
): Record<string, number | string | boolean> {
  return {
    [RECONCILE_COUNT_KEYS.passComplete]: complete,
    [RECONCILE_COUNT_KEYS.passWalked]: walked,
    [RECONCILE_COUNT_KEYS.passStartedAt]: new Date(
      pass.startedAtMs,
    ).toISOString(),
    ...(last
      ? {
          [RECONCILE_COUNT_KEYS.lastPassAt]: new Date(last.atMs).toISOString(),
          [RECONCILE_COUNT_KEYS.lastPassWalked]: last.walked,
        }
      : {}),
  };
}

/** What the run's note says the restore does with the young lone copies, by `RESTORE_MODE` (unset: none reported). */
const RESTORE_WORDS: Record<RestoreMode | "unset", string> = {
  on: "The restore copies them back next (RESTORE_MODE on); its card says what it copied.",
  dryrun:
    "The restore is in dry run, so it copies nothing until RESTORE_MODE is on; this run's log names each.",
  off: "The restore is off (RESTORE_MODE): copy each from the backup by hand; this run's log names each.",
  unset: "Restore them from the backup; this run's log names each.",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function plural(n: number, noun: string): string {
  return `${fmt(n)} ${noun}${n === 1 ? "" : "s"}`;
}
