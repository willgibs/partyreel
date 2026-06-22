/**
 * Worker-side verify for the signed export-manifest token. This is the Web-Crypto twin of the app's
 * `src/lib/export/export-token.ts` (which signs with node:crypto). They share ONE contract — the token
 * FORMAT — and must stay in lockstep:
 *
 *   token = `${body}.${hmacHex(body)}`,  body = base64url(JSON.stringify(payload))
 *
 * `crypto.subtle.verify` does the MAC check in constant time. The Worker NEVER authorizes — a valid
 * signature means the app already authorized this exact object set at mint. As defense-in-depth it ALSO
 * re-validates each key's canonical layout, so even an (impossible-without-the-secret) forged manifest
 * can't point an R2 read at a non-event object.
 */

export const EXPORT_TOKEN_VERSION = 1;

export type ExportItem = { key: string; name: string };

export type ExportManifestPayload = {
  v: number;
  jti: string;
  scope: string;
  eventId: string;
  zipName: string;
  items: ExportItem[];
  exp: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strict layout gate: `events/<uuid>/<photo|video>/<uuid>/<original|preview>.<ext>`. Mirrors the app. */
export function isValidExportKey(key: string): boolean {
  const s = key.split("/");
  if (s.length !== 5) return false;
  if (s[0] !== "events") return false;
  if (!UUID_RE.test(s[1])) return false;
  if (s[2] !== "photo" && s[2] !== "video") return false;
  if (!UUID_RE.test(s[3])) return false;
  return /^(original|preview)\.[a-z0-9]+$/.test(s[4]);
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return null;
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function base64UrlToString(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes); // UTF-8 (emoji event names etc.)
}

export type ExportVerifyResult =
  | { ok: true; payload: ExportManifestPayload }
  | { ok: false };

/** Verify + decode + shape/expiry/key-layout check. Fails closed (returns `{ ok: false }`) on anything off. */
export async function verifyExportToken(
  secret: string | undefined,
  token: string | null,
  nowMs: number,
): Promise<ExportVerifyResult> {
  if (!secret || !token) return { ok: false };
  const dot = token.indexOf(".");
  if (dot < 1 || dot !== token.lastIndexOf(".")) return { ok: false };
  const body = token.slice(0, dot);
  const sig = hexToBytes(token.slice(dot + 1));
  if (!sig) return { ok: false };

  const enc = new TextEncoder();
  let verified = false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    verified = await crypto.subtle.verify("HMAC", key, sig, enc.encode(body));
  } catch {
    return { ok: false };
  }
  if (!verified) return { ok: false };

  let payload: ExportManifestPayload;
  try {
    payload = JSON.parse(base64UrlToString(body)) as ExportManifestPayload;
  } catch {
    return { ok: false };
  }

  if (payload?.v !== EXPORT_TOKEN_VERSION) return { ok: false };
  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= nowMs
  ) {
    return { ok: false };
  }
  if (
    typeof payload.zipName !== "string" ||
    payload.zipName.length === 0 ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    return { ok: false };
  }
  for (const it of payload.items) {
    if (
      !it ||
      typeof it.name !== "string" ||
      it.name.length === 0 ||
      typeof it.key !== "string" ||
      !isValidExportKey(it.key)
    ) {
      return { ok: false };
    }
  }
  return { ok: true, payload };
}
