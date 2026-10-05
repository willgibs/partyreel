/**
 * sendOnce — send a transactional email AT MOST ONCE per (kind, dedupeKey).
 *
 * Frugality guard (Resend free tier = 3,000/mo): the daily lifecycle cron can call this
 * every run; the `sent_emails` unique(kind, dedupe_key) makes repeats a no-op. We CLAIM
 * the slot first (insert), then send; a unique-violation means "already sent" → skip. If
 * the send itself fails, we delete the claim so it retries next run — so a row exists
 * only after a successful send, and we never double-send.
 *
 * COROLLARY (do not undo): every possible failure between the claim and the send must be
 * moved ABOVE the claim, because only a Resend sendError releases the row. Anything that
 * throws in between burns that (kind, dedupe_key) permanently.
 *
 * OBSERVABILITY (the admin-jobs round). A failed send used to be INVISIBLE: it releases the
 * claim and throws, the lifecycle sweep catches it, and the cron tries the same address again
 * tomorrow, and the day after, forever. A permanently refused recipient and a healthy night
 * looked identical from every console we had. So every failure here now records into the
 * `email_delivery` signal (a Sentry event plus one throttled `job_runs` error row), which is
 * what /admin/jobs reads as "N sent, N failed in the last 24 hours". The THROW is unchanged —
 * the caller's behaviour is exactly what it was.
 *
 * ★ A ONE-TIME NOTICE IS KEPT UNTIL IT SENDS (crumbs-75). The release above retries a mail only because its sweep
 * calls again while the state lasts. A one-time notice (`STATE_NOTICES`: an idle event put in Deleted, a grace opened,
 * a plan reduced) is sent AFTER its sweep moved the state, and the sweep never meets that state again, so one refused
 * send lost it for good: a Resend outage the night an event was removed, and its host was never told. So a notice
 * whose claim or send fails is KEPT, rendered, in `notice_retries` (whose it is, never its address), beside the
 * release; its sweep retries it first thing each night (`retryParkedNotices`, below) until it sends, the claim still
 * keeping the send single, and gives it up, loudly, `NOTICE_RETRY_DAYS` after its first failure. The throw still comes.
 *
 * THE LIFECYCLE-MAIL PAUSE (the spend watch, `ops_flags.lifecycle_mail_enabled`). While it is off, the mail a
 * lifecycle sweep sends again every night its state lasts (`HELD_WHILE_PAUSED`, send-kinds.ts) is HELD: never
 * claimed, so it goes out the first night after the switch is back on, and `false` comes back as if it had gone
 * already (no caller records a state on it). A one-time notice and every operator mail always send, because a held
 * notice would be lost for good and a held alert would silence the thing saying why mail stopped. The switch fails
 * CLOSED for what it holds (`lifecycleMailFlowing`): a hold nobody chose is recorded in `email_delivery`.
 */
import "server-only";


import { getResend } from "@/lib/email/client";
import {
  heldWhilePaused,
  isStateNotice,
  NOTICE_RETRY_DAYS,
  type StateNotice,
} from "@/lib/email/send-kinds";
import { assertResendEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { forEachIsolated } from "@/lib/jobs/isolate";
import { lifecycleMailFlowing } from "@/lib/jobs/spend-watch-switches";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

const DAY_MS = 86_400_000;

type AdminClient = ReturnType<typeof createAdminClient>;

export type SendOnceArgs = {
  /** Stable category, e.g. "over_cap_grace_start". */
  kind: string;
  /** Unique per state within a kind, e.g. `${profileId}:${graceUntilISO}`. */
  dedupeKey: string;
  profileId?: string | null;
  to: string;
  subject: string;
  html: string;
  /**
   * The plain-text twin, from the same parts as `html` (every template's `Mail`). Required, so no
   * send can forget it: without one Resend writes its own from the HTML, and that one carries the
   * table layout and the preview's invisible tail instead of the mail's words.
   */
  text: string;
  /** Optional Reply-To — e.g. so an operator can reply straight to a form submitter. */
  replyTo?: string;
};

/**
 * What `sendOnce` throws when the claim or Resend refused: already recorded in `email_delivery` (Sentry and the row),
 * so a caller that records its own failures (the notice retry) knows not to say it twice. Still an `Error` with the
 * words it always had, so every other caller reads it exactly as before.
 */
export class SendFailedError extends Error {
  override name = "SendFailedError";
}

/**
 * Returns true if an email was sent; false if it was not sent this time: already sent (deduped), or held while
 * lifecycle mail is paused (it goes the first run after the switch is back on).
 */
export async function sendOnce(args: SendOnceArgs): Promise<boolean> {
  const admin = createAdminClient();

  // ★ Resolve the env BEFORE claiming the slot. The claim/send/release dance only releases the row on
  // a Resend sendError; a THROW between the two (which is exactly what assertResendEnv does when
  // EMAIL_FROM or the API key is missing on this deploy) leaves the (kind, dedupe_key) row behind
  // forever. Since the unique constraint reads a present row as "already sent", that single email is
  // then permanently un-sendable for this key - a misconfigured deploy would silently burn one
  // over-cap warning per host, and re-sending would need a manual DELETE. Failing before the claim
  // costs nothing and stays retryable.
  const { EMAIL_FROM } = assertResendEnv();
  // Construct the client above the claim for the same reason, and it is the same bug: `getResend()`
  // lazily news up the SDK and re-asserts the env, so any throw in there would land between the
  // claim and the send and burn the key. Resolving both dependencies first costs nothing and leaves
  // the window between claim and send holding exactly one fallible call, the send itself.
  const resend = getResend();

  // ★ THE PAUSE HOLDS BEFORE THE CLAIM: a held mail claims nothing, so its sweep sends it the night it is back on.
  if (heldWhilePaused(args.kind) && !(await lifecycleMailFlowing(args.kind))) {
    return false;
  }

  const { error: claimError } = await admin.from("sent_emails").insert({
    kind: args.kind,
    dedupe_key: args.dedupeKey,
    profile_id: args.profileId ?? null,
  });
  if (claimError) {
    if (claimError.code === UNIQUE_VIOLATION) return false; // already sent
    // Nothing went: a notice is kept for its retry as a refused one is (a claim that cannot be written most often
    // means the database is down, and then keeping it fails too, which says so).
    if (isStateNotice(args.kind)) await keepNotice(admin, args, args.kind);
    await recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `sent_emails claim (${args.kind})`,
      error: new Error(claimError.message),
      extra: { kind: args.kind, code: claimError.code },
    });
    throw new SendFailedError(
      `sent_emails claim (${args.kind}): ${claimError.message}`,
    );
  }

  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
  });
  if (sendError) {
    // Release the claim so a transient failure retries next run (still single-send).
    await admin
      .from("sent_emails")
      .delete()
      .eq("kind", args.kind)
      .eq("dedupe_key", args.dedupeKey);
    // A one-time notice's sweep never calls again, so the notice is kept for the retry that will.
    if (isStateNotice(args.kind)) await keepNotice(admin, args, args.kind);
    // A refusal and a transient failure look the same from here (Resend answers both as an error),
    // and both are worth the signal: one is "this address will never work", the other is "we are
    // retrying nightly and nobody knows". The KIND is recorded, never the address — the row renders
    // on a page rather than through Sentry's scrubber.
    await recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `resend send (${args.kind})`,
      error: new Error(sendError.message),
      extra: { kind: args.kind, name: sendError.name },
    });
    throw new SendFailedError(
      `resend send (${args.kind}): ${sendError.message}`,
    );
  }
  return true;
}

/**
 * KEEP A NOTICE FOR ITS RETRY: the mail as it was rendered and whose it is, upserted on sent_emails' own key, so a
 * retry that fails again moves `last_failed_at` while `first_failed_at` (the give-up clock, never written here) keeps
 * the first failure's instant. The address is never kept: the retry reads the account's own at the time, so a changed
 * one is honoured and an account on its way out has none. Never throws (its caller is already failing); a notice that
 * cannot be kept is recorded as lost, the one way it still can be.
 */
async function keepNotice(
  admin: AdminClient,
  args: SendOnceArgs,
  kind: StateNotice,
): Promise<void> {
  const lost = (why: string, error: Error, code?: string) =>
    recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `notice lost: ${why} (${kind})`,
      error,
      extra: { kind, code },
    });
  if (!args.profileId) {
    await lost(
      "no account to retry it for",
      new Error("a one-time notice was sent with no profileId"),
    );
    return;
  }
  try {
    const { error } = await admin.from("notice_retries").upsert(
      {
        kind,
        dedupe_key: args.dedupeKey,
        profile_id: args.profileId,
        subject: args.subject,
        html: args.html,
        text: args.text,
        last_failed_at: new Date().toISOString(),
      },
      { onConflict: "kind,dedupe_key" },
    );
    if (error) {
      await lost("it could not be kept", new Error(error.message), error.code);
    }
  } catch (e) {
    await lost(
      "it could not be kept",
      e instanceof Error ? e : new Error(String(e)),
    );
  }
}

/** At most this many kept notices of one kind a run, the oldest first: a backlog drains over the nights. */
export const NOTICE_RETRIES_A_RUN = 25;

/** Retries failing in a row that read as Resend down, not one bad address: the rest wait for the next run. */
const RETRY_ABORT_AFTER = 3;

export type NoticeRetryTally = {
  /** Kept notices a retry sent this run. */
  notices_resent: number;
  /** Retries that failed again: each still kept, and recorded in `email_delivery`. */
  notices_failed: number;
  /**
   * Kept notices let go unsent: given up past `NOTICE_RETRY_DAYS` (recorded), their account has no address left, or
   * what they say is no longer so (`stillTrue`).
   */
  notices_dropped: number;
};

type KeptNotice = {
  kind: StateNotice;
  dedupe_key: string;
  profile_id: string;
  subject: string;
  html: string;
  text: string;
  first_failed_at: string;
};

/** What a sweep is asked about a kept notice before it goes again: the notice by its key, and whose it is. */
export type KeptNoticeKey = {
  kind: StateNotice;
  dedupeKey: string;
  profileId: string;
};

/**
 * THE RETRY: each kept notice of these kinds, oldest first, sent again through `sendOnce` (so the claim keeps it
 * single: one another run's retry already sent answers false and is simply let go), and let go once it went. Called by
 * the sweep that owns the kinds, first thing in its run, so its switch stops the retries with the sweep, and under its
 * deadline (`stopWhen`). Never throws: every failure is recorded in `email_delivery` (a refused send by `sendOnce`
 * itself, anything else here), and three in a row stop it for the night.
 *
 * ★ A NOTICE GOES ONLY WHILE WHAT IT SAYS IS STILL SO (`stillTrue`, the sweep's own answer): a day late, "your event
 * is in Deleted" to a host who has restored it, or "you are over your plan" to one who has since upgraded, would be a
 * wrong mail, worse than none. One that is no longer so is let go quietly: nothing failed, the state moved on.
 */
export async function retryParkedNotices(opts: {
  kinds: readonly StateNotice[];
  now: Date;
  stopWhen?: () => boolean;
  stillTrue?: (notice: KeptNoticeKey) => boolean | Promise<boolean>;
}): Promise<NoticeRetryTally> {
  const tally: NoticeRetryTally = {
    notices_resent: 0,
    notices_failed: 0,
    notices_dropped: 0,
  };
  const records: Promise<void>[] = [];
  const record = (operation: string, error: unknown, kind: string) =>
    recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `${operation} (${kind})`,
      error: error instanceof Error ? error : new Error(String(error)),
      extra: { kind },
    });

  let admin: AdminClient;
  try {
    admin = createAdminClient();
  } catch (e) {
    await record("notice retry: no database client", e, opts.kinds.join(","));
    return tally;
  }
  const giveUpBefore = opts.now.getTime() - NOTICE_RETRY_DAYS * DAY_MS;

  /** Let a kept notice go: it went, a claim says it already had, or it is given up. */
  const letGo = async (n: KeptNotice) => {
    const { error } = await admin
      .from("notice_retries")
      .delete()
      .eq("kind", n.kind)
      .eq("dedupe_key", n.dedupe_key);
    if (error) {
      throw new Error(`notice_retries let go (${n.kind}): ${error.message}`);
    }
  };

  const retryOne = async (n: KeptNotice) => {
    if (Date.parse(n.first_failed_at) < giveUpBefore) {
      await letGo(n);
      tally.notices_dropped += 1;
      await record(
        `notice given up after ${NOTICE_RETRY_DAYS} days of failed sends`,
        new Error("a kept notice never sent"),
        n.kind,
      );
      return;
    }
    if (
      opts.stillTrue &&
      !(await opts.stillTrue({
        kind: n.kind,
        dedupeKey: n.dedupe_key,
        profileId: n.profile_id,
      }))
    ) {
      // What it says is no longer so (her event is back, her grace has cleared): a wrong mail is worse than none.
      await letGo(n);
      tally.notices_dropped += 1;
      return;
    }
    const { data: profile, error } = await admin
      .from("profiles")
      .select("email")
      .eq("id", n.profile_id)
      .maybeSingle();
    if (error) throw new Error(`notice retry: the account (${error.message})`);
    if (!profile?.email) {
      // Her account has no address any more (anonymised on its way out): there is no one left to tell.
      await letGo(n);
      tally.notices_dropped += 1;
      return;
    }
    const sent = await sendOnce({
      kind: n.kind,
      dedupeKey: n.dedupe_key,
      profileId: n.profile_id,
      to: profile.email,
      subject: n.subject,
      html: n.html,
      text: n.text,
    });
    // False is a claim saying it went already (another run's retry): no longer owed either way.
    await letGo(n);
    if (sent) tally.notices_resent += 1;
  };

  for (const kind of opts.kinds) {
    if (opts.stopWhen?.()) break;
    // A night's retries of one kind, the oldest first; the rest wait for the next night, and /admin/jobs counts every
    // kept notice with a head count (`getJobSignals`).
    const { data, error } = await admin
      .from("notice_retries")
      .select(
        "kind, dedupe_key, profile_id, subject, html, text, first_failed_at",
      )
      .eq("kind", kind)
      .order("first_failed_at", { ascending: true })
      .order("dedupe_key", { ascending: true })
      .limit(NOTICE_RETRIES_A_RUN);
    if (error) {
      await record(
        "notice retry: the kept notices",
        new Error(error.message),
        kind,
      );
      continue;
    }
    const isolated = await forEachIsolated(
      (data ?? []) as KeptNotice[],
      retryOne,
      {
        // `sendOnce` recorded its own refusal; anything else is said here, once.
        onError: (n, e) => {
          if (!(e instanceof SendFailedError)) {
            records.push(record("notice retry", e, n.kind));
          }
        },
        abortAfterConsecutive: RETRY_ABORT_AFTER,
        stopWhen: opts.stopWhen,
      },
    );
    tally.notices_failed += isolated.failed;
    if (isolated.aborted) break;
  }
  await Promise.all(records);
  return tally;
}

/** A LIKE pattern's own characters, taken literally. */
function likeLiteral(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * AT MOST ONE MAIL A SCOPE IN ANY WINDOW, the window running from that scope's last mail of the kind (crumbs-40,
 * build 35's red-team). The urgent-report alert was keyed `album:floor(now / ten minutes)`, a clock bucket, so two
 * reports four minutes apart on either side of a :x0 boundary mailed the ops inbox twice. Here the scope's last mail
 * decides whether this one may go, and the dedupe key names that mail (`<scope>:after:<its id>`, or `<scope>:first`),
 * so two sends that raced past the same last mail claim one key and only one of them sends (`sendOnce`'s unique
 * claim): never a check-then-send race. A key under the scope's prefix in any older shape counts as a last mail too.
 * Resolves true when it sent; throws as `sendOnce` does, a failed read recorded in the same signal.
 */
export async function sendOncePerWindow(
  args: Omit<SendOnceArgs, "dedupeKey"> & {
    /** What the window is per (an album's id); the dedupe key's prefix. */
    scope: string;
    windowMs: number;
    /** The clock the window is read against (a test's; the server's otherwise). */
    now?: Date;
  },
): Promise<boolean> {
  const { scope, windowMs, now, ...mail } = args;
  const { data: last, error } = await createAdminClient()
    .from("sent_emails")
    .select("id, sent_at")
    .eq("kind", mail.kind)
    .like("dedupe_key", `${likeLiteral(scope)}:%`)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    await recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `sent_emails window (${mail.kind})`,
      error: new Error(error.message),
      extra: { kind: mail.kind, code: error.code },
    });
    throw new Error(`sent_emails window (${mail.kind}): ${error.message}`);
  }
  const at = (now ?? new Date()).getTime();
  if (last && at - Date.parse(last.sent_at) < windowMs) return false;
  return sendOnce({
    ...mail,
    dedupeKey: last ? `${scope}:after:${last.id}` : `${scope}:first`,
  });
}
