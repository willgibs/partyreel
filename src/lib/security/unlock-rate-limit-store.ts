/**
 * Server-only store for the unlock rate-limiter (security Phase 2, Part C). Reads/writes the deny-all
 * `unlock_attempts` table via the service-role admin client. Privacy: stores ONLY HMAC hashes keyed by
 * UNLOCK_COOKIE_SECRET, never a raw IP or qr_token. See `unlock-rate-limit.ts` for the design + the
 * venue-NAT rationale, and the `/api/guests/unlock` route for the wiring (it fails OPEN on any error).
 */
import "server-only";

import { createHmac } from "node:crypto";

import { serverEnv } from "@/lib/env";
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
  const [ipRes, evRes] = await Promise.all([
    admin
      .from("unlock_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("attempted_at", ipSince),
    admin
      .from("unlock_attempts")
      .select("*", { count: "exact", head: true })
      .eq("token_hash", tokenHash)
      .gt("attempted_at", eventSince),
  ]);
  return unlockRateDecision(ipRes.count ?? 0, evRes.count ?? 0);
}

/** Record ONE failed attempt (best-effort; the caller ignores errors). */
export async function recordUnlockFailure(
  tokenHash: string,
  ipHash: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("unlock_attempts")
    .insert({ token_hash: tokenHash, ip_hash: ipHash });
}

/** On a SUCCESSFUL unlock, clear that IP's failures for the event (the venue-crowd fix). */
export async function clearUnlockFailures(ipHash: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("unlock_attempts").delete().eq("ip_hash", ipHash);
}
