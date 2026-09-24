/**
 * SWEEP 7: FREE-TIER INACTIVITY REMOVAL. A free event is active while the LATEST of its host's
 * `last_active_at`, the event's created/updated and its newest upload is within about six months.
 * Past that: a warning email (14 days out), then a soft-delete (`deleted_at`; the trigger derives
 * `purge_at`, so sweep 1 reclaims it after the window) and a recoverable-tail email. Free tier only
 * (the PRD): paid accounts keep their events until they cancel. The pure decision is
 * `inactivityAction` (`src/lib/lifecycle/inactivity.ts`).
 *
 * WHOLE, ACROSS RUNS (the 1,000-row round, 2026-09-23; H11). The candidates were one read cut at
 * 1,000 rows, so an event past the cut was never warned nor removed. They are now read in keyset
 * batches on the event id, starting after the cursor the last run stopped at, each event isolated,
 * until the deadline; a run that stops stores its cursor and says how many candidates it left
 * (counted), and the next run carries on from there. A run that reaches the end of the list clears
 * the cursor, so the next starts from the lowest id: every candidate is examined once per turn.
 *
 * THE PRE-FILTER can only drop events whose verdict is already "none": the freshness clock is a MAX,
 * so an event is due for a warning only when EVERY input (the event's `updated_at` and the host's
 * `last_active_at` included) is past the warning line. Filtering both in SQL keeps an active free
 * host's old events out of the candidate list entirely; the newest upload is still asked per event.
 */
import "server-only";

import { mustCount, mustQuery, QueryFailedError } from "@/lib/db/must-query";
import { MAX_ROWS, readAllPages } from "@/lib/db/read-all";
import {
  inactivityRemovedEmail,
  inactivityWarningEmail,
} from "@/lib/email/templates";
import { sendOnce } from "@/lib/email/send";
import {
  emptyTally,
  forEachIsolated,
  tallyNote,
  type IsolatedTally,
} from "@/lib/jobs/isolate";
import {
  INACTIVE_DAYS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";
import type { AdminClient } from "@/lib/lifecycle/reclaim";
import { RECENTLY_DELETED_WINDOW_DAYS } from "@/lib/lifecycle/recently-deleted";
import {
  NO_DEADLINE,
  stoppedEarly,
  type Deadline,
  type StoppedEarly,
} from "@/lib/lifecycle/sweep-budget";
import { emailDate } from "@/lib/lifecycle/sweeps/email-date";
import { resumeFields } from "@/lib/lifecycle/sweeps/rotation";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";

export type InactivityTally = {
  candidates: number;
  warned: number;
  removed: number;
  rows_failed: number;
  rows_not_attempted: number;
  rows_note?: string;
  resume_after?: string;
} & Partial<StoppedEarly>;

type InactiveCandidate = {
  id: string;
  name: string;
  host_id: string;
  created_at: string;
  updated_at: string;
  profiles: { email: string | null; last_active_at: string };
};

// Disambiguate the events->profiles embed by FK name: profile_shown_events (event_id + user_id ->
// profiles) makes PostgREST infer a SECOND, many-to-many events<->profiles relationship, so a bare
// `profiles!inner` is ambiguous ("more than one relationship was found") and the sweep throws. Pin the
// direct host FK; the `profiles.*` filters still target it by resource name.
const CANDIDATE_SELECT =
  "id, name, host_id, created_at, updated_at, profiles!events_host_id_fkey!inner(tier, email, last_active_at)";

/** The warning line: an event is a candidate only when its every freshness input is older. */
export function warnCutoff(now: Date): string {
  return new Date(
    now.getTime() - (INACTIVE_DAYS - WARN_BEFORE_DAYS) * 86_400_000,
  ).toISOString();
}

/** THE READ HALF: one keyset page of free, live, stale events past `after`, ascending by id. */
export function inactiveCandidatesPage(
  admin: AdminClient,
  now: Date,
  after: string | null,
  limit: number,
) {
  const cutoff = warnCutoff(now);
  let query = admin
    .from("events")
    .select(CANDIDATE_SELECT)
    .eq("profiles.tier", "free")
    .lte("profiles.last_active_at", cutoff)
    .is("deleted_at", null)
    .lte("updated_at", cutoff)
    .order("id", { ascending: true })
    .limit(limit);
  if (after) query = query.gt("id", after);
  return query;
}

/** How many candidates stand past `after`: what a stopped run left. */
export async function countInactiveCandidates(
  admin: AdminClient,
  now: Date,
  after: string | null,
): Promise<number> {
  const cutoff = warnCutoff(now);
  let query = admin
    .from("events")
    .select("id, profiles!events_host_id_fkey!inner(tier)", {
      count: "exact",
      head: true,
    })
    .eq("profiles.tier", "free")
    .lte("profiles.last_active_at", cutoff)
    .is("deleted_at", null)
    .lte("updated_at", cutoff);
  if (after) query = query.gt("id", after);
  return mustCount(query, "cron/purge: inactivity candidates left");
}

export async function sweepInactiveFreeEvents(
  admin: AdminClient,
  now: Date,
  opts: { deadline?: Deadline; resumeAfter?: string | null } = {},
): Promise<InactivityTally> {
  const deadline = opts.deadline ?? NO_DEADLINE;
  const nowMs = now.getTime();
  const dashboardUrl = `${await getSiteUrl()}/dashboard`;
  let warned = 0;
  let removed = 0;
  let candidates = 0;
  const total: IsolatedTally = emptyTally();

  const examine = async (e: InactiveCandidate) => {
    // Newest upload (any status: a recent upload means the event is still in use). mustQuery,
    // because this read can only ever move the verdict toward DELETION: swallowed, a failed query
    // looked identical to "this event has never had an upload", so a busy album whose other
    // timestamps were old got warned and then removed. A transient error fails this one event (the
    // next run retries it), never silently ages out a live one.
    const media = await mustQuery(
      admin
        .from("media")
        .select("created_at")
        .eq("event_id", e.id)
        .order("created_at", { ascending: false })
        .limit(1),
      "cron/purge: newest upload for inactivity",
    );
    const latestUpload = media?.[0]?.created_at;

    const activityMs = Math.max(
      new Date(e.profiles.last_active_at).getTime(),
      new Date(e.created_at).getTime(),
      new Date(e.updated_at).getTime(),
      latestUpload ? new Date(latestUpload).getTime() : 0,
    );
    const action = inactivityAction(activityMs, nowMs);
    if (action === "none") return;

    if (action === "remove") {
      // purge_at is DERIVED by the set_event_purge_at trigger from deleted_at (single source,
      // un-spoofable). The email's "recoverable until" date is computed here only for the copy.
      const purgeAt = new Date(
        nowMs + RECENTLY_DELETED_WINDOW_DAYS * 86_400_000,
      );
      const { error } = await admin
        .from("events")
        .update({ deleted_at: now.toISOString() })
        .eq("id", e.id)
        .is("deleted_at", null);
      if (error) {
        throw new QueryFailedError("cron/purge: inactive soft-delete", error);
      }
      removed += 1;
      if (e.profiles.email) {
        const { subject, html } = inactivityRemovedEmail({
          eventName: e.name,
          recoverableUntil: emailDate(purgeAt),
          dashboardUrl,
        });
        await sendOnce({
          kind: "inactivity_removed",
          dedupeKey: e.id,
          profileId: e.host_id,
          to: e.profiles.email,
          subject,
          html,
        });
      }
    } else if (e.profiles.email) {
      const { subject, html } = inactivityWarningEmail({
        eventName: e.name,
        deadline: emailDate(new Date(activityMs + INACTIVE_DAYS * 86_400_000)),
        dashboardUrl,
      });
      const sent = await sendOnce({
        kind: "inactivity_warning",
        dedupeKey: `${e.id}:${activityMs}`,
        profileId: e.host_id,
        to: e.profiles.email,
        subject,
        html,
      });
      if (sent) warned += 1;
    }
  };

  let after: string | null = opts.resumeAfter ?? null;
  // Where the next run starts (null: from the lowest id), and whether the deadline is why.
  let resumeAt: string | null = null;
  let stopped = false;
  for (;;) {
    if (deadline.passed()) {
      stopped = true;
      resumeAt = after;
      break;
    }
    const batch = await readAllPages(
      "cron/purge: inactivity candidates",
      (cursor: string | null, limit) =>
        inactiveCandidatesPage(admin, now, cursor, limit),
      (event) => event.id,
      { budget: MAX_ROWS, after },
    );
    const rows = batch.rows as unknown as InactiveCandidate[];
    candidates += rows.length;

    // ★ PER-ROW ISOLATION (QA #27): this loop SOFT-DELETES a host's event and emails them about it,
    // so one bad row used to mean every candidate behind it was neither warned nor removed that
    // night, with nothing but one `{ error }` on the parent run to show for it.
    const tally = await forEachIsolated(rows, examine, {
      onError: (e, error) =>
        captureError("cron", error, {
          sweep: "inactive_free_events",
          // The event id, never the host's address.
          event_id: e.id,
        }),
      stopWhen: () => deadline.passed(),
    });
    total.processed += tally.processed;
    total.failed += tally.failed;
    total.skipped += tally.skipped;
    total.aborted ||= tally.aborted;
    total.firstError ??= tally.firstError;

    // Resume after the last event this run got to (or where it began, if it got to none). The
    // deadline stopping it is `stopped_early`; five failures in a row aborting it is a failure
    // (`rows_not_attempted`), which still resumes where it broke off.
    const attempted = tally.processed + tally.failed;
    if (tally.unreached > 0 || tally.skipped > 0) {
      stopped = tally.unreached > 0;
      resumeAt = attempted > 0 ? rows[attempted - 1].id : after;
      break;
    }
    if (!batch.more) break;
    after = batch.after;
  }

  return {
    candidates,
    warned,
    removed,
    rows_failed: total.failed,
    rows_not_attempted: total.skipped,
    rows_note: tallyNote("events", total) ?? undefined,
    ...(stopped
      ? stoppedEarly(await countInactiveCandidates(admin, now, resumeAt))
      : {}),
    ...resumeFields(resumeAt),
  };
}
