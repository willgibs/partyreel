import Link from "next/link";

import type { JobHealthReport } from "@/lib/jobs/health-summary";
import { cn } from "@/lib/utils";

/**
 * THE BAND UNDER THE BAR (`health=portal`, Will 2026-09-20: "a band under the
 * bar, on every page ... On a good day it is not there at all").
 *
 * A signal you have to navigate to is one you check when you already suspect,
 * and /admin/jobs was the only place in the portal that said anything about the
 * backend at all. This says it on whichever page you are reading, and costs
 * nothing on a healthy day because on a healthy day it does not render.
 *
 * ★ AN UNREADABLE HEARTBEAT NEVER SAYS "1 JOB". That is the console's own
 * failure mode in its purest form: a health signal inventing the answer it
 * exists to go and find. The bell has nowhere to put a sentence and rings once;
 * the band has a whole row, so it says what actually happened and sends the
 * operator to the page that says why.
 */
export function HealthBand({ health }: { health: JobHealthReport }) {
  if (health.readable && health.unhealthy.length === 0) return null;

  const failed = !health.readable || health.unhealthy.some((j) => j.health === "failed");

  return (
    <div
      data-slot="health-band"
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-2 text-working lg:px-4",
        failed
          ? "border-destructive/25 bg-destructive/6"
          : "border-warning/30 bg-warning/8",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 shrink-0 rounded-full",
          failed ? "bg-destructive" : "bg-warning",
        )}
      />
      {health.readable ? (
        <>
          <span className="font-medium">{sentence(health)}</span>
          <span className="text-muted-foreground">
            {heartbeat(health.heartbeatAgeMs)}
            {health.pausedCount > 0
              ? ` ${health.pausedCount} ${health.pausedCount === 1 ? "job is" : "jobs are"} paused on purpose.`
              : ""}
          </span>
        </>
      ) : (
        <>
          <span className="font-medium">
            The backend heartbeat could not be read.
          </span>
          <span className="text-muted-foreground">
            Every job&rsquo;s health is unknown until this read succeeds.
          </span>
        </>
      )}
      <Link
        href="/admin/jobs"
        className="ml-auto shrink-0 font-medium underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
      >
        Open the console
      </Link>
    </div>
  );
}

/** The jobs by name while there are few enough to name, then a count. */
function sentence(health: JobHealthReport): string {
  const names = health.unhealthy.map((j) => j.label);
  if (names.length === 1) return `${names[0]} needs a look.`;
  if (names.length === 2) return `${names[0]} and ${names[1]} need a look.`;
  if (names.length === 3)
    return `${names[0]}, ${names[1]} and ${names[2]} need a look.`;
  return `${names.length} backend jobs need a look.`;
}

function heartbeat(ageMs: number | null): string {
  if (ageMs === null) return "No job has ever finished a run.";
  const hours = Math.floor(ageMs / 3_600_000);
  if (hours < 1) return "Last heartbeat under an hour ago.";
  if (hours < 48) return `Last heartbeat ${hours} hours ago.`;
  return `Last heartbeat ${Math.floor(hours / 24)} days ago.`;
}
