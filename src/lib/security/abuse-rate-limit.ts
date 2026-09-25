/**
 * Abuse-focused rate limiter — PURE core (kinds + thresholds + decision). No env / DB / server-only imports,
 * so it is unit-testable (mirrors `unlock-rate-limit.ts`). The HMAC hashing + the DB counters (the
 * `action_rate` RPC + `action_attempts` inserts) live in `abuse-rate-limit-store.ts` (server-only); the guest
 * routes (`/api/guests`, `/api/guests/email`, `/api/reports`, `/api/guests/capture-email`) wire them together.
 *
 * DESIGN (Will's directive): ABUSE-focused, NOT volume-focused. An event app gets heavy LEGITIMATE traffic
 * from ONE NAT IP (a wedding/venue behind one WiFi/CGNAT), so a per-IP volume cap would block the core use
 * case. The venue-safe signal is cross-event BREADTH — one IP touching many DISTINCT events = a scraper/bot
 * (a venue is exactly ONE event → never trips). The per-(IP,event) backstop ceiling sits FAR above realistic
 * venue rates (runaway-bot guard only); raw volumetric DoS is the Vercel edge firewall's job. The limiter is
 * defense-in-depth (the capability token / verified session is the real gate), so the routes fail OPEN on a
 * limiter error.
 *
 * ★ THE PUBLIC MARKETING FORMS ARE THE EXCEPTION, and it is the whole point of them (QA #14). `contact` and
 * `careers` have NO capability token and NO session behind them: the limiter IS the gate, not a second layer
 * over one. So those two fail CLOSED on a limiter error, in `public-form-limit.ts`. They are also not
 * event-shaped, so breadth is meaningless (there is nothing to be broad across) and the scope is the bare IP,
 * exactly like `capture`.
 *
 * ★ THE ACCOUNT KINDS ARE THE OTHER EXCEPTION (`email_change`). Their requester is a signed-in ACCOUNT, not a
 * venue: the key is the user's id (HMAC'd in the store, `accountAbuseHashes`), so no NAT is shared and no
 * breadth applies, and the gate (`checkAccountAbuseRate`) fails CLOSED, because for this abuse the limiter is
 * the only bound (the kind's comment below says why).
 */

export type AbuseKind =
  | "join"
  | "rename"
  | "attach_email"
  | "report"
  | "capture"
  | "export"
  | "reel_clip_add"
  | "contact"
  | "careers"
  | "email_change";

/** The kinds keyed on a signed-in account rather than an IP (see the header's second ★). */
export type AccountAbuseKind = Extract<AbuseKind, "email_change">;

type Limit = {
  /** # of DISTINCT events one IP may touch in `breadthWindowMin` before it reads as a scraper. */
  breadthWindowMin: number;
  /** breadth ceiling; `Infinity` disables the breadth signal (capture is per-IP only — scope is the IP). */
  breadthMax: number;
  /** window for the per-scope backstop (per-(IP,event), or per-IP when the scope is the IP). */
  scopeWindowMin: number;
  /** backstop ceiling — set well above any realistic venue for `join`. */
  scopeMax: number;
};

// Generous, abuse-only ceilings (tunable). A venue is ONE event, so breadth never trips it; the per-event
// backstop sits well above realistic venue join rates.
export const ABUSE_LIMITS: Record<AbuseKind, Limit> = {
  // Join is venue-heavy → breadth is the primary guard; the per-(IP,event) backstop is a high runaway-bot cap
  // (400/15min to ONE event from ONE IP ≈ a very large venue; a scraper hits MANY events → breadth catches it).
  join: {
    breadthWindowMin: 60,
    breadthMax: 25,
    scopeWindowMin: 15,
    scopeMax: 400,
  },
  // The identity reshape's rename door (POST /api/guests/name), scope = (IP, event). TIGHTER than
  // join by design — a guest names themselves once, at the door, and the rename is the "actually,
  // call me something else" path — but still VENUE-SHAPED, which is the constraint that sets the
  // number rather than the tightness: thirty people on one wedding WiFi correcting a typo in the
  // same quarter of an hour are all legitimate, and a limiter that blocks them at a party is a
  // worse failure than a name-spammer who has nothing to gain (the name is only ever their OWN
  // row's — the session token is the capability). So the per-(IP, event) backstop is a runaway-bot
  // ceiling six times under join's, and BREADTH does the real work: one IP renaming across 15
  // distinct events in an hour is a script, and a venue is exactly one event.
  rename: {
    breadthWindowMin: 60,
    breadthMax: 15,
    scopeWindowMin: 15,
    scopeMax: 60,
  },
  // The guest identity round's attach door (POST /api/guests/email), scope = (IP, event). The
  // RENAME's numbers exactly, and for the RENAME's reasoning: this is the same act on the same row
  // by the same capability, one field over. A guest types their address once at the door and comes
  // back to this route only to correct it or to take it off, so the natural rate is near zero — but
  // the constraint that sets the number is still the VENUE, not the tightness: thirty people on one
  // wedding WiFi fixing a typo inside the same quarter hour are all legitimate, and a limiter that
  // stops them at a party is a worse failure than the abuse it prevents. There is very little to
  // prevent: the address is written to ONE row the caller already holds the token for, it is never
  // shown to anyone and NOTHING IS EVER SENT TO IT, so this is not a mail-bomb surface — the harm
  // ceiling is junk in a column. BREADTH does the real work, as everywhere: one IP attaching
  // addresses across 15 distinct events in an hour is a script, and a venue is exactly one event.
  attach_email: {
    breadthWindowMin: 60,
    breadthMax: 15,
    scopeWindowMin: 15,
    scopeMax: 60,
  },
  // Reports are rare even at a big venue → a tighter per-(IP,event) cap + a cross-event report-bomb guard.
  report: {
    breadthWindowMin: 60,
    breadthMax: 30,
    scopeWindowMin: 60,
    scopeMax: 15,
  },
  // Capture is already gated by a verified session → a light per-IP cap; no breadth (scope is a constant).
  capture: {
    breadthWindowMin: 60,
    breadthMax: Infinity,
    scopeWindowMin: 60,
    scopeMax: 40,
  },
  // "Download all" zip-export mints, scope = (IP, event). BREADTH is the scraper guard (one IP exporting
  // many DISTINCT events → a harvester; a venue is ONE event → never trips). The per-(IP,event) backstop
  // sits well above a big venue's end-of-night download burst (~100/15min from one NAT) — a runaway-bot
  // ceiling only. The token (signed, 2-min TTL) is the real gate, so the routes fail OPEN on a limiter error.
  export: {
    breadthWindowMin: 60,
    breadthMax: 15,
    scopeWindowMin: 15,
    scopeMax: 100,
  },
  // A GUEST'S "Add to event" (the on-device clip creator's write, complete-upload's `reel_eligible:
  // false`), scope = the guest's OWN session token — UNLIKE every other kind above, whose scope is the
  // EVENT (venue-shaped: many guests sharing one legitimate flood behind one NAT). A clip add is
  // unlike a download or the old render: it costs real storage and a moderation slot, and the budget
  // reel-teardown's brief asks for is per GUEST, not a shared venue envelope a handful of enthusiastic
  // uploaders could drain for everyone else at the same party. So breadth (distinct SESSIONS per IP)
  // is not the scraper signal it is elsewhere — a big party legitimately has many distinct guest
  // sessions behind one venue WiFi — and is disabled here (mirrors `capture`'s per-IP-only shape); the
  // per-(IP, session) backstop alone carries the guard, a full day wide ("a daily budget"). A handful
  // of clips a night sits comfortably inside it; a script hammering one session does not. The host's
  // own adds never reach this: they ride the host route, metered by storage instead.
  reel_clip_add: {
    breadthWindowMin: 60,
    breadthMax: Infinity,
    scopeWindowMin: 1440,
    scopeMax: 10,
  },
  // The public /contact form. Unauthenticated and unthrottled until now: every accepted submission is
  // one service-role insert plus one Resend send, so a few thousand requests drain the monthly email
  // quota, after which the orphan-sweep and prune BREAKER alerts cannot send either. That is the real
  // damage, and it is why this one fails closed. No breadth (nothing to be broad across); the scope is
  // the bare IP. 8 an hour is far past any honest sender, including someone retrying a flaky submit,
  // and an office NAT sharing one address stays comfortably inside it.
  contact: {
    breadthWindowMin: 60,
    breadthMax: Infinity,
    scopeWindowMin: 60,
    scopeMax: 8,
  },
  // The public /careers application form, same shape and same reasoning. Tighter, because applications
  // are rarer than messages: five from one address in an hour is already unusual, and an applicant who
  // hits it can come back in the hour or write to the address on the page.
  careers: {
    breadthWindowMin: 60,
    breadthMax: Infinity,
    scopeWindowMin: 60,
    scopeMax: 5,
  },
  // The account page's email change (requestEmailChangeAction, confirmEmailChangeAction), scope = the
  // signed-in ACCOUNT. GoTrue answers `email_exists` BEFORE it sends anything, so the requester's own
  // current inbox stays empty exactly when the new address already has an account: an oracle for which
  // addresses hold Partyreel accounts, which Supabase's email limits never meter because nothing was
  // sent. This kind is that oracle's only bound, so it counts every request AND every code attempt (a
  // code guesser draws on the same budget). Six an hour: an honest change is three calls (the request
  // and two codes), so six is a change plus one full redo (a lost email, a code typed wrong twice), and
  // a prober gets six addresses an hour per account. No breadth: an account is not venue-shaped.
  email_change: {
    breadthWindowMin: 60,
    breadthMax: Infinity,
    scopeWindowMin: 60,
    scopeMax: 6,
  },
};

/**
 * PURE decision from the windowed snapshot. `distinctScopes` = distinct events this IP touched in the breadth
 * window; `scopeHits` = hits to this exact scope (per-(IP,event), or per-IP for capture) in the scope window.
 * The backstop is checked first (a single-scope flood is the more acute signal).
 */
export function abuseRateDecision(
  kind: AbuseKind,
  distinctScopes: number,
  scopeHits: number,
): { allowed: boolean; retryAfterSec: number } {
  const cfg = ABUSE_LIMITS[kind];
  if (scopeHits >= cfg.scopeMax) {
    return { allowed: false, retryAfterSec: cfg.scopeWindowMin * 60 };
  }
  if (distinctScopes >= cfg.breadthMax) {
    return { allowed: false, retryAfterSec: cfg.breadthWindowMin * 60 };
  }
  return { allowed: true, retryAfterSec: 0 };
}
