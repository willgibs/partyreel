/**
 * Abuse-focused rate limiter — PURE core (kinds + thresholds + decision). No env / DB / server-only imports,
 * so it is unit-testable (mirrors `unlock-rate-limit.ts`). The HMAC hashing + the DB counters (the
 * `action_rate` RPC + `action_attempts` inserts) live in `abuse-rate-limit-store.ts` (server-only); the guest
 * routes (`/api/guests`, `/api/reports`, `/api/guests/capture-email`) wire them together.
 *
 * DESIGN (Will's directive): ABUSE-focused, NOT volume-focused. An event app gets heavy LEGITIMATE traffic
 * from ONE NAT IP (a wedding/venue behind one WiFi/CGNAT), so a per-IP volume cap would block the core use
 * case. The venue-safe signal is cross-event BREADTH — one IP touching many DISTINCT events = a scraper/bot
 * (a venue is exactly ONE event → never trips). The per-(IP,event) backstop ceiling sits FAR above realistic
 * venue rates (runaway-bot guard only); raw volumetric DoS is the Vercel edge firewall's job. The limiter is
 * defense-in-depth (the capability token / verified session is the real gate), so the routes fail OPEN on a
 * limiter error.
 */

export type AbuseKind = "join" | "report" | "capture";

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
  join: { breadthWindowMin: 60, breadthMax: 25, scopeWindowMin: 15, scopeMax: 400 },
  // Reports are rare even at a big venue → a tighter per-(IP,event) cap + a cross-event report-bomb guard.
  report: { breadthWindowMin: 60, breadthMax: 30, scopeWindowMin: 60, scopeMax: 15 },
  // Capture is already gated by a verified session → a light per-IP cap; no breadth (scope is a constant).
  capture: { breadthWindowMin: 60, breadthMax: Infinity, scopeWindowMin: 60, scopeMax: 40 },
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
