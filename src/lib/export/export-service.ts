/**
 * Server-only orchestration shared by the host + guest export mint routes. The routes do the
 * scope-specific AUTHZ + row fetching (host: getUser + own-event + listEventMedia; guest:
 * qr-resolve + access-resolve + admin size read); this module does the common work: the
 * `export_enabled` kill-switch, the abuse limiter, the manifest build + cap, signing the token,
 * the `export_log` write, and mapping the outcome to an HTTP response.
 *
 * The app is the single authz oracle — it authorizes HERE, at mint, and seals the result into the
 * signed token. The Worker only verifies the signature + streams; it never re-authorizes.
 */
import "server-only";

import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { assertExportEnv } from "@/lib/env";
import {
  buildExportManifest,
  type ExportCursor,
  type ExportMediaRow,
  type ExportSummary,
  type ExportTypeFilter,
  type ExportWalk,
  summarizeMedia,
} from "@/lib/export/build-manifest";
import {
  EXPORT_TOKEN_TTL_MS,
  EXPORT_TOKEN_VERSION,
  type ExportScope,
  signExportToken,
} from "@/lib/export/export-token";
import { reportAddressFor } from "@/lib/export/report";
import { EMPTY_EXPORT_MESSAGE, WALK_COPY } from "@/lib/export/walk";
import { recordSignalFailure } from "@/lib/jobs/failure-log";
import { captureWarning } from "@/lib/observability/sentry";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = SupabaseClient<Database>;

/** The modal summary breakdown for a viewer's authoritative rows (no DB/authz here — caller fetched). */
export function exportSummary(rows: ExportMediaRow[]): ExportSummary {
  return summarizeMedia(rows);
}

type MintInput = {
  scope: ExportScope;
  eventId: string;
  eventName: string;
  rows: ExportMediaRow[];
  types: ExportTypeFilter;
  includeHidden: boolean;
  ip: string;
  /** The part a walk asks for (`cap=split`); absent, the old one-zip-or-refused contract. */
  walk?: ExportWalk;
  /** A word the zip's name carries after the event's (`yours`). */
  zipLabel?: string;
  /**
   * The minting app's own origin (the route's request), where the Worker is asked to report this export
   * (`export-ends`): its check, its stream's start and end. Absent, nothing is asked.
   */
  appOrigin?: string;
};

export type MintOutcome =
  | {
      ok: true;
      token: string;
      workerUrl: string;
      /** This part's number, how many the walk takes as of this mint, and where the next begins. */
      part: number;
      parts: number;
      next: ExportCursor | null;
      /** What this zip holds: the count the Worker's check is read against. */
      itemCount: number;
      totalBytes: number;
      /** The token's nonce: the export's row, and what the walk's status poll asks by. */
      jti: string;
      /** The token asks the Worker to report (the walk may then wait for its word). */
      reports: boolean;
    }
  | {
      ok: false;
      reason: "paused" | "rate_limited" | "empty" | "over_cap" | "unconfigured";
      retryAfterSec?: number;
    };

/** The export kill-switch. Fails OPEN on a read error (a transient DB hiccup must not block every
 *  legit download; the token + cap + limiter are the other layers) and defaults ON if the row is gone. */
async function isExportEnabled(admin: Admin): Promise<boolean> {
  const { data, error } = await admin
    .from("ops_flags")
    .select("enabled")
    .eq("key", "export_enabled")
    .maybeSingle();
  if (error) return true;
  return data?.enabled ?? true;
}

type LogFields = {
  scope: ExportScope;
  eventId: string;
  requesterHash: string | null;
  itemCount: number;
  totalBytes: number;
  jti: string | null;
  outcome: string;
  error?: string;
};

/** Best-effort export_log write (the admin /export readout reads it). Never throws into the flow. */
async function recordExport(admin: Admin, f: LogFields): Promise<void> {
  await admin
    .from("export_log")
    .insert({
      scope: f.scope,
      event_id: f.eventId,
      requester_hash: f.requesterHash,
      item_count: f.itemCount,
      total_bytes: f.totalBytes,
      jti: f.jti,
      outcome: f.outcome,
      error: f.error ?? null,
    })
    .then(
      () => {},
      () => {},
    );
}

/**
 * Authorize-and-sign an export. Order: configured? → kill-switch → abuse limiter (fail OPEN) →
 * manifest+cap → sign → log. Returns a typed outcome the route maps to HTTP. NEVER trusts the
 * client for the row set or sizes — the caller passed authoritative, access-scoped rows.
 */
export async function mintExport(input: MintInput): Promise<MintOutcome> {
  // Configured? Fail closed (operational) if the secret/URL are unset — nothing to mint to.
  let signing: { EXPORT_SIGNING_SECRET: string; EXPORT_WORKER_URL: string };
  try {
    signing = assertExportEnv();
  } catch (error) {
    // Every download refused until someone notices: the delivery signal is how they do (`export-ends`).
    await recordSignalFailure({
      job: "export_delivery",
      area: "export",
      operation: "mint (the export secret or Worker URL is unset)",
      error,
    });
    return { ok: false, reason: "unconfigured" };
  }

  const admin = createAdminClient();

  // HMAC-of-IP for export_log + the abuse limiter scope (never a raw IP). Fail open if the hashing
  // secret (UNLOCK_COOKIE_SECRET) is unset.
  let ipHash: string | null = null;
  let scopeHash: string | null = null;
  try {
    const h = abuseHashes(input.ip, "export", input.eventId);
    ipHash = h.ipHash;
    scopeHash = h.scopeHash;
  } catch {
    /* limiter secret unset → no hash, fail open */
  }

  // Kill-switch: an operator can halt all new exports from /admin (live tokens still expire in 2 min).
  if (!(await isExportEnabled(admin))) {
    await recordExport(admin, {
      scope: input.scope,
      eventId: input.eventId,
      requesterHash: ipHash,
      itemCount: 0,
      totalBytes: 0,
      jti: null,
      outcome: "rejected_mode",
    });
    return { ok: false, reason: "paused" };
  }

  // Abuse limiter (venue-safe; fail OPEN on a limiter error — the signed token is the real gate).
  if (ipHash && scopeHash) {
    try {
      const gate = await checkAbuseRate("export", ipHash, scopeHash);
      if (!gate.allowed) {
        await recordExport(admin, {
          scope: input.scope,
          eventId: input.eventId,
          requesterHash: ipHash,
          itemCount: 0,
          totalBytes: 0,
          jti: null,
          outcome: "rate_limited",
        });
        return {
          ok: false,
          reason: "rate_limited",
          retryAfterSec: gate.retryAfterSec,
        };
      }
    } catch {
      captureWarning("security", "abuse_limiter_unavailable_fail_open", {
        kind: "export",
      });
    }
  }

  const manifest = buildExportManifest({
    rows: input.rows,
    eventName: input.eventName,
    types: input.types,
    includeHidden: input.includeHidden,
    walk: input.walk,
    zipLabel: input.zipLabel,
  });
  if (!manifest.ok) {
    await recordExport(admin, {
      scope: input.scope,
      eventId: input.eventId,
      requesterHash: ipHash,
      itemCount: 0,
      totalBytes: 0,
      jti: null,
      outcome: manifest.reason === "empty" ? "rejected_empty" : "rejected_cap",
    });
    return { ok: false, reason: manifest.reason };
  }

  const jti = randomBytes(16).toString("hex");
  // Where the Worker reports this export, when it can reach this app at all (`report.ts`).
  const report = input.appOrigin
    ? reportAddressFor(input.appOrigin, signing.EXPORT_WORKER_URL)
    : null;
  const token = signExportToken(signing.EXPORT_SIGNING_SECRET, {
    v: EXPORT_TOKEN_VERSION,
    jti,
    scope: input.scope,
    eventId: input.eventId,
    zipName: manifest.zipName,
    items: manifest.items,
    exp: Date.now() + EXPORT_TOKEN_TTL_MS,
    ...(report ? { report } : {}),
  });

  await recordExport(admin, {
    scope: input.scope,
    eventId: input.eventId,
    requesterHash: ipHash,
    itemCount: manifest.itemCount,
    totalBytes: manifest.totalBytes,
    jti,
    outcome: "minted",
  });
  if (ipHash && scopeHash) {
    await recordAbuseEvent("export", ipHash, scopeHash).catch(() => {});
  }

  return {
    ok: true,
    token,
    workerUrl: signing.EXPORT_WORKER_URL,
    part: manifest.part,
    parts: manifest.parts,
    next: manifest.next,
    itemCount: manifest.itemCount,
    totalBytes: manifest.totalBytes,
    jti,
    reports: report !== null,
  };
}

/**
 * The Worker's check (`workers/export/src/check.ts`), beside its stream: the app asks it what the
 * zip would hold before the browser takes the file. Derived here so the Worker's address has one
 * home, the server's `EXPORT_WORKER_URL`.
 */
export function exportCheckUrl(workerUrl: string): string {
  return new URL("/check", workerUrl).href;
}

/** Map a mint outcome to its HTTP response (shared by both routes). User-facing copy = no em-dashes. */
export function mintResponse(result: MintOutcome): NextResponse {
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      token: result.token,
      workerUrl: result.workerUrl,
      checkUrl: exportCheckUrl(result.workerUrl),
      part: result.part,
      parts: result.parts,
      next: result.next,
      items: result.itemCount,
      bytes: result.totalBytes,
      // `export-ends`: the nonce the walk's status poll asks by, and whether the Worker will report.
      jti: result.jti,
      reports: result.reports,
    });
  }
  switch (result.reason) {
    case "paused":
      return NextResponse.json(
        { ok: false, code: "paused", message: WALK_COPY.paused },
        { status: 503 },
      );
    case "rate_limited":
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message:
            "Too many downloads from this network right now. Please wait a bit.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSec ?? 900) },
        },
      );
    case "empty":
      return NextResponse.json(
        { ok: false, code: "empty", message: EMPTY_EXPORT_MESSAGE },
        { status: 400 },
      );
    case "over_cap":
      return NextResponse.json(
        {
          ok: false,
          code: "over_cap",
          message: "This album is too large to download all at once.",
        },
        { status: 413 },
      );
    case "unconfigured":
      return NextResponse.json(
        {
          ok: false,
          code: "unconfigured",
          message: "Downloads aren't available right now.",
        },
        { status: 500 },
      );
    default:
      return NextResponse.json(
        { ok: false, code: "error", message: "Couldn't start that download." },
        { status: 500 },
      );
  }
}
