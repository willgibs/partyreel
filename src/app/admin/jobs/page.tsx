import type { Metadata } from "next";

import { AlertTriangle } from "lucide-react";

import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
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
  getJobStates,
  listRecentJobRuns,
  type JobRunRow,
  type JobState,
} from "@/lib/db/queries/jobs";

import {
  JOBS,
  JOB_RUN_NOW_NOTE,
  jobHealth,
  type JobHealth,
  type JobId,
} from "./catalog";
import { JobKillSwitch, RunJobNowButton } from "./job-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jobs" };

// The zero-silent-failure console (admin-portal P8, QA #15). Every backend job, whether it runs on
// Vercel, on Cloudflare or on GitHub, reports here through one heartbeat table: when it last ran,
// what it did, whether it is overdue, and a switch to stop it without a deploy.

const HEALTH_LABEL: Record<JobHealth, string> = {
  ok: "Healthy",
  running: "Running",
  paused: "Paused",
  missed: "Overdue",
  failed: "Last run failed",
  never: "No runs yet",
};

const HEALTH_VARIANT: Record<
  JobHealth,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ok: "secondary",
  running: "secondary",
  paused: "outline",
  missed: "destructive",
  failed: "destructive",
  never: "outline",
};

const HOST_LABEL: Record<string, string> = {
  vercel_cron: "Vercel Cron",
  cloudflare_worker: "Cloudflare Worker",
  github_actions: "GitHub Actions",
};

const RUN_STATUS_LABEL: Record<string, string> = {
  running: "Running",
  ok: "Succeeded",
  error: "Failed",
  skipped: "Skipped",
};

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

/** A compact one-line rendering of a run's counts, so the card says what the run DID, not just that it ran. */
function summarizeCounts(counts: JobRunRow["counts"]): string | null {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    return null;
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(counts)) {
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
    const [flags, states, recent] = await Promise.all([
      getJobFlags(),
      getJobStates(),
      listRecentJobRuns(40),
    ]);
    return { flags, states, recent, nowMs: Date.now(), unavailable: null };
  } catch (e) {
    return {
      flags: null,
      states: [],
      recent: [],
      nowMs: Date.now(),
      unavailable: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function JobsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { flags, states, recent, nowMs, unavailable } = await loadPageData();

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
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
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
        const health = jobHealth({
          def,
          enabled,
          lastRun: state?.lastRun ?? null,
          lastFinishedAtMs: state?.lastFinishedAtMs ?? null,
          nowMs,
        });
        const last = state?.lastRunRow ?? null;
        const counts = summarizeCounts(last?.counts ?? null);

        return (
          <Card key={def.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {def.label}
                  <Badge variant={HEALTH_VARIANT[health]}>
                    {HEALTH_LABEL[health]}
                  </Badge>
                </CardTitle>
                {flags ? (
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
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Last run</dt>
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
                          {last.duration_ms !== null
                            ? `, ${formatDuration(last.duration_ms)}`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </dd>
                </div>
                {counts ? (
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="text-muted-foreground">Reported</dt>
                    <dd className="text-muted-foreground">{counts}</dd>
                  </div>
                ) : null}
                {last?.note ? (
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
                  {JOB_RUN_NOW_NOTE[def.host] ??
                    "Pausing takes effect on the next scheduled run."}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent runs</CardTitle>
          <CardDescription>
            The last {recent.length || 0} runs across every job, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No runs recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Started</th>
                    <th className="py-2 pr-3 font-medium">Job</th>
                    <th className="py-2 pr-3 font-medium">Outcome</th>
                    <th className="py-2 pr-3 font-medium">Trigger</th>
                    <th className="py-2 pr-3 text-right font-medium">Took</th>
                    <th className="py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td
                        className="py-2 pr-3 whitespace-nowrap text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {new Date(r.started_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3">
                        {JOBS.find((j) => j.id === r.job)?.label ?? r.job}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            r.status === "error"
                              ? "text-destructive"
                              : r.status === "ok"
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }
                        >
                          {RUN_STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {r.triggered_by === "manual" ? "Manual" : "Schedule"}
                      </td>
                      <td className="py-2 pr-3 text-right text-muted-foreground tabular-nums">
                        {formatDuration(r.duration_ms)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {r.note ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
