/**
 * Venue-NAT-aware unlock rate-limit — PURE core (constants + decision + IP parse). No env / DB /
 * server-only imports, so it is unit-testable (env.ts validates eagerly at import, so the DB-backed
 * store can't be imported in Vitest). The HMAC hashing + the DB counters live in
 * `unlock-rate-limit-store.ts` (server-only); the `/api/guests/unlock` route wires them together.
 *
 * THE VENUE-NAT PROBLEM: a wedding/concert crowd shares ONE WiFi NAT/CGNAT IP, so a naive per-IP
 * limit would lock out legitimate guests. THE FIX: count ONLY FAILED attempts, and a SUCCESS clears
 * that IP's failures. Legitimate guests entering the correct shared password SUCCEED (never counted),
 * and their successes keep clearing any attacker's failures on the shared IP; a lone remote attacker
 * (no successes) accumulates failures and gets blocked. A high per-event GLOBAL cap backstops
 * distributed/botnet brute-force across rotating IPs. The limiter is defense-in-depth, NOT the auth
 * gate (bcrypt + the generic 401 remain the password check), so the route fails OPEN on limiter error.
 */

// Single-sourced thresholds (the Vitest tripwire below guards these). A 4-char password has ~1.7M
// combinations, so even MAX_FAILS_PER_EVENT/hour makes a full brute-force take ~months, while the
// generous per-IP cap absorbs a crowd's occasional fat-fingering (which a success then clears).
export const UNLOCK_IP_WINDOW_MIN = 15; // per-(event, IP) failure window
export const UNLOCK_EVENT_WINDOW_MIN = 60; // per-event GLOBAL failure window (distributed backstop)
export const UNLOCK_MAX_FAILS_PER_IP = 20;
export const UNLOCK_MAX_FAILS_PER_EVENT = 300;

/**
 * PURE decision: given the windowed failure counts, allow the attempt or return a 429 Retry-After.
 * The per-IP cap is the primary guard (a lone attacker); the per-event cap is the distributed backstop.
 */
export function unlockRateDecision(
  perIpFails: number,
  perEventFails: number,
): { allowed: boolean; retryAfterSec: number } {
  if (perIpFails >= UNLOCK_MAX_FAILS_PER_IP) {
    return { allowed: false, retryAfterSec: UNLOCK_IP_WINDOW_MIN * 60 };
  }
  if (perEventFails >= UNLOCK_MAX_FAILS_PER_EVENT) {
    return { allowed: false, retryAfterSec: UNLOCK_EVENT_WINDOW_MIN * 60 };
  }
  return { allowed: true, retryAfterSec: 0 };
}

/** First-hop client IP from the proxy headers (Vercel sets x-forwarded-for). Pure (no env). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
