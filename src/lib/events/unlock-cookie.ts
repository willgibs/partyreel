/**
 * Server-side wrappers around the unlock-token core. These read the server secret
 * (UNLOCK_COOKIE_SECRET) and the request cookies, so they're server-only and not
 * unit-tested (the pure crypto in `unlock-token.ts` is). See that file for the
 * token format and why the signed eventId — not the cookie name — is the boundary.
 */
import "server-only";

import { cookies } from "next/headers";

import { assertUnlockEnv, serverEnv } from "@/lib/env";
import {
  UNLOCK_TTL_SECONDS,
  signUnlockToken,
  unlockCookieName,
  verifyUnlockToken,
} from "@/lib/events/unlock-token";

/**
 * Build the unlock cookie for an event (name + signed value + maxAge). Throws if
 * UNLOCK_COOKIE_SECRET is unset, so the unlock route fails closed (500) rather than
 * minting an unsigned cookie. The route applies httpOnly/secure/sameSite/path.
 */
export function signUnlock(eventId: string): {
  name: string;
  value: string;
  maxAge: number;
} {
  const { UNLOCK_COOKIE_SECRET } = assertUnlockEnv();
  const expMs = Date.now() + UNLOCK_TTL_SECONDS * 1000;
  return {
    name: unlockCookieName(eventId),
    value: signUnlockToken(UNLOCK_COOKIE_SECRET, eventId, expMs),
    maxAge: UNLOCK_TTL_SECONDS,
  };
}

/**
 * Has the current request unlocked this event? Reads + verifies the per-event signed
 * cookie. Fails closed (false) if the secret is unset or the cookie is missing /
 * forged / expired / minted for another event. Safe in an RSC (cookies() read is
 * allowed; only writes throw there). NEVER assume unlocked without calling this.
 */
export async function isUnlocked(eventId: string): Promise<boolean> {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const value = store.get(unlockCookieName(eventId))?.value;
  return verifyUnlockToken(secret, eventId, value, Date.now());
}
