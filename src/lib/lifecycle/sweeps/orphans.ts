/**
 * SWEEP 3: ORPHANED R2 OBJECTS, uploaded bytes with no media row (a presign that raced
 * `create_media`, or a straggler from a crashed earlier sweep). No meter change: an orphan was never
 * counted in `storage_used_bytes`. It deletes only objects older than `ORPHAN_MIN_AGE_HOURS` and only
 * keys it positively recognizes (`parseMediaIdFromKey`); an unrecognized key is left untouched.
 *
 * THE LISTING IS BOUNDED TWICE (the 1,000-row round, 2026-09-23): each R2 page asks for at most
 * `ORPHAN_LIST_PAGE` (= `MAX_ROWS`) objects, and each page's candidate ids are checked against
 * `media` in `inChunks` reads of `IN_CHUNK` ids (a whole page's thousand ids in one `.in()` rode a
 * URL of about 39 KB). A run lists at most `ORPHAN_PAGE_CAP` pages and stops at its deadline; one that
 * stops with the bucket unfinished says so (`stopped_early`, and its note).
 *
 * ★ IT RESUMES (backup-prune, 2026-10-03; it used to list from the top every night, so past
 * `ORPHAN_PAGE_CAP` pages an abandoned upload was never reached). The tally hands back `resume_after`,
 * the last key it listed (null once a run reaches the end: the next starts at the head), and the
 * route stores the tally whole on the purge run's row, nested under `orphans`, where no card prints
 * it. The next run reads it back itself (`readOrphanCursor`) and lists after it with `StartAfter`, a
 * position a later run can always resume from (an S3 continuation token is opaque and its lifetime
 * unpromised). A position is an R2 key, not a uuid, so it cannot ride `readSweepCursor`'s uuid cursor.
 *
 * The circuit-breaker (durability-backups.md) decides before the single bulk delete, unchanged; a run
 * it trips hands back the cursor it started from, so the next run judges the same window again.
 */
import "server-only";

import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks, MAX_ROWS } from "@/lib/db/read-all";
import { RESUME_KEY } from "@/lib/jobs/sweep-tally";
import { orphanBreakerEmail } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { deleteR2Objects, listR2Objects, type R2Object } from "@/lib/r2/delete";
import { parseMediaIdFromKey } from "@/lib/r2/keys";
import { evaluateOrphanSweep } from "@/lib/r2/orphan-guard";

/**
 * An orphan candidate must be older than this, well past the 15-minute presign TTL, so the sweep
 * never races an in-flight upload (presigned, PUT in progress, `create_media` not yet called).
 */
export const ORPHAN_MIN_AGE_HOURS = 24;

/** R2 pages listed per run, so one invocation stays bounded. */
export const ORPHAN_PAGE_CAP = 20;

/**
 * Objects asked for per R2 page. At most `MAX_ROWS`, so one page's candidate ids (one per media item,
 * however many of its objects are listed) never outnumber what one read could answer; `inChunks`
 * splits them for the URL all the same. S3's own default is 1,000; this pins it.
 */
export const ORPHAN_LIST_PAGE = MAX_ROWS;

const MEDIA_PREFIX = "events/";

/** The purge runs `readOrphanCursor` looks back through for the last position: two weeks of nights. */
const CURSOR_LOOKBACK_RUNS = 14;

/** A stored position longer than this is not one of ours (a media key is about 100 characters). */
const MAX_CURSOR_LENGTH = 1024;

export type OrphansTally = {
  scanned_pages: number;
  r2_deleted: number;
  r2_errored: number;
  objects_scanned: number;
  /**
   * Where the next run lists from: the last key this one listed, or null once it reached the end of the
   * bucket (the next run starts at the head). The sweep sets it on every tally it returns (optional in
   * the type only so a hand-built tally elsewhere still type-checks), so a night it threw or was paused
   * (no tally, no key) never resets the walk: `readOrphanCursor` looks past it.
   */
  resume_after?: string | null;
  breaker_tripped?: boolean;
  breaker_reason?: string | null;
  orphan_candidates?: number;
  media_count?: number;
  stopped_note?: string;
} & Partial<StoppedEarly>;

/**
 * THE READ HALF, for one listed page: the keys of aged, recognized objects whose media row is gone.
 * An original and its preview resolve together through their media id.
 */
export async function findOrphanKeys(
  admin: AdminClient,
  objects: readonly R2Object[],
  ageCutoffMs: number,
): Promise<string[]> {
  const keysByMediaId = new Map<string, string[]>();
  for (const object of objects) {
    if (!object.lastModified || object.lastModified.getTime() > ageCutoffMs) {
      continue;
    }
    const mediaId = parseMediaIdFromKey(object.key);
    if (!mediaId) continue; // not our layout: never delete
    const keys = keysByMediaId.get(mediaId) ?? [];
    keys.push(object.key);
    keysByMediaId.set(mediaId, keys);
  }
  if (keysByMediaId.size === 0) return [];

  const existing = await inChunks(
    "cron/purge: orphan candidates",
    [...keysByMediaId.keys()],
    async (chunk) =>
      (await mustQuery(
        admin.from("media").select("id").in("id", chunk),
        "cron/purge: orphan candidates",
      )) ?? [],
  );
  const existingIds = new Set(existing.map((row) => row.id));
  const orphanKeys: string[] = [];
  for (const [mediaId, keys] of keysByMediaId) {
    if (!existingIds.has(mediaId)) orphanKeys.push(...keys);
  }
  return orphanKeys;
}

/**
 * The position the last purge run's orphan sweep handed back: the latest finished `purge_cron` row whose
 * nested `orphans` tally carries one (a night the sweep threw, was paused or predates the cursor carries
 * none, and is looked past). Null is the head: no history, a pass that reached the end, or a stored value
 * that is not a position (re-examining from the head can never skip a key).
 */
export async function readOrphanCursor(
  admin: AdminClient,
): Promise<string | null> {
  const rows = await mustQuery(
    admin
      .from("job_runs")
      .select("counts")
      .eq("job", "purge_cron")
      .in("status", ["ok", "error"])
      .order("started_at", { ascending: false })
      .limit(CURSOR_LOOKBACK_RUNS),
    "cron/purge: orphan sweep cursor",
  );
  for (const row of rows ?? []) {
    const position = orphanCursorFrom(row.counts);
    if (position !== undefined) return position;
  }
  return null;
}

/** The position a purge run's `counts` hold for the orphan sweep: undefined when it holds none. */
export function orphanCursorFrom(counts: unknown): string | null | undefined {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return undefined;
  }
  const tally = (counts as Record<string, unknown>).orphans;
  if (!tally || typeof tally !== "object" || Array.isArray(tally)) {
    return undefined;
  }
  if (!(RESUME_KEY in tally)) return undefined;
  const value = (tally as Record<string, unknown>)[RESUME_KEY];
  return typeof value === "string" &&
    value.startsWith(MEDIA_PREFIX) &&
    value.length <= MAX_CURSOR_LENGTH &&
    !/[\u0000-\u001f\u007f]/.test(value)
    ? value
    : null;
}

/** The cursor, or the head with a warning: an unreadable cursor is not worth a failed sweep. */
async function resumeOrphanCursor(admin: AdminClient): Promise<string | null> {
  try {
    return await readOrphanCursor(admin);
  } catch (e) {
    captureWarning("cron", "sweep_cursor_unreadable", {
      job: "purge_cron",
      sweep: "orphans",
      error: String(e).slice(0, 300),
    });
    return null;
  }
}

export async function sweepOrphans(
  admin: AdminClient,
  now: Date,
  opts: {
    deadline?: Deadline;
    /** Where to list from; omitted, the sweep reads the purge's last run (`readOrphanCursor`). */
    resumeAfter?: string | null;
  } = {},
): Promise<OrphansTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const ageCutoffMs = now.getTime() - ORPHAN_MIN_AGE_HOURS * 3_600_000;
  const startCursor =
    opts.resumeAfter !== undefined
      ? opts.resumeAfter
      : await resumeOrphanCursor(admin);
  const orphanKeys: string[] = [];
  let position = startCursor;
  let pages = 0;
  let objectsScanned = 0; // objects looked at THIS run: the breaker's fraction denominator
  let listedAll = false;

  while (pages < ORPHAN_PAGE_CAP && !deadline.passed()) {
    const { objects, nextToken } = await listR2Objects({
      prefix: MEDIA_PREFIX,
      startAfter: position ?? undefined,
      maxKeys: ORPHAN_LIST_PAGE,
    });
    pages += 1;
    objectsScanned += objects.length;
    orphanKeys.push(...(await findOrphanKeys(admin, objects, ageCutoffMs)));
    const last = objects.at(-1)?.key;
    if (!nextToken || last === undefined) {
      listedAll = true;
      break;
    }
    if (position !== null && !(last > position)) {
      // A listing that does not move past its own start would hand the next run the same window for good.
      captureWarning("cron", "orphan_listing_stalled", { sweep: "orphans" });
      break;
    }
    position = last;
  }

  // Said on the console, never silent: the page cap or the deadline stopped the listing with more of
  // the bucket unlisted.
  const stopped = listedAll
    ? {}
    : {
        ...stoppedEarly(null),
        stopped_note: `Listed ${pages.toLocaleString("en-US")} pages (${objectsScanned.toLocaleString("en-US")} objects) and stopped with more of the bucket unlisted; the next run carries on from where this one stopped.`,
      };
  const resumeAfter = listedAll ? null : position;

  // --- Circuit-breaker (durability-backups.md, media durability) ----------------------------------
  // The sweep TRUSTS the DB to label an object an orphan. A lost/unlinked media set (bad migration,
  // snapshot restore, mass row-delete, RLS/query bug) would make ~every object look orphaned, so one
  // run could delete the entire bucket. Before the single bulk delete, fail CLOSED if the candidate
  // set looks pathological: delete nothing, alert loudly (Sentry + a deduped operator email), and let
  // a human investigate. The safe failure mode is a storage LEAK, not data loss. NOTE: intentional
  // bulk purges (the pre-launch test-data reset) trip this BY DESIGN; they must run via an explicit
  // force-purge path, never this guarded daily cron.
  if (orphanKeys.length > 0) {
    const mediaCount = await mustCount(
      admin.from("media").select("id", { count: "exact", head: true }),
      "cron/purge: count media for the breaker",
    );
    const { trip, reason } = evaluateOrphanSweep({
      mediaCount,
      candidateCount: orphanKeys.length,
      objectsScanned,
    });

    if (trip) {
      captureError(
        "cron",
        new Error(`orphan sweep circuit-breaker tripped: ${reason}`),
        {
          sweep: "orphans",
          reason,
          media_count: mediaCount,
          orphan_candidates: orphanKeys.length,
          objects_scanned: objectsScanned,
        },
      );
      // Deduped per (reason, day) so a stuck breaker pages once a day, not every run. A failure to
      // SEND the alert must never become a delete, so swallow it: the Sentry capture above is the
      // primary signal, and we still return without deleting.
      try {
        const { subject, html, text } = orphanBreakerEmail({
          reason: reason ?? "unknown",
          candidates: orphanKeys.length,
          mediaCount,
          objectsScanned,
        });
        await sendOnce({
          kind: "orphan_breaker",
          dedupeKey: `${reason}:${now.toISOString().slice(0, 10)}`,
          to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
          subject,
          html,
          text,
        });
      } catch (e) {
        captureError("cron", e, { sweep: "orphans", phase: "breaker_alert" });
      }

      return {
        scanned_pages: pages,
        r2_deleted: 0,
        r2_errored: 0,
        objects_scanned: objectsScanned,
        // The window this run judged is judged again: the trip waits on a person, not on the next pass.
        resume_after: startCursor,
        breaker_tripped: true,
        breaker_reason: reason,
        orphan_candidates: orphanKeys.length,
        media_count: mediaCount,
        ...stopped,
      };
    }
  }

  const r2 = orphanKeys.length
    ? await deleteR2Objects(orphanKeys)
    : { deleted: 0, errored: [] };

  return {
    scanned_pages: pages,
    r2_deleted: r2.deleted,
    r2_errored: r2.errored.length,
    objects_scanned: objectsScanned,
    resume_after: resumeAfter,
    ...stopped,
  };
}
