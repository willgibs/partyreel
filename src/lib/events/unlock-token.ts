/**
 * Signed unlock-token core for password-protected albums (Phase 1).
 *
 * A guest who enters the correct password gets a signed, httpOnly, per-event cookie
 * that the server checks on each load to serve the gated media (via the admin-read).
 * This module is the PURE, env-free, next/headers-free core (so it's unit-testable);
 * the server wrappers that read the secret + cookies live in `unlock-cookie.ts`.
 *
 * Token format: `${eventId}.${expMs}.${hmacHex(eventId + "." + expMs)}`.
 *   • The exp is INSIDE the MAC, so a holder can't extend their own TTL.
 *   • The cookie NAME is per-event but is NOT the security boundary — the signed
 *     eventId in the payload is (a client can rename cookies, not forge the MAC).
 */
import { createHmac } from "node:crypto";

import { constantTimeEquals } from "@/lib/crypto/constant-time";

// A party spans hours; the unlock outlives the gathering but not forever.
export const UNLOCK_TTL_SECONDS = 60 * 60 * 12; // 12h

/** Per-event cookie name. Read by BOTH /e/ and /a/, so the cookie is path "/". */
export function unlockCookieName(eventId: string): string {
  return `pr_unlock_${eventId}`;
}

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Sign an unlock token for an event that expires at `expMs`. Returns the cookie value. */
export function signUnlockToken(
  secret: string,
  eventId: string,
  expMs: number,
): string {
  const body = `${eventId}.${expMs}`;
  return `${body}.${hmacHex(secret, body)}`;
}

/**
 * Verify an unlock token for THIS event at `nowMs`. Recompute the MAC over the
 * claimed {eid,exp}, constant-time compare, THEN check the eid matches + not expired.
 * Fails closed (false) on a missing secret/value, malformed token, forged MAC, a
 * token minted for another event, or an expired one.
 */
export function verifyUnlockToken(
  secret: string,
  eventId: string,
  value: string | undefined,
  nowMs: number,
): boolean {
  if (!secret || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [eid, expRaw, mac] = parts;
  // MAC first (constant-time) so we don't branch on attacker-controlled fields early.
  if (!constantTimeEquals(mac, hmacHex(secret, `${eid}.${expRaw}`)))
    return false;
  if (eid !== eventId) return false;
  const expMs = Number(expRaw);
  if (!Number.isFinite(expMs) || expMs <= nowMs) return false;
  return true;
}
