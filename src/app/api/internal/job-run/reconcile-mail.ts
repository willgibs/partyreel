/**
 * THE BACKUP RECONCILE'S ALERT MAIL (durability-backups.md, "The reconcile"): one operator mail to the ops inbox when a
 * reconcile run reports it stopped early, failed, or found a key whose two copies differ, raised where the report
 * lands (`route.ts`, beside the Sentry warning), at most once a day. The reconcile is the media backup's backstop: a
 * run that stops short or errs leaves objects with no backup copy, and its card is read only by someone already
 * looking. It is an operator alert's shape, in the shell every Partyreel mail wears (`email/templates.ts`): no button,
 * the tagged subject, the jobs console in the foot.
 *
 * PURE (no env, no DB), so the words are tested without a send.
 */
import { composeMail, OPERATOR_TAG, type Mail } from "@/lib/email/templates";

export type ReconcileTrouble = {
  /** The run closed `error`: a copy failed, a key past one run's reach, a question it could not ask, a doubt. */
  failed: boolean;
  /** It stopped at its deadline or budget with more of the pass to walk. */
  stoppedEarly: boolean;
  /** Keys whose two copies differ (size or checksum): never overwritten, a person's call. */
  mismatched: number;
};

export function reconcileTroubleEmail(opts: {
  trouble: ReconcileTrouble;
  /** The run's own line from the jobs console, when it sent one. */
  runNote: string | null;
  jobsUrl: string;
}): Mail {
  const { trouble } = opts;
  const subject = trouble.failed
    ? "The backup reconcile's run failed"
    : trouble.stoppedEarly
      ? "The backup reconcile stopped before the end of its pass"
      : `${trouble.mismatched.toLocaleString("en-US")} ${trouble.mismatched === 1 ? "key differs" : "keys differ"} between the media buckets`;
  return composeMail({
    subject: `${OPERATOR_TAG} ${subject}`,
    heading: "The backup reconcile needs a look",
    blocks: [
      {
        kind: "p",
        parts: [
          "The daily reconcile compares the primary bucket with the locked backup and copies whatever the live queue missed. Its last run did not end clean, so some media may have no backup copy until it does. ",
          { strong: "Nothing has been deleted or overwritten." },
        ],
      },
      {
        kind: "fields",
        rows: [
          { label: "Run", value: trouble.failed ? "Failed" : "Closed" },
          {
            label: "Pass",
            value: trouble.stoppedEarly
              ? "Stopped early; the next run carries on"
              : "Reached its end",
          },
          ...(trouble.mismatched > 0
            ? [
                {
                  label: "Copies that differ",
                  value: trouble.mismatched.toLocaleString("en-US"),
                },
              ]
            : []),
          ...(opts.runNote
            ? [{ label: "The run's note", value: opts.runNote }]
            : []),
        ],
      },
      {
        kind: "p",
        parts: [
          { strong: "What to do:" },
          " the run's note says why, and Workers Logs (",
          { code: "partyreel-backup" },
          ") name each key. A failed copy is tried again by the next pass; a key past one run's copy reach is copied by hand from ",
          { code: "partyreel" },
          " into ",
          { code: "partyreel-backup" },
          ". A key whose copies differ is never overwritten: if the primary's is the good one, delete the backup's copy once its lock has passed and the next run copies it again; if the backup's is, copy it back into the primary (durability-backups.md, The reconcile). A run that stops early every day is a pass outgrowing a run.",
        ],
      },
    ],
    foot: {
      line: "Partyreel operations alert (the backup reconcile, durability-backups.md). Sent at most once a day while it stands.",
      link: { href: opts.jobsUrl, label: "Open the backup reconcile" },
    },
  });
}
