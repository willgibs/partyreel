/**
 * Keep guest capability tokens out of telemetry (QA #22).
 *
 * THE LEAK. A guest's album link is `/e/<qr_token>`, and that token IS the authorization (database-security.md):
 * anyone holding it can read the album and upload to it. It rides the URL PATH, not the query, and
 * the existing `beforeSend` scrubber only strips query strings and only ever sees ERROR events. So
 * every other channel carried the token out intact: navigation and fetch BREADCRUMBS, performance
 * TRANSACTIONS, the `extra` bag on a capture, and the URL list on a session REPLAY. A token in an
 * issue is a token in every notification and integration downstream of it.
 *
 * THE FIX is three hooks, each covering a surface the others cannot reach, wired in all three
 * runtimes (`sentry.server.config`, `sentry.edge.config`, `instrumentation-client`):
 *   - `addEventProcessor(redactEvent)` runs on EVERY event type, errors and transactions and replay
 *     envelopes alike, and runs BEFORE `beforeSend`, so the shared scrubber still gets its turn.
 *   - `beforeBreadcrumb(redactBreadcrumb)` catches the token before it is even buffered on the scope.
 *   - `beforeAddRecordingEvent(redactReplayFrame)` catches the replay's own navigation frames.
 *
 * PURE, with type-only Sentry imports, so it is unit-tested next door and costs nothing at runtime.
 * Deliberately over-redacts: a redacted diagnostic is an inconvenience, a leaked capability token is
 * an incident.
 */
import type { Breadcrumb, Event } from "@sentry/nextjs";

/**
 * The token's shape. `qr_token` is a `gen_random_uuid()` with the dashes stripped (the init
 * migration), i.e. exactly 32 lowercase hex characters; `session_token` is TWO of those
 * concatenated, i.e. 64. Matching the SHAPE, not just the route, catches the token wherever it
 * turns up: a query value, a log line, an R2 key, an `extra` field nobody thought about. Real
 * UUIDs keep their dashes and are never matched.
 *
 * ★ WIDENED FROM 32 TO 32-64 (the door as three steps, 2026-09-21). `\b[0-9a-f]{32}\b` never
 * matched a session token at all: at character 33 of a 64-hex run there is no word boundary, so
 * the longer capability sailed through every hook this module owns. The door round puts that token
 * on a cookie and through a new poll field, so the shape is corrected BEFORE any of that ships.
 * A 40-character sha1 digest now redacts too, which is the over-redaction this module prefers.
 */
const TOKEN_SHAPE = /\b[0-9a-f]{32,64}\b/g;

/**
 * The route shape, as a belt to that braces: whatever a future link format looks like, the segment
 * after `/e/` is a capability and never belongs in telemetry. Also covers custom slugs, which are
 * not secret but are not diagnostic either.
 */
const GUEST_LINK_SEGMENT = /(^|\/)e\/[^/?#\s]+/g;

const REDACTED = "[redacted]";

/** Redact capability tokens from any free text (a message, an exception value, an `extra` string). */
export function redactTokens(value: string): string {
  return value
    .replace(GUEST_LINK_SEGMENT, `$1e/${REDACTED}`)
    .replace(TOKEN_SHAPE, REDACTED);
}

/**
 * Redact a URL: drop the query and fragment outright (R2 presigns carry signatures there, and no
 * query string has ever been worth the risk of reading it), then redact the path.
 */
export function redactUrl(value: string): string {
  const cut = value.search(/[?#]/);
  return redactTokens(cut === -1 ? value : value.slice(0, cut));
}

/** Depth-bounded walk over an `extra`/`data` bag, redacting string leaves. Bounded so a deep or
 * circular structure can never turn a telemetry hook into a hang. */
function redactBag(value: unknown, depth = 0): unknown {
  if (depth > 3) return value;
  if (typeof value === "string") return redactTokens(value);
  if (Array.isArray(value)) return value.map((v) => redactBag(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactBag(v, depth + 1);
    }
    return out;
  }
  return value;
}

/** URL-bearing keys on a breadcrumb's `data` (navigation uses to/from, fetch and xhr use url). */
const URL_KEYS = ["url", "to", "from", "description", "name", "href"];

/**
 * `beforeBreadcrumb`. Navigation and fetch crumbs are the single richest source of the leak: every
 * hop a guest makes through their album is one crumb carrying the token.
 */
export function redactBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.message) {
    breadcrumb.message = redactTokens(breadcrumb.message);
  }
  const data = breadcrumb.data;
  if (data && typeof data === "object") {
    for (const key of URL_KEYS) {
      const v = (data as Record<string, unknown>)[key];
      if (typeof v === "string") {
        (data as Record<string, unknown>)[key] = redactUrl(v);
      }
    }
  }
  return breadcrumb;
}

/** A replay envelope carries the pages it recorded; the type is not exported, so widen structurally. */
type MaybeReplayEvent = Event & { urls?: unknown };

/**
 * The event processor. Runs on errors, transactions and replay envelopes, which is why this and not
 * `beforeSend` (error-only) is the primary hook.
 */
export function redactEvent<T extends Event>(event: T): T {
  if (event.request?.url) event.request.url = redactUrl(event.request.url);
  if (event.message) event.message = redactTokens(event.message);
  // The transaction NAME is normally the parameterized route, which is already safe, but a manually
  // named span or a pageload on an unmatched route can carry the raw path.
  if (event.transaction) event.transaction = redactTokens(event.transaction);
  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = redactTokens(ex.value);
  }
  for (const crumb of event.breadcrumbs ?? []) redactBreadcrumb(crumb);
  if (event.extra) {
    event.extra = redactBag(event.extra) as typeof event.extra;
  }
  const urls = (event as MaybeReplayEvent).urls;
  if (Array.isArray(urls)) {
    (event as MaybeReplayEvent).urls = urls.map((u) =>
      typeof u === "string" ? redactUrl(u) : u,
    );
  }
  return event;
}

/**
 * `beforeAddRecordingEvent`. Only the CUSTOM frames (rrweb type 5) are touched: that is where the
 * replay's own breadcrumb and performance entries live, and it is the URL-bearing kind. DOM snapshot
 * frames are left alone deliberately, because walking every node of every snapshot in a hot path
 * would cost far more than it buys (an `href` in the recorded markup is a separate, smaller problem,
 * left for the roadmap; `maskAllText` and `blockAllMedia` already cover the visible content).
 */
export function redactReplayFrame<T extends { type?: number; data?: unknown }>(
  frame: T,
): T {
  if (frame.type !== 5 || !frame.data || typeof frame.data !== "object") {
    return frame;
  }
  frame.data = redactBag(frame.data) as typeof frame.data;
  return frame;
}
