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
 */
import "server-only";

import { getResend } from "@/lib/email/client";
import { assertResendEnv } from "@/lib/env";
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

  const { error: claimError } = await admin.from("sent_emails").insert({
    kind: args.kind,
    dedupe_key: args.dedupeKey,
    profile_id: args.profileId ?? null,
  });
  if (claimError) {
    if (claimError.code === UNIQUE_VIOLATION) return false; // already sent
    throw new Error(`sent_emails claim (${args.kind}): ${claimError.message}`);
  }

  const { error: sendError } = await getResend().emails.send({
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
    throw new Error(`resend send (${args.kind}): ${sendError.message}`);
  }
  return true;
}
