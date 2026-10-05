/**
 * THE BACKUP'S LONE COPIES' ALERT MAIL (durability-backups.md, "The restore"): one operator mail to the ops inbox when
 * a Worker report says keys are held by the backup alone (a host's media whose primary object is gone while its row
 * still names it), raised where the report lands (`route.ts`, beside the Sentry warning), at most once a day while
 * they stand. It is an operator alert's shape, in the shell every Partyreel mail wears (`email/templates.ts`): no
 * button, the tagged subject, the jobs console in the foot.
 *
 * PURE (no env, no DB), so the words are tested without a send.
 */
import { composeMail, OPERATOR_TAG, type Mail } from "@/lib/email/templates";

/** What each RESTORE_MODE does with them, in the operator's words; an older Worker that reports none says so. */
const MODE_WORDS: Record<string, string> = {
  on: "On: the restore copies them back",
  dryrun: "Dry run: the restore copies nothing",
  off: "Off: the restore does nothing",
};

export function loneCopiesEmail(opts: {
  /** Keys held by the backup alone, the whole backup's (the Worker's lone copies' table). */
  keys: number;
  /** The job whose report said so, as its card names it (Backup prune, Backup restore). */
  reportedBy: string;
  /** `restore_mode` from the report, or null when it carried none. */
  restoreMode: string | null;
  /** The run's own line from the jobs console, when it sent one. */
  runNote: string | null;
  jobsUrl: string;
}): Mail {
  const count = opts.keys.toLocaleString("en-US");
  const held = `${count} ${opts.keys === 1 ? "key" : "keys"}`;
  return composeMail({
    subject: `${OPERATOR_TAG} ${held} held by the backup alone`,
    heading: "Media held by the backup alone",
    blocks: [
      {
        kind: "p",
        parts: [
          "A host's media lost its object in the primary bucket while its row still names it, so the locked backup holds its only copy, and it will not open for its host until it is copied back. ",
          { strong: "Nothing has been deleted." },
        ],
      },
      {
        kind: "fields",
        rows: [
          { label: "Held by the backup alone", value: held },
          { label: "Reported by", value: opts.reportedBy },
          {
            label: "Restore mode",
            value:
              (opts.restoreMode && MODE_WORDS[opts.restoreMode]) ??
              "Not reported by this Worker",
          },
          ...(opts.runNote
            ? [{ label: "The run's note", value: opts.runNote }]
            : []),
        ],
      },
      {
        kind: "p",
        parts: [
          { strong: "What to do:" },
          " with RESTORE_MODE on, the backup restore copies each back on its own, only keys a live row names and never over an object that is there, and its card says what it copied and what it could not; Restore now on that card runs it at once. In a dry run or off it copies nothing: switch it on, or copy each key from ",
          { code: "partyreel-backup" },
          " into ",
          { code: "partyreel" },
          " by hand (durability-backups.md, Restore). A key over 4.99 GB is always a copy by hand.",
        ],
      },
    ],
    foot: {
      line: "Partyreel operations alert (the backup's lone copies, durability-backups.md). Sent at most once a day while they stand.",
      link: { href: opts.jobsUrl, label: "Open the backup restore" },
    },
  });
}
