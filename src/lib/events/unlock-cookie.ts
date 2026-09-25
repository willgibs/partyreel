/**
 * Server-side wrappers around the unlock-token core. These read the server secret
 * (UNLOCK_COOKIE_SECRET), the request cookies and the event's stored password state,
 * so they're server-only (tested with those three mocked in `unlock-cookie.test.ts`;
 * the pure crypto is `unlock-token.ts`'s). See that file for the token format and why
 * the signed eventId, not the cookie name, is the boundary.
 *
 * ★ AN UNLOCK ANSWERS TO THE PASSWORD IT WAS EARNED UNDER. The cookie's MAC covers
 * the event's PASSWORD VERSION (a digest of its stored bcrypt hash), which every check
 * reads fresh, so changing or clearing the password signs every guest out at once. Before
 * it, the cookie signed only `{eid, exp}` and a changed password evicted nobody for up
 * to 12 hours. Every call site keeps asking `isUnlocked(eventId)` alone: the version is
 * read here, where the answer is made, so no caller can forget to pass it.
 */
import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

import { assertUnlockEnv, serverEnv } from "@/lib/env";
import {
  UNLOCK_TTL_SECONDS,
  signUnlockToken,
  unlockCookieName,
  verifyUnlockToken,
  type UnlockClaim,
} from "@/lib/events/unlock-token";
import { captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * THE PASSWORD VERSION: a sha256 of the stored bcrypt hash. `set_event_password` salts
 * afresh on every call, so ANY change moves it (even back to the same word: a password
 * re-set is a deliberate sign-out); `clear_event_password` nulls the hash, so a cleared
 * password has no version and unlocks nothing. The hash goes no further than this
 * digest: read server-side through the service-role client (no guest role can read the
 * column), digested, dropped, as `toHostEvent` treats it (queries/events.ts). It never
 * rides a cookie, a log line or a payload.
 */
function passwordVersionOf(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex");
}

/**
 * An event's CURRENT password version, or null when it has none (no password, a
 * cleared one, a deleted event).
 *
 * DELIBERATE FAIL-CLOSED: a failed read (or a client that cannot be built) answers
 * null, so nothing verifies and the guest meets the password step rather than a 500 at
 * the venue, and it is reported, because a locked-out crowd with a correct password must
 * never look like a quiet night.
 */
async function readPasswordVersion(eventId: string): Promise<string | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("events")
      .select("event_password_hash")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.event_password_hash
      ? passwordVersionOf(data.event_password_hash)
      : null;
  } catch (e) {
    captureWarning("security", "unlock_password_state_unreadable", {
      reason: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/**
 * ONE READ PER REQUEST, route handlers included. A guest's request reaches
 * `isUnlocked` through several self-guarded reads (the route, the unlocked album, the
 * reel arm, the details re-read): measured before this memo, three version reads per
 * gallery poll and five per album sync, every 12 seconds per unlocked guest. React's
 * `cache()` dedupes only inside a render, so the answer is memoized on the request's
 * own cookie store instead, which `cookies()` resolves to once per request in a render,
 * a route handler and an action alike. Were that identity ever to change, this only
 * stops deduping, never answers wrongly. One answer per request also means its reads
 * can never disagree mid-request; the memo dies with the request, so a password change
 * is seen by the very next one.
 */
const versionsByRequest = new WeakMap<
  object,
  Map<string, Promise<string | null>>
>();

function currentPasswordVersion(
  request: object,
  eventId: string,
): Promise<string | null> {
  let versions = versionsByRequest.get(request);
  if (!versions) {
    versions = new Map();
    versionsByRequest.set(request, versions);
  }
  let version = versions.get(eventId);
  if (!version) {
    version = readPasswordVersion(eventId);
    versions.set(eventId, version);
  }
  return version;
}

/** An event's password state, as the unlock route reads it before checking a password. */
export type UnlockState = UnlockClaim;

/**
 * The password state behind a guest link: the event and its password version, or
 * null when the link names no live event with a password. ★ The unlock route reads
 * this BEFORE the bcrypt check and signs for exactly what it read (the route says
 * why). Throws on a failed read, so the route answers an error instead of signing
 * blind.
 */
export async function readUnlockStateByToken(
  qrToken: string,
): Promise<UnlockState | null> {
  const { data, error } = await createAdminClient()
    .from("events")
    .select("id, event_password_hash")
    .eq("qr_token", qrToken)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`unlock state read: ${error.message}`);
  if (!data?.event_password_hash) return null;
  return {
    eventId: data.id,
    passwordVersion: passwordVersionOf(data.event_password_hash),
  };
}

/**
 * Build the unlock cookie for an event under the password state read before the
 * check (name + signed value + maxAge). Throws if UNLOCK_COOKIE_SECRET is unset, so
 * the unlock route fails closed (500) rather than minting an unsigned cookie. The
 * route applies httpOnly/secure/sameSite/path.
 */
export function signUnlock(state: UnlockState): {
  name: string;
  value: string;
  maxAge: number;
} {
  const { UNLOCK_COOKIE_SECRET } = assertUnlockEnv();
  const expMs = Date.now() + UNLOCK_TTL_SECONDS * 1000;
  return {
    name: unlockCookieName(state.eventId),
    value: signUnlockToken(UNLOCK_COOKIE_SECRET, state, expMs),
    maxAge: UNLOCK_TTL_SECONDS,
  };
}

/**
 * Has the current request unlocked this event, under its CURRENT password? Reads +
 * verifies the per-event signed cookie against the event's password version. Fails
 * closed (false) if the secret is unset, the cookie is missing / forged / expired /
 * minted for another event or under another password, or the event has no password
 * state. Safe in an RSC (cookies() read is allowed; only writes throw there). NEVER
 * assume unlocked without calling this.
 */
export async function isUnlocked(eventId: string): Promise<boolean> {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const value = store.get(unlockCookieName(eventId))?.value;
  // No cookie, no read: the crowd still at the door costs the database nothing.
  if (!value) return false;
  const passwordVersion = await currentPasswordVersion(store, eventId);
  if (!passwordVersion) return false;
  return verifyUnlockToken(
    secret,
    { eventId, passwordVersion },
    value,
    Date.now(),
  );
}
