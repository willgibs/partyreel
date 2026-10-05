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
 *   under the line        → clear any grace (resolved by an upgrade or by freeing room for good), unless
 *                           the grace is due and she is still over the cap itself (a reduce left part
 *                           way finishes);
 *   over + no grace       → open a 45-day grace + the grace-start email;
 *   over + grace, near    → the reminder (within OVER_CAP_REMINDER_DAYS of the deadline);
 *   over + grace elapsed  → make room: first what she already deleted leaves for good, oldest first, a
 *                           batch a call under the deadline (`leave_deleted`, never the system's own
 *                           removals, and whatever her Make room from Deleted says, since the reduce is
 *                           not an upload: nothing she kept is touched while her own Deleted can cover
 *                           it), then her largest files move to Deleted as the system's removals (the
 *                           removed_media sweep reclaims them after the window), + the reduced email.
 * Every email goes through `sendOnce`, so a re-run never re-sends; the two one-time notices (the grace's
 * start, the reduce) a send failed on are kept and retried here first thing each run (`retryParkedNotices`).
 *
 * WHOLE (the 1,000-row round, 2026-09-23; H9 and H10; crumbs-75):
 *  - ★ THE CANDIDATES ARE EXACTLY THE ACCOUNTS THERE IS SOMETHING TO DO FOR (crumbs-75), read by one SQL
 *    function a page (`over_capacity_candidates`, 20261005060000): every account in a grace, or keeping more
 *    than her own write line, each with the `host_storage_summary` it was judged on. They were every profile
 *    past the smallest plan's cap (every paying host), each asked for that summary in a call of its own, so
 *    past a few hundred paying hosts a night's share reached only some and an account that had just gone
 *    over waited nights for its turn. They are still taken in rotation from the last run's cursor under the
 *    deadline (`forEachInRotation`), so a list longer than a night (a mass downgrade) is still whole in turn.
 *  - An account's figures are ONE aggregate, `host_storage_summary`, the same numbers the dashboard meter
 *    and the storage guard read, here as the candidate read hands them over. They used to be summed in
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


import {
  capWithWriteHeadroom,
  effectiveStorageCap,
  toBillingTier,
} from "@/lib/constants/tiers";
import { QueryFailedError } from "@/lib/db/must-query";
import {
  inChunks,
  MAX_ROWS,
  readAllPages,
  type AllPages,
  type PageResult,
} from "@/lib/db/read-all";
import {
  overCapGraceStartEmail,
  overCapReducedEmail,
  overCapReminderEmail,
} from "@/lib/email/templates";
import {
  retryParkedNotices,
  sendOnce,
  type NoticeRetryTally,
} from "@/lib/email/send";
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
} & NoticeRetryTally &
  Partial<StoppedEarly>;

/**
 * One account the sweep has something to do for, as `over_capacity_candidates` answers it: her plan, her grace, and
 * the `host_storage_summary` she was judged on (`deleted_bytes` is the summary's `standby_bytes`, her Deleted).
 */
export type OverCapCandidate = {
  id: string;
  email: string | null;
  tier: string;
  storage_cap_bytes: number | null;
  storage_grace_until: string | null;
  active_bytes: number;
  deleted_bytes: number;
  system_bytes: number;
};

/**
 * Candidates a call. Each is a whole storage aggregate summed inside the call, which runs under PostgREST's 8 s
 * statement_timeout (the service role's too), so a page stays small enough that its sums never could; the SQL stops
 * at this many, and the read loops while a page comes back full.
 */
export const CANDIDATE_PAGE = 100;

/** One page of candidates after `after`, ascending by id: PostgREST's answer as `readAllPages` takes it. */
function candidatesPage(
  admin: AdminClient,
  after: string | null,
  limit: number,
): PromiseLike<PageResult<OverCapCandidate>> {
  return admin.rpc("over_capacity_candidates", {
    // The generated Args take no null: an absent p_after is the SQL default (null), the first page.
    p_after: after ?? undefined,
    p_limit: limit,
  });
}

/**
 * THE READ HALF: every account in a grace or keeping past her own write line, whole, a page of `CANDIDATE_PAGE` at a
 * time by keyset on id. A bigint arrives as a JSON number; each is read as one, so a figure is never a string.
 */
export async function readOverCapCandidates(
  admin: AdminClient,
): Promise<OverCapCandidate[]> {
  const rows: OverCapCandidate[] = [];
  let after: string | null = null;
  for (;;) {
    const page: AllPages<OverCapCandidate, string> = await readAllPages(
      "cron/purge: over-cap candidates",
      (cursor: string | null, limit) => candidatesPage(admin, cursor, limit),
      (row) => row.id,
      { budget: CANDIDATE_PAGE, after },
    );
    for (const row of page.rows) {
      rows.push({
        ...row,
        storage_cap_bytes:
          row.storage_cap_bytes === null ? null : Number(row.storage_cap_bytes),
        active_bytes: Number(row.active_bytes),
        deleted_bytes: Number(row.deleted_bytes),
        system_bytes: Number(row.system_bytes),
      });
    }
    if (!page.more) return rows;
    after = page.after;
  }
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

/**
 * IS A KEPT GRACE-START NOTICE STILL SO? Its key names the grace it announced (`<profile>:<the grace's end>`, as the
 * sweep opens one), so it goes only while that very grace stands and she still keeps past her write line, by this
 * run's candidate read: a grace cleared since (she upgraded, or freed room for good), or one she has come back inside
 * (which this very run then clears), is never announced late.
 */
export function graceNoticeStillTrue(
  notice: { dedupeKey: string; profileId: string },
  candidates: readonly OverCapCandidate[],
): boolean {
  const c = candidates.find((row) => row.id === notice.profileId);
  if (!c?.storage_grace_until) return false;
  const announced = `${c.id}:${new Date(c.storage_grace_until).toISOString()}`;
  if (notice.dedupeKey !== announced) return false;
  const cap = effectiveStorageCap(toBillingTier(c.tier), c.storage_cap_bytes);
  return (
    cap !== null &&
    c.active_bytes + c.deleted_bytes - c.system_bytes >
      capWithWriteHeadroom(cap)
  );
}

export async function sweepOverCapacity(
  admin: AdminClient,
  now: Date,
  opts: { deadline?: Deadline; resumeAfter?: string | null } = {},
): Promise<OverCapacityTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const candidates = await readOverCapCandidates(admin);
  // Then the grace and reduce notices an earlier run could not send. It never throws, and its failures are the mail
  // signal's (`email_delivery`), so they ride the tally without failing the sweep. A grace's start goes only while
  // that grace still stands and she still keeps past her line (`graceNoticeStillTrue`, judged on this run's read);
  // the reduce's always goes, since it says what was done.
  const notices = await retryParkedNotices({
    kinds: ["over_cap_grace_start", "over_cap_reduced"],
    now,
    stopWhen: () => deadline.passed(),
    stillTrue: (notice) =>
      notice.kind !== "over_cap_grace_start" ||
      graceNoticeStillTrue(notice, candidates),
  });
  const dashboardUrl = `${await getSiteUrl()}/dashboard`;
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

      // What she keeps by choice: her albums and her own Deleted, the reduce's own removals left out, from the one
      // aggregate the candidate read judged her on (`host_storage_summary`).
      const deletedBytes = p.deleted_bytes;
      const systemBytes = p.system_bytes;
      let kept = p.active_bytes + deletedBytes - systemBytes;
      const graceDue =
        p.storage_grace_until !== null &&
        now >= new Date(p.storage_grace_until);

      // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
      // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
      // them. Once truly over, the reduce below still targets the REAL cap (hysteresis, so it cannot
      // flap). ★ And once the grace is due, the reduce finishes to that cap even inside the headroom
      // (trash-in-storage): a run its deadline stopped part way, leaving her Deleted or moving her
      // files, is finished by the next, never cleared half done with no mail.
      if (kept <= capWithWriteHeadroom(cap) && !(graceDue && kept > cap)) {
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
        // 1. What she already deleted leaves for good first, oldest first, as far as it goes: a batch a
        // call (`leaveDeleted`, the Advisor's Q23), asking the deadline before each, so a large Deleted
        // never runs one statement past its timeout nor the sweep past its window. Out of time part
        // way, the account is left like a reduce stopped part way: the next run starts at it.
        let emptied = false;
        let ownDeleted = deletedBytes - systemBytes;
        while (kept > cap && ownDeleted > 0) {
          if (deadline.passed()) {
            unfinished = p.id;
            return;
          }
          const left = await leaveDeleted(admin, p.id, kept - cap);
          deletedLeft += left.items;
          if (left.items > 0) emptied = true;
          kept -= left.freedBytes;
          ownDeleted -= left.freedBytes;
          if (!left.more) break;
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
    ...notices,
    // The isolation tally travels WITH the result: `rows_failed` is what makes this sub-sweep's run
    // close as an error, so keeping the accounts behind a bad row alive never buys a green night.
    rows_failed: tally.failed,
    rows_not_attempted: tally.skipped,
    rows_note: tallyNote("accounts", tally) ?? undefined,
    ...(left > 0 ? stoppedEarly(left) : {}),
    ...resumeFields(resumeAfter),
  };
}
