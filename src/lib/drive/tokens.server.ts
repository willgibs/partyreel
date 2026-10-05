/**
 * THE TOKEN STORE'S SEAL (drive-export.md, "The token store"): a Google refresh or access token, sealed in the app with
 * AES-256-GCM before it reaches the database, opened only here, in Vercel's runtime.
 *
 * `v1.<key id>.<iv>.<ciphertext and tag>`, every part base64url: a fresh 12-byte IV a seal, the key's id (the first 8
 * hex of its SHA-256, never the key) so a rotation knows which key opens a row, and the tag GCM appends.
 *
 * ★ THE ASSOCIATED DATA BINDS A SEAL TO ITS ROW AND ITS SLOT: `drive:v1:<account id>:<provider>:<purpose>`. A
 * connection is one row an account and provider (`unique (user_id, provider)`), so a ciphertext copied onto another
 * account's row, or from the access slot onto the refresh slot, fails to open. (The account rather than the row's id,
 * so the callback can seal before the row exists; the uniqueness makes the two the same binding.)
 *
 * ★ A ROTATION FINISHES ITSELF. DRIVE_TOKEN_KEY seals; DRIVE_TOKEN_KEY_PREVIOUS, while set, still opens what it
 * sealed, and every write re-seals with the current key (`needsReseal`), so rows move over as their tokens refresh. A
 * row neither key opens is a broken connection (she reconnects), never an error page: `openToken` answers null.
 *
 * ★ WHO CAN OPEN ONE: the Vercel runtime and anyone who can read Vercel's environment (the key and the client secret
 * together are every refresh token). The database holds ciphertext alone; the Worker never sees a refresh token or
 * this key (the lease hands it an hour of access, sealed again for the wire: `protocol.ts`).
 */
import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type TokenPurpose = "refresh" | "access";

export type TokenContext = {
  userId: string;
  provider: "google_drive";
  purpose: TokenPurpose;
};

/** The keys, base64 as the env holds them. */
export type TokenKeys = { current: string; previous?: string | null };

const VERSION = "v1";

function keyBytes(b64: string): Buffer {
  const key = Buffer.from(b64, "base64");
  if (key.length !== 32) {
    throw new Error(
      "DRIVE_TOKEN_KEY must be 32 bytes, base64 (openssl rand -base64 32)",
    );
  }
  return key;
}

/** A key's public id: the first 8 hex of its SHA-256. Names the key on the row; reveals nothing of it. */
export function keyId(b64: string): string {
  return createHash("sha256").update(keyBytes(b64)).digest("hex").slice(0, 8);
}

function aad(ctx: TokenContext): Buffer {
  return Buffer.from(
    `drive:${VERSION}:${ctx.userId}:${ctx.provider}:${ctx.purpose}`,
    "utf8",
  );
}

/** Seal a token under the current key. */
export function sealToken(
  plaintext: string,
  ctx: TokenContext,
  keys: TokenKeys,
): string {
  const key = keyBytes(keys.current);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad(ctx));
  const sealed = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return [
    VERSION,
    keyId(keys.current),
    iv.toString("base64url"),
    sealed.toString("base64url"),
  ].join(".");
}

/**
 * Open a sealed token, or null: an unknown shape, a key id neither key carries, a tag that does not hold (another
 * row's ciphertext, another slot's, a byte changed) all read as "this connection is broken", never a throw.
 */
export function openToken(
  sealed: string | null | undefined,
  ctx: TokenContext,
  keys: TokenKeys,
): string | null {
  if (!sealed) return null;
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  const [, id, ivPart, bodyPart] = parts;
  const candidates = [keys.current, keys.previous].filter((k): k is string =>
    Boolean(k),
  );
  const keyB64 = candidates.find((k) => {
    try {
      return keyId(k) === id;
    } catch {
      return false;
    }
  });
  if (!keyB64) return null;
  try {
    const iv = Buffer.from(ivPart!, "base64url");
    const body = Buffer.from(bodyPart!, "base64url");
    if (iv.length !== 12 || body.length < 17) return null;
    const tag = body.subarray(body.length - 16);
    const ciphertext = body.subarray(0, body.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(keyB64), iv);
    decipher.setAAD(aad(ctx));
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** True when a sealed value was sealed by a key other than the current one: the next write re-seals it. */
export function needsReseal(
  sealed: string | null | undefined,
  keys: TokenKeys,
): boolean {
  if (!sealed) return false;
  const id = sealed.split(".")[1];
  return id !== keyId(keys.current);
}
