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
 *    host would never learn her event was removed. Each is bounded by a real change, at most one an account a
 *    night, and its sweep's own switch (`purge_inactivity`, `purge_over_capacity`) stops it with the change.
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

/** One-time notices of a state change: never held (a pause would lose them for good). */
export const STATE_NOTICES = [
  "inactivity_removed",
  "over_cap_grace_start",
  "over_cap_reduced",
] as const;

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

/** The mail the lifecycle sweeps send hosts: the spend watch's `lifecycle_mail` reading counts exactly these. */
export const LIFECYCLE_KINDS: readonly string[] = [
  ...HELD_WHILE_PAUSED,
  ...STATE_NOTICES,
];

/** Does a pause of lifecycle mail hold this kind? Only the re-sent three; any other kind always sends. */
export function heldWhilePaused(kind: string): boolean {
  return (HELD_WHILE_PAUSED as readonly string[]).includes(kind);
}
