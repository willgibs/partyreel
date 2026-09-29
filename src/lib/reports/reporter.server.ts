/**
 * WHO FILED A REPORT, AS THE SERVER KNOWS IT (admin-triage r2, `proof=confirm`), and what happens at once when the
 * report cannot wait. Server-only: the session, the rate-limit secret and the operator's inbox.
 *
 * ★ THE REPORTER IS THE SESSION'S, NEVER THE BODY'S. `readReporter` takes the request's own `getUser()`: the id
 * when anyone is signed in, and the address only beside `email_confirmed_at` (a bare `user.email` is satisfied by
 * an unconfirmed sign-up, the identity round's lesson). The form's "Confirm your email" is the door's own code,
 * so a signed-out guest who confirms on the form arrives here signed in and confirmed.
 *
 * ★ THE ADDRESS'S HASH OUTLIVES THE ADDRESS. The report keeps a confirmed address only until it closes (a
 * trigger forgets it), but the instant hide's limits and its bar ("an address whose child-abuse report is
 * dismissed as false loses the instant hide") must still know the address afterwards. So a child-abuse report
 * also keeps an HMAC of it, keyed with the rate-limit secret in its own `r-addr:` domain (never equal to an IP's
 * or an account's hash), which answers "the same address again?" and nothing else.
 */
import "server-only";

import { createHmac } from "node:crypto";

import type { User } from "@supabase/supabase-js";

import type { ReportReporter } from "@/lib/db/mutations/report";
import { sendOnce } from "@/lib/email/send";
import { urgentReportEmail } from "@/lib/email/templates";
import { ADMIN_HOST } from "@/lib/auth/admin-host";
import { SITE_URL, SUPPORT_EMAIL } from "@/lib/constants/site";
import { serverEnv } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";

/** The address's keyed hash, one address one value (trimmed, lowercased first). Throws with no secret. */
export function reporterAddressHash(email: string): string {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) throw new Error("UNLOCK_COOKIE_SECRET unset");
  return createHmac("sha256", secret)
    .update(`r-addr:${email.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * The reporter as the session says: nobody signed in is null; signed in unconfirmed is the id alone; confirmed is
 * the id, the address and its hash. A hash that cannot be taken (no secret) files the report without the address,
 * so the report itself is never gated on it.
 */
export function readReporter(user: User | null): ReportReporter | null {
  if (!user) return null;
  const confirmed =
    user.email && user.email_confirmed_at ? user.email.trim() : null;
  if (!confirmed) {
    return { userId: user.id, confirmedEmail: null, addressHash: null };
  }
  try {
    return {
      userId: user.id,
      confirmedEmail: confirmed.toLowerCase(),
      addressHash: reporterAddressHash(confirmed),
    };
  } catch (e) {
    captureError("security", e, { phase: "reporter_address_hash" });
    return { userId: user.id, confirmedEmail: null, addressHash: null };
  }
}

/** The portal's Reports, on the admin host where one is configured. */
function reportsUrl(): string {
  return ADMIN_HOST
    ? `https://${ADMIN_HOST}/admin/reports`
    : `${SITE_URL}/admin/reports`;
}

/** Ten minutes: one alert mail per album per window, so a burst is one mail and the queue says the rest. */
const ALERT_WINDOW_MS = 10 * 60 * 1000;

/**
 * THE OPERATOR, TOLD AT ONCE (his word: "so a false hide lasts minutes"): a child-abuse report raises a Sentry
 * warning every time (area `security`, no content, no reporter) and a mail to the ops inbox once per album per ten
 * minutes. The portal's own signal is its urgent count (the rail and the bell), which reads the reports table and
 * needs nothing sent. Never throws: a failed alert must not fail the report it is about.
 */
export async function alertUrgentReport(args: {
  reportId: string;
  eventId: string;
  eventName: string;
  hidden: boolean;
  now?: Date;
}): Promise<void> {
  captureWarning("security", "urgent_report_filed", {
    report_id: args.reportId,
    event_id: args.eventId,
    hidden: args.hidden,
  });
  try {
    const at = (args.now ?? new Date()).getTime();
    const bucket = Math.floor(at / ALERT_WINDOW_MS);
    const { subject, html, text } = urgentReportEmail({
      eventName: args.eventName,
      hidden: args.hidden,
      reportsUrl: reportsUrl(),
    });
    await sendOnce({
      kind: "report_urgent",
      dedupeKey: `${args.eventId}:${bucket}`,
      to: serverEnv.CONTACT_NOTIFY_EMAIL ?? SUPPORT_EMAIL,
      subject,
      html,
      text,
    });
  } catch (e) {
    captureError("security", e, {
      phase: "urgent_report_alert",
      report_id: args.reportId,
    });
  }
}
