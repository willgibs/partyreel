import "server-only";

import { cache } from "react";

import type { PendingCounts } from "@/lib/admin/nav";
import { countApplicationsByStatus } from "@/lib/db/queries/applications";
import { countOpenReports } from "@/lib/db/queries/reports";
import { countContactByStatus } from "@/lib/db/queries/support";
import { readJobHealth, type JobHealthReport } from "@/lib/jobs/health-summary";

/**
 * EVERYTHING WAITING ON THE OPERATOR, READ ONCE PER REQUEST.
 *
 * Three surfaces want these numbers now, not one: the rail puts a count beside
 * Support, Applicants, Reports and Jobs; the bar's bell carries the same four;
 * and the home's queue ranks them. Before the rail they were read in the layout
 * alone and handed down as props, which is fine for a layout and impossible for
 * a PAGE that needs the same numbers (a layout cannot hand anything to its
 * children in the App Router).
 *
 * ★ React's `cache()` IS WHAT MAKES THAT FREE. The layout and the page render
 * in one request and one React pass, so the second call returns the first
 * call's promise: four head-counts and one heartbeat read, not eight and two.
 * It is per-request memoisation, never a cross-request cache, which is exactly
 * right for a console whose whole job is to be current.
 */

export type PendingWork = PendingCounts & { health: JobHealthReport };

export const readPendingWork = cache(async function readPendingWork(): Promise<PendingWork> {
  const [support, applicants, reports, health] = await Promise.all([
    countContactByStatus("new"),
    countApplicationsByStatus("new"),
    countOpenReports(),
    readJobHealth(),
  ]);
  return {
    support,
    applicants,
    reports,
    // The bell and the rail have nowhere to put "unreadable", and a silent
    // count would be the calm-empty-page lie; the band beside them says it
    // in words (health-summary.ts).
    jobs: health.readable ? health.unhealthy.length : 1,
    health,
  };
});

/**
 * ONE CLOCK READ PER REQUEST.
 *
 * Relative labels ("3h", "2d") need a now, and a page cannot take one: a
 * component body is render, `Date.now()` is impure, and `react-hooks/purity`
 * refuses it on sight (rightly: a value that changes between two renders of the
 * same tree is a value that can tear). A page ASKS for the time instead, and
 * because the ask is cached, every relative label on that page is measured from
 * the same instant rather than from thirteen instants a few microseconds apart.
 */
export const serverNow = cache((): number => Date.now());
