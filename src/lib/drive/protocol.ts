/**
 * THE WORDS BETWEEN THE APP AND THE `partyreel-drive` WORKER (drive-export.md, "The transfer"): a kick from the app,
 * and from the Worker a lease, a report, a closing check's page, a dying lane and the sweep, each a POST signed with
 * DRIVE_WORKER_SECRET. The app is the one authorization oracle (as it is for both Workers we run): the Worker holds no
 * database credential, no refresh token, no key; it leases work and an hour of access from the app and reports back.
 *
 * ★ ONE WIRE FORMAT, TWO TWINS. `${body}.${hmacHex("drive:" + body)}`, body = base64url(JSON). This file verifies
 * with node:crypto; `workers/drive/src/protocol.ts` signs with Web Crypto; the vector in both suites is the contract
 * (`protocol.test.ts` here, `protocol.test.ts` there), as the export report's twin is pinned.
 *
 * ★ ITS OWN DOMAIN. The "drive:" prefix is in every MAC, so no Drive word can pass as an export token or report (bare
 * body, "report:") and none of theirs as a Drive word, even if one secret were ever reused.
 *
 * ★ FRESH OR NOTHING, AND A REPLAY IS HARMLESS BY CONSTRUCTION, so there is no nonce table: every word's `at` must sit
 * within five minutes of the app's clock; a replayed report is a no-op (every write is a transition keyed by its lease
 * token, and a `sent` stays sent), a replayed lease only holds a batch idle until it runs out, a replayed kick
 * enqueues lanes that find nothing to lease. What a forged report CAN do is mark items sent that are not in her
 * Drive: nothing that deletes anything ever reads that word (there is no exit, and the closing check asks Drive).
 *
 * ★ A LEASE'S ACCESS TOKEN TRAVELS SEALED, under a key derived from the same secret (HKDF-SHA256, info
 * "drive:token") and bound to its lease (associated data `drive:lease:<token>`), so a captured or logged response
 * yields nothing, and a sealed token lifted from one lease opens under no other.
 *
 * Pure (no env, no DB): the routes import it, and Vitest loads it beside them.
 */
import { createCipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

import { z } from "zod";

import { constantTimeEquals } from "@/lib/crypto/constant-time";

export const DRIVE_PROTOCOL_VERSION = 1;

/** A word older or newer than this is refused: each is sent the moment it is true. */
export const DRIVE_FRESH_MS = 5 * 60 * 1000;

/** The paths the Worker posts to on the app's origin, and the one the app posts to on the Worker's. */
export const DRIVE_PATHS = {
  lease: "/api/internal/drive/lease",
  report: "/api/internal/drive/report",
  check: "/api/internal/drive/check",
  lanefail: "/api/internal/drive/lanefail",
  sweep: "/api/internal/drive/sweep",
  kick: "/kick",
} as const;

const mac = (secret: string, body: string) =>
  createHmac("sha256", secret).update(`drive:${body}`).digest("hex");

/** Sign a word as the Worker does (the tests' half of the vector) and as the app's kick does. */
export function signDriveWord(secret: string, payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${mac(secret, body)}`;
}

export type DriveVerdict<T> =
  | { ok: true; word: T }
  | { ok: false; reason: "malformed" | "bad_signature" | "stale" };

/**
 * Verify a word at `nowMs`: the MAC first (constant time, before any field is read), then the shape, then its
 * freshness. Fails closed on anything off.
 */
export function verifyDriveWord<T extends { at: number }>(
  secret: string,
  wire: string,
  schema: z.ZodType<T>,
  nowMs: number,
): DriveVerdict<T> {
  if (!secret || !wire || wire.length > 1_000_000)
    return { ok: false, reason: "malformed" };
  const dot = wire.indexOf(".");
  if (dot < 1 || dot !== wire.lastIndexOf("."))
    return { ok: false, reason: "malformed" };
  const body = wire.slice(0, dot);
  if (!constantTimeEquals(wire.slice(dot + 1), mac(secret, body))) {
    return { ok: false, reason: "bad_signature" };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "malformed" };
  if (Math.abs(nowMs - parsed.data.at) > DRIVE_FRESH_MS)
    return { ok: false, reason: "stale" };
  return { ok: true, word: parsed.data };
}

// ── The sealed token ────────────────────────────────────────────────────────────────────────────

function tokenKey(secret: string): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(secret, "utf8"),
      Buffer.alloc(0),
      "drive:token",
      32,
    ),
  );
}

/**
 * Seal an access token for one lease: `${iv}.${ciphertext and tag}`, base64url. `iv` is for the pinned vector alone;
 * every real seal draws a fresh one.
 */
export function sealForLease(
  secret: string,
  accessToken: string,
  leaseToken: string,
  iv?: Buffer,
): string {
  const nonce = iv ?? randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(secret), nonce);
  cipher.setAAD(Buffer.from(`drive:lease:${leaseToken}`, "utf8"));
  const sealed = Buffer.concat([
    cipher.update(accessToken, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return `${nonce.toString("base64url")}.${sealed.toString("base64url")}`;
}

// ── The words ───────────────────────────────────────────────────────────────────────────────────

const uuid = z.uuid();
const at = z.number().int().positive();
const v = z.literal(DRIVE_PROTOCOL_VERSION);
const fileId = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);
const md5 = z.string().regex(/^[0-9a-f]{32}$/);
const reason = z.string().max(300);

/** A connection-level finding a report or a check page carries (section 5's table). */
export const DRIVE_FINDINGS = [
  "drive_full",
  "daily_limit",
  "throttled",
  "auth",
  "folder_gone",
  "domain_policy",
] as const;
export type DriveFinding = (typeof DRIVE_FINDINGS)[number];

export const kickWordSchema = z.object({
  v,
  kind: z.literal("kick"),
  at,
  connectionId: uuid,
  lanes: z.number().int().min(1).max(3),
});
export type KickWord = z.infer<typeof kickWordSchema>;

export const leaseWordSchema = z.object({
  v,
  kind: z.literal("lease"),
  at,
  connectionId: uuid,
});
export type LeaseWord = z.infer<typeof leaseWordSchema>;

export const reportItemSchema = z.discriminatedUnion("outcome", [
  z.object({
    mediaId: uuid,
    outcome: z.literal("sent"),
    fileId,
    md5: md5.optional(),
    workerMd5: md5.optional(),
    kept: z.boolean().optional(),
  }),
  z.object({
    mediaId: uuid,
    outcome: z.literal("progress"),
    sessionUri: z.url().max(2048),
    offset: z.number().int().min(0),
  }),
  z.object({
    mediaId: uuid,
    outcome: z.literal("failed"),
    reason,
    retry: z.boolean(),
    keepSession: z.boolean().optional(),
  }),
  z.object({
    mediaId: uuid,
    outcome: z.literal("skipped"),
    reason: z.enum(["gone", "missing_object"]),
  }),
  z.object({ mediaId: uuid, outcome: z.literal("released") }),
]);
export type ReportItem = z.infer<typeof reportItemSchema>;

export const reportWordSchema = z.object({
  v,
  kind: z.literal("report"),
  at,
  lease: uuid,
  items: z.array(reportItemSchema).max(50),
  finding: z.enum(DRIVE_FINDINGS).optional(),
  done: z.boolean().optional(),
});
export type ReportWord = z.infer<typeof reportWordSchema>;

export const checkResultSchema = z.object({
  mediaId: uuid,
  state: z.enum(["ok", "missing", "trashed", "mismatch", "unknown"]),
});
export type CheckResult = z.infer<typeof checkResultSchema>;

export const checkWordSchema = z.object({
  v,
  kind: z.literal("check"),
  at,
  lease: uuid,
  results: z.array(checkResultSchema).max(100),
  duplicates: z.number().int().min(0).max(1_000_000).optional(),
  finding: z.literal("folder_gone").optional(),
});
export type CheckWord = z.infer<typeof checkWordSchema>;

export const laneFailWordSchema = z.object({
  v,
  kind: z.literal("lanefail"),
  at,
  connectionId: uuid,
  error: z.string().max(300),
});
export type LaneFailWord = z.infer<typeof laneFailWordSchema>;

/** The Worker's own readings, reported on every sweep: the queue's and the dead letters' depths, and its switch. */
export const sweepWordSchema = z.object({
  v,
  kind: z.literal("sweep"),
  at,
  mode: z.enum(["on", "off"]),
  depths: z
    .record(z.string().max(40), z.number().int().min(0))
    .refine((d) => Object.keys(d).length <= 8),
});
export type SweepWord = z.infer<typeof sweepWordSchema>;

// ── What the app answers ────────────────────────────────────────────────────────────────────────

/** One original a lease hands a lane: everything it needs to send it, nothing it could misuse. */
export type LeaseItem = {
  mediaId: string;
  /** The R2 key of the original (the Worker reads R2 through its binding; no key ever reaches a browser). */
  key: string;
  bytes: number;
  contentType: string;
  name: string;
  description: string;
  /** RFC 3339: when it reached the album, so Drive's own sort agrees with the names. */
  modifiedTime: string;
  attempts: number;
  /** The file an earlier send on this connection left: asked first, kept when it is still there and whole. */
  priorFileId: string | null;
  /** A big file's session to resume (Google answers where it stands; we never trust our own offset). */
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

export type ReportAnswer = { state: "ok" | "stop" };

export type SweepAnswer = { kick: { connectionId: string; lanes: number }[] };
