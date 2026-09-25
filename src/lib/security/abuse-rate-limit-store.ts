/**
 * Server-only store for the abuse rate-limiter. Reads/writes the deny-all `action_attempts` table via the
 * service-role admin client; the breadth COUNT(DISTINCT) runs in the `action_rate` SECURITY DEFINER RPC
 * (PostgREST can't COUNT DISTINCT). Privacy: stores ONLY HMAC hashes keyed by UNLOCK_COOKIE_SECRET (the
 * existing rate-limit hashing secret) — never a raw IP, qr_token or user id. See `abuse-rate-limit.ts` for
 * the design + the per-kind thresholds; the guest routes wire it (and fail OPEN on any error), and the
 * account kinds go through `checkAccountAbuseRate` below (which fails CLOSED).
 */
import "server-only";

import { createHmac } from "node:crypto";

import { mustQuery } from "@/lib/db/must-query";
import { serverEnv } from "@/lib/env";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import {
  ABUSE_LIMITS,
  abuseRateDecision,
  type AbuseKind,
  type AccountAbuseKind,
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

/**
 * The per-ACCOUNT key pair for an account kind (`email_change`). The requester column (`ip_hash`, named
 * for the venue kinds) holds an HMAC of the signed-in user's id under its own `a-acct:` prefix, so it can
 * never equal an IP's hash, and the scope is the kind's constant, so the per-scope count IS the
 * per-account count, whatever network the account arrives from. Never the raw id. Throws if the secret is
 * unset (the account gate catches, and fails CLOSED).
 */
export function accountAbuseHashes(
  kind: AccountAbuseKind,
  userId: string,
): { ipHash: string; scopeHash: string } {
  const secret = serverEnv.UNLOCK_COOKIE_SECRET;
  if (!secret) throw new Error("UNLOCK_COOKIE_SECRET unset");
  return {
    ipHash: hmac(secret, `a-acct:${userId}`),
    scopeHash: hmac(secret, `a-scope:${kind}:`),
  };
}

export type AccountRateGate =
  | { allowed: true }
  /** Over the per-account ceiling. `retryAfterSec` is the window, for the refusal to quote. */
  | { allowed: false; reason: "rate_limited"; retryAfterSec: number }
  /** The limiter itself could not answer. Refused on purpose (below). */
  | { allowed: false; reason: "unavailable"; retryAfterSec: number };

/**
 * THE ACCOUNT KINDS' GATE: check the account's window and, when allowed, COUNT THIS CALL BEFORE THE WORK
 * IT AUTHORIZES (the public forms' order), so a call that then fails at GoTrue still spent its share and a
 * burst of parallel calls cannot all slip in behind one count.
 *
 * ★ IT FAILS CLOSED, unlike the guest kinds. Their capability token is the real gate and the limiter a
 * second layer; here the limiter is the only bound on the abuse it exists for (the `email_change` kind's
 * comment: an `email_exists` oracle Supabase never meters). An unreadable limiter is a call refused, and
 * reported as an error, because an outage of the only gate should wake somebody. A failed count after an
 * allowed check does not deny (best-effort, and `recordAbuseEvent` reports its own failures).
 */
export async function checkAccountAbuseRate(
  kind: AccountAbuseKind,
  userId: string,
): Promise<AccountRateGate> {
  try {
    const { ipHash, scopeHash } = accountAbuseHashes(kind, userId);
    const gate = await checkAbuseRate(kind, ipHash, scopeHash);
    if (!gate.allowed) {
      captureWarning("security", "account_rate_limited", { kind });
      return {
        allowed: false,
        reason: "rate_limited",
        retryAfterSec: gate.retryAfterSec,
      };
    }
    await recordAbuseEvent(kind, ipHash, scopeHash).catch(() => {});
    return { allowed: true };
  } catch (e) {
    captureError("security", e, { kind, phase: "rate_limit_fail_closed" });
    return { allowed: false, reason: "unavailable", retryAfterSec: 60 };
  }
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
