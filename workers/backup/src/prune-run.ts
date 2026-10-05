/**
 * THE PRUNE'S RUN (durability-backups.md, "The deletion-aware prune"): one weekly pass's worth of work over the
 * backup, from where the last run stopped. PURE over its ports (the two buckets, the app's confirm route, a clock),
 * so the same code runs in the Worker against its R2 bindings, in the tests against fakes, and in the dry-run
 * harness against the real buckets over the S3 API.
 *
 * THE ORDER IS PRIMARY FIRST. A run lists a page of the backup, then the primary over the SAME key range (both
 * listings are lexicographic, so the page's keys and the primary's keys line up), and only a key the primary does
 * not list becomes a candidate. The app is asked about candidates only, never about the live set, so its load is the
 * deletions, not the backup's size; the old order asked about every age-eligible id every week. A candidate's key
 * goes only when THREE readings agree: the primary's listing lacks it, the app has no row for its media, and a HEAD
 * of the primary right before the delete finds nothing (an object restored since the listing is kept).
 *
 * A DOUBT DELETES NOTHING. Deletes happen once, at the end of the run, after every candidate has been judged, so an
 * unavailable confirm route, a tripped breaker, an answer naming an id it was never asked about, or a listing that
 * does not move forward aborts the WHOLE run with nothing deleted and the cursor where it was. A HEAD that fails
 * keeps that one item (and closes the run as an error). A run whose backlog is far over the usual holds
 * (prune-ledger.ts).
 *
 * ITS CAPS ARE ITS BUDGET: no count stops the scan. The deadline, the subrequest budget and the delete cap
 * (prune-strategy.ts) each stop it with the cursor at the first thing it did not finish, so the next run carries
 * on; a run that reaches the end of the listing completes the pass and the next starts at the head.
 */
import type { LoneWalk } from "./lone-store";
import { NAMED_BATCH, type NamedAnswer } from "./named";
import {
  decideHold,
  nextLedger,
  type PruneHold,
  type PruneLedger,
} from "./prune-ledger";
import {
  PRUNE_CONFIRM_BATCH,
  PRUNE_DELETE_CAP_PER_RUN,
  PRUNE_HEAD_CONCURRENCY,
  PRUNE_RUN_DEADLINE_MS,
  PRUNE_SUBREQUEST_BUDGET,
  isPrunableAge,
  parseMediaIdFromKey,
  shouldDelete,
} from "./prune-strategy";
import type { RestoreMode } from "./restore-run";

export type ListedObject = { key: string; uploaded: Date };
export type ListedPage = { objects: ListedObject[]; truncated: boolean };
export type ListOptions = {
  prefix: string;
  startAfter?: string;
  limit: number;
};

/** What the run needs of a bucket. An `R2Bucket` binding is one as it stands. */
export interface PruneBucket {
  list(options: ListOptions): Promise<ListedPage>;
  head(key: string): Promise<unknown | null>;
}

export interface PruneBackupBucket extends PruneBucket {
  delete(keys: string[]): Promise<void>;
}

/** The app's confirm route, read: which of these media have no row, or why it cannot say. */
export type ConfirmAnswer =
  | { kind: "gone"; goneIds: string[] }
  | { kind: "trip"; reason: string }
  | { kind: "unavailable"; detail: string };

export type PrunePorts = {
  backup: PruneBackupBucket;
  primary: PruneBucket;
  confirm(mediaIds: string[], objectsScanned: number): Promise<ConfirmAnswer>;
  /**
   * Which of these lone keys a live row still names (named.ts), asked when the restore is on or in dry run. Absent,
   * every lone key counts.
   */
  named?(keys: string[]): Promise<NamedAnswer>;
  /**
   * The lone copies' table (lone-store.ts, in the prune's Durable Object): settles the range this run judged into it
   * (null: nothing settled, a count only) and answers how many keys the whole backup holds alone after it. Absent,
   * a run counts its own range alone.
   */
  lone?: { record(walk: LoneWalk | null): Promise<number> };
  /** The wall clock the deadline is read from (injected so a test can walk it). */
  now(): number;
};

export type PruneLimits = {
  /** No new page, confirm or HEAD starts this long after the run began. */
  deadlineMs: number;
  /** The run's own subrequest count stays at or under this, its deletes included. */
  subrequests: number;
  /** The most media one run deletes. */
  deleteMedia: number;
  /** Ids a confirm call carries. */
  confirmBatch: number;
  /** HEADs in flight at once. */
  headConcurrency: number;
};

export const PRUNE_LIMITS: PruneLimits = {
  deadlineMs: PRUNE_RUN_DEADLINE_MS,
  subrequests: PRUNE_SUBREQUEST_BUDGET,
  deleteMedia: PRUNE_DELETE_CAP_PER_RUN,
  confirmBatch: PRUNE_CONFIRM_BATCH,
  headConcurrency: PRUNE_HEAD_CONCURRENCY,
};

export type PruneRunInput = {
  /** `PRUNE_MODE`: only the literal "live" deletes. */
  mode: string;
  /** What the last runs left (prune-ledger.ts), already parsed. */
  ledger: PruneLedger;
  /** The age gate's reference and the run's record time. */
  startedAtMs: number;
  /**
   * The last "Release the hold" pressed on /admin/jobs, as the job heartbeat's start answer carries it (epoch ms),
   * or null for none: `decideHold` honours it only when it is newer than the standing hold.
   */
  releasedAtMs?: number | null;
  /**
   * `RESTORE_MODE` (restore-run.ts). The prune copies nothing either way; in dry run or on it asks which lone keys a
   * live row names, so it counts only those, and its report says what the restore will do with them. Absent: off.
   */
  restoreMode?: RestoreMode;
  limits?: Partial<PruneLimits>;
};

export type PruneRunResult = {
  status: "ok" | "error";
  note: string;
  /** The heartbeat's `counts`: what the run did, `remaining` and the card's flags first. */
  counts: Record<string, number | string | boolean>;
  /** The ledger to store, or null to leave the stored one as it is (an abort, or an empty primary). */
  ledger: PruneLedger | null;
};

/**
 * The confirm route's JSON, read strictly: `{ trip: true, reason }` or `{ trip: false, goneIds: string[] }`
 * (src/app/api/internal/backup-prune/route.ts). Anything else is `unavailable`, which deletes nothing: an answer
 * the Worker cannot read is never read as "these are gone".
 */
export function readConfirmAnswer(body: unknown): ConfirmAnswer {
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const b = body as Record<string, unknown>;
    if (b.trip === true) {
      return {
        kind: "trip",
        reason:
          typeof b.reason === "string" ? b.reason.slice(0, 80) : "unknown",
      };
    }
    if (
      b.trip === false &&
      Array.isArray(b.goneIds) &&
      b.goneIds.every((id) => typeof id === "string")
    ) {
      return { kind: "gone", goneIds: b.goneIds as string[] };
    }
  }
  return { kind: "unavailable", detail: "an answer of the wrong shape" };
}

const MEDIA_PREFIX = "events/";

/** R2's largest page. */
const PAGE = 1000;

/** R2's binding `delete()` takes at most 1,000 keys a call. */
const MAX_DELETE_KEYS = 1000;

/**
 * ★ THE BACKUP'S LONE COPIES (crumbs-75). A candidate whose row lives while the primary lost its object is kept, and
 * it is the one finding here that is about the PRIMARY: a host's photo that will not open, the backup its last copy.
 * It used to close the run `ok` with a note line nobody was told about. The run now always reports the count under
 * this key (zero included, on every run that judged its candidates, so a quiet week reads as a reading and not as
 * none), which the app reads as a card of its own beside the dead letters (`/admin/jobs`, a failure at any count,
 * the bell), and logs each item's keys for the restore. A cross-package contract: the app's catalog names the same
 * string (`DEPTH_COUNT_KEYS.backup_primary_missing`), and each side's suite asserts it.
 */
export const PRIMARY_MISSING_KEY = "primary_missing";

/** At most this many lone copies are logged by key a run (Workers Logs keeps them for the restore); the count is whole. */
const PRIMARY_MISSING_LOGGED = 200;

/**
 * At most this many lone keys a run carries to the named check and into the table; past it a key is counted, not
 * kept (a disaster's volume, which the whole-bucket restore is for), and the report says so. Ten confirm calls.
 */
export const LONE_KEYS_PER_RUN = 10_000;

type Stop = "deadline" | "subrequests" | "delete_cap";

const STOP_WORDS: Record<Stop, string> = {
  deadline: "deadline",
  subrequests: "subrequest budget",
  delete_cap: "delete cap",
};

/** A candidate: the keys of one media item the primary did not list, and where its first key was listed from. */
type Candidate = {
  mediaId: string;
  keys: string[];
  /** The key listed just before its first key: where a run that did not reach it resumes (null is the head). */
  from: string | null;
};

/** A reason to delete nothing at all this run. */
class Doubt extends Error {}

export async function runPrune(
  ports: PrunePorts,
  input: PruneRunInput,
): Promise<PruneRunResult> {
  const limits: PruneLimits = { ...PRUNE_LIMITS, ...input.limits };
  const mode = input.mode;
  const live = shouldDelete(mode);
  const runStartMs = ports.now();
  const inTime = () => ports.now() - runStartMs < limits.deadlineMs;

  // THE BUDGET. Every call below is counted, and a call is made only when it, and the deletes the run would then
  // owe at its end, fit under the limit: a run never dies of "Too many subrequests" with its work half judged.
  let used = 0;
  let deletableKeys = 0; // keys judged deletable so far
  let reservedKeys = 0; // keys of the re-checks in flight, each owed a delete if it comes back gone
  const deleteCalls = (keys: number) => Math.ceil(keys / MAX_DELETE_KEYS);
  const afford = (calls: number, moreDeleteKeys = 0) =>
    used + calls + deleteCalls(deletableKeys + reservedKeys + moreDeleteKeys) <=
    limits.subrequests;

  // An empty primary is no source to compare against (a wiped or uninitialized bucket): never prune against it.
  used += 1;
  const probe = await ports.primary.list({ prefix: MEDIA_PREFIX, limit: 1 });
  if (probe.objects.length === 0) {
    return {
      status: "ok",
      note: "Primary empty under events/, nothing to compare against.",
      counts: { scanned: 0, mode, ...holdCounts(input.ledger.hold) },
      ledger: null,
    };
  }

  const startCursor = input.ledger.cursor;
  let position = startCursor;
  let reachedEnd = false;
  let stop: Stop | null = null;
  /** Set when judged work was cut short: where the next run must start (null is the head). */
  let resumeFrom: string | null | undefined;

  const tally = {
    scanned: 0,
    absent: 0,
    primaryMissing: 0,
    /** Media items behind `primaryMissing` (its keys): what the log names, at most PRIMARY_MISSING_LOGGED. */
    primaryMissingItems: 0,
    keptOnHead: 0,
    checksFailed: 0,
    leftKeys: 0,
  };
  const pending = new Map<string, Candidate>();
  const deletable = new Map<string, string[]>();
  /** The keys of the lone copies this run found, in listing order, at most LONE_KEYS_PER_RUN. */
  const loneKeys: string[] = [];
  /** Lone keys past LONE_KEYS_PER_RUN: counted, never kept. */
  let loneUnkept = 0;

  /** The primary's keys in (after, through]: one listing call per 1,000, usually one. Null when the budget ran out. */
  async function primaryKeysThrough(
    after: string | null,
    through: string,
  ): Promise<Set<string> | null> {
    const held = new Set<string>();
    let start = after;
    for (;;) {
      if (!afford(1)) return null;
      used += 1;
      const page = await ports.primary.list({
        prefix: MEDIA_PREFIX,
        startAfter: start ?? undefined,
        limit: PAGE,
      });
      for (const obj of page.objects) {
        if (obj.key > through) return held;
        held.add(obj.key);
      }
      if (!page.truncated) return held;
      const last = page.objects.at(-1)?.key;
      if (last === undefined || (start !== null && !(last > start))) {
        throw new Doubt("The primary's listing did not move forward.");
      }
      if (last >= through) return held;
      start = last;
    }
  }

  /**
   * HEAD each key of one candidate whose row is gone: the keys the primary does not hold now, or null when a HEAD
   * failed (the whole item is then kept: never delete on a reading we did not get).
   */
  async function headsSaying(candidate: Candidate): Promise<string[] | null> {
    const keep: string[] = [];
    try {
      for (const key of candidate.keys) {
        if (await ports.primary.head(key)) keep.push(key);
      }
    } catch (err) {
      tally.checksFailed += 1;
      console.error("prune: HEAD failed; kept the item", {
        mediaId: candidate.mediaId,
        err: String(err),
      });
      return null;
    }
    tally.keptOnHead += keep.length;
    return candidate.keys.filter((key) => !keep.includes(key));
  }

  /** Confirm one batch with the app, then re-check its gone items, six HEADs in flight, until a stop. */
  async function flushBatch(batch: Candidate[]): Promise<void> {
    if (!inTime()) {
      cut(batch, 0, "deadline");
      return;
    }
    if (!afford(1)) {
      cut(batch, 0, "subrequests");
      return;
    }
    used += 1;
    const answer = await ports.confirm(
      batch.map((c) => c.mediaId),
      tally.scanned,
    );
    if (answer.kind === "unavailable") {
      throw new Doubt(
        `Confirm endpoint unavailable (${answer.detail}), deleted nothing.`,
      );
    }
    if (answer.kind === "trip") {
      throw new Doubt(`Circuit-breaker tripped: ${answer.reason}.`);
    }
    const asked = new Set(batch.map((c) => c.mediaId));
    const gone = new Set<string>();
    for (const id of answer.goneIds) {
      if (!asked.has(id)) {
        throw new Doubt(
          "The confirm route named an item it was not asked about, deleted nothing.",
        );
      }
      gone.add(id);
    }

    // `claimed` counts the delete cap's slots: every item already deletable plus every re-check in flight. An item
    // claims its slot as it starts and gives it back, in the same synchronous step as its verdict, if it turns out
    // not to be new to the delete set, so no item is ever counted twice between its HEADs and its lane resuming.
    let next = 0;
    let claimed = deletable.size;
    let halt: Stop | null = null;
    const lane = async (): Promise<void> => {
      while (halt === null && next < batch.length) {
        const candidate = batch[next];
        if (!gone.has(candidate.mediaId)) {
          // Its row lives while the primary lost the object: the backup alone holds it. Kept, counted, and named in
          // the log for the restore (PRIMARY_MISSING_KEY).
          tally.primaryMissing += candidate.keys.length;
          tally.primaryMissingItems += 1;
          for (const key of candidate.keys) {
            if (loneKeys.length < LONE_KEYS_PER_RUN) loneKeys.push(key);
            else loneUnkept += 1;
          }
          if (tally.primaryMissingItems <= PRIMARY_MISSING_LOGGED) {
            console.error(
              "prune: held by the backup alone (its row lives, its primary object is gone); restore it from the backup",
              { mediaId: candidate.mediaId, keys: candidate.keys },
            );
          }
          next += 1;
          continue;
        }
        if (!inTime()) halt = "deadline";
        else if (claimed >= limits.deleteMedia) halt = "delete_cap";
        else if (!afford(candidate.keys.length, candidate.keys.length)) {
          halt = "subrequests";
        }
        if (halt !== null) return;
        next += 1;
        claimed += 1;
        used += candidate.keys.length; // one HEAD a key
        reservedKeys += candidate.keys.length;
        const go = await headsSaying(candidate);
        reservedKeys -= candidate.keys.length;
        const known = deletable.get(candidate.mediaId);
        if (go && go.length > 0) {
          deletable.set(candidate.mediaId, [...(known ?? []), ...go]);
          deletableKeys += go.length;
        }
        if (!go || go.length === 0 || known) claimed -= 1;
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.max(1, Math.min(limits.headConcurrency, batch.length)) },
        lane,
      ),
    );
    if (halt !== null) cut(batch, next, halt);
  }

  /** Stop judging at `batch[index]`: it and everything after it, this batch's and every later page's, is left. */
  function cut(batch: Candidate[], index: number, why: Stop): void {
    stop = why;
    const left = batch.slice(index);
    if (left.length === 0) return;
    resumeFrom = left[0].from;
    tally.leftKeys += left.reduce((n, c) => n + c.keys.length, 0);
  }

  /**
   * THE RUN'S LONE COPIES, SETTLED: which of the keys it found a live row still names (asked when the restore is on or
   * in dry run, so a key a row let go of is never counted or copied back), this run's range put into the lone copies'
   * table, and the whole backup's count read back, which is what the run reports: a pass that spans runs then reads
   * the whole backup's lone copies after each one, never its own range alone. Its counts and its note's lines.
   */
  async function settleLone(): Promise<{
    counts: Record<string, number | string | boolean>;
    lines: string[];
    tableFailed: boolean;
  }> {
    const restoreMode = input.restoreMode ?? "off";
    let found = loneKeys;
    let unnamed = 0;
    let unasked = false;
    if (restoreMode !== "off" && ports.named && loneKeys.length > 0) {
      const named = new Set<string>();
      for (let i = 0; i < loneKeys.length; i += NAMED_BATCH) {
        if (!inTime() || !afford(1)) {
          unasked = true;
          break;
        }
        used += 1;
        const answer = await ports.named(loneKeys.slice(i, i + NAMED_BATCH));
        if (answer.kind === "unavailable") {
          unasked = true;
          break;
        }
        for (const key of answer.named) named.add(key);
      }
      if (!unasked) {
        found = loneKeys.filter((key) => named.has(key));
        unnamed = loneKeys.length - found.length;
      }
    }

    // The range this run settled: after where it began, through where the next run resumes (to the end for a run
    // that reached it). A run cut short at the first key it listed settled nothing, and only reads the count.
    const walk: LoneWalk | null =
      resumeFrom === null
        ? null
        : {
            after: startCursor,
            through:
              resumeFrom !== undefined
                ? resumeFrom
                : reachedEnd
                  ? null
                  : position,
            found,
          };
    let held = found.length;
    let tableFailed = false;
    if (ports.lone) {
      used += 1;
      try {
        held = await ports.lone.record(walk);
      } catch (err) {
        tableFailed = true;
        console.error("prune: the lone copies' table was not written", {
          err: String(err),
        });
      }
    }
    const reported = held + loneUnkept;
    const thisRun = found.length + loneUnkept;

    const counts: Record<string, number | string | boolean> = {
      [PRIMARY_MISSING_KEY]: reported,
    };
    if (input.restoreMode !== undefined) counts.restore_mode = restoreMode;
    if (thisRun !== reported) counts.lone_found = thisRun;
    if (unnamed > 0) counts.lone_unnamed = unnamed;
    if (loneUnkept > 0) counts.lone_unkept = loneUnkept;

    const lines: string[] = [];
    if (reported > 0) {
      const items = itemsOf(found);
      const head =
        thisRun === reported
          ? `${plural(reported, "key")} of ${plural(items, "item")} ${reported === 1 ? "is" : "are"} held by the backup alone`
          : thisRun === 0
            ? `${plural(reported, "key")} ${reported === 1 ? "is" : "are"} held by the backup alone, none of them in this run's range`
            : `${plural(reported, "key")} are held by the backup alone across the pass (${fmt(thisRun)} in this run's range)`;
      lines.push(
        `${head}: ${reported === 1 ? "its row lives, its primary object is" : "their rows live, their primary objects are"} gone. ` +
          RESTORE_WORDS[input.restoreMode ?? "unset"],
      );
    }
    if (unnamed > 0) {
      lines.push(
        `${plural(unnamed, "key")} under living rows ${unnamed === 1 ? "is" : "are"} named by none of them (an upload's ` +
          "dropped phone copy, say): left alone, never counted or copied back.",
      );
    }
    if (unasked) {
      lines.push(
        "Could not ask which a live row names, so every lone key counts.",
      );
    }
    if (loneUnkept > 0) {
      lines.push(
        `${fmt(loneUnkept)} past the first ${fmt(LONE_KEYS_PER_RUN)} are counted, not kept for the restore: ` +
          "copy the bucket back whole (durability-backups.md, Restore).",
      );
    }
    if (tableFailed) {
      lines.push(
        "The lone copies' table could not be written, so this count is this run's range alone.",
      );
    }
    return { counts, lines, tableFailed };
  }

  /** Confirm and re-check the pending candidates in batches; with `all`, the last short batch too. */
  async function flush(all: boolean): Promise<void> {
    while (
      resumeFrom === undefined &&
      (pending.size >= limits.confirmBatch || (all && pending.size > 0))
    ) {
      const batch = [...pending.values()].slice(0, limits.confirmBatch);
      for (const c of batch) pending.delete(c.mediaId);
      await flushBatch(batch);
    }
    if (resumeFrom !== undefined && pending.size > 0) {
      // Cut short: everything still pending lies after the cut, so it is left for the next run too.
      tally.leftKeys += [...pending.values()].reduce(
        (n, c) => n + c.keys.length,
        0,
      );
      pending.clear();
    }
  }

  try {
    for (;;) {
      if (!inTime()) {
        stop = "deadline";
        break;
      }
      if (deletable.size + pending.size >= limits.deleteMedia) {
        stop = "delete_cap";
        break;
      }
      if (!afford(2)) {
        stop = "subrequests";
        break;
      }
      used += 1;
      const page = await ports.backup.list({
        prefix: MEDIA_PREFIX,
        startAfter: position ?? undefined,
        limit: PAGE,
      });
      if (page.objects.length === 0) {
        if (page.truncated) {
          throw new Doubt(
            "The backup's listing came back empty but unfinished.",
          );
        }
        reachedEnd = true;
        break;
      }
      assertAdvances(page.objects, position);
      const last = page.objects[page.objects.length - 1].key;
      const held = await primaryKeysThrough(position, last);
      if (held === null) {
        // Out of budget before this page's range was read: the page is not taken, the cursor stays before it.
        stop = "subrequests";
        break;
      }
      // `previous` walks one key behind: a candidate resumes right after the key listed before its first one,
      // since everything up to there is settled (dismissed, or a candidate judged before it).
      let previous = position;
      for (const obj of page.objects) {
        tally.scanned += 1;
        const before = previous;
        previous = obj.key;
        const mediaId = parseMediaIdFromKey(obj.key);
        if (!mediaId) continue; // not our layout: never a candidate
        if (!isPrunableAge(obj.uploaded, input.startedAtMs)) continue; // inside the lock
        if (held.has(obj.key)) continue; // the primary holds it
        tally.absent += 1;
        const known = pending.get(mediaId);
        if (known) known.keys.push(obj.key);
        else pending.set(mediaId, { mediaId, keys: [obj.key], from: before });
      }
      position = last;
      await flush(false);
      if (resumeFrom !== undefined) break;
      if (!page.truncated) {
        reachedEnd = true;
        break;
      }
    }
    await flush(true);
  } catch (err) {
    if (!(err instanceof Doubt)) throw err;
    console.error(`prune: ${err.message}`);
    return {
      status: "error",
      note: err.message,
      counts: {
        scanned: tally.scanned,
        mode,
        deleted: 0,
        ...holdCounts(input.ledger.hold),
      },
      ledger: null,
    };
  }

  // THE LONE COPIES, settled before the hold, which reports them too: what a live row names of what this run found,
  // and the whole backup's count once the table has this run's range.
  const lone = await settleLone();

  // THE HOLD, over everything the run judged prunable, before a single delete.
  const goneMedia = deletable.size;
  const deleteKeys = [...deletable.values()].flat();
  const decision = decideHold({
    goneMedia,
    ledger: input.ledger,
    nowMs: input.startedAtMs,
    live,
    releasedAtMs: input.releasedAtMs ?? null,
  });
  const record = { atMs: input.startedAtMs, goneMedia, live };
  const passComplete = reachedEnd && resumeFrom === undefined;
  const cursorAfter =
    resumeFrom !== undefined ? resumeFrom : reachedEnd ? null : position;

  if (live && decision.verdict === "hold") {
    const since = new Date(decision.nextHold?.sinceMs ?? input.startedAtMs)
      .toISOString()
      .slice(0, 10);
    return {
      status: lone.tableFailed ? "error" : "ok",
      note: [
        `Held since ${since}: ${fmt(goneMedia)} items gone against a usual ${fmt(decision.usual)} (it holds past ` +
          `${fmt(decision.threshold)}), deleted nothing. It waits for Release the hold here; pause the prune if the ` +
          "backlog looks wrong.",
        ...lone.lines,
      ].join(" "),
      counts: {
        remaining: deleteKeys.length + tally.leftKeys,
        gone_media: goneMedia,
        scanned: tally.scanned,
        mode,
        hold_threshold: decision.threshold,
        // A held run judged its candidates all the same, so what it found the backup alone holds stands.
        ...lone.counts,
        ...holdCounts(decision.nextHold),
        breaker_tripped: true,
        ...(stop ? { stopped_early: true } : {}),
      },
      // The cursor stays where this run began: the held backlog is judged again, whole, by the run that releases it.
      ledger: nextLedger(input.ledger, {
        cursor: startCursor,
        record,
        hold: decision.nextHold,
      }),
    };
  }

  let deleted = 0;
  let errored = 0;
  if (live) {
    for (let i = 0; i < deleteKeys.length; i += MAX_DELETE_KEYS) {
      const chunk = deleteKeys.slice(i, i + MAX_DELETE_KEYS);
      used += 1;
      try {
        await ports.backup.delete(chunk);
        deleted += chunk.length;
      } catch (err) {
        // A still-locked delete is a silent success, so a throw is transient: counted, and the keys are judged
        // again next pass. The age gate already kept every key here outside the lock.
        errored += chunk.length;
        console.error("prune: delete chunk failed", {
          count: chunk.length,
          err: String(err),
        });
      }
    }
  }

  const counts: Record<string, number | string | boolean> = {};
  if (stop && tally.leftKeys > 0) counts.remaining = tally.leftKeys;
  if (live) {
    counts.deleted = deleted;
    if (errored > 0) counts.errored = errored;
  } else {
    counts.would_delete_keys = deleteKeys.length;
  }
  counts.gone_media = goneMedia;
  counts.scanned = tally.scanned;
  counts.mode = mode;
  counts.pass_complete = passComplete;
  if (stop) counts.stopped_early = true;
  if (tally.absent > 0) counts.absent_from_primary = tally.absent;
  // Always, zero included: the app reads a missing count as no reading, never as none missing.
  Object.assign(counts, lone.counts);
  if (tally.keptOnHead > 0) counts.kept_on_recheck = tally.keptOnHead;
  if (tally.checksFailed > 0) counts.checks_failed = tally.checksFailed;
  if (!live && decision.verdict === "hold") {
    counts.would_hold = true;
    counts.hold_threshold = decision.threshold;
  }
  Object.assign(counts, holdCounts(decision.nextHold));
  counts.subrequests = used;

  const lines: string[] = [
    live
      ? `Deleted ${fmt(deleted)} keys of ${fmt(goneMedia)} items.`
      : `Dry run, deleted nothing: ${fmt(deleteKeys.length)} keys of ${fmt(goneMedia)} items would go.`,
  ];
  // Second, so a long note's truncation never takes it: the lines about the primary.
  lines.push(...lone.lines);
  if (decision.verdict === "released") {
    lines.push("The hold was released on /admin/jobs, so this run went ahead.");
  }
  if (passComplete) lines.push("The pass reached the end of the backup.");
  else if (stop) {
    lines.push(
      `Stopped at its ${STOP_WORDS[stop]} with more of the backup to judge; the next run carries on.`,
    );
  }
  if (errored > 0) lines.push(`${fmt(errored)} keys failed to delete.`);
  if (tally.checksFailed > 0) {
    lines.push(
      `${fmt(tally.checksFailed)} items could not be re-checked and were kept.`,
    );
  }
  if (!live && decision.verdict === "hold") {
    lines.push(
      `A live run would hold this backlog (past ${fmt(decision.threshold)}).`,
    );
  }

  return {
    status:
      errored > 0 || tally.checksFailed > 0 || lone.tableFailed
        ? "error"
        : "ok",
    note: lines.join(" "),
    counts,
    ledger: nextLedger(input.ledger, {
      cursor: cursorAfter,
      record,
      hold: decision.nextHold,
    }),
  };
}

/** A page must hold strictly ascending keys, all past the cursor; anything else is a listing we cannot merge on. */
function assertAdvances(objects: ListedObject[], after: string | null): void {
  let prev = after;
  for (const obj of objects) {
    if (prev !== null && !(obj.key > prev)) {
      throw new Doubt("The backup's listing did not move forward.");
    }
    prev = obj.key;
  }
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** What the run's note says the restore does with the lone copies, by `RESTORE_MODE` (unset: a run without one). */
const RESTORE_WORDS: Record<RestoreMode | "unset", string> = {
  on: "The restore copies them back next (RESTORE_MODE on); its card says what it copied.",
  dryrun:
    "The restore is in dry run, so it copies nothing until RESTORE_MODE is on; this run's log names each.",
  off: "The restore is off (RESTORE_MODE): copy each from the backup by hand; this run's log names each.",
  unset: "Restore them from the backup; this run's log names each.",
};

function plural(n: number, noun: string): string {
  return `${fmt(n)} ${noun}${n === 1 ? "" : "s"}`;
}

/** The media items a set of keys belongs to. */
function itemsOf(keys: readonly string[]): number {
  return new Set(keys.map((key) => parseMediaIdFromKey(key) ?? key)).size;
}

/**
 * The standing hold, on every report while it stands (held, aborted or dry alike): `held_since` exact to the
 * millisecond, since the card offers Release the hold by comparing the last press with it exactly as `decideHold`
 * does, and the count it kept. Nothing at all once it clears.
 */
function holdCounts(hold: PruneHold | null): Record<string, number | string> {
  return hold
    ? {
        held_since: new Date(hold.sinceMs).toISOString(),
        held_media: hold.goneMedia,
      }
    : {};
}
