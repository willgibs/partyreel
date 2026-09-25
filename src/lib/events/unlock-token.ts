/**
 * Signed unlock-token core for password-protected albums (Phase 1).
 *
 * A guest who enters the correct password gets a signed, httpOnly, per-event cookie
 * that the server checks on each load to serve the gated media (via the admin-read).
 * This module is the PURE, env-free, next/headers-free core (so it's unit-testable);
 * the server wrappers that read the secret, the cookies and the password state live
 * in `unlock-cookie.ts`.
 *
 * Token format: `${eventId}.${expMs}.${hmacHex(eventId + "." + expMs + "." + passwordVersion)}`.
 *   • The exp is INSIDE the MAC, so a holder can't extend their own TTL.
 *   • The cookie NAME is per-event but is NOT the security boundary — the signed
 *     eventId in the payload is (a client can rename cookies, not forge the MAC).
 *   • ★ The PASSWORD VERSION is inside the MAC and nowhere in the cookie. It is a
 *     digest of the event's stored password state, so a token answers to the password
 *     it was earned under: when the host changes (or clears) the password the version
 *     moves, every outstanding token stops verifying, and everyone is signed out at
 *     once instead of keeping the album for up to 12 hours.
 */
import { createHmac } from "node:crypto";

import { constantTimeEquals } from "@/lib/crypto/constant-time";

// A party spans hours; the unlock outlives the gathering but not forever.
export const UNLOCK_TTL_SECONDS = 60 * 60 * 12; // 12h

/** What an unlock is FOR: one event, under one password state. */
export type UnlockClaim = {
  eventId: string;
  /** The event's password state as `unlock-cookie.ts` derives it. Never empty. */
  passwordVersion: string;
};

/** Per-event cookie name. Read by BOTH /e/ and /a/, so the cookie is path "/". */
export function unlockCookieName(eventId: string): string {
  return `pr_unlock_${eventId}`;
}

function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** The MAC input: the eid and exp the cookie carries, and the version it never does. */
function macPayload(eid: string, expRaw: string, passwordVersion: string) {
  return `${eid}.${expRaw}.${passwordVersion}`;
}

/**
 * Sign an unlock token for an event, under its current password state, that expires
 * at `expMs`. Returns the cookie value. Throws on an empty version: a token minted
 * with no password state would answer to none, which is a bug, never an unlock.
 */
export function signUnlockToken(
  secret: string,
  claim: UnlockClaim,
  expMs: number,
): string {
  if (!claim.passwordVersion) {
    throw new Error("signUnlockToken: an unlock needs a password version");
  }
  const body = `${claim.eventId}.${expMs}`;
  return `${body}.${hmacHex(secret, macPayload(claim.eventId, String(expMs), claim.passwordVersion))}`;
}

/**
 * Verify an unlock token for THIS event, under its CURRENT password state, at `nowMs`.
 * Recompute the MAC over the claimed {eid,exp} and the current version, constant-time
 * compare, THEN check the eid matches + not expired. Fails closed (false) on a missing
 * secret/value/version, malformed token, forged MAC, a token minted for another event
 * or under another password, or an expired one.
 */
export function verifyUnlockToken(
  secret: string,
  claim: UnlockClaim,
  value: string | undefined,
  nowMs: number,
): boolean {
  if (!secret || !value || !claim.passwordVersion) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [eid, expRaw, mac] = parts;
  // MAC first (constant-time) so we don't branch on attacker-controlled fields early.
  if (
    !constantTimeEquals(
      mac,
      hmacHex(secret, macPayload(eid, expRaw, claim.passwordVersion)),
    )
  )
    return false;
  if (eid !== claim.eventId) return false;
  const expMs = Number(expRaw);
  if (!Number.isFinite(expMs) || expMs <= nowMs) return false;
  return true;
}
