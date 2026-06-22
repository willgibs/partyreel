/**
 * Signed export-manifest token core for "Download all" (the zip-export Worker).
 *
 * The app authorizes a download ONCE at mint (host owns the event / guest access-resolved),
 * then signs the authorized object list into this token. The browser form-POSTs the token to
 * the streaming Worker, which verifies the signature and streams a zip of exactly those keys.
 * The app is the single authz oracle; the Worker only verifies a MAC and streams.
 *
 * This is the PURE, env-free, next/headers-free core (so it's Vitest-loadable) — mirrors
 * `events/unlock-token.ts`. The route reads the secret + supplies `jti`/`exp`; the Worker has
 * its OWN Web-Crypto copy of verify (it can't import from `src/`), so the only contract that
 * MUST stay in lockstep across the two is the token FORMAT below.
 *
 * Token format: `${body}.${hmacHex(body)}` where `body = base64url(JSON.stringify(payload))`.
 *   • base64url has no "." and the MAC is hex, so there is exactly ONE "." — split is unambiguous.
 *   • The exp is INSIDE the signed payload, so a holder can't extend their own TTL.
 *   • The raw R2 keys ride sealed in `payload.items` — equivalent exposure to the presigned
 *     gallery URLs we already ship (same keys, useless without a signature; others' mediaId-UUIDs
 *     are unguessable), so the "never expose raw keys" guardrail holds. The Worker ALSO re-validates
 *     each key's layout (defense-in-depth) before any R2 read.
 */
import { createHmac } from "node:crypto";

import { constantTimeEquals } from "@/lib/crypto/constant-time";

/** Bump when the payload shape changes incompatibly; verify rejects a mismatched version. */
export const EXPORT_TOKEN_VERSION = 1;

/** One-shot fetch — the browser is redirected to the Worker within seconds of minting. */
export const EXPORT_TOKEN_TTL_MS = 120_000; // 2 min (clock-skew + slow click-through)

export type ExportScope = "host" | "guest";

/** One object to put in the zip: the R2 key + the friendly in-zip filename. */
export type ExportItem = { key: string; name: string };

export type ExportManifestPayload = {
  /** EXPORT_TOKEN_VERSION at mint time. */
  v: number;
  /** Random per-mint nonce — replay visibility + the export-log key (NOT a hard single-use gate in v1). */
  jti: string;
  scope: ExportScope;
  /** For logging / abuse-scoping only; the Worker does NOT derive keys from this. */
  eventId: string;
  /** Header-safe ASCII zip filename, e.g. "sarah-toms-wedding.zip". */
  zipName: string;
  items: ExportItem[];
  /** Absolute expiry, unix ms. */
  exp: number;
};

export type ExportVerifyResult =
  | { ok: true; payload: ExportManifestPayload }
  | { ok: false; reason: ExportVerifyFailure };

export type ExportVerifyFailure =
  | "malformed"
  | "bad_signature"
  | "bad_version"
  | "expired"
  | "bad_payload"
  | "bad_key";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Strict canonical-layout check for an R2 key we're willing to stream:
 * `events/<uuid>/<photo|video>/<uuid>/<original|preview>.<ext>`. The Worker runs the SAME check
 * so that even a (signature-requiring, therefore practically-impossible) forged manifest can never
 * point a read at `avatars/…`, a traversal, or any non-event object. Mirrors `r2/keys.ts` layout.
 */
export function isValidExportKey(key: string): boolean {
  const segments = key.split("/");
  if (segments.length !== 5) return false;
  if (segments[0] !== "events") return false;
  if (!UUID_RE.test(segments[1])) return false;
  if (segments[2] !== "photo" && segments[2] !== "video") return false;
  if (!UUID_RE.test(segments[3])) return false;
  return /^(original|preview)\.[a-z0-9]+$/.test(segments[4]);
}

function hmacHex(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function encodeBody(payload: ExportManifestPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

/** Sign a manifest into a token. The caller supplies `jti` + `exp` (keeps this core pure/testable). */
export function signExportToken(
  secret: string,
  payload: ExportManifestPayload,
): string {
  const body = encodeBody(payload);
  return `${body}.${hmacHex(secret, body)}`;
}

/**
 * Verify a token at `nowMs`. Recompute the MAC over the body (constant-time) FIRST, then decode +
 * shape-check the payload, the version, the expiry, and EVERY item key's layout. Fails closed
 * (returns a typed reason) on a missing secret, malformed token, forged MAC, wrong version, expired
 * token, or any non-canonical key. The Worker re-implements this in Web Crypto; keep them in sync.
 */
export function verifyExportToken(
  secret: string,
  token: string | undefined,
  nowMs: number,
): ExportVerifyResult {
  if (!secret || !token) return { ok: false, reason: "malformed" };
  const dot = token.indexOf(".");
  if (dot < 1 || dot !== token.lastIndexOf(".")) {
    return { ok: false, reason: "malformed" };
  }
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  // MAC first (constant-time) so we never branch on attacker-controlled fields before authenticating.
  if (!constantTimeEquals(mac, hmacHex(secret, body))) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: ExportManifestPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as ExportManifestPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (payload?.v !== EXPORT_TOKEN_VERSION) {
    return { ok: false, reason: "bad_version" };
  }
  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= nowMs
  ) {
    return { ok: false, reason: "expired" };
  }
  if (
    (payload.scope !== "host" && payload.scope !== "guest") ||
    typeof payload.zipName !== "string" ||
    payload.zipName.length === 0 ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    return { ok: false, reason: "bad_payload" };
  }
  for (const item of payload.items) {
    if (
      !item ||
      typeof item.name !== "string" ||
      item.name.length === 0 ||
      typeof item.key !== "string" ||
      !isValidExportKey(item.key)
    ) {
      return { ok: false, reason: "bad_key" };
    }
  }
  return { ok: true, payload };
}
