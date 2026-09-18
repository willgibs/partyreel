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
 */
import "server-only";

import { getResend } from "@/lib/email/client";
import { assertResendEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

export type SendOnceArgs = {
  /** Stable category, e.g. "over_cap_grace_start". */
  kind: string;
  /** Unique per state within a kind, e.g. `${profileId}:${graceUntilISO}`. */
  dedupeKey: string;
  profileId?: string | null;
  to: string;
  subject: string;
  html: string;
  /** Optional Reply-To — e.g. so an operator can reply straight to a form submitter. */
  replyTo?: string;
};

/** Returns true if an email was sent, false if it was already sent (deduped). */
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

  const { error: claimError } = await admin.from("sent_emails").insert({
    kind: args.kind,
    dedupe_key: args.dedupeKey,
    profile_id: args.profileId ?? null,
  });
  if (claimError) {
    if (claimError.code === UNIQUE_VIOLATION) return false; // already sent
    await recordSignalFailure({
      job: "email_delivery",
      area: "other",
      operation: `sent_emails claim (${args.kind})`,
      error: new Error(claimError.message),
      extra: { kind: args.kind, code: claimError.code },
    });
    throw new Error(`sent_emails claim (${args.kind}): ${claimError.message}`);
  }

  const { error: sendError } = await resend.emails.send({
    from: EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
    replyTo: args.replyTo,
  });
  if (sendError) {
    // Release the claim so a transient failure retries next run (still single-send).
    await admin
      .from("sent_emails")
      .delete()
      .eq("kind", args.kind)
      .eq("dedupe_key", args.dedupeKey);
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
    throw new Error(`resend send (${args.kind}): ${sendError.message}`);
  }
  return true;
}
