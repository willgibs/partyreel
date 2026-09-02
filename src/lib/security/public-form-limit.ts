/**
 * The public marketing forms' rate gate (QA #14 + #19) — /contact and /careers.
 *
 * ★ THIS ONE FAILS CLOSED, and it is the only limiter in the codebase that does. Everywhere else the
 * limiter is defense-in-depth behind a capability token or a verified session, so a limiter outage
 * degrades to "the real gate still holds" and the route deliberately fails OPEN. These two forms have
 * NO gate behind them: they are unauthenticated, they insert with the service-role client, and they
 * send through Resend. Failing open here means an outage in the counter turns into an open pipe to the
 * monthly email quota, and when that quota is gone the orphan-sweep and prune circuit-breaker ALERTS
 * cannot send either. So a limiter we cannot read is a submission we do not accept.
 *
 * The cost of that choice is honest and small: during a database outage the contact form says "try
 * again in a bit" instead of losing the message silently. The form is not the only way to reach us,
 * and the page carries the support address.
 *
 * ★ AND IT IS NEVER SILENT. A limiter that dies looks exactly like a limiter that is passing everyone
 * (QA #19), so the swallow is captured here, at the swallow point, rather than left to each caller to
 * remember. This is a security module, not `src/lib/db/*`, so importing Sentry here is allowed.
 */
import "server-only";

import { captureError, captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";

export type PublicFormKind = "contact" | "careers";

export type FormRateGate =
  | { allowed: true }
  /** Over the per-IP ceiling. `retryAfterSec` is the window the caller can quote back. */
  | { allowed: false; reason: "rate_limited"; retryAfterSec: number }
  /** The limiter itself could not answer. Refused on purpose (see the header). */
  | { allowed: false; reason: "unavailable"; retryAfterSec: number };

/**
 * Decide whether this submission may proceed. Reads the caller's IP from the request headers itself,
 * because a Server Function has no `request` object to pass around.
 */
export async function checkPublicFormRate(
  kind: PublicFormKind,
  headers: Headers,
): Promise<FormRateGate> {
  try {
    // Scope is the bare IP: these forms are not event-shaped, so there is nothing for the breadth
    // signal to count. Passing "" makes the scope hash a constant, exactly like `capture`.
    const { ipHash, scopeHash } = abuseHashes(clientIp(headers), kind, "");
    const gate = await checkAbuseRate(kind, ipHash, scopeHash);
    if (!gate.allowed) {
      captureWarning("security", "public_form_rate_limited", { form: kind });
      return {
        allowed: false,
        reason: "rate_limited",
        retryAfterSec: gate.retryAfterSec,
      };
    }
    // Count this submission BEFORE the work it authorizes, so a request that then fails mid-flight
    // still consumed its share. Best-effort: a failed insert must not deny an allowed submission.
    await recordAbuseEvent(kind, ipHash, scopeHash).catch(() => {});
    return { allowed: true };
  } catch (e) {
    // captureError, not a warning: on these two forms an unreadable limiter is an outage of the ONLY
    // gate, and it now costs real submissions. Somebody should be woken by it.
    captureError("security", e, {
      form: kind,
      phase: "rate_limit_fail_closed",
    });
    return { allowed: false, reason: "unavailable", retryAfterSec: 60 };
  }
}
