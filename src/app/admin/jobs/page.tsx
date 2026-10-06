import type { Metadata } from "next";
import { Fragment } from "react";

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
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
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
import { readLatestLimits } from "@/lib/jobs/limits-watch-run";
import { readLatestWatchRun } from "@/lib/jobs/spend-watch-run";
import { readSwitches } from "@/lib/jobs/spend-watch-switches";
import { RESUME_KEY } from "@/lib/jobs/sweep-tally";

import { AttentionLine } from "./attention-line";
import {
  JOBS,
  JOB_RUN_NOW_NOTE,
  healthLabel,
  jobHealth,
  readDepth,
  readDepthAgeMinutes,
  type DepthSource,
  type JobHealth,
  type JobId,
  type JobReading,
} from "./catalog";
import {
  JobKillSwitch,
  PruneHoldControl,
  RunJobNowButton,
} from "./job-controls";
import { PlanLimitsCard, type LatestLimits } from "./limits-card";
import { owedWords } from "./owed-words";
import { readLastPruneReport, readPruneHoldReleasedAtMs } from "./prune-hold";
import { pruneHoldView, type PruneHoldView } from "./prune-hold-view";
import { reconcileView, type ReconcileLine } from "./reconcile-view";
import { RestoreNowControl } from "./restore-control";
import { restoreNowWired } from "./restore-now";
import { restoreView, type RestoreLine } from "./restore-view";
import {
  SpendWatchReadings,
  SpendWatchSwitches,
  type LatestWatchRun,
} from "./spend-watch-card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jobs" };

// The zero-silent-failure console (admin-portal P8, QA #15). Every backend job, whether it runs on
// Vercel, on Cloudflare, on GitHub or inside another job, reports here through one heartbeat table:
// when it last ran, what it did, whether it is overdue, and a switch to stop it without a deploy.
//
// THREE KINDS OF CARD, one per catalog kind (catalog.ts explains the split). They share the card,
// the badge and the definition list deliberately — an operator should not have to learn three
// layouts to read one console — and differ only in the three or four facts that genuinely differ.

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
  help_feedback: { ok: "clicks recorded", failed: "clicks dropped" },
  export_delivery: { ok: "downloads finished", failed: "failed" },
  drive_transfer: { ok: "files in hosts' Drives", failed: "failures" },
  pass_credit: { ok: "credits honoured", failed: "deliveries failed" },
};

/**
 * What a `derived` reading counts (and the term its number takes, "Depth" when none is named), and the remedy to say
 * when it is not zero.
 */
const READING_LABEL: Partial<
  Record<JobId, { unit: string; remedy: string; term?: string }>
> = {
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
  // The remedy, said where the alert is (durability-restore): the restore copies them back on its own, only keys a
  // live row names and never over an object that is there, and a person copies by hand only what it cannot.
  backup_primary_missing: {
    term: "Keys",
    unit: "held by the backup alone",
    remedy:
      "The backup restore below copies each back on its own while its RESTORE_MODE is on (a dry run until then): only keys a live row still names, never over an object that is there. Its card says what it copied and what it could not; Restore now there runs a pass at once. A key it cannot copy back is copied by hand from partyreel-backup into partyreel at the same key (durability-backups.md, Restore); the prune never deletes one while its row lives.",
  },
  drive_queue: {
    unit: "lanes waiting",
    remedy:
      "Lanes drain on their own; a connection runs at most three, oldest send first.",
  },
  drive_dead_letters: {
    unit: "lanes given up on",
    remedy:
      "Read the lane's error in Workers Logs for partyreel-drive (drive-lane). Its connection paused itself at three in a day: Resume it on /admin/exports once the cause is fixed, then purge the dead letters from the Cloudflare dashboard.",
  },
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

/**
 * One line of a job's words (the restore's pass, the reconcile's): what waits on a person in the band's attention voice,
 * a quiet fact muted, work done plain.
 */
function viewLine(line: RestoreLine | ReconcileLine) {
  return line.tone === "attention" ? (
    <AttentionLine key={line.text}>{line.text}</AttentionLine>
  ) : (
    <p
      key={line.text}
      className={line.tone === "quiet" ? "text-muted-foreground" : undefined}
    >
      {line.text}
    </p>
  );
}

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
      parts.push(`${key.replaceAll("_", " ")} ${formatCount(value)}`);
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

/**
 * The spend watch's card reads two more things: its last run that took readings (the newest of all may be a pause's
 * skipped row) and the switches it can stop. Each failure stays on the card in words, never blanking the console.
 */
async function loadWatchData(): Promise<{
  latest: LatestWatchRun | null;
  latestError: string | null;
  switches: Awaited<ReturnType<typeof readSwitches>> | null;
  switchesError: string | null;
}> {
  const [latest, switches] = await Promise.allSettled([
    readLatestWatchRun(),
    readSwitches(),
  ]);
  const message = (r: PromiseRejectedResult) =>
    r.reason instanceof Error ? r.reason.message : String(r.reason);
  return {
    latest: latest.status === "fulfilled" ? latest.value : null,
    latestError: latest.status === "rejected" ? message(latest) : null,
    switches: switches.status === "fulfilled" ? switches.value : null,
    switchesError: switches.status === "rejected" ? message(switches) : null,
  };
}

/**
 * The plan limits' card reads the newest run that carried them (the spend watch's run takes them; the newest of all may
 * be a pause's skipped row, or a run from before it learned them). A failed read stays on the card in words, never
 * blanking the console or drawing a calm card.
 */
async function loadLimitsData(): Promise<{
  latest: LatestLimits | null;
  error: string | null;
}> {
  try {
    return { latest: await readLatestLimits(), error: null };
  } catch (e) {
    return { latest: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * The backup prune's hold, for its card: its last report from a run that ran and the last release pressed. A hold
 * read that fails draws no control rather than a wrong one; a stamp that cannot be read reads as none, so a hold
 * still offers its release (pressing again only stamps again).
 */
async function loadPruneHold(): Promise<PruneHoldView> {
  const [report, released] = await Promise.allSettled([
    readLastPruneReport(),
    readPruneHoldReleasedAtMs(),
  ]);
  if (report.status === "rejected") return null;
  return pruneHoldView({
    counts: report.value,
    releasedAtMs: released.status === "fulfilled" ? released.value : null,
  });
}

export default async function JobsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [
    { flags, states, recent, signals, nowMs, unavailable },
    watch,
    limits,
    pruneHold,
  ] = await Promise.all([
    loadPageData(),
    loadWatchData(),
    loadLimitsData(),
    loadPruneHold(),
  ]);
  // Restore now asks the backup Worker's own door: drawn wired only where the app knows where it is.
  const restoreWired = restoreNowWired();

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
        const owed = def.kind === "signal" ? owedWords(def.id, signal) : null;
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
        // The restore's card reads its last pass in words of its own, in place of the raw counts.
        const restore =
          def.id === "backup_restore"
            ? restoreView(last?.counts ?? null)
            : null;
        // So does the reconcile's: its pass (it carries a cursor), its last whole pass, what waits on a person.
        const reconcile =
          def.id === "backup_reconcile"
            ? reconcileView(last?.counts ?? null)
            : null;

        return (
          <Fragment key={def.id}>
            {/* The palette jumps to a job's card rather than throwing its switch
              (lib/admin/palette.ts), so the id is part of that contract. */}
            <Card id={`job-${def.id}`} className="scroll-mt-20">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    {def.label}
                    <Badge variant={healthBadge(health)}>
                      {healthLabel(def, health)}
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
                              {signal.failed24h}{" "}
                              {signalWords?.failed ?? "failed"}
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
                          <span className="text-muted-foreground">
                            Not read
                          </span>
                        )}
                      </dd>
                    </div>
                  ) : null}

                  {/* What the path still owes past its grace (crumbs-75): a notice waiting to send, a download
                    with no end. Nothing failed in the window, so this line is what says it. */}
                  {owed ? (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="text-muted-foreground">{owed.term}</dt>
                      <dd className="min-w-0 flex-1">
                        <AttentionLine>{owed.line}</AttentionLine>
                      </dd>
                    </div>
                  ) : null}

                  {def.kind === "derived" ? (
                    <>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">
                          {readingWords?.term ?? "Depth"}
                        </dt>
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
                              {formatCount(reading.value)}{" "}
                              {readingWords?.unit ?? ""}
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Read</dt>
                        <dd>
                          {reading?.readAtMs ? (
                            <span>
                              {formatAdminTimestamp(reading.readAtMs)}
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
                            <span>{formatAdminTimestamp(last.started_at)}</span>{" "}
                            <span className="text-muted-foreground">
                              {RUN_STATUS_LABEL[last.status] ?? last.status}
                              {last.duration_ms !== null &&
                              def.kind !== "signal"
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

                  {restore ? (
                    <>
                      <div className="flex gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Mode</dt>
                        <dd>{restore.modeWords}</dd>
                      </div>
                      {restore.lines.length > 0 ? (
                        <div className="flex gap-2 sm:col-span-2">
                          <dt className="text-muted-foreground">Last pass</dt>
                          <dd className="min-w-0 flex-1 space-y-1">
                            {restore.lines.map(viewLine)}
                          </dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {reconcile ? (
                    <>
                      <div className="flex gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">Pass</dt>
                        <dd className="min-w-0 flex-1">
                          {viewLine(reconcile.pass)}
                        </dd>
                      </div>
                      <div className="flex gap-2 sm:col-span-2">
                        <dt className="text-muted-foreground">
                          Last full pass
                        </dt>
                        <dd className="min-w-0 flex-1">
                          {viewLine(reconcile.lastPass)}
                        </dd>
                      </div>
                      {reconcile.lines.length > 0 ? (
                        <div className="flex gap-2 sm:col-span-2">
                          <dt className="text-muted-foreground">Found</dt>
                          <dd className="min-w-0 flex-1 space-y-1">
                            {reconcile.lines.map(viewLine)}
                          </dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {counts &&
                  def.kind === "scheduled" &&
                  def.id !== "spend_watch" &&
                  def.id !== "backup_restore" &&
                  !reconcile ? (
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

                {def.id === "spend_watch" ? (
                  // The watch's own card: its readings against their ceilings, and what it can stop.
                  <div className="space-y-5 border-t border-border pt-3">
                    <SpendWatchReadings
                      latest={watch.latest}
                      unreadable={watch.latestError}
                    />
                    <SpendWatchSwitches
                      switches={watch.switches}
                      latest={watch.latest?.run ?? null}
                      unreadable={watch.switchesError}
                    />
                  </div>
                ) : null}

                {def.id === "backup_prune" && pruneHold ? (
                  <div className="border-t border-border pt-3">
                    <PruneHoldControl view={pruneHold} />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                  {def.canRunNow ? (
                    <RunJobNowButton jobId={def.id} label={def.label} />
                  ) : null}
                  {def.id === "backup_restore" ? (
                    <RestoreNowControl wired={restoreWired} />
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {/* The remedy, said where the problem is: a dead letter is not stuck forever. Only beside a count
                      to act on (crumbs-75): "No reading" is no lone copy to restore, so it keeps the host's note. */}
                    {def.id === "backup_restore"
                      ? restoreWired
                        ? "Restore now asks its Worker for a pass at once; otherwise it runs daily with the reconcile and after each prune."
                        : "Restore now is not wired here: set BACKUP_WORKER_URL to the backup Worker's origin. It runs daily with the reconcile and after each prune."
                      : def.kind === "derived" &&
                          health !== "ok" &&
                          readingWords &&
                          (reading?.value ?? 0) > 0
                        ? readingWords.remedy
                        : (JOB_RUN_NOW_NOTE[def.host] ??
                          "Pausing takes effect on the next scheduled run.")}
                  </p>
                </div>
              </CardContent>
            </Card>
            {def.id === "spend_watch" ? (
              // The plan limits ride the spend watch's run: their card sits beside its own.
              <PlanLimitsCard
                latest={limits.latest}
                unreadable={limits.error}
                nowMs={nowMs}
              />
            ) : null}
          </Fragment>
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
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatAdminTimestamp(r.started_at)}
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
