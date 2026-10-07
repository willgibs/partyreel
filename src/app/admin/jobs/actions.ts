"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import { jobById } from "@/app/admin/jobs/catalog";
import { stampPruneHoldRelease } from "@/app/admin/jobs/prune-hold";
import { askRestoreNow } from "@/app/admin/jobs/restore-now";
import { requireAdminAction } from "@/lib/auth/admin-context";
import { rebuildStorageSums } from "@/lib/db/mutations/storage-sums";
import { recordClosedRun, setJobEnabled } from "@/lib/db/queries/jobs";
import {
  readLatestStorageSumsCounts,
  recheckHost,
} from "@/lib/db/queries/storage-sums";
import { assertCronEnv } from "@/lib/env";
import {
  readStorageSumsState,
  rebuildOutcome,
  type RebuildAnswer,
  type Recheck,
  type StorageSumsState,
} from "@/lib/lifecycle/sweeps/storage-sums-state";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuidShape } from "@/lib/validation/uuid-shape";

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
  // A job with no flagKey has nothing to pause (the derived readings and the rolling signals: a
  // switch there would silence the reading, not the work), so its card never draws a switch.
  // Refusing here too keeps the action honest if one is ever forged.
  if (!def?.flagKey) {
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
 * The switches whose home is the spend watch's card (`ops_flags`, the spend watch): guest uploads and lifecycle
 * mail. Downloads and the purge sweep keep theirs where they always lived (/admin/exports, the purge's card), so a
 * switch has one home. Re-checks admin + AAL2 here; anything else named is refused, so a forged key flips nothing.
 */
const WATCH_SWITCHES = ["uploads_enabled", "lifecycle_mail_enabled"] as const;

export async function toggleWatchSwitchAction(
  key: string,
  enabled: boolean,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  if (!(WATCH_SWITCHES as readonly string[]).includes(key)) {
    return { ok: false, code: "unknown", message: "Unknown switch." };
  }
  const { error } = await setJobEnabled(key, enabled);
  if (error) {
    captureError("admin", new Error(error), {
      action: "toggle_watch_switch",
      switch: key,
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
 * RELEASE THE BACKUP PRUNE'S HOLD (the Advisor's Q20; `prune-hold.ts`). The hold never lets a backlog through by
 * itself, so this stamp is the act that does: the Worker's next run reads it from its heartbeat's start answer and
 * goes ahead only if it was pressed after the hold began. It starts nothing (the app cannot start a Cloudflare job),
 * and it changes no switch: a paused prune stays paused, and the pause is the brake if the backlog looks wrong.
 */
export async function releasePruneHoldAction(): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const { error } = await stampPruneHoldRelease();
  if (error) {
    captureError("admin", new Error(error), { action: "release_prune_hold" });
    return {
      ok: false,
      code: "unknown",
      message: "Couldn't release it, so it is still held. Please try again.",
    };
  }

  revalidatePath("/admin/jobs");
  return { ok: true };
}

/**
 * RESTORE NOW, on the backup restore's card (durability-backups.md, "The restore"): asks the backup Worker's door for
 * a pass at once (restore-now.ts), which copies the backup's lone copies back exactly as the daily pass does. The one
 * start the app has for a Cloudflare job, behind the same admin and AAL2 check as every control here; the pass reports
 * on the card, so the press only says whether it began. A refusing or unreachable Worker is a Sentry event; the
 * restore switched off is a state, said in words.
 */
export async function restoreNowAction(): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;

  const answer = await askRestoreNow();
  if (!answer.ok) {
    if (answer.fault) {
      captureError("admin", new Error(answer.message), {
        action: "restore_now",
      });
    }
    return { ok: false, code: "unknown", message: answer.message };
  }

  revalidatePath("/admin/jobs");
  return { ok: true };
}

/**
 * Run a job the app can start, now: the purge sweep or the spend watch. The app calls its OWN cron route (the
 * catalog's `runPath`, the one vercel.json schedules) with the cron secret and a manual trigger header, which is
 * the only way to run a job without duplicating its logic; the route re-checks the kill switch and writes its own
 * heartbeat, so a manual run is a real run in every sense.
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
  if (!def?.canRunNow || !def.runPath) {
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

  const url = `${await getSiteUrl()}${def.runPath}`;
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

/**
 * REBUILD ONE HOST'S STORAGE SUMS, on the storage sums' card (storage-sums-signal): the operator's fix for a host the
 * nightly check named, `rebuild_storage_sums` (her profiles row first, her sum rows made again from her media), then
 * the check of her alone at once, recorded as a closed manual run of the check, so the card follows the fix: she
 * leaves the list when she reads at parity, and the bell stops once no host stays named.
 *
 * ★ requireAdminAction() FIRST (admin + AAL2), then the host must be one the check's own record names, read from the
 * row on the server, never the browser's word: a forged id rebuilds nothing. No typed confirmation: the sums are the
 * database's own reckoning of her items, made again from them, so nothing of hers is lost and the act is reversible
 * in the only sense that matters (rebuilt twice, she reads the same). AUDITED like the account acts (there is no
 * operator audit table, admin-observability.md): its effect, its row on the card, and one Sentry line naming who, whom
 * and both figures.
 */
export async function rebuildStorageSumsAction(
  hostId: string,
): Promise<ActionResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return auth.result;
  if (!isUuidShape(hostId)) {
    return { ok: false, code: "unknown", message: "No such host." };
  }
  const id = hostId.toLowerCase();
  const admin = createAdminClient();

  let state: StorageSumsState;
  let answer: RebuildAnswer;
  try {
    state = readStorageSumsState(await readLatestStorageSumsCounts());
    if (!state.findings.some((f) => f.host_id === id)) {
      return {
        ok: false,
        code: "unknown",
        message:
          "The storage sums' last check does not name that host, so nothing was rebuilt. Refresh for its list.",
      };
    }
    answer = await rebuildStorageSums(admin, id);
  } catch (error) {
    // The rebuild is one transaction: a failure rolled it back whole.
    captureError("admin", error, {
      action: "rebuild_storage_sums",
      host_id: id,
    });
    return {
      ok: false,
      code: "unknown",
      message:
        "The rebuild did not run, so her sums are as they were. Check Sentry before retrying.",
    };
  }

  let recheck: Recheck;
  try {
    recheck = await recheckHost(admin, id);
  } catch (error) {
    // Rebuilt, but unproven: she stays on the list, and the next run checks her first.
    captureError("admin", error, {
      action: "rebuild_storage_sums",
      host_id: id,
      phase: "recheck",
    });
    revalidatePath("/admin/jobs");
    return {
      ok: false,
      code: "unknown",
      message:
        "Rebuilt, but the check after it could not be read, so the card names her until the next run checks her. Check Sentry.",
    };
  }

  const outcome = rebuildOutcome({
    state,
    hostId: id,
    answer,
    recheck,
    now: new Date(),
  });
  const record = await recordClosedRun("storage_sums", "manual", {
    status: outcome.status,
    counts: outcome.counts,
    note: outcome.note,
  });
  if (record.heartbeatError) {
    captureWarning("admin", "job_heartbeat_write_failed", {
      job: "storage_sums",
      phase: "rebuild",
      error: record.heartbeatError,
    });
  }
  captureWarning("admin", "operator_rebuilt_storage_sums", {
    host_id: id,
    operator_id: auth.ctx.userId,
    before: answer.ok ? answer.before : null,
    after: answer.ok ? answer.after : null,
    outcome: recheck.kind,
  });
  revalidatePath("/admin/jobs");

  if (!outcome.settled) {
    captureError(
      "admin",
      new Error("storage sums still drift after a rebuild"),
      {
        action: "rebuild_storage_sums",
        host_id: id,
      },
    );
    return {
      ok: false,
      code: "unknown",
      message:
        "Rebuilt, and she still differs from the walk: the sums' definitions disagree, not her rows. The card keeps her; Sentry has both figures.",
    };
  }
  return { ok: true };
}
