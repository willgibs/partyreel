/**
 * THE WORKER'S WORD BACK, AS THE APP READS IT (`export-ends`): the check's count, a stream's start and end,
 * and the Worker's daily heartbeat, each a signed POST into `/api/export/report`.
 *
 * The twin of `workers/export/src/report.ts`, which signs it with Web Crypto; this verifies with node:crypto.
 * ONE contract, the wire format, pinned by the same vector in both suites:
 *
 *   report = `${body}.${hmacHex("report:" + body)}`,  body = base64url(JSON.stringify(payload))
 *
 * ★ THE EXPORT SECRET, IN A DOMAIN OF ITS OWN. A token's MAC is over its bare body and a base64url body never
 * holds a ":", so no report can pass as a token nor a token as a report, and the deploy needs no new secret.
 *
 * ★ A REPORT IS FRESH OR IT IS NOTHING. Its `at` must sit within `REPORT_FRESH_MS` of the app's clock, so a
 * captured report cannot be replayed into tomorrow's heartbeat; the writes it drives only ever fill an empty
 * field (`queries/exports.ts`), so a replay inside the window changes nothing either.
 *
 * Pure (no env, no DB), so Vitest loads it beside the route.
 */
import { createHmac } from "node:crypto";

import { z } from "zod";

import { constantTimeEquals } from "@/lib/crypto/constant-time";

/** The one path the Worker posts reports to (its `REPORT_PATH`). */
export const REPORT_PATH = "/api/export/report";

/** A report older or newer than this is refused: the Worker sends one the moment its fact is true. */
export const REPORT_FRESH_MS = 5 * 60 * 1000;

/** A token's nonce: 16 random bytes in hex (`export-service.ts`'s `randomBytes(16)`). */
export const JTI_RE = /^[0-9a-f]{32}$/;

const jti = z.string().regex(JTI_RE);
const count = z.number().int().min(0).max(1_000_000);
const at = z.number().int().positive();
const mediaId = z.uuid();

/** How a stream ended (the Worker's `StreamOutcome`). */
export const STREAM_OUTCOMES = [
  "saved",
  "short",
  "stopped",
  "failed",
  "empty",
] as const;
export type StreamOutcome = (typeof STREAM_OUTCOMES)[number];

const reportSchema = z.discriminatedUnion("kind", [
  // The check's count, or that R2 could not answer it: exactly one of the two.
  z
    .object({
      v: z.literal(1),
      kind: z.literal("check"),
      jti,
      at,
      items: count,
      found: count.optional(),
      error: z.literal("unavailable").optional(),
    })
    .refine((r) => (r.found === undefined) !== (r.error === undefined))
    .refine((r) => r.found === undefined || r.found <= r.items),
  z.object({ v: z.literal(1), kind: z.literal("start"), jti, at }),
  z.object({
    v: z.literal(1),
    kind: z.literal("end"),
    jti,
    at,
    outcome: z.enum(STREAM_OUTCOMES),
    files: count,
    // One zip holds at most 2,000 items (`MAX_EXPORT_ITEMS`); the bound is the parser's, not the rule.
    missing: z.array(mediaId).max(5_000),
  }),
  z.object({
    v: z.literal(1),
    kind: z.literal("heartbeat"),
    at,
    mode: z.enum(["on", "off"]),
    r2: z.enum(["ok", "error"]),
  }),
]);

export type WorkerReport = z.infer<typeof reportSchema>;

export type ReportVerdict =
  | { ok: true; report: WorkerReport }
  | { ok: false; reason: "malformed" | "bad_signature" | "stale" };

const reportMac = (secret: string, body: string) =>
  createHmac("sha256", secret).update(`report:${body}`).digest("hex");

/** Sign a report as the Worker does: the tests' half of the pinned vector. */
export function signReport(secret: string, report: WorkerReport): string {
  const body = Buffer.from(JSON.stringify(report), "utf8").toString(
    "base64url",
  );
  return `${body}.${reportMac(secret, body)}`;
}

/**
 * Verify a report at `nowMs`: the MAC first (constant time, before any field is read), then the shape,
 * then its freshness. Fails closed on anything off.
 */
export function verifyReport(
  secret: string,
  wire: string,
  nowMs: number,
): ReportVerdict {
  if (!secret || !wire) return { ok: false, reason: "malformed" };
  const dot = wire.indexOf(".");
  if (dot < 1 || dot !== wire.lastIndexOf(".")) {
    return { ok: false, reason: "malformed" };
  }
  const body = wire.slice(0, dot);
  if (!constantTimeEquals(wire.slice(dot + 1), reportMac(secret, body))) {
    return { ok: false, reason: "bad_signature" };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: "malformed" };
  if (Math.abs(nowMs - parsed.data.at) > REPORT_FRESH_MS) {
    return { ok: false, reason: "stale" };
  }
  return { ok: true, report: parsed.data };
}

const isLocalHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "[::1]" ||
  host.endsWith(".localhost");

/**
 * WHERE THIS APP ASKS THE WORKER TO REPORT, signed into the token (`report`), or null to ask nothing.
 *
 * The app's own origin, so a report returns to the deployment that minted the token (the alias to the alias,
 * partyreel.com to itself). Null where the Worker could never reach it: a laptop's `next dev` behind a
 * deployed Worker (a lane's `wrangler dev` beside it is local too, and is asked), or an origin in the clear.
 * With no ask the Worker answers as it always has, and the walk claims nothing it cannot hear.
 */
export function reportAddressFor(
  appOrigin: string,
  workerUrl: string,
): string | null {
  let app: URL;
  let worker: URL;
  try {
    app = new URL(appOrigin);
    worker = new URL(workerUrl);
  } catch {
    return null;
  }
  const appLocal = isLocalHost(app.hostname);
  if (appLocal && !isLocalHost(worker.hostname)) return null;
  if (app.protocol !== "https:" && !(appLocal && app.protocol === "http:")) {
    return null;
  }
  return new URL(REPORT_PATH, app.origin).href;
}
