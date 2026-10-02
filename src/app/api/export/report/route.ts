/**
 * THE WORKER'S WORD, KEPT (`export-ends`): the export Worker's signed reports, written where the portal, the
 * walk and the health console read them. The Worker cannot reach the database, so this is the one way what it
 * saw reaches the app, and the app stays the one writer of `export_log` and `job_runs`.
 *
 *   check      → the export's row: when the Worker answered, how many it found (or that the bucket could
 *                not answer, which is also a failure of `export_delivery`).
 *   start      → the export's row: its stream began (the walk's toast now waits for the end).
 *   end        → the export's row: how the stream ended (saved, short, stopped, failed, empty), the files it
 *                held whole and the ids it lacks (the walk's Try again). A broken one is a failure too.
 *   heartbeat  → a closed `job_runs` row of the `export` job: the Worker's daily self-check, skipped while
 *                downloads are paused (`export_enabled`, the job's switch) or the Worker's own switch is off.
 *
 * AUTH: the report's own MAC (the export secret in its `report:` domain, `lib/export/report.ts`), checked
 * before a field is read, and its freshness (five minutes), so a captured report cannot be replayed later;
 * every row write only fills an empty field (`queries/exports.ts`). Fails closed: unset secret 500, a bad
 * MAC 403, anything malformed 400. No session and no cookie: the Worker is the only caller.
 *
 * The answer is for the Worker's log alone (it never retries): 204 kept, 503 when the write failed.
 */
import { assertExportEnv } from "@/lib/env";
import {
  recordStreamEnd,
  recordStreamStart,
  recordWorkerCheck,
  type ReportWrite,
} from "@/lib/db/queries/exports";
import {
  isJobEnabled,
  recordClosedRun,
  recordSkippedRun,
} from "@/lib/db/queries/jobs";
import { verifyReport, type WorkerReport } from "@/lib/export/report";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { captureError, captureWarning } from "@/lib/observability/sentry";

// The service-role admin client requires the Node runtime; never edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A report's ceiling: an end report naming every id of a 2,000-item zip is about 100 KB on the wire. */
const MAX_REPORT_BYTES = 256 * 1024;

const kept = () => new Response(null, { status: 204 });

/** A write the app could not keep: said to Sentry, and to the Worker's log as a 503. */
function unkept(kind: string, write: ReportWrite): Response | null {
  if (!write.error) return null;
  captureWarning("export", "export_report_write_failed", {
    kind,
    error: write.error,
  });
  return new Response("Not kept", { status: 503 });
}

/** The daily heartbeat, as a closed run of the `export` job (`app/admin/jobs/catalog.ts`). */
async function keepHeartbeat(
  report: Extract<WorkerReport, { kind: "heartbeat" }>,
): Promise<Response> {
  let enabled = true;
  try {
    enabled = await isJobEnabled("export");
  } catch (e) {
    // The switch is unreadable: the beat is still kept (a missing heartbeat would read as a dead Worker).
    captureError("cron", e, { job: "export", phase: "flag_read" });
  }
  const paused = !enabled
    ? "Paused from /admin/exports: downloads are off (export_enabled)."
    : report.mode === "off"
      ? "The Worker's own switch is off (EXPORT_MODE)."
      : null;
  if (paused) {
    const skip = await recordSkippedRun("export", "schedule", paused);
    if (skip.heartbeatError) {
      captureWarning("cron", "job_heartbeat_write_failed", {
        job: "export",
        phase: "skip",
        error: skip.heartbeatError,
      });
      return new Response("Not kept", { status: 503 });
    }
    return kept();
  }

  const run = await recordClosedRun("export", "schedule", {
    status: report.r2 === "ok" ? "ok" : "error",
    counts: { r2: report.r2 },
    note:
      report.r2 === "ok"
        ? undefined
        : "The Worker could not read the bucket: every download would fail.",
  });
  if (report.r2 !== "ok") {
    captureWarning("export", "export_worker_bucket_unreadable", {
      job: "export",
    });
  }
  if (run.heartbeatError) {
    captureWarning("cron", "job_heartbeat_write_failed", {
      job: "export",
      phase: "beat",
      error: run.heartbeatError,
    });
    return new Response("Not kept", { status: 503 });
  }
  return kept();
}

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = assertExportEnv().EXPORT_SIGNING_SECRET;
  } catch {
    // Fail closed: with no secret nothing can be verified, so nothing is kept.
    return new Response("Reports not configured", { status: 500 });
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_REPORT_BYTES) {
    return new Response("Too large", { status: 413 });
  }
  let wire: string;
  try {
    wire = (await request.text()).trim();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (wire.length > MAX_REPORT_BYTES) {
    return new Response("Too large", { status: 413 });
  }

  const verdict = verifyReport(secret, wire, Date.now());
  if (!verdict.ok) {
    return verdict.reason === "malformed"
      ? new Response("Bad request", { status: 400 })
      : new Response("Forbidden", { status: 403 });
  }
  const report = verdict.report;

  switch (report.kind) {
    case "check": {
      const found = report.error ? null : (report.found ?? null);
      if (report.error) {
        await recordSignalFailure({
          job: "export_delivery",
          area: "export",
          operation: "the Worker's check (the bucket could not answer)",
          error: new Error(`export check unavailable (${report.jti})`),
        });
      }
      return (
        unkept("check", await recordWorkerCheck(report.jti, report.at, found)) ??
        kept()
      );
    }
    case "start":
      return (
        unkept("start", await recordStreamStart(report.jti, report.at)) ??
        kept()
      );
    case "end": {
      if (report.outcome === "failed") {
        await recordSignalFailure({
          job: "export_delivery",
          area: "export",
          operation: "a zip stream an object read broke",
          error: new Error(`export stream failed (${report.jti})`),
        });
      }
      return (
        unkept(
          "end",
          await recordStreamEnd(report.jti, report.at, {
            outcome: report.outcome,
            files: report.files,
            missing: report.missing,
          }),
        ) ?? kept()
      );
    }
    case "heartbeat":
      return keepHeartbeat(report);
  }
}
