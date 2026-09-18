/**
 * The Worker's half of the backend-job heartbeat + kill switch (admin-portal P8, QA #15).
 *
 * This Worker cannot reach the database (no binding, by design), so it reports through the app the
 * same way the prune already confirms gone media: one authenticated POST per phase to
 * `/api/internal/job-run`. The app owns the `ops_flags` read, the `job_runs` rows and the Sentry
 * signal; the Worker only says "starting" and "here is what I did".
 *
 * THE URL IS DERIVED, not configured. `wrangler.jsonc` already carries PRUNE_API_URL
 * (…/api/internal/backup-prune) and the matching PRUNE_API_SECRET, so the job endpoint is its
 * sibling path. Deriving it keeps this change to `src/` and adds no var to deploy, no second secret
 * to rotate, and no way for the two URLs to point at different environments. If the endpoints ever
 * stop being siblings, add a JOB_API_URL var and read it here first.
 *
 * POSTURE, and it differs per job on purpose:
 *   reconcile — fails OPEN. It is the media backup's backstop; not copying is a durability risk,
 *               while a run with no heartbeat is only a blind spot. So an unreachable app means
 *               "run anyway, unlogged".
 *   prune     — fails CLOSED. It is the only job that deletes from the last-resort copy, and it
 *               already refuses to act on any unanswered question. An unreachable app means "skip".
 */

/** Only what the heartbeat needs from the Worker env (the full Env lives in index.ts). */
export type HeartbeatEnv = {
  PRUNE_API_URL?: string;
  PRUNE_API_SECRET?: string;
};

export type JobRunHandle = { runId: string; startedAtMs: number };

export type JobStartResult =
  /** The app answered. `paused` true means it already logged the skipped run; do not run. */
  | { ok: true; paused: boolean; run: JobRunHandle | null }
  /** The app could not be reached or refused. The CALLER decides whether to run anyway. */
  | { ok: false; error: string };

/**
 * Swap the last path segment of the prune endpoint for the job-run one. Returns null for anything
 * that is not a usable absolute URL, so a misconfigured var degrades to "no heartbeat" rather than
 * throwing inside a scheduled handler.
 */
export function jobRunUrlFrom(pruneApiUrl: string | undefined): string | null {
  if (!pruneApiUrl) return null;
  let url: URL;
  try {
    url = new URL(pruneApiUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const segments = url.pathname.split("/");
  if (segments.length < 2) return null;
  segments[segments.length - 1] = "job-run";
  url.pathname = segments.join("/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function post(
  env: HeartbeatEnv,
  body: unknown,
): Promise<{ ok: true; json: unknown } | { ok: false; error: string }> {
  const url = jobRunUrlFrom(env.PRUNE_API_URL);
  if (!url || !env.PRUNE_API_SECRET) {
    return { ok: false, error: "job endpoint not configured" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.PRUNE_API_SECRET}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, json: await res.json() };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/** Ask whether this job may run, and open its heartbeat row if so. */
export async function jobStart(
  env: HeartbeatEnv,
  job: string,
): Promise<JobStartResult> {
  const res = await post(env, { phase: "start", job, triggeredBy: "schedule" });
  if (!res.ok) return { ok: false, error: res.error };

  const payload = res.json as {
    paused?: boolean;
    runId?: string | null;
    startedAtMs?: number;
  };
  if (payload.paused) return { ok: true, paused: true, run: null };
  const run =
    payload.runId && payload.startedAtMs
      ? { runId: payload.runId, startedAtMs: payload.startedAtMs }
      : null;
  return { ok: true, paused: false, run };
}

/**
 * Close the heartbeat row. Best-effort by definition: the work already happened, so a failure here
 * is logged and dropped. A null handle (the start never opened a row) is a no-op.
 *
 * `counts` now also carries the Cloudflare QUEUE and DEAD-LETTER depths (queue-metrics.ts). That is
 * additive by construction: the field has always been a free-form record on both ends, so an app
 * deploy that predates the reader stores the extra keys harmlessly, and one that postdates the
 * Worker deploy simply finds no reading and says so rather than printing a zero.
 */
export async function jobFinish(
  env: HeartbeatEnv,
  job: string,
  run: JobRunHandle | null,
  outcome: {
    status: "ok" | "error";
    counts?: Record<string, number | string | boolean>;
    note?: string;
  },
): Promise<void> {
  if (!run) return;
  const res = await post(env, {
    phase: "finish",
    job,
    runId: run.runId,
    startedAtMs: run.startedAtMs,
    status: outcome.status,
    counts: outcome.counts,
    note: outcome.note,
  });
  if (!res.ok) {
    console.error("heartbeat: finish failed", { job, err: res.error });
  }
}
