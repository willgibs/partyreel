import "server-only";

import { cache } from "react";

import { buildOperatorQueue, type QueueItem } from "@/lib/admin/queue";
import { readPendingWork } from "@/lib/admin/pending";
import { oldestApplicationAt } from "@/lib/db/queries/applications";
import { oldestOpenReportAt } from "@/lib/db/queries/reports";
import { oldestContactAt } from "@/lib/db/queries/support";

/**
 * THE QUEUE'S DATA, read only where the queue is drawn.
 *
 * The rail's counts ride `readPendingWork()` on every admin page, so they stay
 * head-counts. The AGES are one more read per inbox, and only the home draws
 * them, so they live in their own cached reader rather than being folded into
 * the thing eleven other pages call.
 *
 * ★ "OLDEST WAITING" IS ONE ROW ORDERED OLDEST FIRST (the 1,000-row round,
 * 2026-09-23). It used to be the last row of each inbox's whole list, newest
 * first, which PostgREST cut at 1,000: past that, the "oldest" was merely the
 * thousandth newest, and the home under-reported how long somebody had waited.
 *
 * ★ AND A FAILED READ IS AN ERROR. These reads used to swallow a failure into an
 * empty list, which drew the row with no age and no word: a missing figure that
 * looked like a present one. The rail's head counts beside them already throw on
 * a failed read, so an age does too, and the portal's error screen says so.
 */

function toMs(at: string | null): number | null {
  return at ? new Date(at).getTime() : null;
}

export const readOperatorQueue = cache(async function readOperatorQueue(
  nowMs = Date.now(),
): Promise<QueueItem[]> {
  const [pending, supportAt, applicantsAt, reportsAt] = await Promise.all([
    readPendingWork(),
    oldestContactAt("new"),
    oldestApplicationAt("new"),
    oldestOpenReportAt(),
  ]);

  return buildOperatorQueue({
    health: pending.health,
    support: { count: pending.support, oldestAtMs: toMs(supportAt) },
    applicants: { count: pending.applicants, oldestAtMs: toMs(applicantsAt) },
    reports: { count: pending.reports, oldestAtMs: toMs(reportsAt) },
    nowMs,
  });
});
