/**
 * EVERY KIND OF MAIL `sendOnce` SENDS, BY WHAT A PAUSE MAY DO TO IT (the spend watch's lifecycle-mail switch,
 * `ops_flags.lifecycle_mail_enabled`; admin-observability.md, "The spend watch").
 *
 * PURE on purpose (no env, no DB, no `server-only`): the spend watch's readings count the lifecycle kinds in SQL,
 * `send.ts` gates on them, and `send-kinds.test.ts` holds every `kind:` a send site names to exactly one list, so a
 * new mail cannot ship unclassified.
 *
 * THREE KINDS, because a pause costs each of them something different:
 *
 *  - HELD while lifecycle mail is paused: the mail its sweep sends again every night its state lasts (the warning
 *    two weeks before an idle event rests, the reminder in a grace's last week, the renewal nudge in a pass's last
 *    two weeks). A held one is not claimed, so it goes out the first night after the switch is back on, as long as
 *    the pause is shorter than its window (seven days at the least, the over-cap reminder's).
 *  - NOTICES, never held: the one-time mail of a state change (an idle event put in Deleted, a grace opened, a plan
 *    reduced to its cap). Its sweep never meets that state again, so a held notice would be lost for good, and a
 *    host would never learn her event was removed. For the same reason one whose send FAILS is kept, rendered, and
 *    retried by its sweep each night until it sends (`notice_retries`, `retryParkedNotices` in send.ts). Each is
 *    bounded by a real change, at most one an account a night, and its sweep's own switch (`purge_inactivity`,
 *    `purge_over_capacity`) stops it, and its retries, with the change.
 *  - OPERATOR mail, never held: what tells us something is wrong (the breakers, an urgent report, the spend watch's
 *    own alert), what a visitor's form hands us, and the one mail an operator sends by hand. Holding the alert
 *    would silence the thing that says why the mail stopped.
 */

/** Re-sent by its sweep while the state lasts: held, never lost, while lifecycle mail is paused. */
export const HELD_WHILE_PAUSED = [
  "inactivity_warning",
  "over_cap_reminder",
  "renewal_nudge",
] as const;

/** One-time notices of a state change: never held (a pause would lose them for good), and kept when a send fails. */
export const STATE_NOTICES = [
  "inactivity_removed",
  "over_cap_grace_start",
  "over_cap_reduced",
] as const;

export type StateNotice = (typeof STATE_NOTICES)[number];

/**
 * A kept notice is given up this many days after its first failure (`retryParkedNotices`, send.ts): by then the
 * removal or the reduce it reports has purged for good (its "until" date passed: the 30-day window each of those
 * notices names), and a grace-start that late is covered by the grace's own reminder in its last week. Thirty nights
 * of failing is an address that will never take it, not an outage, so it goes with a last, loud record. Here, beside
 * the kinds, so the console can say it without reaching into the send path.
 */
export const NOTICE_RETRY_DAYS = 30;

/** Mail to us, or sent by an operator's own hand: never held. */
export const OPERATOR_KINDS = [
  "orphan_breaker",
  "prune_breaker",
  "report_urgent",
  "contact_form",
  "job_application",
  "report_proof",
  "spend_watch",
] as const;

/**
 * Mail about a host's own Google Drive (drive-export.md): a connection made, sends that finished (an hour's folded into
 * one), a send paused or stopped, a connection that lost its access. Never held: each is about something she started,
 * or a stop that needs her, which a pause of lifecycle mail must not silence. Never counted as lifecycle mail (no
 * sweep re-sends them) and not kept for a retry: the send's own place in the app says the same, at once.
 */
export const DRIVE_KINDS = [
  "drive_connected",
  "drive_export_done",
  "drive_export_paused",
  "drive_export_stopped",
  "drive_reconnect",
] as const;

/** The mail the lifecycle sweeps send hosts: the spend watch's `lifecycle_mail` reading counts exactly these. */
export const LIFECYCLE_KINDS: readonly string[] = [
  ...HELD_WHILE_PAUSED,
  ...STATE_NOTICES,
];

/** Does a pause of lifecycle mail hold this kind? Only the re-sent three; any other kind always sends. */
export function heldWhilePaused(kind: string): boolean {
  return (HELD_WHILE_PAUSED as readonly string[]).includes(kind);
}

/**
 * Is this a one-time notice, kept for a retry when its send fails? Only the three: a re-sent kind's sweep sends it again
 * itself, and an operator's mail fails beside its own Sentry event or in front of the operator who sent it.
 */
export function isStateNotice(kind: string): kind is StateNotice {
  return (STATE_NOTICES as readonly string[]).includes(kind);
}
