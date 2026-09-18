/**
 * Server-only store for the unlock rate-limiter (security Phase 2, Part C). Reads/writes the deny-all
 * `unlock_attempts` table via the service-role admin client. Privacy: stores ONLY HMAC hashes keyed by
 * UNLOCK_COOKIE_SECRET, never a raw IP or qr_token. See `unlock-rate-limit.ts` for the design + the
 * venue-NAT rationale, and the `/api/guests/unlock` route for the wiring (it fails OPEN on any error).
 */
import "server-only";

import { createHmac } from "node:crypto";

import { mustCount } from "@/lib/db/must-query";
import { serverEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import {
  UNLOCK_EVENT_WINDOW_MIN,
  UNLOCK_IP_WINDOW_MIN,
  unlockRateDecision,
} from "@/lib/security/unlock-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

function hmac(secret: string, input: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

/**
 * Derive the per-event (token_hash) + per-IP (ip_hash) keys. Throws if UNLOCK_COOKIE_SECRET is unset
 * (the caller wraps in try/catch and fails OPEN — the unlock route already 500s at cookie-signing if
 * the secret is missing, so the limiter never silently weakens a working unlock flow).
 */
export function unlockHashes(
  qrToken: string,
  ip: string,
): { tokenHash: string; ipHash: string } {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) throw new Error("UNLOCK_COOKIE_SECRET unset");
  return {
    tokenHash: hmac(secret, `t:${qrToken}`),
    ipHash: hmac(secret, `i:${qrToken}:${ip}`),
  };
}

/** Count windowed FAILURES (per-IP + per-event) and decide. Reads via the service-role client. */
export async function checkUnlockRate(
  tokenHash: string,
  ipHash: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const admin = createAdminClient();
  const ipSince = new Date(
    Date.now() - UNLOCK_IP_WINDOW_MIN * 60_000,
  ).toISOString();
  const eventSince = new Date(
    Date.now() - UNLOCK_EVENT_WINDOW_MIN * 60_000,
  ).toISOString();
  // mustCount, for the same reason as the abuse limiter: a failed COUNT resolves as
  // a confident ZERO, i.e. "no failed attempts", i.e. ALLOWED. The unlock route
  // wraps this in try/catch and fails open on purpose, but its own comment says a
  // silent outage here is an open brute-force window ("so surface it") — and it
  // could not surface, because swallowing the error meant nothing ever threw.
  // NOTE this pair escaped the no-swallowed-db-error lint: `ipRes.count ?? 0` is a
  // property read, not a destructure, so the rule's AST pattern never saw it.
  // The counts are recorded into the `unlock_limiter` signal on their way past (QA #19): the route
  // still fails OPEN on a throw, on purpose, but a week of silent fail-open is now a number on
  // /admin/jobs instead of an open brute-force window nobody would ever learn about.
  try {
    const [ipCount, evCount] = await Promise.all([
      mustCount(
        admin
          .from("unlock_attempts")
          .select("*", { count: "exact", head: true })
          .eq("ip_hash", ipHash)
          .gt("attempted_at", ipSince),
        "security/unlock-limiter: per-IP failures",
      ),
      mustCount(
        admin
          .from("unlock_attempts")
          .select("*", { count: "exact", head: true })
          .eq("token_hash", tokenHash)
          .gt("attempted_at", eventSince),
        "security/unlock-limiter: per-event failures",
      ),
    ]);
    return unlockRateDecision(ipCount, evCount);
  } catch (e) {
    await recordSignalFailure({
      job: "unlock_limiter",
      area: "security",
      operation: "unlock_attempts windowed counts",
      error: e,
    });
    throw e;
  }
}

/**
 * Record ONE failed attempt (best-effort; the caller ignores errors).
 *
 * ★ A failing INSERT here is the limiter switching itself off: no failures are counted, so no
 * threshold is ever reached, so every attempt is allowed. Silent until now, and indistinguishable
 * from a night when nobody typed a wrong password.
 */
export async function recordUnlockFailure(
  tokenHash: string,
  ipHash: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("unlock_attempts")
    .insert({ token_hash: tokenHash, ip_hash: ipHash });
  if (error) {
    await recordSignalFailure({
      job: "unlock_limiter",
      area: "security",
      operation: "unlock_attempts insert",
      error: new Error(error.message),
      extra: { code: error.code },
    });
  }
}

/** On a SUCCESSFUL unlock, clear that IP's failures for the event (the venue-crowd fix). */
export async function clearUnlockFailures(ipHash: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("unlock_attempts").delete().eq("ip_hash", ipHash);
}
