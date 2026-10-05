/**
 * A LANE REPORTS (`POST /api/internal/drive/report`, every 10 seconds and at a slice's end; drive-export.md).
 *
 * Keyed by the lease token: `cloud_export_report` ignores a dead lease's word (its items may be another lane's now),
 * so a replay changes nothing and a `sent` stays sent. It answers `stop` once the send is no longer sending (her
 * Cancel, a pause, the switch, an operator), so a lane stops within ten seconds.
 *
 * After the answer: a pause that needs her gets its mail (once a send, a reason and a pause), and what the transfer
 * must never be silent about (a file failed for good, an original missing in R2) is recorded in the `drive_transfer`
 * signal.
 */
import { after } from "next/server";

import { internalJson, readDriveWord } from "@/lib/drive/internal.server";
import { notifyPaused } from "@/lib/drive/mail.server";
import { reportWordSchema, type ReportAnswer, type ReportItem } from "@/lib/drive/protocol";
import { readJustPaused, reportWork } from "@/lib/db/queries/drive";
import { recordSignalFailure } from "@/lib/jobs/failure-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The protocol's item, in the SQL's own keys. */
function sqlItem(item: ReportItem): Record<string, unknown> {
  switch (item.outcome) {
    case "sent":
      return {
        media_id: item.mediaId,
        outcome: "sent",
        file_id: item.fileId,
        md5: item.md5 ?? null,
        worker_md5: item.workerMd5 ?? null,
        kept: item.kept ?? false,
      };
    case "progress":
      return { media_id: item.mediaId, outcome: "progress", session_uri: item.sessionUri, offset: item.offset };
    case "failed":
      return {
        media_id: item.mediaId,
        outcome: "failed",
        reason: item.reason,
        retry: item.retry,
        keep_session: item.keepSession ?? false,
      };
    case "skipped":
      return { media_id: item.mediaId, outcome: "skipped", reason: item.reason };
    case "released":
      return { media_id: item.mediaId, outcome: "released" };
  }
}

/** The findings that pause every running send of the connection, not only the lease's. */
const CONNECTION_WIDE: ReadonlySet<string> = new Set(["drive_full", "daily_limit", "domain_policy"]);

const SIGNALS: Record<string, string> = {
  file_failed: "a file failed for good",
  missing_object: "an original missing in R2",
};

export async function POST(request: Request) {
  const read = await readDriveWord(request, reportWordSchema, "report");
  if (!read.ok) return read.response;
  const word = read.word;

  let outcome;
  try {
    outcome = await reportWork({
      lease: word.lease,
      items: word.items.map(sqlItem),
      finding: word.finding ?? null,
      done: word.done ?? false,
    });
  } catch (e) {
    await recordSignalFailure({ job: "drive_transfer", area: "export", operation: "report", error: e });
    return internalJson({ ok: false, code: "report_failed" }, 500);
  }

  const jobId = outcome.jobId;
  const connectionId = outcome.connectionId;
  if (word.finding && CONNECTION_WIDE.has(word.finding) && connectionId) {
    // A finding about her Drive (full, its day, her admin's policy) paused every running send of the connection:
    // each gets its mail, once.
    const reason = word.finding;
    const since = Date.now() - 60_000;
    after(async () => {
      for (const id of await readJustPaused(connectionId, reason, since).catch(() => [])) await notifyPaused(id);
    });
  } else if (jobId && outcome.status === "paused" && outcome.before !== "paused") {
    after(() => notifyPaused(jobId));
  }
  if (outcome.signal && SIGNALS[outcome.signal]) {
    after(() =>
      recordSignalFailure({
        job: "drive_transfer",
        area: "export",
        operation: SIGNALS[outcome.signal!]!,
        error: new Error(outcome.signal!),
        extra: { jobId },
      }),
    );
  }
  return internalJson({ state: outcome.state } satisfies ReportAnswer);
}
