/**
 * ONE PAGE OF A SEND'S CLOSING CHECK (`POST /api/internal/drive/check`; drive-export.md, "The closing check"): the
 * Worker asked Drive for each sent file by its id. `cloud_export_check_page` keeps what was confirmed, sends again
 * (once) what went missing or into the bin, counts the duplicates the first page's folder listing found, and ends the
 * send when the walk is through. It decides her page and nothing else: nothing anywhere deletes on its word.
 *
 * After the answer: what went back is kicked at once, a folder in her bin gets its paused mail, and a duplicate is
 * counted in the `drive_transfer` signal (never binned: a copy she made on purpose carries our marks too).
 */
import { after } from "next/server";

import { internalJson, readDriveWord } from "@/lib/drive/internal.server";
import { notifyPaused } from "@/lib/drive/mail.server";
import { checkWordSchema, type ReportAnswer } from "@/lib/drive/protocol";
import { kickConnection } from "@/lib/drive/service.server";
import { reportCheckPage } from "@/lib/db/queries/drive";
import { recordSignalFailure } from "@/lib/jobs/failure-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const read = await readDriveWord(request, checkWordSchema, "check");
  if (!read.ok) return read.response;
  const word = read.word;

  let outcome;
  try {
    outcome = await reportCheckPage({
      lease: word.lease,
      // "unknown" (Drive could not answer for one) stays sent and unconfirmed: the walk moves on, nothing is resent.
      results: word.results
        .filter((r) => r.state !== "unknown")
        .map((r) => ({
          media_id: r.mediaId,
          state: r.state === "ok" ? "ok" : "missing",
        })),
      duplicates: word.duplicates ?? null,
      finding: word.finding ?? null,
    });
  } catch (e) {
    await recordSignalFailure({
      job: "drive_transfer",
      area: "export",
      operation: "closing check",
      error: e,
    });
    return internalJson({ ok: false, code: "check_failed" }, 500);
  }

  const { jobId, connectionId } = outcome;
  if (
    outcome.status === "sending" &&
    outcome.before === "checking" &&
    connectionId
  ) {
    after(() => kickConnection(connectionId).then(() => undefined));
  }
  if (jobId && outcome.status === "paused" && outcome.before !== "paused") {
    after(() => notifyPaused(jobId));
  }
  if ((outcome.duplicates ?? 0) > 0) {
    after(() =>
      recordSignalFailure({
        job: "drive_transfer",
        area: "export",
        operation: "duplicates in a send's folder",
        error: new Error("duplicates"),
        extra: { jobId, duplicates: outcome.duplicates },
      }),
    );
  }
  return internalJson({ state: outcome.state } satisfies ReportAnswer);
}
