/**
 * SWEEP 5: OVER-CAPACITY RETENTION FOR LAPSED PAID ACCOUNTS (a Free account is blocked at upload
 * before it can pass its cap, so it never lands here).
 *
 * ★ DECISIONS KEY OFF WHAT SHE KEEPS BY CHOICE (trash-in-storage, Will 2026-10-03: Deleted counts in
 * storage): her albums and her own Deleted, everything stored but the reduce's own removals waiting in
 * Deleted (`host_storage_summary`'s active, Deleted and system figures), never `storage_used_bytes`
 * (which drops only at hard-delete). Her own Deleted counts, so a move to Deleted clears no grace; the
 * system's removals do not, since they are the overage on its way out, so an account already reduced
 * does not re-trigger while they wait out their window (and restoring one is gated: restore_media).
 * Per account:
 *   under the line        → clear any grace (resolved by an upgrade or by freeing room for good);
 *   over + no grace       → open a 45-day grace + the grace-start email;
 *   over + grace, near    → the reminder (within OVER_CAP_REMINDER_DAYS of the deadline);
 *   over + grace elapsed  → make room: first what she already deleted leaves for good, oldest first
 *                           (`leave_deleted`, never the system's own removals, whatever her setting:
 *                           nothing she kept is touched while her own Deleted can cover it), then
 *                           her largest files move to Deleted as the system's removals (the
 *                           removed_media sweep reclaims them after the window), + the reduced email.
 * Every email goes through `sendOnce`, so a re-run never re-sends.
 *
 * WHOLE (the 1,000-row round, 2026-09-23; H9 and H10):
 *  - The candidates (every profile past the smallest cap) are read whole by keyset, then taken in
 *    rotation from the last run's cursor under the deadline (`forEachInRotation`): they were one read
 *    cut at 1,000, and an account past the cut was never looked at.
 *  - An account's figures are ONE aggregate, `host_storage_summary` through `readHostStorageSummary`,
 *    the same numbers the dashboard meter and the storage guard read. They used to be summed in
 *    TypeScript from a media list cut at 1,000 rows, so a large account read as under its cap.
 *  - The soft-remove is chunked (`inChunks`): the whole id list rode one URL.
 *
 * ★ THE REDUCE IS PAGED AND BUDGETED (crumbs-37). It read a lapsed host's WHOLE active set before it
 * removed anything, under no deadline, so past roughly 100,000 items one account could spend the sweep's
 * share (and run the invocation into Vercel's kill). It now reads that set largest first a page at a time
 * (`reduceToCap`), soft-removes each page's picks before reading the next, stops reading the moment what
 * is left fits, and asks the deadline before every page. Walking the pages in order removes exactly the
 * items one sort of the whole set would (`takeLargestFirst`). A reduce the deadline stops part way keeps
 * its grace open and sends no mail; the account counts as left, and the next run starts AT it, so a
 * half-reduced account never waits a whole rotation for its turn.
 */
import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import {
  capWithWriteHeadroom,
  effectiveStorageCap,
  PLANS,
  toBillingTier,
} from "@/lib/constants/tiers";
import { QueryFailedError } from "@/lib/db/must-query";
import { readHostStorageSummary } from "@/lib/db/queries/storage";
import { inChunks, MAX_ROWS, readAllPages } from "@/lib/db/read-all";
import {
  overCapGraceStartEmail,
  overCapReducedEmail,
  overCapReminderEmail,
} from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import { tallyNote } from "@/lib/jobs/isolate";
import {
  OVER_CAP_GRACE_DAYS,
  OVER_CAP_REMINDER_DAYS,
} from "@/lib/lifecycle/over-cap";
import { leaveDeleted } from "@/lib/lifecycle/leave-deleted";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { emailDate } from "@/lib/lifecycle/sweeps/email-date";
import {
  forEachInRotation,
  resumeFields,
} from "@/lib/lifecycle/sweeps/rotation";
import { largestFirst, takeLargestFirst } from "@/lib/media/auto-reduce";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";
import { formatBytes } from "@/lib/utils";

/**
 * The candidate floor: the SMALLEST cap any plan grants (Free's 100 MB today), read from
 * `tiers.ts`. `storage_used_bytes` is at least the active bytes, so an account at or under the
 * smallest cap cannot be over any cap. An account in grace is over its cap, so it is over the
 * floor until its removed media purges (by then its grace is cleared): the floor covers the
 * in-grace rows too.
 *
 * ★ DERIVED, NEVER TYPED (the free/pro shift). It was a literal 2 GB, Free's old cap, and the day
 * Free became 100 MB that literal would have skipped every downgraded account storing between the
 * two: no grace, no emails, no reduce, a free host keeping up to 2 GB for good. A downgrade now
 * lands far over Free's cap, so this is the line the grace path starts at.
 */
export const CANDIDATE_FLOOR_BYTES = Math.min(
  ...PLANS.map((plan) => plan.storageBytes),
);

export type OverCapacityTally = {
  candidates: number;
  grace_opened: number;
  reminded: number;
  /** Accounts whose reduce finished this run (its grace cleared, its mail sent). */
  reduced: number;
  /** Items soft-removed this run, a reduce stopped part way's included. */
  items_reduced: number;
  /** Items of her own Deleted that left for good this run, ahead of any she kept. */
  deleted_left: number;
  cleared: number;
  rows_failed: number;
  rows_not_attempted: number;
  rows_note?: string;
  resume_after?: string;
} & Partial<StoppedEarly>;

export type OverCapCandidate = {
  id: string;
  email: string | null;
  tier: string;
  storage_cap_bytes: number | null;
  storage_grace_until: string | null;
};

/** THE READ HALF: every account that could be over a cap, whole, by keyset on id. */
export async function readOverCapCandidates(
  admin: AdminClient,
): Promise<OverCapCandidate[]> {
  const { rows } = await readAllPages(
    "cron/purge: over-cap candidates",
    (after: string | null, limit) => {
      let query = admin
        .from("profiles")
        .select("id, email, tier, storage_cap_bytes, storage_grace_until")
        .gt("storage_used_bytes", CANDIDATE_FLOOR_BYTES)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  return rows;
}

/** Where a page of the reduce ends: its smallest item's size and id (the keyset is size desc, id asc). */
export type ReduceCursor = { size: number; id: string };

/**
 * One page of a host's ACTIVE media (non-removed, in live events), LARGEST FIRST: size descending, then id
 * ascending, after `after`. The reduce's one order (`largestFirst`), so the pages walked in turn are the
 * whole set sorted.
 */
export async function readActivePage(
  admin: AdminClient,
  hostId: string,
  after: ReduceCursor | null,
  limit: number,
): Promise<{ id: string; file_size_bytes: number }[]> {
  let query = admin
    .from("media")
    .select(
      "id, file_size_bytes, events!media_event_id_fkey!inner(host_id, deleted_at)",
    )
    .eq("events.host_id", hostId)
    .is("events.deleted_at", null)
    .neq("status", "removed")
    .order("file_size_bytes", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit);
  if (after) {
    query = query.or(
      `file_size_bytes.lt.${after.size},and(file_size_bytes.eq.${after.size},id.gt.${after.id})`,
    );
  }
  const { data, error } = await query;
  if (error) {
    throw new QueryFailedError("cron/purge: auto-reduce candidates", error);
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    file_size_bytes: Number(row.file_size_bytes),
  }));
}

export type ReduceOutcome = {
  /** True once what is left fits under the cap (or nothing active is left to take). */
  done: boolean;
  /** Items soft-removed by this call. */
  removed: number;
};

/**
 * THE REDUCE, A PAGE AT A TIME: the host's active set read largest first, each page's picks
 * (`takeLargestFirst`) soft-removed as SYSTEM removals before the next page is read, until what is left fits
 * under `cap` or the deadline (asked before every page) stops it. `activeBytes` is the total the picks are taken
 * against: what she keeps by choice (her albums and her own Deleted, from the one aggregate,
 * `host_storage_summary`), which each pick leaves as it becomes the system's removal, so the first pages decide and
 * nothing after the last pick is read. Stopped part way it answers `done: false`: the items it removed stay
 * removed, and the next run's reduce, reading what is still active, carries on from the largest left.
 */
export async function reduceToCap(
  admin: AdminClient,
  hostId: string,
  opts: {
    activeBytes: number;
    cap: number;
    now: Date;
    deadline: Deadline;
    pageSize?: number;
  },
): Promise<ReduceOutcome> {
  const pageSize = opts.pageSize ?? MAX_ROWS;
  let active = opts.activeBytes;
  let after: ReduceCursor | null = null;
  let removed = 0;
  while (active > opts.cap) {
    if (opts.deadline.passed()) return { done: false, removed };
    const page = await readActivePage(admin, hostId, after, pageSize);
    const step = takeLargestFirst(page, active, opts.cap);
    await inChunks("cron/purge: auto-reduce", step.ids, async (chunk) => {
      const { error } = await admin
        .from("media")
        .update({
          status: "removed",
          removed_at: opts.now.toISOString(),
          // QA #2: SYSTEM-binned. What she keeps by choice reads without them (this sweep's own
          // figure, so they never re-trigger it), restoring one stays gated against her cap, and
          // the deadline's first step (`leave_deleted` without `p_system`) never takes back what
          // this run told her stays recoverable.
          removed_by_system: true,
        })
        .in("id", chunk);
      if (error) {
        throw new QueryFailedError("cron/purge: auto-reduce", error);
      }
      return [];
    });
    removed += step.ids.length;
    active = step.activeBytes;
    // A short page is the end of the active set: nothing more to take, whatever is left.
    if (page.length < pageSize) break;
    const last = [...page].sort(largestFirst).at(-1)!;
    after = { size: last.file_size_bytes, id: last.id };
  }
  return { done: true, removed };
}

export async function sweepOverCapacity(
  admin: AdminClient,
  now: Date,
  opts: { deadline?: Deadline; resumeAfter?: string | null } = {},
): Promise<OverCapacityTally> {
  const candidates = await readOverCapCandidates(admin);
  const dashboardUrl = `${await getSiteUrl()}/dashboard`;
  const deadline = opts.deadline ?? NO_DEADLINE;
  let graceOpened = 0;
  let reminded = 0;
  let reduced = 0;
  let itemsReduced = 0;
  let deletedLeft = 0;
  let cleared = 0;
  /** An account whose reduce the deadline stopped part way: the next run starts AT it. */
  let unfinished: string | null = null;

  const clearGrace = async (profileId: string) => {
    const { error } = await admin
      .from("profiles")
      .update({ storage_grace_until: null })
      .eq("id", profileId);
    if (error) throw new QueryFailedError("cron/purge: clear grace", error);
  };

  // ★ PER-ROW ISOLATION (QA #27): this loop opens grace windows, sends email and auto-reduces media,
  // and one bounced address or one bad profile used to abort it, skipping every account behind it
  // for the night. Each account is isolated, and the tally travels with the result so the sweep
  // still closes RED.
  const rotation = await forEachInRotation(
    candidates,
    (p) => p.id,
    opts.resumeAfter ?? null,
    deadline,
    async (p) => {
      const cap = effectiveStorageCap(
        toBillingTier(p.tier),
        p.storage_cap_bytes,
      );
      if (cap === null) return; // an unlimited tier is not subject to the cap

      // It throws the raw PostgREST error (a plain object): wrap it, so the run's note reads it.
      const { activeBytes, deletedBytes, systemBytes } =
        await readHostStorageSummary(p.id).catch((error: unknown) => {
          throw error instanceof Error
            ? error
            : new QueryFailedError(
                "cron/purge: storage summary",
                error as PostgrestError,
              );
        });
      // What she keeps by choice: her albums and her own Deleted, the reduce's own removals left out.
      let kept = activeBytes + deletedBytes - systemBytes;

      // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
      // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
      // them. Once truly over, the reduce below still targets the REAL cap (hysteresis, so it cannot
      // flap).
      if (kept <= capWithWriteHeadroom(cap)) {
        if (p.storage_grace_until) {
          await clearGrace(p.id);
          cleared += 1;
        }
        return;
      }

      if (!p.storage_grace_until) {
        const graceUntil = new Date(
          now.getTime() + OVER_CAP_GRACE_DAYS * 86_400_000,
        );
        const { error } = await admin
          .from("profiles")
          .update({ storage_grace_until: graceUntil.toISOString() })
          .eq("id", p.id);
        if (error) throw new QueryFailedError("cron/purge: open grace", error);
        graceOpened += 1;
        if (p.email) {
          const { subject, html, text } = overCapGraceStartEmail({
            capLabel: formatBytes(cap),
            deadline: emailDate(graceUntil),
            dashboardUrl,
          });
          await sendOnce({
            kind: "over_cap_grace_start",
            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
            profileId: p.id,
            to: p.email,
            subject,
            html,
            text,
          });
        }
        return;
      }

      const graceUntil = new Date(p.storage_grace_until);
      if (now >= graceUntil) {
        // 1. What she already deleted leaves for good first, oldest first, as far as it goes.
        let emptied = false;
        if (kept > cap) {
          const left = await leaveDeleted(admin, p.id, kept - cap);
          deletedLeft += left.items;
          emptied = left.items > 0;
          kept -= left.freedBytes;
        }
        // 2. Then her largest files move to Deleted, as the system's removals, until what she keeps fits.
        const outcome = await reduceToCap(admin, p.id, {
          activeBytes: kept,
          cap,
          now,
          deadline,
        });
        itemsReduced += outcome.removed;
        if (!outcome.done) {
          // Out of time part way: the grace stays open and no mail goes until the reduce finishes, and the
          // next run starts here. The items already removed stay removed (each is a SYSTEM removal,
          // recoverable for the window like the rest will be).
          unfinished = p.id;
          return;
        }
        await clearGrace(p.id);
        reduced += 1;
        if (p.email) {
          const { subject, html, text } = overCapReducedEmail({
            recoverableUntil: emailDate(
              new Date(
                now.getTime() + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
              ),
            ),
            dashboardUrl,
            emptiedDeleted: emptied,
            movedFiles: outcome.removed > 0,
          });
          await sendOnce({
            kind: "over_cap_reduced",
            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
            profileId: p.id,
            to: p.email,
            subject,
            html,
            text,
          });
        }
      } else if (
        now.getTime() >=
        graceUntil.getTime() - OVER_CAP_REMINDER_DAYS * 86_400_000
      ) {
        if (p.email) {
          const { subject, html, text } = overCapReminderEmail({
            deadline: emailDate(graceUntil),
            dashboardUrl,
          });
          const sent = await sendOnce({
            kind: "over_cap_reminder",
            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
            profileId: p.id,
            to: p.email,
            subject,
            html,
            text,
          });
          if (sent) reminded += 1;
        }
      }
    },
    // The profile ID, never the address: a Sentry extra is not the place for a recipient.
    (p, e) =>
      captureError("cron", e, { sweep: "over_capacity", profile_id: p.id }),
  );
  const { tally } = rotation;
  // An account the deadline stopped part way is left too, and the next run starts AT it: the cursor is the
  // candidate before it (none, the lowest id, starts the list from the top, which is it).
  const left = tally.unreached + (unfinished ? 1 : 0);
  const resumeAfter = unfinished
    ? (candidates
        .map((c) => c.id)
        .filter((id) => id < unfinished!)
        .sort()
        .at(-1) ?? null)
    : rotation.resumeAfter;

  return {
    candidates: candidates.length,
    grace_opened: graceOpened,
    reminded,
    reduced,
    items_reduced: itemsReduced,
    deleted_left: deletedLeft,
    cleared,
    // The isolation tally travels WITH the result: `rows_failed` is what makes this sub-sweep's run
    // close as an error, so keeping the accounts behind a bad row alive never buys a green night.
    rows_failed: tally.failed,
    rows_not_attempted: tally.skipped,
    rows_note: tallyNote("accounts", tally) ?? undefined,
    ...(left > 0 ? stoppedEarly(left) : {}),
    ...resumeFields(resumeAfter),
  };
}
