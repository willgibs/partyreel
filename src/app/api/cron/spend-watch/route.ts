/**
 * THE SPEND WATCH'S CRON (vercel.json, daily before launch; hourly at launch on Pro). Reads our own counters, alerts
 * past ten times the week's busiest and pauses what a trip may pause (`src/lib/jobs/spend-watch-run.ts`; the rules
 * in `spend-watch.ts`; admin-observability.md, "The spend watch"). The same run reads every vendor's plan meter against
 * its limit and mails what newly crossed (`limits-watch-run.ts`; "Plan limits"), so Hobby's two crons stay two.
 *
 * ITS OWN ROUTE, NEVER A RIDE ON THE PURGE'S: it must run while the purge is paused, it may be the one pausing it,
 * and it is the one job that asks after the purge's own silence.
 *
 * AUTH: the purge's exactly. Vercel sends `Authorization: Bearer $CRON_SECRET`; no secret configured, or a mismatch,
 * runs nothing (500 / 401), compared in constant time. Run now on /admin/jobs calls it with the same secret and
 * `x-job-trigger: manual`.
 */
import { constantTimeEquals } from "@/lib/crypto/constant-time";
import type { JobTrigger } from "@/lib/db/queries/jobs";
import { assertCronEnv } from "@/lib/env";
import { runSpendWatch } from "@/lib/jobs/spend-watch-run";
import { captureError } from "@/lib/observability/sentry";
import { servesApp } from "@/lib/surface";

// The service-role client and node:crypto need the Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A run is one RPC, up to 30 pages of Resend's list, the plan limits' reads (one Vercel GET with a 10 s timeout, up to
// 40 more pages of Resend's list, two small RPCs, side by side) and a few small writes: seconds, tens at the very worst,
// so two minutes of headroom rather than a function killed mid-run with its row left "running".
export const maxDuration = 120;

export async function GET(request: Request): Promise<Response> {
  let cronSecret: string;
  try {
    cronSecret = assertCronEnv().CRON_SECRET;
  } catch {
    // Fail closed: better a watch that does not run than one anyone can run.
    return new Response("Cron not configured", { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!constantTimeEquals(authHeader, `Bearer ${cronSecret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // vercel.json is one file, so BOTH Vercel projects register this cron. The app surface's run is the watch; the
  // admin deployment answers and stops before any read, since a second run a day would fake the cadence and
  // halve every rate the watch measures (the purge route's guard, for the same reason).
  if (!servesApp()) {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "not_this_surface",
      ran_at: new Date().toISOString(),
    });
  }

  const trigger: JobTrigger =
    request.headers.get("x-job-trigger") === "manual" ? "manual" : "schedule";
  try {
    const outcome = await runSpendWatch({ trigger });
    return Response.json({ ok: true, ...outcome });
  } catch (e) {
    // The run guards every step itself; this is the belt to its braces, never a silent 200.
    captureError("cron", e, { job: "spend_watch" });
    return Response.json({ ok: false }, { status: 500 });
  }
}
