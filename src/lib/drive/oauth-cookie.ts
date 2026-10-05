/**
 * THE CONNECT'S STATE COOKIE (drive-export.md, "The flow"): what `/api/drive/connect` remembers for its own callback,
 * the one lock on the round trip through Google.
 *
 * `pr_drive_oauth`: HttpOnly, Secure (but on a local http dev host), SameSite=Lax (Google's redirect back is a
 * top-level GET, which Lax lets through), Path=/api/drive/callback, ten minutes. It holds the state, the PKCE
 * verifier, the account it was started for and where to land (one of `return-path.ts`'s shapes), HMAC-signed under
 * UNLOCK_COOKIE_SECRET in a `drive-oauth:` domain of its own (the report hash uses that secret in `r-addr:`, the
 * limiter in `a-ip:`), so no other signed value can pass as one.
 *
 * ★ THE CALLBACK REFUSES UNLESS THE COOKIE IS THERE, ITS SIGNATURE HOLDS, ITS STATE EQUALS THE QUERY'S AND
 * `getUser()` IS THE ACCOUNT IT NAMES. The last check is the lock: it stops an attacker's code from connecting the
 * attacker's Drive to a victim's account (the classic OAuth CSRF, where every later send would land in the attacker's
 * Drive).
 *
 * Pure (the secret passed in): Vitest drives every refusal.
 */
import { createHmac } from "node:crypto";

import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { signInReturn } from "@/lib/auth/return-path";

export const DRIVE_OAUTH_COOKIE = "pr_drive_oauth";
export const DRIVE_OAUTH_TTL_MS = 10 * 60 * 1000;
export const DRIVE_CALLBACK_PATH = "/api/drive/callback";

export type DriveOAuthIntent = {
  state: string;
  verifier: string;
  /** The account the connect was started for: the callback's `getUser()` must be it. */
  uid: string;
  /** Where the round trip lands: one of the sign-in return shapes, never anything else. */
  next: string;
  /** Epoch ms after which the cookie is dead (it also expires in the browser). */
  exp: number;
};

const mac = (secret: string, body: string) =>
  createHmac("sha256", secret).update(`drive-oauth:${body}`).digest("hex");

export function sealIntent(secret: string, intent: DriveOAuthIntent): string {
  const body = Buffer.from(JSON.stringify(intent), "utf8").toString("base64url");
  return `${body}.${mac(secret, body)}`;
}

/** The intent a cookie holds, or null for anything absent, unsigned, malformed or past its ten minutes. */
export function openIntent(secret: string, value: string | undefined | null, nowMs: number): DriveOAuthIntent | null {
  if (!secret || !value || value.length > 4096) return null;
  const dot = value.indexOf(".");
  if (dot < 1 || dot !== value.lastIndexOf(".")) return null;
  const body = value.slice(0, dot);
  if (!constantTimeEquals(value.slice(dot + 1), mac(secret, body))) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const r = raw as Partial<DriveOAuthIntent> | null;
  if (
    !r ||
    typeof r.state !== "string" ||
    typeof r.verifier !== "string" ||
    typeof r.uid !== "string" ||
    typeof r.exp !== "number" ||
    r.exp <= nowMs ||
    signInReturn(r.next) === null
  ) {
    return null;
  }
  return { state: r.state, verifier: r.verifier, uid: r.uid, next: r.next as string, exp: r.exp };
}

/** Where a connect may land: a sign-in return shape, else her dashboard. */
export function connectLanding(next: unknown): string {
  return signInReturn(next) ?? "/dashboard";
}

/** The words a return carries back (`?drive=`), each read by the page it lands on. */
export const DRIVE_RETURNS = [
  "connected",
  "switched",
  "declined",
  "needs_permission",
  "failed",
  "unavailable",
] as const;
export type DriveReturn = (typeof DRIVE_RETURNS)[number];

/** `next` with `?drive=<word>` (its own marker, never carried from the input). */
export function withDriveReturn(next: string, word: DriveReturn): string {
  // Before any fragment: "/account#google-drive" lands as "/account?drive=connected#google-drive".
  const hash = next.indexOf("#");
  const path = hash === -1 ? next : next.slice(0, hash);
  const fragment = hash === -1 ? "" : next.slice(hash);
  return `${path}${path.includes("?") ? "&" : "?"}drive=${word}${fragment}`;
}
