/**
 * THE WORDS BETWEEN THIS WORKER AND THE APP (drive-export.md, "The transfer"): the app's kick, and the Worker's lease,
 * report, check page, dying lane and sweep, each a POST signed with DRIVE_WORKER_SECRET.
 *
 * ★ THE TWIN OF THE APP'S `src/lib/drive/protocol.ts`, ONE WIRE FORMAT: `${body}.${hmacHex("drive:" + body)}`, body =
 * base64url(JSON). This signs and verifies with Web Crypto; the app verifies with node:crypto; the vector in both
 * suites is the contract (`protocol.test.ts` here and there), as the export report's twin is pinned. The "drive:"
 * domain keeps every Drive word apart from the export Worker's tokens and reports.
 *
 * ★ A LEASE'S ACCESS TOKEN ARRIVES SEALED (AES-256-GCM under HKDF-SHA256(secret, info "drive:token"), associated data
 * `drive:lease:<token>`): opened here for the lease it was sealed for, held in memory for the slice, and NEVER logged
 * (`log-safety.test.ts` refuses a log call that takes a lease object or a token).
 */

export const DRIVE_PROTOCOL_VERSION = 1;

/** A word older or newer than this is refused (the app's clock and ours both agree within it). */
export const DRIVE_FRESH_MS = 5 * 60 * 1000;

export const APP_PATHS = {
  lease: "/api/internal/drive/lease",
  report: "/api/internal/drive/report",
  check: "/api/internal/drive/check",
  lanefail: "/api/internal/drive/lanefail",
  sweep: "/api/internal/drive/sweep",
} as const;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const b64 =
    text.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((text.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Sign a word: `${body}.${hmacHex("drive:" + body)}`. */
export async function signWord(
  secret: string,
  payload: unknown,
): Promise<string> {
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const mac = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    enc.encode(`drive:${body}`),
  );
  return `${body}.${toHex(mac)}`;
}

/** Constant-time compare of two hex strings of any length (lengths are compared last, inside the loop's time). */
function sameHex(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export type WordVerdict =
  | { ok: true; word: Record<string, unknown> }
  | { ok: false; reason: "malformed" | "bad_signature" | "stale" };

/** Verify a word at `nowMs`: the MAC first, then the JSON, then `at`'s freshness. The app's kick is the one we take. */
export async function verifyWord(
  secret: string,
  wire: string,
  nowMs: number,
): Promise<WordVerdict> {
  if (!secret || !wire || wire.length > 64 * 1024)
    return { ok: false, reason: "malformed" };
  const dot = wire.indexOf(".");
  if (dot < 1 || dot !== wire.lastIndexOf("."))
    return { ok: false, reason: "malformed" };
  const body = wire.slice(0, dot);
  const mac = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    enc.encode(`drive:${body}`),
  );
  if (!sameHex(wire.slice(dot + 1), toHex(mac)))
    return { ok: false, reason: "bad_signature" };
  let raw: unknown;
  try {
    raw = JSON.parse(dec.decode(fromBase64Url(body)));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    return { ok: false, reason: "malformed" };
  const word = raw as Record<string, unknown>;
  if (typeof word.at !== "number" || Math.abs(nowMs - word.at) > DRIVE_FRESH_MS)
    return { ok: false, reason: "stale" };
  return { ok: true, word };
}

/** The app's kick, read: a connection and how many lanes to enqueue (1 to 3). Null for anything else. */
export function readKick(
  word: Record<string, unknown>,
): { connectionId: string; lanes: number } | null {
  if (word.v !== DRIVE_PROTOCOL_VERSION || word.kind !== "kick") return null;
  const id = word.connectionId;
  const lanes = word.lanes;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (
    typeof lanes !== "number" ||
    !Number.isInteger(lanes) ||
    lanes < 1 ||
    lanes > 3
  )
    return null;
  return { connectionId: id, lanes };
}

async function tokenKey(secret: string): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: enc.encode("drive:token"),
    },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/** Open a lease's sealed access token, or null: a seal for another lease, or a byte changed, opens nothing. */
export async function openLeaseToken(
  secret: string,
  sealed: string,
  leaseToken: string,
): Promise<string | null> {
  const parts = sealed.split(".");
  if (parts.length !== 2) return null;
  try {
    const iv = fromBase64Url(parts[0]!);
    const body = fromBase64Url(parts[1]!);
    if (iv.length !== 12 || body.length < 17) return null;
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
        additionalData: enc.encode(`drive:lease:${leaseToken}`),
      },
      await tokenKey(secret),
      body,
    );
    return dec.decode(plain);
  } catch {
    return null;
  }
}

// ── What the app answers (the app's own types, mirrored: the vector and the routes' tests hold them together) ──

export type LeaseItem = {
  mediaId: string;
  key: string;
  bytes: number;
  contentType: string;
  name: string;
  description: string;
  modifiedTime: string;
  attempts: number;
  priorFileId: string | null;
  /** The album's folder was found by its mark after a reconnect: look the file up by `pr_media` before sending it. */
  lookUp: boolean;
  session: { uri: string; offset: number } | null;
};

export type CheckItem = {
  mediaId: string;
  fileId: string;
  bytes: number;
  md5: string | null;
};

export type LeaseAnswer =
  | {
      state: "work";
      lease: string;
      until: string;
      jobId: string;
      folderId: string;
      token: string;
      items: LeaseItem[];
    }
  | {
      state: "check";
      lease: string;
      until: string;
      jobId: string;
      folderId: string;
      first: boolean;
      token: string;
      items: CheckItem[];
    }
  | { state: "throttled"; until: string }
  | { state: "wait" | "paused" | "stopped" | "idle" };

/** A connection-level finding a report carries (the app's `DRIVE_FINDINGS`). */
export type Finding =
  | "drive_full"
  | "daily_limit"
  | "throttled"
  | "auth"
  | "folder_gone"
  | "domain_policy";

export type ReportItem =
  | {
      mediaId: string;
      outcome: "sent";
      fileId: string;
      md5?: string;
      workerMd5?: string;
      kept?: boolean;
    }
  | { mediaId: string; outcome: "progress"; sessionUri: string; offset: number }
  | {
      mediaId: string;
      outcome: "failed";
      reason: string;
      retry: boolean;
      keepSession?: boolean;
    }
  | { mediaId: string; outcome: "skipped"; reason: "gone" | "missing_object" }
  | { mediaId: string; outcome: "released" };

export type CheckResult = {
  mediaId: string;
  state: "ok" | "missing" | "trashed" | "mismatch" | "unknown";
};
