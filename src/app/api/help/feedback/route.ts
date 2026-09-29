import { isHelpArticleSlug } from "@/lib/content/help";
import { recordArticleFeedback } from "@/lib/db/mutations/article-feedback";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { helpFeedbackSchema } from "@/lib/validation/help-feedback";

/**
 * THE FEEDBACK BEACON (help-center r1 `feedback=beacon`, Will: "One insert per click, visible only in
 * admin; the reader sees the same thank-you or sorry"). `ArticleFeedback` posts `{ slug, helpful }`
 * once per click and never waits on the answer; this writes one `article_feedback` row, read only at
 * `/admin/help-feedback`.
 *
 * ★ NOTHING COMES BACK. Every answer is a bare status with no body: no count, no id, no row, so a
 * reader (or a script) can learn nothing about what anyone else said. There is no GET, and the table
 * is deny-all with every client grant revoked (migration 20260928150000), so this route is the one
 * insert path and nothing reads it but the service role behind the admin seam.
 *
 * ★ ONLY A JSON BODY. A cross-site page can POST `text/plain` without asking (a "simple" request),
 * and `request.json()` would happily parse it; `application/json` needs a CORS preflight this route
 * never answers, so demanding it is what keeps another site from stuffing the count through a
 * visitor's browser.
 *
 * ★ THE LIMITER FAILS CLOSED, the public forms' posture (database-security.md): nothing stands behind
 * it, no capability and no session. And here it costs nothing real, because the limiter and the
 * insert share one database: a limiter that cannot be read almost always means a table that cannot
 * be written. Both failures are counted in the `help_feedback` signal, so a beacon quietly recording
 * nothing shows on /admin/jobs and on the feedback page itself.
 */
export async function POST(request: Request) {
  const type = request.headers.get("content-type") ?? "";
  if (!/^application\/json\b/i.test(type)) return status(415);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return status(400);
  }
  const parsed = helpFeedbackSchema.safeParse(body);
  if (!parsed.success) return status(400);
  const { slug, helpful } = parsed.data;
  if (!isHelpArticleSlug(slug)) return status(404);

  // Scope = (IP, article): the natural rate is one click an article; BREADTH across articles is the
  // stuffing signal (ABUSE_LIMITS.help_feedback says why the numbers are what they are).
  let keys: { ipHash: string; scopeHash: string };
  try {
    keys = abuseHashes(clientIp(request.headers), "help_feedback", slug);
    const gate = await checkAbuseRate(
      "help_feedback",
      keys.ipHash,
      keys.scopeHash,
    );
    if (!gate.allowed) {
      return new Response(null, {
        status: 429,
        headers: { "Retry-After": String(gate.retryAfterSec) },
      });
    }
  } catch (e) {
    // `checkAbuseRate` has already counted this in the `abuse_limiter` signal; the beacon's own
    // signal says a click was dropped because of it.
    captureWarning("security", "help_feedback_limiter_unavailable_fail_closed");
    await recordSignalFailure({
      job: "help_feedback",
      area: "security",
      operation: "limiter unavailable (fail closed)",
      error: e,
    });
    return status(503);
  }
  // Counted BEFORE the write it authorizes (the public forms' order), so a burst of parallel clicks
  // cannot all slip in behind one count. Best-effort: `recordAbuseEvent` reports its own failures.
  await recordAbuseEvent("help_feedback", keys.ipHash, keys.scopeHash).catch(
    () => {},
  );

  const written = await recordArticleFeedback({ slug, helpful });
  if (!written.ok) {
    await recordSignalFailure({
      job: "help_feedback",
      area: "other",
      operation: "article_feedback insert",
      error: new Error(written.message),
      extra: { code: written.code },
    });
    return status(503);
  }
  return status(204);
}

/** Every answer is a status and nothing else (see "NOTHING COMES BACK"). */
function status(code: number): Response {
  return new Response(null, { status: code });
}
