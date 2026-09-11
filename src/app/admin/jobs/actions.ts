"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { jobById } from "@/app/admin/jobs/catalog";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { setJobEnabled } from "@/lib/db/queries/jobs";
import { assertCronEnv } from "@/lib/env";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";

// The per-job kill switches and the one Run now the app can honestly offer (admin-portal P8).
// Both re-check authz (admin + AAL2) here; the service-role admin client is the only writer, since
// ops_flags and job_runs are deny-all.

/**
 * Pause or resume one backend job. Takes effect on the job's NEXT run with no deploy: the app-side
 * purge cron reads the flag at the top of its handler, and the Cloudflare and GitHub jobs read it
 * through /api/internal/job-run. Nothing in flight is interrupted.
 */
export async function toggleJobAction(
  jobId: string,
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const def = jobById(jobId);
  if (!def) {
    return { ok: false, code: "unknown", message: "Unknown job." };
  }

  const { error } = await setJobEnabled(def.flagKey, enabled);
  if (error) {
    captureError("admin", new Error(error), {
      action: "toggle_job",
      job: def.id,
      enabled,
    });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't update the switch. Please try again.",
    };
  }

  revalidatePath("/admin/jobs");
  return { ok: true };
}

/**
 * Run the purge sweep now. The app calls its OWN cron route with the cron secret and a manual
 * trigger header, which is the only way to run the sweep without duplicating a thousand lines of
 * lifecycle logic; the route re-checks the kill switch and writes its own heartbeat, so a manual run
 * is a real run in every sense.
 *
 * The wait is deliberately SHORT. The sweep may take up to its 60s maxDuration, and holding a server
 * action open that long to show a spinner is worse than telling the truth: the heartbeat row is the
 * result, so we start the run, wait briefly, and let the operator refresh. Aborting our fetch does
 * NOT cancel the run (the route is already executing server-side); it only stops us waiting.
 */
export async function runJobNowAction(jobId: string): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const def = jobById(jobId);
  if (!def?.canRunNow) {
    return {
      ok: false,
      code: "unknown",
      message: "That job cannot be started from here.",
    };
  }

  let cronSecret: string;
  try {
    cronSecret = assertCronEnv().CRON_SECRET;
  } catch {
    return {
      ok: false,
      code: "unknown",
      message: "The cron secret is not set in this environment.",
    };
  }

  const url = `${await getSiteUrl()}/api/cron/purge`;
  try {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${cronSecret}`,
        "x-job-trigger": "manual",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      captureError("admin", new Error(`run-now HTTP ${res.status}`), {
        action: "run_job_now",
        job: def.id,
      });
      return {
        ok: false,
        code: "unknown",
        message: `The run did not start (HTTP ${res.status}).`,
      };
    }
  } catch (e) {
    // A timeout here means the sweep is STILL RUNNING, which is a success from the operator's point
    // of view. Anything else is a real failure. Distinguishing them keeps the toast honest.
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    if (!timedOut) {
      captureError("admin", e, { action: "run_job_now", job: def.id });
      return {
        ok: false,
        code: "unknown",
        message: "Couldn't start the run. Please try again.",
      };
    }
  }

  revalidatePath("/admin/jobs");
  return { ok: true };
}
