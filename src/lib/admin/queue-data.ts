import "server-only";

import { cache } from "react";

import { buildOperatorQueue, type QueueItem } from "@/lib/admin/queue";
import { readPendingWork } from "@/lib/admin/pending";
import { listJobApplications } from "@/lib/db/queries/applications";
import { listReports } from "@/lib/db/queries/reports";
import { listContactSubmissions } from "@/lib/db/queries/support";

/**
 * THE QUEUE'S DATA, read only where the queue is drawn.
 *
 * The rail's counts ride `readPendingWork()` on every admin page, so they stay
 * head-counts. The AGES cost more (three list reads), and only the home draws
 * them, so they live in their own cached reader rather than being folded into
 * the thing eleven other pages call.
 *
 * ★ THE LISTS ARE ORDERED NEWEST FIRST, SO THE OLDEST IS THE LAST ROW. Cheaper
 * than a second query and exactly as true; if one of those queries ever changes
 * its order this returns the wrong end, which is what the `at(-1)` beside each
 * call is there to make visible.
 */

function oldestMs(rows: { created_at: string }[]): number | null {
  const last = rows.at(-1);
  return last ? new Date(last.created_at).getTime() : null;
}

export const readOperatorQueue = cache(async function readOperatorQueue(
  nowMs = Date.now(),
): Promise<QueueItem[]> {
  const pending = await readPendingWork();

  // Every read is best-effort: the home must still draw its figures and its
  // other rows when one inbox is unreachable, and the row that is missing is
  // the honest consequence of a read that failed rather than a fabricated zero.
  const [support, applicants, reports] = await Promise.all([
    listContactSubmissions("new").catch(() => []),
    listJobApplications("new").catch(() => []),
    // `listReports` presigns a review URL per row, which is local signing and
    // no network, and this is the same read /admin/reports makes.
    listReports("open").catch(() => []),
  ]);

  return buildOperatorQueue({
    health: pending.health,
    support: { count: pending.support, oldestAtMs: oldestMs(support) },
    applicants: { count: pending.applicants, oldestAtMs: oldestMs(applicants) },
    reports: { count: pending.reports, oldestAtMs: oldestMs(reports) },
    nowMs,
  });
});
