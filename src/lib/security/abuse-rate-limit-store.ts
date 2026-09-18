/**
 * Server-only store for the abuse rate-limiter. Reads/writes the deny-all `action_attempts` table via the
 * service-role admin client; the breadth COUNT(DISTINCT) runs in the `action_rate` SECURITY DEFINER RPC
 * (PostgREST can't COUNT DISTINCT). Privacy: stores ONLY HMAC hashes keyed by UNLOCK_COOKIE_SECRET (the
 * existing rate-limit hashing secret) — never a raw IP or qr_token. See `abuse-rate-limit.ts` for the design
 * + the per-kind thresholds; the guest routes wire it (and fail OPEN on any error).
 */
import "server-only";

import { createHmac } from "node:crypto";

import { mustQuery } from "@/lib/db/must-query";
import { serverEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import {
  ABUSE_LIMITS,
  abuseRateDecision,
  type AbuseKind,
} from "@/lib/security/abuse-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

function hmac(secret: string, input: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

/**
 * Derive the per-IP key + the per-event scope key (HMAC; never stores raw IP/qr_token). `scopeValue` is the
 * qr_token for `join`/`report`; for per-IP-only kinds (`capture`) pass "" — the scope becomes a constant so
 * the per-scope count IS the per-IP count. Throws if the secret is unset (callers catch + fail OPEN).
 */
export function abuseHashes(
  ip: string,
  kind: AbuseKind,
  scopeValue: string,
): { ipHash: string; scopeHash: string } {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) throw new Error("UNLOCK_COOKIE_SECRET unset");
  return {
    ipHash: hmac(secret, `a-ip:${ip}`),
    scopeHash: hmac(secret, `a-scope:${kind}:${scopeValue}`),
  };
}

/** Read the breadth + backstop snapshot (one RPC) and decide. Reads via the service-role client. */
export async function checkAbuseRate(
  kind: AbuseKind,
  ipHash: string,
  scopeHash: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const cfg = ABUSE_LIMITS[kind];
  const admin = createAdminClient();
  const breadthSince = new Date(
    Date.now() - cfg.breadthWindowMin * 60_000,
  ).toISOString();
  const scopeSince = new Date(
    Date.now() - cfg.scopeWindowMin * 60_000,
  ).toISOString();
  // mustQuery ARMS THE ALERT THAT WAS ALREADY WRITTEN FOR THIS. Every caller wraps
  // this in try/catch and fails OPEN with captureWarning("abuse_limiter_unavailable
  // _fail_open") — a deliberate policy (the capability token is the real gate). But
  // swallowed, the failed RPC returned `{}`, which reads as zero hits, which reads
  // as ALLOWED. So the limiter failed open exactly as designed while the outage
  // alert could never fire: the one path nobody would ever learn was broken.
  // Throwing here does NOT change the allow/deny posture (the callers still fail
  // open, on purpose); it just makes the outage visible.
  //
  // ROADMAP QA #19, the second half: throwing makes the outage visible to the CALLER, which then
  // fails open with a captureWarning. What nothing counted was how often that happened, so the
  // console could not tell a limiter that has been dead for a week from one nobody tripped. The
  // failure is recorded into the `abuse_limiter` signal on the way past; the throw is unchanged.
  let data: unknown;
  try {
    data = await mustQuery(
      admin.rpc("action_rate", {
        p_kind: kind,
        p_ip_hash: ipHash,
        p_scope_hash: scopeHash,
        p_breadth_since: breadthSince,
        p_scope_since: scopeSince,
      }),
      `security/abuse-limiter: action_rate(${kind})`,
    );
  } catch (e) {
    await recordSignalFailure({
      job: "abuse_limiter",
      area: "security",
      operation: `action_rate(${kind})`,
      error: e,
      extra: { kind },
    });
    throw e;
  }
  const snap = (data ?? {}) as {
    distinct_scopes?: number;
    scope_hits?: number;
  };
  return abuseRateDecision(
    kind,
    Number(snap.distinct_scopes ?? 0),
    Number(snap.scope_hits ?? 0),
  );
}

/**
 * Record ONE action event (best-effort; callers ignore errors).
 *
 * ★ THE SILENT HALF OF QA #19, and the worse one. Every call site wraps this in `.catch(() => {})`,
 * so a failing INSERT means the counters never accumulate, which means every later decision reads
 * zero hits, which means ALLOWED — the limiter is off and looks identical to one nobody has tripped.
 * Reporting it here rather than at the seven call sites covers all of them at once, and the swallow
 * upstream is left exactly as it was: the write is genuinely best-effort, it just is not silent.
 */
export async function recordAbuseEvent(
  kind: AbuseKind,
  ipHash: string,
  scopeHash: string,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("action_attempts")
    .insert({ kind, ip_hash: ipHash, scope_hash: scopeHash });
  if (error) {
    await recordSignalFailure({
      job: "abuse_limiter",
      area: "security",
      operation: `action_attempts insert (${kind})`,
      error: new Error(error.message),
      extra: { kind, code: error.code },
    });
  }
}
