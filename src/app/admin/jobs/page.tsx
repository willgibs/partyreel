import type { Metadata } from "next";

import { AlertTriangle } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { healthBadge, runBadge, runRow } from "@/lib/admin/tone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  getJobFlags,
  getJobSignals,
  getJobStates,
  listRecentJobRuns,
  type JobRunRow,
  type JobSignals,
  type JobState,
} from "@/lib/db/queries/jobs";
import { RESUME_KEY } from "@/lib/jobs/sweep-tally";

import {
  JOBS,
  JOB_RUN_NOW_NOTE,
  jobHealth,
  readDepth,
  readDepthAgeMinutes,
  type DepthSource,
  type JobHealth,
  type JobId,
  type JobReading,
} from "./catalog";
import { JobKillSwitch, RunJobNowButton } from "./job-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jobs" };

// The zero-silent-failure console (admin-portal P8, QA #15). Every backend job, whether it runs on
// Vercel, on Cloudflare, on GitHub or inside another job, reports here through one heartbeat table:
// when it last ran, what it did, whether it is overdue, and a switch to stop it without a deploy.
//
// THREE KINDS OF CARD, one per catalog kind (catalog.ts explains the split). They share the card,
// the badge and the definition list deliberately — an operator should not have to learn three
// layouts to read one console — and differ only in the three or four facts that genuinely differ.

const HEALTH_LABEL: Record<JobHealth, string> = {
  ok: "Healthy",
  running: "Running",
  paused: "Paused",
  missed: "Overdue",
  failed: "Last run failed",
  attention: "Needs a look",
  never: "No runs yet",
};

// HEALTH_VARIANT used to live here, greyscale but for a red failure. The four states now speak in
// four voices and the map is `lib/admin/tone.ts`, so the chip on this card and the tint on the row
// below it are one decision (`colour=rows`, Will 2026-09-20).

const HOST_LABEL: Record<string, string> = {
  vercel_cron: "Vercel Cron",
  cloudflare_worker: "Cloudflare Worker",
  github_actions: "GitHub Actions",
  purge_sweep: "Inside the purge sweep",
  app: "This app",
};

const RUN_STATUS_LABEL: Record<string, string> = {
  running: "Running",
  ok: "Succeeded",
  error: "Failed",
  skipped: "Skipped",
};

/**
 * What a signal job's two numbers MEAN, in its own words. A shared "N ok, N failed" would read as
 * nonsense: "40 sent" and "40 failed unlocks recorded" are both healthy and are not the same kind of
 * fact. Presentation, so it lives on the page rather than in the catalog.
 */
const SIGNAL_LABEL: Partial<Record<JobId, { ok: string; failed: string }>> = {
  email_delivery: { ok: "sent", failed: "failed or refused" },
  abuse_limiter: { ok: "actions recorded", failed: "limiter errors" },
  unlock_limiter: { ok: "failed unlocks recorded", failed: "limiter errors" },
};

/** What a `derived` reading counts, and the remedy to say when it is not zero. */
const READING_LABEL: Partial<Record<JobId, { unit: string; remedy: string }>> =
  {
    backup_queue: {
      unit: "waiting to copy",
      remedy:
        "A backlog drains on its own; the daily reconcile copies anything the live queue never reached.",
    },
    backup_dead_letters: {
      unit: "given up on",
      remedy:
        "The daily backup reconcile copies anything the live queue missed, so a dead letter clears on its next run.",
    },
  };

/** A signal job's "No activity" reads differently from a scheduled job's "No runs yet". */
const NEVER_LABEL: Record<string, string> = {
  signal: "No activity",
  derived: "No reading",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} hours`;
  return `${Math.round(hours / 24)} days`;
}

/**
 * What a run that stopped early LEFT leads the line (the 1,000-row round: a sweep's time budget ran
 * out, and the backlog it left is the thing to see), ahead of the six-part cut below.
 */
const LEAD_COUNT_KEYS = ["remaining", "sweeps_stopped_early"];

/** A compact one-line rendering of a run's counts, so the card says what the run DID, not just that it ran. */
function summarizeCounts(counts: JobRunRow["counts"]): string | null {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const lead = (key: string) => (LEAD_COUNT_KEYS.includes(key) ? 0 : 1);
  const entries = Object.entries(counts)
    // A rotating sweep's resume cursor is bookkeeping for its next run, not a fact for the card.
    .filter(([key]) => key !== RESUME_KEY)
    .sort(([a], [b]) => lead(a) - lead(b));
  const parts: string[] = [];
  for (const [key, value] of entries) {
    if (typeof value === "number" && value > 0) {
      parts.push(`${key.replaceAll("_", " ")} ${value}`);
    }
    if (typeof value === "string")
      parts.push(`${key.replaceAll("_", " ")} ${value}`);
  }
  return parts.length ? parts.slice(0, 6).join(", ") : null;
}

type PageData = {
  flags: Record<JobId, boolean> | null;
  states: JobState[];
  recent: JobRunRow[];
  signals: JobSignals;
  /** Read once, outside the render, so every card judges freshness against the SAME instant (and
   * so the render itself stays pure, which the React Compiler lint enforces). */
  nowMs: number;
  /** Set when the heartbeat could not be read. Shown LOUDLY: an empty page must never read as healthy. */
  unavailable: string | null;
};

/**
 * The reads are wrapped, not swallowed. Before the migration is applied the table does not exist,
 * and in a real outage it is unreachable, and BOTH must show the operator a banner rather than a
 * calm page of empty cards: a health console that renders "nothing to report" when it cannot read
 * anything is the exact failure this surface was built to end.
 */
async function loadPageData(): Promise<PageData> {
  try {
    const [flags, states, recent, signals] = await Promise.all([
      getJobFlags(),
      getJobStates(),
      listRecentJobRuns(40),
      getJobSignals(),
    ]);
    return {
      flags,
      states,
      recent,
      signals,
      nowMs: Date.now(),
      unavailable: null,
    };
  } catch (e) {
    return {
      flags: null,
      states: [],
      recent: [],
      signals: {},
      nowMs: Date.now(),
      unavailable: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function JobsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { flags, states, recent, signals, nowMs, unavailable } =
    await loadPageData();

  // Health resolves in TWO passes because a `derived` reading inherits the health of the run that
  // carried it: the Worker's own verdict has to exist before the queue and dead-letter cards can say
  // whether their number is fresh. Both passes go through the one `jobHealth`, so the page and the
  // alerting scan still share a single definition of healthy.
  const healthById = new Map<JobId, JobHealth>();
  for (const def of JOBS) {
    if (def.kind === "derived") continue;
    const state = states.find((s) => s.job === def.id);
    healthById.set(
      def.id,
      jobHealth({
        def,
        enabled: flags?.[def.id] ?? true,
        lastRun: state?.lastRun ?? null,
        lastFinishedAtMs: state?.lastFinishedAtMs ?? null,
        nowMs,
        signal: signals[def.id] ?? null,
      }),
    );
  }

  const depthSources: DepthSource[] = states.map((s) => ({
    job: s.job,
    counts: s.lastRunRow?.counts ?? null,
    startedAtMs: s.lastRun?.startedAtMs ?? null,
    health: healthById.get(s.job) ?? "never",
  }));

  const readingById = new Map<JobId, JobReading | null>();
  for (const def of JOBS) {
    if (def.kind !== "derived") continue;
    const reading = readDepth(def, depthSources);
    readingById.set(def.id, reading);
    healthById.set(
      def.id,
      jobHealth({
        def,
        // A derived reading has nothing to pause, so it is never "paused" — see catalog.ts.
        enabled: true,
        lastRun: null,
        lastFinishedAtMs: null,
        nowMs,
        reading,
      }),
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <PageHeading>Jobs</PageHeading>
        <p className="text-sm text-muted-foreground">
          Every backend job, its last runs, and the switch that stops it.
        </p>
      </div>

      {unavailable ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" aria-hidden />
              Heartbeat unreadable
            </CardTitle>
            <CardDescription>
              Nothing below is a health signal right now. Either the job_runs
              migration has not been applied yet, or the database is
              unreachable. The jobs themselves keep running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md bg-muted px-2.5 py-2 text-xs break-all text-muted-foreground select-all">
              {unavailable}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {JOBS.map((def) => {
        const state = states.find((s) => s.job === def.id);
        const enabled = flags?.[def.id] ?? true;
        const health = healthById.get(def.id) ?? "never";
        const last = state?.lastRunRow ?? null;
        const counts = summarizeCounts(last?.counts ?? null);
        const signal = signals[def.id] ?? null;
        const signalWords = SIGNAL_LABEL[def.id];
        const reading = readingById.get(def.id) ?? null;
        const readingWords = READING_LABEL[def.id];
        // The age rides the SAME run that carried the depth, so find that run rather than the
        // newest one: a stale reading and a fresh one must never be mixed on one card.
        const readingSource =
          reading?.readAtMs !== null && reading?.readAtMs !== undefined
            ? (states.find((s) => s.lastRun?.startedAtMs === reading.readAtMs)
                ?.lastRunRow?.counts ?? null)
            : null;
        const readingAgeMin = readDepthAgeMinutes(def, readingSource);

        return (
          // The palette jumps to a job's card rather than throwing its switch
          // (lib/admin/palette.ts), so the id is part of that contract.
          <Card key={def.id} id={`job-${def.id}`} className="scroll-mt-20">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  {def.label}
                  <Badge variant={healthBadge(health)}>
                    {health === "never"
                      ? (NEVER_LABEL[def.kind] ?? HEALTH_LABEL.never)
                      : HEALTH_LABEL[health]}
                  </Badge>
                </CardTitle>
                {flags && def.flagKey ? (
                  <JobKillSwitch
                    jobId={def.id}
                    label={def.label}
                    enabled={enabled}
                  />
                ) : null}
              </div>
              <CardDescription>{def.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Schedule</dt>
                  <dd>{def.cadence}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Runs on</dt>
                  <dd>{HOST_LABEL[def.host] ?? def.host}</dd>
                </div>

                {def.kind === "signal" ? (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Last 24 hours</dt>
                    <dd>
                      {signal ? (
                        <>
                          {signal.ok24h} {signalWords?.ok ?? "ok"},{" "}
                          <span
                            className={
                              signal.failed24h > 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            {signal.failed24h} {signalWords?.failed ?? "failed"}
                          </span>
                          {/* The failure count is a FLOOR, not a census: the log damps a burst to
                              one row per quarter hour per instance, so "3" means at least three.
                              Said here rather than left to be read as exact. */}
                          {signal.failed24h > 0 ? (
                            <span className="text-muted-foreground">
                              {" "}
                              (at least; Sentry has every event)
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not read</span>
                      )}
                    </dd>
                  </div>
                ) : null}

                {def.kind === "derived" ? (
                  <>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Depth</dt>
                      <dd>
                        {!reading || reading.value === null ? (
                          <span className="text-muted-foreground">
                            No reading
                          </span>
                        ) : (
                          <span
                            className={
                              health === "failed" || health === "attention"
                                ? "text-destructive"
                                : undefined
                            }
                          >
                            {reading.value} {readingWords?.unit ?? ""}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Read</dt>
                      <dd>
                        {reading?.readAtMs ? (
                          <span suppressHydrationWarning>
                            {new Date(reading.readAtMs).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </dd>
                    </div>
                    {readingAgeMin !== null ? (
                      <div className="flex gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">
                          Oldest message
                        </dt>
                        <dd>{formatMinutes(readingAgeMin)}</dd>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">
                      {def.kind === "signal" ? "Last failure" : "Last run"}
                    </dt>
                    <dd>
                      {last ? (
                        <>
                          {/* Locale/tz formatting differs between the server render and the browser
                            (the React #418 trap in admin-observability.md), so suppress here. */}
                          <span suppressHydrationWarning>
                            {new Date(last.started_at).toLocaleString()}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {RUN_STATUS_LABEL[last.status] ?? last.status}
                            {last.duration_ms !== null && def.kind !== "signal"
                              ? `, ${formatDuration(last.duration_ms)}`
                              : ""}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          {def.kind === "signal" ? "None recorded" : "Never"}
                        </span>
                      )}
                    </dd>
                  </div>
                )}

                {counts && def.kind === "scheduled" ? (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Reported</dt>
                    <dd className="text-muted-foreground">{counts}</dd>
                  </div>
                ) : null}
                {last?.note && def.kind !== "derived" ? (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Note</dt>
                    <dd>{last.note}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                {def.canRunNow ? (
                  <RunJobNowButton jobId={def.id} label={def.label} />
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {/* The remedy, said where the problem is: a dead letter is not stuck forever. */}
                  {def.kind === "derived" && health !== "ok" && readingWords
                    ? readingWords.remedy
                    : (JOB_RUN_NOW_NOTE[def.host] ??
                      "Pausing takes effect on the next scheduled run.")}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>
            The last {recent.length || 0} runs across every job, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {recent.length === 0 ? (
            <p className="px-6 text-working text-muted-foreground">
              No runs recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead className="text-right">Took</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  // His note on `colour=rows`: "Makes it a bit harder to miss."
                  // A failed run tints its own row and takes a leading edge, so
                  // a bad run is found by scrolling rather than by reading.
                  <TableRow key={r.id} tone={runRow(r.status)}>
                    <TableCell
                      className="whitespace-nowrap text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {new Date(r.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {JOBS.find((j) => j.id === r.job)?.label ?? r.job}
                    </TableCell>
                    <TableCell>
                      <Badge variant={runBadge(r.status)}>
                        {RUN_STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.triggered_by === "manual" ? "Manual" : "Schedule"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatDuration(r.duration_ms)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.note ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
