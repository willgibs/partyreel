/**
 * SWEEP 5: OVER-CAPACITY RETENTION FOR LAPSED PAID ACCOUNTS (a Free account is blocked at upload
 * before it can pass its cap, so it never lands here). Decisions key off ACTIVE bytes (non-removed
 * media in live events), never `storage_used_bytes` (which drops only at hard-delete), so an account
 * already reduced does not re-trigger while its removed media waits out the window. Per account:
 *   under the line        → clear any grace (resolved by an upgrade or their own deletes);
 *   over + no grace       → open a 45-day grace + the grace-start email;
 *   over + grace, near    → the reminder (within OVER_CAP_REMINDER_DAYS of the deadline);
 *   over + grace elapsed  → auto-reduce (soft-remove largest-first; the removed_media sweep reclaims
 *                           the bytes after the window) + the reduced email.
 * Every email goes through `sendOnce`, so a re-run never re-sends.
 *
 * WHOLE (the 1,000-row round, 2026-09-23; H9 and H10):
 *  - The candidates (every profile past the smallest cap) are read whole by keyset, then taken in
 *    rotation from the last run's cursor under the deadline (`forEachInRotation`): they were one read
 *    cut at 1,000, and an account past the cut was never looked at.
 *  - An account's active bytes are ONE aggregate, `host_storage_summary` through
 *    `readHostStorageSummary`, the same number the dashboard meter and the storage guard read. They
 *    used to be summed in TypeScript from a media list cut at 1,000 rows, so a large account read as
 *    under its cap.
 *  - The auto-reduce candidates are the host's active media read whole by keyset, and the soft-remove
 *    is chunked (`inChunks`): the whole id list rode one URL.
 */
import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import {
  capWithWriteHeadroom,
  effectiveStorageCap,
  toBillingTier,
} from "@/lib/constants/tiers";
import { QueryFailedError } from "@/lib/db/must-query";
import { readHostStorageSummary } from "@/lib/db/queries/storage";
import { inChunks, readAllPages } from "@/lib/db/read-all";
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
import { selectForAutoReduce } from "@/lib/media/auto-reduce";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";
import { formatBytes } from "@/lib/utils";

/**
 * The candidate floor. `storage_used_bytes` is at least the active bytes, and the smallest cap is
 * Free's 2 GB, so an account at or under 2 GB used cannot be over any cap. An account in grace is
 * over its cap, so it is over 2 GB used until its removed media purges (by then its grace is
 * cleared): the floor covers the in-grace rows too.
 */
export const FREE_CAP_BYTES = 2 * 1024 ** 3;

export type OverCapacityTally = {
  candidates: number;
  grace_opened: number;
  reminded: number;
  reduced: number;
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
        .gt("storage_used_bytes", FREE_CAP_BYTES)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  return rows;
}

/** A host's ACTIVE media (non-removed, in live events), whole: what auto-reduce chooses from. */
export async function readActiveMedia(
  admin: AdminClient,
  hostId: string,
): Promise<{ id: string; file_size_bytes: number }[]> {
  const { rows } = await readAllPages(
    "cron/purge: auto-reduce candidates",
    (after: string | null, limit) => {
      let query = admin
        .from("media")
        .select(
          "id, file_size_bytes, events!media_event_id_fkey!inner(host_id, deleted_at)",
        )
        .eq("events.host_id", hostId)
        .is("events.deleted_at", null)
        .neq("status", "removed")
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  return rows.map((row) => ({
    id: row.id,
    file_size_bytes: Number(row.file_size_bytes),
  }));
}

export async function sweepOverCapacity(
  admin: AdminClient,
  now: Date,
  opts: { deadline?: Deadline; resumeAfter?: string | null } = {},
): Promise<OverCapacityTally> {
  const candidates = await readOverCapCandidates(admin);
  const dashboardUrl = `${await getSiteUrl()}/dashboard`;
  let graceOpened = 0;
  let reminded = 0;
  let reduced = 0;
  let cleared = 0;

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
  const { tally, resumeAfter } = await forEachInRotation(
    candidates,
    (p) => p.id,
    opts.resumeAfter ?? null,
    opts.deadline ?? NO_DEADLINE,
    async (p) => {
      const cap = effectiveStorageCap(
        toBillingTier(p.tier),
        p.storage_cap_bytes,
      );
      if (cap === null) return; // an unlimited tier is not subject to the cap

      // It throws the raw PostgREST error (a plain object): wrap it, so the run's note reads it.
      const { activeBytes } = await readHostStorageSummary(p.id).catch(
        (error: unknown) => {
          throw error instanceof Error
            ? error
            : new QueryFailedError(
                "cron/purge: storage summary",
                error as PostgrestError,
              );
        },
      );

      // ENGAGE at the write-path line, not the bare cap (QA #26): uploads are accepted up to
      // cap + cap/10, so a host inside that deliberate headroom is exactly where the product put
      // them. Once truly over, the reduce below still targets the REAL cap (hysteresis, so it cannot
      // flap).
      if (activeBytes <= capWithWriteHeadroom(cap)) {
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
          const { subject, html } = overCapGraceStartEmail({
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
          });
        }
        return;
      }

      const graceUntil = new Date(p.storage_grace_until);
      if (now >= graceUntil) {
        const ids = selectForAutoReduce(
          await readActiveMedia(admin, p.id),
          cap,
        );
        await inChunks("cron/purge: auto-reduce", ids, async (chunk) => {
          const { error } = await admin
            .from("media")
            .update({
              status: "removed",
              removed_at: now.toISOString(),
              // QA #2: SYSTEM-binned, so sweepStandbyBudget (same invocation, seconds later) leaves
              // them out. Without it the standby sweep hard-deletes the media this sweep just
              // promised the host was recoverable for 30 days.
              removed_by_system: true,
            })
            .in("id", chunk);
          if (error) {
            throw new QueryFailedError("cron/purge: auto-reduce", error);
          }
          return [];
        });
        await clearGrace(p.id);
        reduced += 1;
        if (p.email) {
          const { subject, html } = overCapReducedEmail({
            recoverableUntil: emailDate(
              new Date(
                now.getTime() + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
              ),
            ),
            dashboardUrl,
          });
          await sendOnce({
            kind: "over_cap_reduced",
            dedupeKey: `${p.id}:${graceUntil.toISOString()}`,
            profileId: p.id,
            to: p.email,
            subject,
            html,
          });
        }
      } else if (
        now.getTime() >=
        graceUntil.getTime() - OVER_CAP_REMINDER_DAYS * 86_400_000
      ) {
        if (p.email) {
          const { subject, html } = overCapReminderEmail({
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
          });
          if (sent) reminded += 1;
        }
      }
    },
    // The profile ID, never the address: a Sentry extra is not the place for a recipient.
    (p, e) =>
      captureError("cron", e, { sweep: "over_capacity", profile_id: p.id }),
  );

  return {
    candidates: candidates.length,
    grace_opened: graceOpened,
    reminded,
    reduced,
    cleared,
    // The isolation tally travels WITH the result: `rows_failed` is what makes this sub-sweep's run
    // close as an error, so keeping the accounts behind a bad row alive never buys a green night.
    rows_failed: tally.failed,
    rows_not_attempted: tally.skipped,
    rows_note: tallyNote("accounts", tally) ?? undefined,
    ...(tally.unreached > 0 ? stoppedEarly(tally.unreached) : {}),
    ...resumeFields(resumeAfter),
  };
}
