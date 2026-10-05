/**
 * EVERY READ AND WRITE OF SEND TO GOOGLE DRIVE (drive-export.md): the connection, the sends, their items and leases,
 * through the `cloud_*` functions (20261005120000) on the service role, and her own sends through her own session
 * (RLS, the progress columns). Nothing here talks to Google or the Worker (`lib/drive/*` does); this is the database's
 * half, one home.
 *
 * THE RULES OF THE HEARTBEAT STORE HOLD HERE TOO: a read a page or a route acts on THROWS when it fails (`mustQuery`),
 * so "not connected" or "nothing running" is never what a failed read says; the functions answer jsonb, read
 * defensively (a field this code does not know reads as absent, never as a zero).
 *
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: the tables and functions arrive with 20261005120000, so every call goes
 * through `untyped` (drop the cast then).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import type { AlbumPreview } from "@/lib/drive/press";
import { inChunks, readAllPages, type PageResult } from "@/lib/db/read-all";
import { isSealed } from "@/lib/disposable/seal";
import {
  resolveUploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createAdminClient>;

function untyped(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

function admin(): SupabaseClient {
  return untyped(createAdminClient());
}

const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v !== "" && Number.isFinite(Number(v))
      ? Number(v)
      : null;
const bool = (v: unknown): boolean => v === true;
const obj = (v: unknown): Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};

/** One `cloud_*` function, its jsonb answer, a failure thrown with its name. */
async function rpc(
  fn: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data = await mustQuery(admin().rpc(fn, args), `drive: ${fn}`);
  return obj(data);
}

// ── The connection ──────────────────────────────────────────────────────────────────────────────

export type ConnectionStatus = "connected" | "failing" | "revoked";

/** A host's connection as the app reads it (never a token: the ciphertexts are read only by `readTokenRow`). */
export type DriveConnection = {
  id: string;
  userId: string;
  status: ConnectionStatus;
  /** "Connected as": the address only when Google said it is verified. */
  email: string | null;
  name: string | null;
  rootFolderId: string | null;
  createdAt: string;
  lastRefreshAt: string | null;
  refreshExpiresAt: string | null;
  operatorPausedAt: string | null;
  quota: { limit: number | null; usage: number | null; at: string | null };
};

const CONNECTION_COLUMNS =
  "id, user_id, status, account_email, email_verified, account_name, root_folder_id, created_at, last_refresh_at, refresh_expires_at, operator_paused_at, quota_limit, quota_usage, quota_at";

function connectionOf(row: Record<string, unknown>): DriveConnection {
  const status = str(row.status);
  return {
    id: str(row.id) ?? "",
    userId: str(row.user_id) ?? "",
    status: status === "failing" || status === "revoked" ? status : "connected",
    email: bool(row.email_verified) ? str(row.account_email) : null,
    name: str(row.account_name),
    rootFolderId: str(row.root_folder_id),
    createdAt: str(row.created_at) ?? "",
    lastRefreshAt: str(row.last_refresh_at),
    refreshExpiresAt: str(row.refresh_expires_at),
    operatorPausedAt: str(row.operator_paused_at),
    quota: {
      limit: num(row.quota_limit),
      usage: num(row.quota_usage),
      at: str(row.quota_at),
    },
  };
}

/** Her connection, keyed on the `getUser()` id (the table is deny-all: the admin client, scoped here). */
export async function readConnection(
  userId: string,
): Promise<DriveConnection | null> {
  const row = await mustQuery(
    admin()
      .from("cloud_connections")
      .select(CONNECTION_COLUMNS)
      .eq("user_id", userId)
      .eq("provider", "google_drive")
      .maybeSingle(),
    "drive: her connection",
  );
  return row ? connectionOf(row as Record<string, unknown>) : null;
}

/** A connection by id (the Worker's internal routes, an operator's act). */
export async function readConnectionById(
  connectionId: string,
): Promise<DriveConnection | null> {
  const row = await mustQuery(
    admin()
      .from("cloud_connections")
      .select(CONNECTION_COLUMNS)
      .eq("id", connectionId)
      .maybeSingle(),
    "drive: a connection",
  );
  return row ? connectionOf(row as Record<string, unknown>) : null;
}

export type UpsertOutcome = {
  connectionId: string;
  outcome: "new" | "same" | "other";
  resumed: number;
  ended: number;
  /** The replaced account's refresh ciphertext, to revoke (another Google account only). */
  oldRefreshCt: string | null;
  oldEmail: string | null;
};

export async function upsertConnection(input: {
  userId: string;
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  scopes: string[];
  refreshCt: string;
  accessCt: string;
  accessExpiresAt: string;
  refreshExpiresAt: string | null;
}): Promise<UpsertOutcome> {
  const r = await rpc("cloud_connection_upsert", {
    p_user: input.userId,
    p_sub: input.sub,
    p_email: input.email,
    p_email_verified: input.emailVerified,
    p_name: input.name,
    p_scopes: input.scopes,
    p_refresh_ct: input.refreshCt,
    p_access_ct: input.accessCt,
    p_access_expires_at: input.accessExpiresAt,
    p_refresh_expires_at: input.refreshExpiresAt,
  });
  const outcome = str(r.outcome);
  return {
    connectionId: str(r.connection_id) ?? "",
    outcome: outcome === "same" || outcome === "other" ? outcome : "new",
    resumed: num(r.resumed) ?? 0,
    ended: num(r.ended) ?? 0,
    oldRefreshCt: str(r.old_refresh_ct),
    oldEmail: str(r.old_email),
  };
}

export type DisconnectOutcome =
  | { found: false }
  | {
      found: true;
      connectionId: string;
      ended: number;
      refreshCt: string | null;
      accessCt: string | null;
    };

export async function disconnectConnection(
  userId: string,
): Promise<DisconnectOutcome> {
  const r = await rpc("cloud_connection_disconnect", { p_user: userId });
  if (!bool(r.found)) return { found: false };
  return {
    found: true,
    connectionId: str(r.connection_id) ?? "",
    ended: num(r.ended) ?? 0,
    refreshCt: str(r.refresh_ct),
    accessCt: str(r.access_ct),
  };
}

/**
 * Where a connection's access token stands: cached (sealed, ready to open), the refresh claimed for this caller, or
 * wait / revoked / missing. `userId` is the account the seals are bound to (their associated data).
 */
export type TokenClaim =
  | { state: "cached"; accessCt: string; expiresAt: string; userId: string }
  | { state: "refresh"; refreshCt: string; userId: string }
  | { state: "wait" | "revoked" | "missing"; userId: string | null };

export function tokenClaimOf(
  raw: unknown,
  fallbackUserId: string | null = null,
): TokenClaim {
  const r = obj(raw);
  const state = str(r.state);
  const userId = str(r.user_id) ?? fallbackUserId;
  if (state === "cached" && str(r.access_ct) && userId) {
    return {
      state,
      accessCt: str(r.access_ct)!,
      expiresAt: str(r.expires_at) ?? "",
      userId,
    };
  }
  if (state === "refresh" && str(r.refresh_ct) && userId)
    return { state, refreshCt: str(r.refresh_ct)!, userId };
  if (state === "revoked" || state === "missing") return { state, userId };
  return { state: "wait", userId };
}

export async function claimToken(connectionId: string): Promise<TokenClaim> {
  return tokenClaimOf(
    await rpc("cloud_connection_token", { p_connection: connectionId }),
  );
}

export async function recordRefreshed(input: {
  connectionId: string;
  accessCt: string;
  accessExpiresAt: string;
  refreshCt?: string | null;
}): Promise<void> {
  await rpc("cloud_connection_refreshed", {
    p_connection: input.connectionId,
    p_access_ct: input.accessCt,
    p_access_expires_at: input.accessExpiresAt,
    p_refresh_ct: input.refreshCt ?? null,
  });
}

export async function recordRefreshFailed(input: {
  connectionId: string;
  error: string;
  revoked: boolean;
}): Promise<{ first: boolean; paused: number; userId: string | null }> {
  const r = await rpc("cloud_connection_refresh_failed", {
    p_connection: input.connectionId,
    p_error: input.error.slice(0, 500),
    p_revoked: input.revoked,
  });
  return {
    first: bool(r.first),
    paused: num(r.paused) ?? 0,
    userId: str(r.user_id),
  };
}

export async function recordRoom(input: {
  connectionId: string;
  limit: number | null;
  usage: number;
  resume: boolean;
}): Promise<{ left: number; resumed: number }> {
  const r = await rpc("cloud_connection_room", {
    p_connection: input.connectionId,
    p_limit: input.limit,
    p_usage: input.usage,
    p_resume: input.resume,
  });
  return { left: num(r.left) ?? 0, resumed: num(r.resumed) ?? 0 };
}

export async function claimRoot(input: {
  connectionId: string;
  candidate: string | null;
  expected: string | null;
}): Promise<{ root: string | null; won: boolean }> {
  const r = await rpc("cloud_connection_root", {
    p_connection: input.connectionId,
    p_candidate: input.candidate,
    p_expected: input.expected,
  });
  return { root: str(r.root), won: bool(r.won) };
}

export async function lanesToKick(connectionId: string): Promise<number> {
  const r = await rpc("cloud_connection_kick", { p_connection: connectionId });
  return num(r.lanes) ?? 0;
}

export async function recordLaneFailed(
  connectionId: string,
  error: string,
): Promise<{ failures: number; paused: number; userId: string | null }> {
  const r = await rpc("cloud_connection_lane_failed", {
    p_connection: connectionId,
    p_error: error.slice(0, 500),
  });
  return {
    failures: num(r.failures) ?? 0,
    paused: num(r.paused) ?? 0,
    userId: str(r.user_id),
  };
}

export async function operatorOnConnection(
  connectionId: string,
  act: "pause" | "resume" | "lift_breaker",
  note?: string | null,
): Promise<{ ok: boolean; jobs: number; userId: string | null }> {
  const r = await rpc("cloud_connection_operator", {
    p_connection: connectionId,
    p_act: act,
    p_note: note ?? null,
  });
  return { ok: bool(r.ok), jobs: num(r.jobs) ?? 0, userId: str(r.user_id) };
}

/** The ciphertexts and the account they are bound to (the tokens' associated data), for the one opener. */
export async function readTokenRow(
  connectionId: string,
): Promise<{
  userId: string;
  refreshCt: string | null;
  accessCt: string | null;
} | null> {
  const row = await mustQuery(
    admin()
      .from("cloud_connections")
      .select("user_id, refresh_ct, access_ct")
      .eq("id", connectionId)
      .maybeSingle(),
    "drive: a connection's ciphertexts",
  );
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return {
    userId: str(r.user_id) ?? "",
    refreshCt: str(r.refresh_ct),
    accessCt: str(r.access_ct),
  };
}

// ── The send ────────────────────────────────────────────────────────────────────────────────────

export type { AlbumPreview };

export async function previewAlbums(input: {
  userId: string;
  eventIds: string[];
  includeHidden: boolean;
}): Promise<{ connected: boolean; albums: Map<string, AlbumPreview> }> {
  const albums = new Map<string, AlbumPreview>();
  if (input.eventIds.length === 0) return { connected: false, albums };
  const r = await rpc("cloud_export_preview", {
    p_user: input.userId,
    p_events: input.eventIds,
    p_include_hidden: input.includeHidden,
  });
  for (const [eventId, raw] of Object.entries(obj(r.albums))) {
    const a = obj(raw);
    albums.set(eventId, {
      eventId,
      name: str(a.name) ?? "",
      eventDate: str(a.event_date),
      eventEndDate: str(a.event_end_date),
      items: num(a.items) ?? 0,
      bytes: num(a.bytes) ?? 0,
      photos: num(a.photos) ?? 0,
      clips: num(a.clips) ?? 0,
      newItems: num(a.new_items) ?? 0,
      newBytes: num(a.new_bytes) ?? 0,
      sentBefore: str(a.sent_before),
      unfinished: str(a.unfinished),
    });
  }
  return { connected: bool(r.connected), albums };
}

export type CreateRefusal =
  | "switch_off"
  | "not_connected"
  | "disconnected"
  | "paused"
  | "not_found"
  | "breaker";

/** What a send needs to get its folder: the press's, or a press again of one still preparing. */
export type FolderFacts = {
  connectionId: string;
  items: number;
  bytes: number;
  albumName: string;
  eventDate: string | null;
  eventEndDate: string | null;
  rootFolderId: string | null;
  folderId: string | null;
};

export type CreateOutcome =
  | { ok: false; code: CreateRefusal }
  /** An unfinished send of the album already stands: the press opens it (and gets a preparing one its folder). */
  | {
      ok: true;
      jobId: string;
      existing: true;
      status: SendStatus;
      facts: FolderFacts;
    }
  | { ok: true; jobId: string; existing: false; empty: true }
  | {
      ok: true;
      jobId: string;
      existing: false;
      empty: false;
      facts: FolderFacts;
    };

const REFUSALS: ReadonlySet<string> = new Set([
  "switch_off",
  "not_connected",
  "disconnected",
  "paused",
  "not_found",
  "breaker",
]);

export async function createSend(input: {
  userId: string;
  eventId: string;
  includeHidden: boolean;
  tz: string;
}): Promise<CreateOutcome> {
  const r = await rpc("cloud_export_create", {
    p_user: input.userId,
    p_event: input.eventId,
    p_include_hidden: input.includeHidden,
    p_tz: input.tz,
  });
  if (!bool(r.ok)) {
    const code = str(r.code);
    return {
      ok: false,
      code: code && REFUSALS.has(code) ? (code as CreateRefusal) : "not_found",
    };
  }
  const jobId = str(r.job_id) ?? "";
  const facts: FolderFacts = {
    connectionId: str(r.connection_id) ?? "",
    items: num(r.items) ?? 0,
    bytes: num(r.bytes) ?? 0,
    albumName: str(r.album_name) ?? "",
    eventDate: str(r.event_date),
    eventEndDate: str(r.event_end_date),
    rootFolderId: str(r.root_folder_id),
    folderId: str(r.folder_id),
  };
  if (bool(r.existing)) {
    const status = str(r.status);
    return {
      ok: true,
      jobId,
      existing: true,
      status:
        status && STATUSES.has(status) ? (status as SendStatus) : "sending",
      facts,
    };
  }
  if (bool(r.empty)) return { ok: true, jobId, existing: false, empty: true };
  return { ok: true, jobId, existing: false, empty: false, facts };
}

export async function markReady(
  jobId: string,
  folderId: string,
): Promise<boolean> {
  const r = await rpc("cloud_export_ready", {
    p_job: jobId,
    p_folder_id: folderId,
  });
  return bool(r.ok);
}

export type SendAct = "cancel" | "resume" | "retry" | "seen";

export async function actOnSend(input: {
  userId: string | null;
  jobId: string;
  act: SendAct;
  operator?: boolean;
}): Promise<{
  ok: boolean;
  code: string | null;
  status: string | null;
  connectionId: string | null;
  reason: string | null;
}> {
  const r = await rpc("cloud_export_act", {
    p_user: input.userId,
    p_job: input.jobId,
    p_act: input.act,
    p_operator: input.operator ?? false,
  });
  return {
    ok: bool(r.ok),
    code: str(r.code),
    status: str(r.status),
    connectionId: str(r.connection_id),
    reason: str(r.reason),
  };
}

/** An album's name and dates now, for a folder made after the press ("Send to a new folder"). */
export async function readAlbumNaming(
  eventId: string,
): Promise<{
  name: string;
  eventDate: string | null;
  eventEndDate: string | null;
} | null> {
  const row = await mustQuery(
    admin()
      .from("events")
      .select("name, event_date, event_end_date")
      .eq("id", eventId)
      .maybeSingle(),
    "drive: an album's name and dates",
  );
  if (!row) return null;
  const r = obj(row);
  return {
    name: str(r.name) ?? "",
    eventDate: str(r.event_date),
    eventEndDate: str(r.event_end_date),
  };
}

export async function refolderSend(input: {
  userId: string;
  jobId: string;
  folderId: string;
}): Promise<boolean> {
  const r = await rpc("cloud_export_refolder", {
    p_user: input.userId,
    p_job: input.jobId,
    p_folder_id: input.folderId,
  });
  return bool(r.ok);
}

// ── The Worker's half ───────────────────────────────────────────────────────────────────────────

export type RawLeaseItem = {
  mediaId: string;
  key: string;
  bytes: number;
  type: "photo" | "video";
  createdAt: string;
  name: string | null;
  attempts: number;
  sessionUri: string | null;
  sessionOffset: number | null;
  priorFileId: string | null;
};

export type RawLease =
  | {
      state: "work";
      lease: string;
      until: string;
      jobId: string;
      userId: string;
      eventId: string;
      albumName: string;
      tz: string;
      folderId: string | null;
      items: RawLeaseItem[];
      access: unknown;
    }
  | {
      state: "check";
      lease: string;
      until: string;
      jobId: string;
      folderId: string | null;
      first: boolean;
      items: {
        mediaId: string;
        fileId: string;
        bytes: number;
        md5: string | null;
      }[];
      access: unknown;
    }
  | { state: "throttled"; until: string }
  | { state: "wait" | "paused" | "stopped" | "idle"; why: string | null };

export async function leaseWork(connectionId: string): Promise<RawLease> {
  const r = await rpc("cloud_export_lease", { p_connection: connectionId });
  const state = str(r.state);
  if (state === "work") {
    const items = (Array.isArray(r.items) ? r.items : []).map((raw) => {
      const i = obj(raw);
      return {
        mediaId: str(i.media_id) ?? "",
        key: str(i.key) ?? "",
        bytes: num(i.bytes) ?? 0,
        type: str(i.type) === "video" ? "video" : "photo",
        createdAt: str(i.created_at) ?? "",
        name: str(i.name),
        attempts: num(i.attempts) ?? 1,
        sessionUri: str(i.session_uri),
        sessionOffset: num(i.session_offset),
        priorFileId: str(i.prior_file_id),
      } satisfies RawLeaseItem;
    });
    return {
      state,
      lease: str(r.lease) ?? "",
      until: str(r.until) ?? "",
      jobId: str(r.job_id) ?? "",
      userId: str(r.user_id) ?? "",
      eventId: str(r.event_id) ?? "",
      albumName: str(r.album_name) ?? "",
      tz: str(r.tz) ?? "UTC",
      folderId: str(r.folder_id),
      items,
      access: r.access,
    };
  }
  if (state === "check") {
    return {
      state,
      lease: str(r.lease) ?? "",
      until: str(r.until) ?? "",
      jobId: str(r.job_id) ?? "",
      folderId: str(r.folder_id),
      first: bool(r.first),
      items: (Array.isArray(r.items) ? r.items : []).map((raw) => {
        const i = obj(raw);
        return {
          mediaId: str(i.media_id) ?? "",
          fileId: str(i.file_id) ?? "",
          bytes: num(i.bytes) ?? 0,
          md5: str(i.md5),
        };
      }),
      access: r.access,
    };
  }
  if (state === "throttled") return { state, until: str(r.until) ?? "" };
  const quiet =
    state === "wait" || state === "paused" || state === "stopped"
      ? state
      : "idle";
  return { state: quiet, why: str(r.why) };
}

export async function nameItems(
  lease: string,
  names: { mediaId: string; stem: string; ext: string }[],
): Promise<Map<string, string>> {
  const r = await rpc("cloud_export_name_items", {
    p_lease: lease,
    p_names: names.map((n) => ({
      media_id: n.mediaId,
      stem: n.stem,
      ext: n.ext,
    })),
  });
  const out = new Map<string, string>();
  for (const [mediaId, name] of Object.entries(obj(r.names))) {
    if (typeof name === "string") out.set(mediaId, name);
  }
  return out;
}

export type ReportOutcome = {
  state: "ok" | "stop";
  connectionId: string | null;
  jobId: string | null;
  userId: string | null;
  before: string | null;
  status: string | null;
  signal: string | null;
};

function reportOutcomeOf(r: Record<string, unknown>): ReportOutcome {
  return {
    state: str(r.state) === "ok" ? "ok" : "stop",
    connectionId: str(r.connection_id),
    jobId: str(r.job_id),
    userId: str(r.user_id),
    before: str(r.before),
    status: str(r.status),
    signal: str(r.signal),
  };
}

export async function reportWork(input: {
  lease: string;
  items: Record<string, unknown>[];
  finding: string | null;
  done: boolean;
}): Promise<ReportOutcome> {
  return reportOutcomeOf(
    await rpc("cloud_export_report", {
      p_lease: input.lease,
      p_items: input.items,
      p_finding: input.finding,
      p_done: input.done,
    }),
  );
}

export async function reportCheckPage(input: {
  lease: string;
  results: { media_id: string; state: string }[];
  duplicates: number | null;
  finding: string | null;
}): Promise<
  ReportOutcome & { back: number; failed: number; duplicates: number | null }
> {
  const r = await rpc("cloud_export_check_page", {
    p_lease: input.lease,
    p_results: input.results,
    p_duplicates: input.duplicates,
    p_finding: input.finding,
  });
  return {
    ...reportOutcomeOf(r),
    back: num(r.back) ?? 0,
    failed: num(r.failed) ?? 0,
    duplicates: num(r.duplicates),
  };
}

/** A finished send the sweep hands the done mail's fold. */
export type FinishedSendRow = {
  jobId: string;
  albumName: string;
  status: string;
  itemsTotal: number;
  itemsSent: number;
  itemsKept: number;
  itemsFailed: number;
  bytesSent: number;
  folderUrl: string | null;
};

export type SweepOutcome = {
  doneMail: { userId: string; sends: FinishedSendRow[] }[];
  kick: { connectionId: string; lanes: number }[];
  recheck: string[];
  reconnect: { connectionId: string; userId: string; why: string }[];
  breakers: { userId: string; sent30: number }[];
  expired: { jobId: string; userId: string }[];
  resumed: number;
  stuck: number;
  failedToStart: number;
};

export async function sweepSends(): Promise<SweepOutcome> {
  const r = await rpc("cloud_export_sweep", {});
  const list = (v: unknown) => (Array.isArray(v) ? v.map(obj) : []);
  return {
    doneMail: list(r.done_mail).map((d) => ({
      userId: str(d.user_id) ?? "",
      sends: list(d.jobs).map((j) => ({
        jobId: str(j.job_id) ?? "",
        albumName: str(j.album_name) ?? "",
        status: str(j.status) ?? "done",
        itemsTotal: num(j.items_total) ?? 0,
        itemsSent: num(j.items_sent) ?? 0,
        itemsKept: num(j.items_kept) ?? 0,
        itemsFailed: num(j.items_failed) ?? 0,
        bytesSent: num(j.bytes_sent) ?? 0,
        folderUrl: str(j.folder_url),
      })),
    })),
    kick: list(r.kick).map((k) => ({
      connectionId: str(k.connection_id) ?? "",
      lanes: num(k.lanes) ?? 0,
    })),
    recheck: (Array.isArray(r.recheck) ? r.recheck : []).filter(
      (x): x is string => typeof x === "string",
    ),
    reconnect: list(r.reconnect).map((c) => ({
      connectionId: str(c.connection_id) ?? "",
      userId: str(c.user_id) ?? "",
      why: str(c.why) ?? "",
    })),
    breakers: list(r.breakers).map((b) => ({
      userId: str(b.user_id) ?? "",
      sent30: num(b.sent30) ?? 0,
    })),
    expired: list(r.expired).map((e) => ({
      jobId: str(e.job_id) ?? "",
      userId: str(e.user_id) ?? "",
    })),
    resumed: num(r.resumed) ?? 0,
    stuck: num(r.stuck) ?? 0,
    failedToStart: num(r.failed_to_start) ?? 0,
  };
}

// ── Who sent each original, as the album credits them ───────────────────────────────────────────

/**
 * WHO SENT EACH OF THESE ORIGINALS, by the one precedence rule (`resolveUploaderIdentity`): a guest's name, or the
 * host's own for her uploads, or nobody; never an address. A shot still sealed for a develop is credited at the
 * develop, not before, as the album credits it (its file then names only when it arrived). Ids are a lease's (at most
 * ten), chunked anyway.
 */
export async function readSenders(
  eventId: string,
  mediaIds: string[],
  nowMs: number = Date.now(),
): Promise<Map<string, string | null>> {
  const client = createAdminClient() as AdminClient;
  const out = new Map<string, string | null>();
  if (mediaIds.length === 0) return out;
  const ev = await mustQuery(
    client.from("events").select("host_id").eq("id", eventId).maybeSingle(),
    "drive: the album's host",
  );
  let hostName: string | null = null;
  if (ev?.host_id) {
    const hp = await mustQuery(
      client
        .from("profiles")
        .select("display_name")
        .eq("id", ev.host_id)
        .maybeSingle(),
      "drive: the host's name",
    );
    hostName = hp?.display_name ?? null;
  }
  const rows = await inChunks("drive: the senders", mediaIds, async (chunk) => {
    const page = await mustQuery(
      client
        .from("media")
        .select(
          "id, guest_id, sealed_until, guests!media_guest_id_fkey(user_id, email, display_name, verified_at, profiles!guests_user_id_fkey(display_name))",
        )
        .in("id", chunk)
        .overrideTypes<
          Array<UploaderRow & { id: string; sealed_until: string | null }>,
          { merge: false }
        >(),
      "drive: the senders",
    );
    return page ?? [];
  });
  for (const row of rows) {
    out.set(
      row.id,
      isSealed(row.sealed_until, nowMs)
        ? null
        : resolveUploaderIdentity(row, hostName).displayName,
    );
  }
  return out;
}

// ── What her pages read ─────────────────────────────────────────────────────────────────────────

/** The progress columns a host reads of her own sends (exactly the column grant). */
export const SEND_COLUMNS =
  "id, event_id, album_name, status, pause_reason, stop_reason, resume_at, include_hidden, items_total, items_sent, items_kept, items_skipped, items_failed, items_duplicated, bytes_total, bytes_sent, folder_url, created_at, started_at, last_progress_at, closed_at, attention_at, attention_seen_at";

export type SendStatus =
  | "preparing"
  | "sending"
  | "paused"
  | "checking"
  | "done"
  | "partly_done"
  | "canceled"
  | "stopped";

/** One of her sends, as her pages read it (RLS: her own rows; the column grant: these fields alone). */
export type SendRow = {
  id: string;
  eventId: string | null;
  albumName: string;
  status: SendStatus;
  pauseReason: string | null;
  stopReason: string | null;
  resumeAt: string | null;
  includeHidden: boolean;
  itemsTotal: number;
  itemsSent: number;
  itemsKept: number;
  itemsSkipped: number;
  itemsFailed: number;
  bytesTotal: number;
  bytesSent: number;
  folderUrl: string | null;
  createdAt: string;
  startedAt: string | null;
  lastProgressAt: string | null;
  closedAt: string | null;
  attentionAt: string | null;
  attentionSeenAt: string | null;
};

const STATUSES: ReadonlySet<string> = new Set([
  "preparing",
  "sending",
  "paused",
  "checking",
  "done",
  "partly_done",
  "canceled",
  "stopped",
]);

export function sendRowOf(row: Record<string, unknown>): SendRow | null {
  const status = str(row.status);
  if (!status || !STATUSES.has(status) || !str(row.id)) return null;
  return {
    id: str(row.id)!,
    eventId: str(row.event_id),
    albumName: str(row.album_name) ?? "",
    status: status as SendStatus,
    pauseReason: str(row.pause_reason),
    stopReason: str(row.stop_reason),
    resumeAt: str(row.resume_at),
    includeHidden: bool(row.include_hidden),
    itemsTotal: num(row.items_total) ?? 0,
    itemsSent: num(row.items_sent) ?? 0,
    itemsKept: num(row.items_kept) ?? 0,
    itemsSkipped: num(row.items_skipped) ?? 0,
    itemsFailed: num(row.items_failed) ?? 0,
    bytesTotal: num(row.bytes_total) ?? 0,
    bytesSent: num(row.bytes_sent) ?? 0,
    folderUrl: str(row.folder_url),
    createdAt: str(row.created_at) ?? "",
    startedAt: str(row.started_at),
    lastProgressAt: str(row.last_progress_at),
    closedAt: str(row.closed_at),
    attentionAt: str(row.attention_at),
    attentionSeenAt: str(row.attention_seen_at),
  };
}

/**
 * HER SENDS THAT MATTER NOW, through her own session: every unfinished one, every one closed in the last day, and
 * any stop of the last month that may still wait for her (whether its flag is due is two columns compared, which a
 * filter cannot ask: `flagDue` decides), newest first. RLS scopes the rows to her; the column grant scopes the fields.
 * At most 50 (a host sending a season at once is a few dozen).
 */
export async function readMySends(
  nowMs: number = Date.now(),
): Promise<SendRow[]> {
  const supabase = untyped(await createClient());
  const since = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
  const month = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await mustQuery(
    supabase
      .from("cloud_exports")
      .select(SEND_COLUMNS)
      .or(
        `status.in.(preparing,sending,paused,checking),closed_at.gte.${since},attention_at.gte.${month}`,
      )
      .order("created_at", { ascending: false })
      .limit(50),
    "drive: her sends",
  );
  return (Array.isArray(rows) ? rows : [])
    .map((r) => sendRowOf(r as Record<string, unknown>))
    .filter((r): r is SendRow => r !== null);
}

/** Her one send by id, through her own session: null when it is not hers (nothing leaks). */
export async function readMySend(jobId: string): Promise<SendRow | null> {
  const supabase = untyped(await createClient());
  const row = await mustQuery(
    supabase
      .from("cloud_exports")
      .select(SEND_COLUMNS)
      .eq("id", jobId)
      .maybeSingle(),
    "drive: her send",
  );
  return row ? sendRowOf(row as Record<string, unknown>) : null;
}

/**
 * What her Account card says it has sent: the albums that reached her Drive, the bytes, and the last one's day, read
 * whole (keyset on id: a planner's thousand sends never cut short at PostgREST's 1,000).
 */
export async function readMySentTotals(): Promise<{
  albums: number;
  bytes: number;
  lastAt: string | null;
}> {
  const supabase = untyped(await createClient());
  const { rows } = await readAllPages(
    "drive: her sent totals",
    (after: string | null, limit) => {
      let q = supabase
        .from("cloud_exports")
        .select("id, event_id, album_name, bytes_sent, closed_at, items_sent")
        .in("status", ["done", "partly_done"])
        .gt("items_sent", 0)
        .order("id", { ascending: true })
        .limit(limit);
      if (after !== null) q = q.gt("id", after);
      return q as unknown as PromiseLike<PageResult<Record<string, unknown>>>;
    },
    (row) => str(row.id) ?? "",
  );
  // An album sent twice is one album; one purged since keeps its line by its name.
  const albums = new Set(
    rows.map((r) => str(r.event_id) ?? `name:${str(r.album_name)}`),
  );
  const last = rows.reduce<string | null>((latest, r) => {
    const at = str(r.closed_at);
    return at && (!latest || at > latest) ? at : latest;
  }, null);
  return {
    albums: albums.size,
    bytes: rows.reduce((n, r) => n + (num(r.bytes_sent) ?? 0), 0),
    lastAt: last,
  };
}

/** One page of a send's items in a state she may ask about (what failed, what was skipped), keyset on media id. */
export async function readSendItems(input: {
  jobId: string;
  state: "failed" | "skipped";
  after: string | null;
  limit: number;
}): Promise<{ mediaId: string; name: string | null; reason: string | null }[]> {
  let q = admin()
    .from("cloud_export_items")
    .select("media_id, name, last_error, skip_reason")
    .eq("job_id", input.jobId)
    .eq("status", input.state)
    .order("media_id", { ascending: true })
    .limit(Math.min(Math.max(input.limit, 1), 200));
  if (input.after) q = q.gt("media_id", input.after);
  const rows = await mustQuery(q, "drive: a send's items");
  return (Array.isArray(rows) ? rows : []).map((raw) => {
    const r = obj(raw);
    return {
      mediaId: str(r.media_id) ?? "",
      name: str(r.name),
      reason:
        input.state === "skipped" ? str(r.skip_reason) : str(r.last_error),
    };
  });
}

/** The sends of a connection a finding just paused for one reason (each gets its own paused mail, once). */
export async function readJustPaused(
  connectionId: string,
  reason: string,
  sinceMs: number,
): Promise<string[]> {
  const rows = await mustQuery(
    admin()
      .from("cloud_exports")
      .select("id")
      .eq("connection_id", connectionId)
      .eq("status", "paused")
      .eq("pause_reason", reason)
      .gte("paused_at", new Date(sinceMs).toISOString())
      .limit(100),
    "drive: sends just paused",
  );
  return (Array.isArray(rows) ? rows : [])
    .map((r) => str(obj(r).id))
    .filter((id): id is string => Boolean(id));
}

/** The done mail named these sends: marked, so the fold never names one twice. */
export async function markMailed(jobIds: string[]): Promise<void> {
  if (jobIds.length === 0) return;
  await rpc("cloud_export_mailed", { p_jobs: jobIds });
}

/** When the Drive sweep last wrote its heartbeat (it writes one an hour), or null for never. */
export async function lastSweepHeartbeatAt(): Promise<number | null> {
  const row = await mustQuery(
    admin()
      .from("job_runs")
      .select("started_at")
      .eq("job", "drive_export")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "drive: the sweep's last heartbeat",
  );
  const at = str(obj(row).started_at);
  return at ? Date.parse(at) : null;
}

/** A send's folder in her Drive (deny-all to her: the column is not granted), for "Check again" on a binned folder. */
export async function readSendFolderId(jobId: string): Promise<string | null> {
  const row = await mustQuery(
    admin()
      .from("cloud_exports")
      .select("folder_id")
      .eq("id", jobId)
      .maybeSingle(),
    "drive: a send's folder",
  );
  return str(obj(row).folder_id);
}

// ── The operator's view (/admin/exports#drive) ──────────────────────────────────────────────────

/** Whose a send or a connection is, as the operator reads it. */
export type AdminHost = { email: string | null; name: string | null };

/** A send as the operator sees it: her progress columns, whose it is, its connection and its stall. */
export type AdminSend = SendRow & {
  userId: string;
  connectionId: string | null;
  stuckSince: string | null;
  host: AdminHost;
};

/** A connection as the operator sees it (never a token). */
export type AdminConnection = {
  id: string;
  userId: string;
  host: AdminHost;
  connectedAs: string | null;
  status: ConnectionStatus;
  failingSince: string | null;
  operatorPausedAt: string | null;
  operatorNote: string | null;
  laneFailures: number;
  laneFailuresOn: string | null;
  lastRefreshAt: string | null;
  lastError: string | null;
  createdAt: string;
  /** Her sends paused on the account breaker (what Lift restarts). */
  breakerSends: number;
};

export type DriveAdmin = {
  /** `drive_export_enabled`, read as the lease reads it (a missing row is on). */
  enabled: boolean;
  /** Every unfinished send (oldest first: the longest waiting on top), then the last week's that ended short. */
  sends: AdminSend[];
  /** More unfinished sends than drawn. */
  sendsMore: boolean;
  /** Connections an operator may need: failing or revoked, paused by an operator, dying lanes, a standing breaker. */
  attention: AdminConnection[];
  /** An account search's connections (`?drive=`), or null when nothing was searched. */
  found: AdminConnection[] | null;
  /** Google deletes an OAuth client unused for six months: the last connect or refresh any connection made. */
  clientLastUsedAt: string | null;
  connections: number;
  /** When this was read (what "days ago" counts from). */
  readAtMs: number;
};

const ADMIN_SEND_COLUMNS = `${SEND_COLUMNS}, user_id, connection_id, stuck_since`;
const ADMIN_CONNECTION_COLUMNS =
  "id, user_id, account_email, status, failing_since, operator_paused_at, operator_note, lane_failures, lane_failures_on, last_refresh_at, last_error, created_at";
const ADMIN_SENDS = 100;
const ADMIN_CLOSED = 50;
const ADMIN_ATTENTION = 100;
const ADMIN_FOUND = 20;

function adminConnectionOf(
  r: Record<string, unknown>,
  hosts: Map<string, AdminHost>,
  breakers: Map<string, number>,
): AdminConnection {
  const userId = str(r.user_id) ?? "";
  const status = str(r.status);
  return {
    id: str(r.id) ?? "",
    userId,
    host: hosts.get(userId) ?? { email: null, name: null },
    connectedAs: str(r.account_email),
    status: status === "failing" || status === "revoked" ? status : "connected",
    failingSince: str(r.failing_since),
    operatorPausedAt: str(r.operator_paused_at),
    operatorNote: str(r.operator_note),
    laneFailures: num(r.lane_failures) ?? 0,
    laneFailuresOn: str(r.lane_failures_on),
    lastRefreshAt: str(r.last_refresh_at),
    lastError: str(r.last_error),
    createdAt: str(r.created_at) ?? "",
    breakerSends: breakers.get(userId) ?? 0,
  };
}

/**
 * EVERYTHING THE DRIVE SECTION DRAWS, in one read (service role; /admin/exports re-checked admin and AAL2). Every list
 * is bounded and says so (`sendsMore`); every read throws on failure, so an unreadable console is an error page, never
 * an empty "nothing running".
 */
export async function readDriveAdmin(
  input: { search?: string | null; nowMs?: number } = {},
): Promise<DriveAdmin> {
  const db = admin();
  const nowMs = input.nowMs ?? Date.now();
  const week = new Date(nowMs - 7 * 24 * 60 * 60 * 1000).toISOString();
  // The account search's term, stripped of what would break the or() filter (as /admin/accounts' search does).
  const term = (input.search ?? "")
    .trim()
    .replace(/[,()*%\\]/g, "")
    .slice(0, 120);

  const [flag, running, ended, attentionRows, refreshed, newest, connections] =
    await Promise.all([
      mustQuery(
        db
          .from("ops_flags")
          .select("enabled")
          .eq("key", "drive_export_enabled")
          .maybeSingle(),
        "drive admin: the switch",
      ),
      mustQuery(
        db
          .from("cloud_exports")
          .select(ADMIN_SEND_COLUMNS)
          .in("status", ["preparing", "sending", "paused", "checking"])
          .order("created_at", { ascending: true })
          .limit(ADMIN_SENDS + 1),
        "drive admin: unfinished sends",
      ),
      mustQuery(
        db
          .from("cloud_exports")
          .select(ADMIN_SEND_COLUMNS)
          .in("status", ["partly_done", "stopped"])
          .gte("closed_at", week)
          .order("closed_at", { ascending: false })
          .limit(ADMIN_CLOSED),
        "drive admin: sends that ended short",
      ),
      mustQuery(
        db
          .from("cloud_connections")
          .select(ADMIN_CONNECTION_COLUMNS)
          .or(
            "status.neq.connected,operator_paused_at.not.is.null,lane_failures.gte.3",
          )
          .order("updated_at", { ascending: false })
          .limit(ADMIN_ATTENTION),
        "drive admin: connections that need an operator",
      ),
      mustQuery(
        db
          .from("cloud_connections")
          .select("last_refresh_at")
          .not("last_refresh_at", "is", null)
          .order("last_refresh_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "drive admin: the last refresh",
      ),
      mustQuery(
        db
          .from("cloud_connections")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        "drive admin: the last connect",
      ),
      mustCount(
        db
          .from("cloud_connections")
          .select("id", { count: "exact", head: true }),
        "drive admin: connections",
      ),
    ]);

  const runningRows = (Array.isArray(running) ? running : []) as Record<
    string,
    unknown
  >[];
  const endedRows = (Array.isArray(ended) ? ended : []) as Record<
    string,
    unknown
  >[];
  const sendRows = [...runningRows.slice(0, ADMIN_SENDS), ...endedRows];

  // The breaker's sends, by account (the unfinished read holds every paused one up to its bound).
  const breakers = new Map<string, number>();
  for (const r of runningRows) {
    if (
      str(r.status) === "paused" &&
      str(r.pause_reason) === "breaker" &&
      str(r.user_id)
    ) {
      breakers.set(str(r.user_id)!, (breakers.get(str(r.user_id)!) ?? 0) + 1);
    }
  }
  const attention = (
    Array.isArray(attentionRows) ? attentionRows : []
  ) as Record<string, unknown>[];
  const seen = new Set(attention.map((r) => str(r.id)));
  const breakerUsers = [...breakers.keys()];
  const breakerRows = breakerUsers.length
    ? await inChunks(
        "drive admin: breaker connections",
        breakerUsers,
        async (chunk) => {
          const rows = await mustQuery(
            db
              .from("cloud_connections")
              .select(ADMIN_CONNECTION_COLUMNS)
              .in("user_id", chunk)
              // One connection an account (unique user and provider), so a chunk reads at most its own length.
              .limit(chunk.length),
            "drive admin: breaker connections",
          );
          return (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
        },
      )
    : [];
  for (const r of breakerRows) if (!seen.has(str(r.id))) attention.push(r);

  let foundRows: Record<string, unknown>[] | null = null;
  if (term.length >= 3) {
    const people = await mustQuery(
      db
        .from("profiles")
        .select("id")
        .ilike("email", `%${term}%`)
        .limit(ADMIN_FOUND),
      "drive admin: accounts by address",
    );
    const ids = (
      (Array.isArray(people) ? people : []) as Record<string, unknown>[]
    )
      .map((p) => str(p.id))
      .filter(Boolean);
    const filter = ids.length
      ? `account_email.ilike.%${term}%,user_id.in.(${ids.join(",")})`
      : `account_email.ilike.%${term}%`;
    const rows = await mustQuery(
      db
        .from("cloud_connections")
        .select(ADMIN_CONNECTION_COLUMNS)
        .or(filter)
        .limit(ADMIN_FOUND),
      "drive admin: connections by address",
    );
    foundRows = (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
  }

  // Whose each is, read once for all of them.
  const userIds = [
    ...new Set(
      [...sendRows, ...attention, ...(foundRows ?? [])]
        .map((r) => str(r.user_id))
        .filter((v): v is string => !!v),
    ),
  ];
  const hosts = new Map<string, AdminHost>();
  const people = await inChunks(
    "drive admin: hosts",
    userIds,
    async (chunk) => {
      const rows = await mustQuery(
        db.from("profiles").select("id, email, display_name").in("id", chunk),
        "drive admin: hosts",
      );
      return (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
    },
  );
  for (const p of people) {
    if (str(p.id))
      hosts.set(str(p.id)!, { email: str(p.email), name: str(p.display_name) });
  }

  const sends: AdminSend[] = [];
  for (const r of sendRows) {
    const row = sendRowOf(r);
    if (!row) continue;
    const userId = str(r.user_id) ?? "";
    sends.push({
      ...row,
      userId,
      connectionId: str(r.connection_id),
      stuckSince: str(r.stuck_since),
      host: hosts.get(userId) ?? { email: null, name: null },
    });
  }

  const lastRefresh = str(obj(refreshed).last_refresh_at);
  const lastConnect = str(obj(newest).created_at);
  const clientLastUsedAt =
    lastRefresh && lastConnect
      ? Date.parse(lastRefresh) > Date.parse(lastConnect)
        ? lastRefresh
        : lastConnect
      : (lastRefresh ?? lastConnect);

  return {
    enabled: obj(flag).enabled === false ? false : true,
    sends,
    sendsMore: runningRows.length > ADMIN_SENDS,
    attention: attention.map((r) => adminConnectionOf(r, hosts, breakers)),
    found: foundRows
      ? foundRows.map((r) => adminConnectionOf(r, hosts, breakers))
      : null,
    clientLastUsedAt,
    connections,
    readAtMs: nowMs,
  };
}

/** One connection's account (the operator's Disconnect acts on the account, as hers does). */
export async function readConnectionUser(
  connectionId: string,
): Promise<string | null> {
  const row = await mustQuery(
    admin()
      .from("cloud_connections")
      .select("user_id")
      .eq("id", connectionId)
      .maybeSingle(),
    "drive admin: a connection's account",
  );
  return str(obj(row).user_id);
}

/** Connections still holding a grant (not `revoked`), a page at a time in id order: the revoke-all's walk. */
export async function readLiveConnections(input: {
  after: string | null;
  limit: number;
}): Promise<{ id: string; userId: string }[]> {
  let query = admin()
    .from("cloud_connections")
    .select("id, user_id")
    .neq("status", "revoked")
    .order("id", { ascending: true })
    .limit(Math.min(Math.max(input.limit, 1), 500));
  if (input.after) query = query.gt("id", input.after);
  const rows = await mustQuery(query, "drive admin: live connections");
  return ((Array.isArray(rows) ? rows : []) as Record<string, unknown>[])
    .map((r) => ({ id: str(r.id) ?? "", userId: str(r.user_id) ?? "" }))
    .filter((r) => r.id && r.userId);
}
