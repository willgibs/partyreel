/**
 * WHAT A SIGNAL STILL OWES, IN ITS OWN WORDS (crumbs-75): the line a signal's card draws under its 24 hours when work
 * is owed past its grace (`JobSignal.owed`). A one-time notice kept for its retry, and a download the Worker spoke of
 * but never said how it ended, each failed nothing inside the window, which is how they stayed off every console; the
 * card says what is owed, since when, and what happens next. Pure, so the page and its test read the same words.
 */
import { PASS_CREDIT_STUCK_AFTER_MS } from "@/lib/billing/passes-stuck";
import { NOTICE_RETRY_DAYS } from "@/lib/email/send-kinds";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

import { EXPORT_END_GRACE_MS, type JobId, type JobSignal } from "./catalog";

export type OwedWords = {
  /** The definition list's term. */
  term: string;
  /** The sentence, in the band's voice for a line that needs a look. */
  line: string;
};

const HOUR_MS = 60 * 60 * 1000;

/** The owed line for one signal card, or null when it owes nothing (or owes by no rule of its own). */
export function owedWords(
  id: JobId,
  signal: JobSignal | null,
): OwedWords | null {
  const owed = signal?.owed ?? 0;
  if (owed <= 0) return null;
  const one = owed === 1;
  switch (id) {
    case "email_delivery": {
      const since =
        signal?.owedSinceMs != null
          ? `, the oldest failing since ${formatAdminTimestamp(signal.owedSinceMs)}`
          : "";
      return {
        term: "Waiting",
        line:
          `${formatCount(owed)} one-time ${one ? "notice" : "notices"} to send${since}. ` +
          `Its sweep tries ${one ? "it" : "each"} again every night, and gives up, said here, ` +
          `${NOTICE_RETRY_DAYS} days after a first failure.`,
      };
    }
    case "export_delivery":
      return {
        term: "No end",
        line:
          `${formatCount(owed)} ${one ? "download" : "downloads"} the Worker checked or began never said how ` +
          `${one ? "it" : "they"} ended, ${EXPORT_END_GRACE_MS / HOUR_MS} hours on: a lost report or a Worker ` +
          "that died mid-stream (a walk left right after its check reads the same). Each row is on /admin/exports.",
      };
    case "drive_transfer":
      return {
        term: "Stuck",
        line:
          `${formatCount(owed)} ${one ? "send" : "sends"} to Google Drive with work left and no progress for an hour. ` +
          "The sweep kicks each every fifteen minutes; past that, the Worker or its queue is down. Each is on /admin/exports, with Cancel.",
      };
    case "pass_credit": {
      const since =
        signal?.owedSinceMs != null
          ? `, the oldest since ${formatAdminTimestamp(signal.owedSinceMs)}`
          : "";
      const hours = PASS_CREDIT_STUCK_AFTER_MS / HOUR_MS;
      return {
        term: "Stuck",
        line:
          `${formatCount(owed)} pass-to-Pro ${one ? "credit" : "credits"} stuck past ${hours === 1 ? "an hour" : `${hours} hours`}${since}: ` +
          "a claim never granted, or a grant whose passes never converted. Stripe may still retry; Retry on the account's page " +
          "runs the same path now. Each is listed on /admin/accounts.",
      };
    }
    default:
      return null;
  }
}
