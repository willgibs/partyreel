/**
 * SWEEPS 4 AND 6: THE EVENT PASS LEDGER'S TWO NIGHTLY JOBS.
 *
 *  - `expired_passes` re-derives every pass holder's profile from their ledger windows
 *    (billing-caps.md, ledger edition): natural expiry (tier to free, cap to null), a stacked pass
 *    lapsing (150 GB to 75 GB, absorbed by the over-capacity grace), a renewal window opening, and
 *    drift healing after a missed webhook. Candidates: the profiles labelled `event_pass` PLUS the
 *    owners of any unconsumed ledger row (a future-window renewal brings a lapsed label back once it
 *    opens). `storage_used_bytes` is left alone.
 *  - `renewal_nudges` emails the holders whose pass expires within `RENEWAL_NUDGE_DAYS`, so they can
 *    renew (cheaper) before it lapses into the over-capacity grace; `sendOnce` dedupes per
 *    (profile, expiry). An already-expired pass is `expired_passes`' business.
 *
 * WHOLE, AND IN ROTATION (the 1,000-row round, 2026-09-23): each candidate list is read whole through
 * `readAllPages` (it was two reads cut at 1,000 rows each), then taken in id order from the cursor the
 * last run stopped at, one account isolated from the next (`forEachInRotation`: one failing account no
 * longer stops the loop, and its failure is counted), until the deadline.
 */
import "server-only";

import { readAllPages } from "@/lib/db/read-all";
import { recomputePassEntitlement } from "@/lib/db/mutations/event-passes";
import { renewalNudgeEmail } from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import { tallyNote } from "@/lib/jobs/isolate";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import { RENEWAL_NUDGE_DAYS } from "@/lib/lifecycle/renewal";
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
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";

/** What a rotating sweep's tally adds: the isolation counts, and where to resume when it stopped. */
type RotatingTally = {
  rows_failed: number;
  rows_not_attempted: number;
  rows_note?: string;
  resume_after?: string;
} & Partial<StoppedEarly>;

export type ExpiredPassesTally = RotatingTally & {
  candidates: number;
  recomputed: number;
  updated: number;
};

export type RenewalNudgesTally = RotatingTally & {
  eligible: number;
  nudged: number;
};

type SweepOptions = { deadline?: Deadline; resumeAfter?: string | null };

/**
 * THE READ HALF of `expired_passes`: every profile id the recompute must look at, sorted and deduped,
 * from both candidate lists read whole.
 */
export async function readPassCandidates(
  admin: AdminClient,
): Promise<string[]> {
  const [labelled, owners] = await Promise.all([
    readAllPages(
      "cron/purge: event pass holders",
      (after: string | null, limit) => {
        let query = admin
          .from("profiles")
          .select("id")
          .eq("tier", "event_pass")
          .order("id", { ascending: true })
          .limit(limit);
        if (after) query = query.gt("id", after);
        return query;
      },
      (row) => row.id,
    ),
    readAllPages(
      "cron/purge: unconsumed passes",
      (after: string | null, limit) => {
        let query = admin
          .from("event_passes")
          .select("id, profile_id")
          .is("consumed_at", null)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) query = query.gt("id", after);
        return query;
      },
      (row) => row.id,
    ),
  ]);
  const ids = new Set<string>();
  for (const row of labelled.rows) ids.add(row.id);
  for (const row of owners.rows) ids.add(row.profile_id);
  return [...ids].sort();
}

export async function sweepExpiredPasses(
  admin: AdminClient,
  now: Date,
  opts: SweepOptions = {},
): Promise<ExpiredPassesTally> {
  const ids = await readPassCandidates(admin);
  let updated = 0;
  const { tally, resumeAfter } = await forEachInRotation(
    ids,
    (id) => id,
    opts.resumeAfter ?? null,
    opts.deadline ?? NO_DEADLINE,
    async (id) => {
      if ((await recomputePassEntitlement(id, now)) === "updated") updated += 1;
    },
    (id, e) =>
      captureError("cron", e, { sweep: "expired_passes", profile_id: id }),
  );
  return {
    candidates: ids.length,
    recomputed: tally.processed,
    updated,
    rows_failed: tally.failed,
    rows_not_attempted: tally.skipped,
    rows_note: tallyNote("accounts", tally) ?? undefined,
    ...(tally.unreached > 0 ? stoppedEarly(tally.unreached) : {}),
    ...resumeFields(resumeAfter),
  };
}

type RenewalCandidate = {
  id: string;
  email: string | null;
  tier_expires_at: string | null;
};

/** THE READ HALF of `renewal_nudges`: every pass holder whose pass expires inside the window, whole. */
export async function readRenewalCandidates(
  admin: AdminClient,
  now: Date,
): Promise<RenewalCandidate[]> {
  const cutoff = new Date(
    now.getTime() + RENEWAL_NUDGE_DAYS * 86_400_000,
  ).toISOString();
  const { rows } = await readAllPages(
    "cron/purge: renewal candidates",
    (after: string | null, limit) => {
      let query = admin
        .from("profiles")
        .select("id, email, tier_expires_at")
        .eq("tier", "event_pass")
        .not("tier_expires_at", "is", null)
        .gt("tier_expires_at", now.toISOString())
        .lte("tier_expires_at", cutoff)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) query = query.gt("id", after);
      return query;
    },
    (row) => row.id,
  );
  return rows;
}

export async function sweepRenewalNudges(
  admin: AdminClient,
  now: Date,
  opts: SweepOptions = {},
): Promise<RenewalNudgesTally> {
  const candidates = await readRenewalCandidates(admin, now);
  const renewUrl = `${await getSiteUrl()}/dashboard`;
  let nudged = 0;
  const { tally, resumeAfter } = await forEachInRotation(
    candidates,
    (p) => p.id,
    opts.resumeAfter ?? null,
    opts.deadline ?? NO_DEADLINE,
    async (p) => {
      if (!p.email || !p.tier_expires_at) return;
      const { subject, html } = renewalNudgeEmail({
        expiresOn: emailDate(new Date(p.tier_expires_at)),
        renewUrl,
      });
      const sent = await sendOnce({
        kind: "renewal_nudge",
        dedupeKey: `${p.id}:${p.tier_expires_at}`,
        profileId: p.id,
        to: p.email,
        subject,
        html,
      });
      if (sent) nudged += 1;
    },
    (p, e) =>
      captureError("cron", e, { sweep: "renewal_nudges", profile_id: p.id }),
  );
  return {
    eligible: candidates.length,
    nudged,
    rows_failed: tally.failed,
    rows_not_attempted: tally.skipped,
    rows_note: tallyNote("accounts", tally) ?? undefined,
    ...(tally.unreached > 0 ? stoppedEarly(tally.unreached) : {}),
    ...resumeFields(resumeAfter),
  };
}
