/**
 * Server-only orchestration for the reel .mp4 export. The reel is produced by an on-device WebCodecs
 * encode (the host's browser, engine/encode.ts); this module brokers the CLIENT-ENCODE handshake and
 * reports render state. The /api/reel/upload route does the AUTHZ (getUser + own-event); this module
 * derives the host's tier (→ watermark), computes the config hash (the cache key), serves the cached
 * mp4 when nothing changed, runs the kill-switch + abuse limiter, presigns the bounded PUT, and stamps
 * highlight_reels through 'processing' → 'ready'. The client's /api/reel/upload finalize call flips the
 * reel to 'ready' synchronously (the encode is on-device), so there is no async poll/resilience net.
 *
 * (The Lambda/Remotion render path was torn down 2026-07-08; client-encode is the only path now. The
 * caller-less GET poll route + its R2-HEAD finalize fallback were pruned 2026-07-08 with it.)
 */
import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  clampReelSeconds,
  type Tier,
  toBillingTier,
} from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import type { Database } from "@/lib/db/types";
import { captureWarning } from "@/lib/observability/sentry";
import {
  clientEncodeSizeCapBytes,
  withinClientEncodeSizeCap,
} from "@/lib/reel/client-encode-budget";
// The reel's pure Orientation union (engine/constants — no DOM, no React). This service is server-only;
// buildReelProps resolves styleId → theme internally (also pure).
import type { Orientation } from "@/lib/reel/engine/constants";
import { renderHash } from "@/lib/reel/render-hash";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { headObject, presignDownload, presignUpload } from "@/lib/r2/presign";
import { reelOutputKey } from "@/lib/r2/keys";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = SupabaseClient<Database>;

// Bound the render cost: a curated highlight reel is small; this is a runaway guard, not a product cap.
const MAX_RENDER_CLIPS = 150;

type ReelRow = Database["public"]["Tables"]["highlight_reels"]["Row"];

/** The reel-render kill-switch (mirrors export). Fails OPEN on a read error; defaults ON if the row's gone. */
async function isRenderEnabled(admin: Admin): Promise<boolean> {
  const { data, error } = await admin
    .from("ops_flags")
    .select("enabled")
    .eq("key", "reel_render_enabled")
    .maybeSingle();
  if (error) return true;
  return data?.enabled ?? true;
}

type LogFields = {
  eventId: string;
  requesterHash: string | null;
  renderId?: string | null;
  outcome: string;
  error?: string;
  /** Explicit render cost (a client-encode is always 0). */
  costUsd?: number | null;
};

/** Best-effort reel_render_log write (the /admin/reels readout reads it). Never throws into the flow. */
async function recordRender(admin: Admin, f: LogFields): Promise<void> {
  await admin
    .from("reel_render_log")
    .insert({
      event_id: f.eventId,
      requester_hash: f.requesterHash,
      render_id: f.renderId ?? null,
      outcome: f.outcome,
      error: f.error ?? null,
      ...(f.costUsd != null ? { cost_usd: f.costUsd } : {}),
    })
    .then(
      () => {},
      () => {},
    );
}

/** The reel mp4's attachment filename ("<event>-reel.mp4") — also the client-encode local-save name. */
// Exported for the guest download route (R3): guests receive the SAME filename the host does.
export function reelFilename(eventName: string): string {
  return `${slugify(eventName) || "partyreel"}-reel.mp4`;
}

/** A friendly attachment URL for the finished mp4 (signed disposition). */
async function reelDownloadUrl(
  eventId: string,
  eventName: string,
): Promise<string> {
  return presignDownload({
    key: reelOutputKey(eventId),
    downloadFilename: reelFilename(eventName),
  });
}

/**
 * The SERVER-side render identity for an event's reel, resolved for every client-encode phase
 * (begin/mint/finalize): the event + host tier (→ watermark + length clamp), the stored config, the
 * ordered approved media, and the resulting render hash (the cache key). Resolved fresh from the DB —
 * the client is never trusted for style/length/watermark/membership. Returns null when the event is
 * gone (deleted or never existed).
 */
// Exported for the guest read/download path (R3): guest-reel.ts + /api/reel/download resolve the
// SAME render identity (same clamp, same watermark derivation, same hash) instead of duplicating it.
export type ReelRenderContext = {
  eventName: string;
  tier: Tier;
  watermark: boolean;
  styleId: string;
  orientation: Orientation;
  seed: number;
  /** The host's raw stored setting (null = Auto) — persisted as-is so upgrades lengthen Auto reels. */
  storedLengthSeconds: number | null;
  /** The tier-clamped effective length (always a positive number; feeds the hash + size budget). */
  lengthSeconds: number;
  coverMediaId: string | null;
  orderedApprovedIds: string[];
  approved: Map<
    string,
    {
      id: string;
      type: Database["public"]["Tables"]["media"]["Row"]["type"];
      original_key: string;
      status: string;
      width: number | null;
      height: number | null;
    }
  >;
  row: ReelRow | null;
  hash: string;
};

export async function resolveReelRenderContext(
  admin: Admin,
  eventId: string,
): Promise<ReelRenderContext | null> {
  // The event (host + name) — authoritative source for the tier read + the download filename.
  const ev = await mustQuery(
    admin
      .from("events")
      .select("host_id, name")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle(),
    "reel render: event",
  );
  if (!ev) return null;

  // Tier → watermark + the length cap (server-derived; never trust the client). max → pro via
  // toBillingTier.
  // mustQuery is load-bearing: a swallowed error here falls through to the
  // `?? "free"` default and stamps the partyreel.com WATERMARK onto a paying
  // host's video (and clamps their length). A failed tier read must never
  // silently downgrade a customer's entitlement.
  const prof = await mustQuery(
    admin.from("profiles").select("tier").eq("id", ev.host_id).maybeSingle(),
    "reel render: host tier",
  );
  const tier = toBillingTier(prof?.tier ?? "free");
  const watermark = tier === "free";

  // The curated reel: ordered ids + the approved media for the event.
  const [{ data: reelRows }, { data: mediaRows }, { data: reelRow }] =
    await Promise.all([
      admin
        .from("reel_items")
        .select("media_id, position, added_at")
        .eq("event_id", eventId)
        .order("position", { ascending: true })
        .order("added_at", { ascending: true }),
      admin
        .from("media")
        .select("id, type, original_key, status, width, height")
        .eq("event_id", eventId)
        .eq("status", "approved"),
      admin
        .from("highlight_reels")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle(),
    ]);

  const row = (reelRow ?? null) as ReelRow | null;
  // The style id (mood or treatment). Fall back to the legacy `theme` column (pre-migration rows), then the
  // default mood. Orientation narrows to the union (default portrait).
  const styleId = row?.style_id ?? row?.theme ?? "classic";
  const orientation: Orientation =
    row?.orientation === "landscape" ? "landscape" : "portrait";
  const seed = row?.seed ?? defaultReelSeed(eventId);
  // The MINT-time tier clamp (ADR-0021): re-derive the length cap here, never trust the stored
  // config (upsert_reel_config clamps too, but a downgrade after save would leave a stale 60).
  // Auto (null) fills UP TO the tier cap, so lengthSeconds is always a number from here on — it
  // feeds the hash (a tier change re-renders) and buildReelProps' capToLength.
  const storedLengthSeconds = row?.length_seconds ?? null;
  const lengthSeconds = clampReelSeconds(tier, storedLengthSeconds);
  const coverMediaId = row?.cover_media_id ?? null;

  // Resolve the ordered, approved, present ids (the render identity).
  const approved = new Map((mediaRows ?? []).map((m) => [m.id, m]));
  const orderedApprovedIds = (reelRows ?? [])
    .map((r) => r.media_id)
    .filter((id) => approved.has(id))
    .slice(0, MAX_RENDER_CLIPS);

  const hash = renderHash({
    orderedApprovedIds,
    styleId,
    orientation,
    seed,
    lengthSeconds,
    coverMediaId,
    watermark,
  });

  return {
    eventName: ev.name,
    tier,
    watermark,
    styleId,
    orientation,
    seed,
    storedLengthSeconds,
    lengthSeconds,
    coverMediaId,
    orderedApprovedIds,
    approved,
    row,
    hash,
  };
}

// ---------------------------------------------------------------------------------------------
// The CLIENT-ENCODE export path (the ONLY reel export path): the host's browser encodes the mp4
// (WebCodecs, engine/encode.ts) and uploads it to the reel output key. Three server phases (all
// host-authed by the route):
//   begin    → cache check + kill-switch + limiter preflight BEFORE the client spends an encode.
//   mint     → the abuse choke point: recompute the hash + size cap server-side, presign a
//              content-length-bound PUT, stamp 'processing' (render_id "client:<uuid>"), record the
//              limiter event.
//   finalize → verify the object LANDED (present + size within cap + LastModified >= the mint
//              stamp, so a stale artifact from an older render at the same stable key can't bless
//              itself), then stamp 'ready' + rendered_hash and log 'client_encoded' at cost 0.
//              Idempotent (retry-safe).
// Trust model: the server derives tier/length/watermark/membership; the client's hash is an opaque
// echo compared against a fresh recompute at every phase, so a mid-encode config change 409s.
// ACCEPTED CAVEAT (pre-launch ruling): the server cannot see the ENCODED PIXELS, so a tampered
// self-encode can at worst upload a reel without the free-tier watermark — it defrauds a watermark,
// nothing else (the key, size, and config are all server-bound). No detection is built for this.
// ---------------------------------------------------------------------------------------------

// 15 min — the blob is fully encoded when the mint happens, so the PUT starts immediately; a short
// TTL keeps a leaked URL near-worthless (it is also content-length-bound and video/mp4-bound).
const CLIENT_UPLOAD_PRESIGN_TTL_SEC = 15 * 60;

export type ClientEncodeBegin =
  | { ok: true; mode: "cached"; downloadUrl: string; filename: string }
  | {
      ok: true;
      mode: "encode";
      hash: string;
      filename: string;
      maxBytes: number;
    }
  | {
      ok: false;
      reason: "empty" | "paused" | "rate_limited" | "error";
      retryAfterSec?: number;
    };

/** Phase 1: is an encode even needed (cache), allowed (kill-switch), and within rate (limiter)? */
export async function beginClientReelUpload(input: {
  eventId: string;
  ip: string;
}): Promise<ClientEncodeBegin> {
  const { eventId, ip } = input;
  const admin = createAdminClient();
  const { ipHash, scopeHash } = clientEncodeHashes(ip, eventId);

  const ctx = await resolveReelRenderContext(admin, eventId);
  if (!ctx) return { ok: false, reason: "empty" };
  if (ctx.orderedApprovedIds.length === 0) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_empty",
    });
    return { ok: false, reason: "empty" };
  }
  const filename = reelFilename(ctx.eventName);

  // CACHE: an unchanged reel that already has its mp4 → no encode at all, serve it.
  if (
    ctx.row?.status === "ready" &&
    ctx.row.rendered_hash === ctx.hash &&
    ctx.row.output_key
  ) {
    // Guard the hit against a POST-finalize overwrite (a still-valid mint presign from a
    // superseded attempt can rewrite the stable key): a legit artifact always lands BEFORE
    // rendered_at stamps, so an object newer than that (+30s R2/app clock skew) is foreign.
    // Stale or missing → fall through to a fresh encode, which overwrites + re-finalizes
    // (self-healing); never serve bytes the row did not bless.
    const renderedAtMs = ctx.row.rendered_at
      ? new Date(ctx.row.rendered_at).getTime()
      : null;
    const meta = await headObject({ key: reelOutputKey(eventId) });
    const fresh =
      meta != null &&
      meta.size > 0 &&
      (renderedAtMs == null ||
        meta.lastModified == null ||
        meta.lastModified.getTime() <= renderedAtMs + 30_000);
    if (fresh) {
      const downloadUrl = await reelDownloadUrl(eventId, ctx.eventName);
      await recordRender(admin, {
        eventId,
        requesterHash: ipHash,
        renderId: ctx.row.render_id,
        outcome: "cached",
      });
      return { ok: true, mode: "cached", downloadUrl, filename };
    }
  }

  // Kill-switch: /admin/reels halts client-encoded uploads.
  if (!(await isRenderEnabled(admin))) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_mode",
    });
    return { ok: false, reason: "paused" };
  }

  // Limiter PREFLIGHT (check only; the recorded event lands at mint, where the write happens) —
  // refuse here so a rate-limited host doesn't burn an encode that mint will reject anyway.
  const gate = await checkClientEncodeRate(admin, eventId, ipHash, scopeHash);
  if (gate) return gate;

  return {
    ok: true,
    mode: "encode",
    hash: ctx.hash,
    filename,
    maxBytes: clientEncodeSizeCapBytes(ctx.lengthSeconds),
  };
}

export type ClientEncodeMint =
  | { ok: true; uploadUrl: string; headers: Record<string, string> }
  | {
      ok: false;
      reason:
        | "empty"
        | "paused"
        | "rate_limited"
        | "config_changed"
        | "too_large"
        | "error";
      retryAfterSec?: number;
    };

/** Phase 2: presign the bounded PUT + stamp 'processing'. The size/hash are re-verified server-side. */
export async function mintClientReelUpload(input: {
  eventId: string;
  ip: string;
  hash: string;
  sizeBytes: number;
}): Promise<ClientEncodeMint> {
  const { eventId, ip, hash, sizeBytes } = input;
  const admin = createAdminClient();
  const { ipHash, scopeHash } = clientEncodeHashes(ip, eventId);

  const ctx = await resolveReelRenderContext(admin, eventId);
  if (!ctx || ctx.orderedApprovedIds.length === 0) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_empty",
    });
    return { ok: false, reason: "empty" };
  }
  // The config moved while the client encoded (another tab, a moderation change): the artifact no
  // longer matches the current reel — refuse, the client re-runs from begin. Logged: hash-probe
  // traffic is exactly what /admin/reels observability exists to surface.
  if (hash !== ctx.hash) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_hash",
    });
    return { ok: false, reason: "config_changed" };
  }

  if (!(await isRenderEnabled(admin))) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_mode",
    });
    return { ok: false, reason: "paused" };
  }

  const gate = await checkClientEncodeRate(admin, eventId, ipHash, scopeHash);
  if (gate) return gate;

  // The size budget: server-computed length × bitrate budget (+ headroom). Reject at mint AND bind
  // the accepted size into the presign signature, so R2 rejects any body that differs from it.
  if (!withinClientEncodeSizeCap(sizeBytes, ctx.lengthSeconds)) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_size",
      error: `declared ${sizeBytes} bytes for a ${ctx.lengthSeconds}s reel`,
    });
    return { ok: false, reason: "too_large" };
  }

  let upload: Awaited<ReturnType<typeof presignUpload>>;
  try {
    upload = await presignUpload({
      key: reelOutputKey(eventId),
      contentType: "video/mp4",
      contentLength: sizeBytes,
      expiresInSeconds: CLIENT_UPLOAD_PRESIGN_TTL_SEC,
    });
  } catch {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "failed",
      error: "presign failed",
    });
    return { ok: false, reason: "error" };
  }

  // Stamp the in-flight upload ('processing' + started-at), so finalize can require LastModified >=
  // this stamp. A re-mint (a failed PUT retried) just re-stamps.
  const renderId = `client:${randomUUID()}`;
  await admin.from("highlight_reels").upsert(
    {
      event_id: eventId,
      style_id: ctx.styleId,
      theme: ctx.styleId, // keep the legacy column in sync during the transition
      orientation: ctx.orientation,
      seed: ctx.seed,
      length_seconds:
        ctx.storedLengthSeconds == null
          ? null
          : clampReelSeconds(ctx.tier, ctx.storedLengthSeconds),
      cover_media_id: ctx.coverMediaId,
      status: "processing",
      render_id: renderId,
      rendered_hash: ctx.hash,
      render_error: null,
      render_started_at: new Date().toISOString(),
    },
    { onConflict: "event_id" },
  );

  await recordRender(admin, {
    eventId,
    requesterHash: ipHash,
    renderId,
    outcome: "client_minted",
  });
  if (ipHash && scopeHash) {
    await recordAbuseEvent("reel_render", ipHash, scopeHash).catch(() => {});
  }

  return { ok: true, uploadUrl: upload.url, headers: upload.headers };
}

export type ClientEncodeFinalize =
  | { ok: true; status: "ready"; downloadUrl: string }
  | {
      ok: false;
      reason:
        | "empty"
        | "paused"
        | "config_changed"
        | "upload_incomplete"
        | "error";
    };

/** Phase 3: confirm the upload landed, stamp 'ready' + the hash, log 'client_encoded' (cost 0). */
export async function finalizeClientReelUpload(input: {
  eventId: string;
  hash: string;
}): Promise<ClientEncodeFinalize> {
  const { eventId, hash } = input;
  const admin = createAdminClient();

  const ctx = await resolveReelRenderContext(admin, eventId);
  if (!ctx || ctx.orderedApprovedIds.length === 0) {
    return { ok: false, reason: "empty" };
  }
  if (hash !== ctx.hash) {
    await recordRender(admin, {
      eventId,
      requesterHash: null,
      outcome: "rejected_hash",
    });
    return { ok: false, reason: "config_changed" };
  }

  // Idempotent retry: already finalized for this exact config → same success, no duplicate log.
  if (
    ctx.row?.status === "ready" &&
    ctx.row.rendered_hash === ctx.hash &&
    ctx.row.output_key
  ) {
    const downloadUrl = await reelDownloadUrl(eventId, ctx.eventName);
    return { ok: true, status: "ready", downloadUrl };
  }

  // Kill-switch: the operator halt covers finalize too. A mint from before the flip must not
  // bless itself after it (the presign stays valid up to 15 min); already-finalized artifacts
  // still serve above, mirroring begin's cache-before-switch order.
  if (!(await isRenderEnabled(admin))) {
    await recordRender(admin, {
      eventId,
      requesterHash: null,
      outcome: "rejected_mode",
    });
    return { ok: false, reason: "paused" };
  }

  // No mint stamp for this config → nothing to finalize (the PUT never happened or was superseded).
  const row = ctx.row;
  if (!row || row.rendered_hash !== ctx.hash || !row.render_started_at) {
    await recordRender(admin, {
      eventId,
      requesterHash: null,
      outcome: "failed",
      error: "upload incomplete: no mint stamp for this config",
    });
    return { ok: false, reason: "upload_incomplete" };
  }

  // The landed check: the object exists, its size is within the mint budget, and it was written
  // AT/AFTER the mint stamp — so finalize can't bless a stale artifact from an older render at the
  // same stable key.
  const meta = await headObject({ key: reelOutputKey(eventId) });
  const startedMs = new Date(row.render_started_at).getTime();
  const landed =
    meta &&
    meta.size > 0 &&
    meta.size <= clientEncodeSizeCapBytes(ctx.lengthSeconds) &&
    meta.lastModified != null &&
    meta.lastModified.getTime() >= startedMs;
  if (!landed) {
    await recordRender(admin, {
      eventId,
      requesterHash: null,
      renderId: row.render_id,
      outcome: "failed",
      error:
        "upload incomplete: object missing, oversized, or older than the mint stamp",
    });
    return { ok: false, reason: "upload_incomplete" };
  }

  await admin
    .from("highlight_reels")
    .update({
      status: "ready",
      output_key: reelOutputKey(eventId),
      rendered_at: new Date().toISOString(),
      render_error: null,
      render_cost_usd: 0,
    })
    .eq("event_id", eventId)
    .eq("rendered_hash", ctx.hash); // don't clobber a newer mint for a changed config

  await recordRender(admin, {
    eventId,
    requesterHash: null,
    renderId: row.render_id,
    outcome: "client_encoded",
    costUsd: 0,
  });

  const downloadUrl = await reelDownloadUrl(eventId, ctx.eventName);
  return { ok: true, status: "ready", downloadUrl };
}

/** HMAC hashes for the client-encode limiter scope (fail open when the secret is unset). */
function clientEncodeHashes(
  ip: string,
  eventId: string,
): { ipHash: string | null; scopeHash: string | null } {
  try {
    return abuseHashes(ip, "reel_render", eventId);
  } catch {
    return { ipHash: null, scopeHash: null };
  }
}

/** Shared limiter check for begin/mint (the reel_render limiter kind; fail OPEN on errors). */
async function checkClientEncodeRate(
  admin: Admin,
  eventId: string,
  ipHash: string | null,
  scopeHash: string | null,
): Promise<{
  ok: false;
  reason: "rate_limited";
  retryAfterSec?: number;
} | null> {
  if (!ipHash || !scopeHash) return null;
  try {
    const gate = await checkAbuseRate("reel_render", ipHash, scopeHash);
    if (!gate.allowed) {
      await recordRender(admin, {
        eventId,
        requesterHash: ipHash,
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
      kind: "reel_render",
    });
  }
  return null;
}
