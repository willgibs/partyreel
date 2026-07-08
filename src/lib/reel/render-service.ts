/**
 * Server-only orchestration for the reel .mp4 export. The /api/reel/render route does the AUTHZ
 * (getUser + own-event); this module does the rest: derive the host's tier (→ watermark), compute the
 * config hash (the cache key), serve the cached mp4 when nothing changed, else run the kill-switch +
 * abuse limiter, presign the ORIGINALS, kick off renderMediaOnLambda (direct-to-R2 via s3OutputProvider,
 * with a signed completion webhook), and stamp highlight_reels into 'processing'. The webhook
 * (/api/internal/reel-complete) AND the poll route both flip it to 'ready' (idempotent).
 *
 * NOT the sync zip-export shape: a Remotion render is a ~60-90s async job producing ONE file, so the
 * template here is the backup-prune async pattern (trigger → webhook), not a streaming token + Worker.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { type GridMedia } from "@/components/app/media-grid";
import { clampReelSeconds, toBillingTier } from "@/lib/constants/tiers";
import type { Database } from "@/lib/db/types";
import { assertR2Env, assertReelRenderEnv } from "@/lib/env";
import { captureWarning } from "@/lib/observability/sentry";
import { buildReelProps } from "@/lib/reel/build-reel-props";
// A PURE composition submodule (the Orientation union), NOT the ./composition barrel (which re-exports
// Reel/Root/style-render → the `remotion` runtime). This service is server-only; the barrel would break the
// server build (React.createContext). buildReelProps resolves styleId → theme internally (also pure).
import type { Orientation } from "@/lib/reel/composition/constants";
import { type AwsRegion, renderMediaOnLambda } from "@/lib/reel/lambda-client";
import { renderHash } from "@/lib/reel/render-hash";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { headObject, presignDownload } from "@/lib/r2/presign";
import { reelOutputKey } from "@/lib/r2/keys";
import {
  abuseHashes,
  checkAbuseRate,
  recordAbuseEvent,
} from "@/lib/security/abuse-rate-limit-store";
import { getSiteUrl } from "@/lib/site-url";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = SupabaseClient<Database>;

// 2 h — the render reads these presigned originals ~60-90s after we mint them (Lambda cold start +
// per-frame fetch). Way past the gallery's short-lived urls, so the render can't race an expiry.
const ORIGINAL_PRESIGN_TTL_SEC = 2 * 60 * 60;

// A silently-dead Lambda would leave status='processing' forever; past this we let a click re-trigger.
const STALE_PROCESSING_MS = 10 * 60 * 1000;

// Bound the render cost: a curated highlight reel is small; this is a runaway guard, not a product cap.
const MAX_RENDER_CLIPS = 150;

export type RenderOutcome =
  | { ok: true; status: "ready"; downloadUrl: string }
  | { ok: true; status: "processing" }
  | {
      ok: false;
      reason: "empty" | "paused" | "rate_limited" | "unconfigured" | "error";
      retryAfterSec?: number;
    };

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
    })
    .then(
      () => {},
      () => {},
    );
}

/** A friendly attachment URL for the finished mp4 ("<event>-reel.mp4", signed disposition). */
async function reelDownloadUrl(
  eventId: string,
  eventName: string,
): Promise<string> {
  const name = `${slugify(eventName) || "partyreel"}-reel.mp4`;
  return presignDownload({
    key: reelOutputKey(eventId),
    downloadFilename: name,
  });
}

/**
 * Authorize-and-trigger (or serve-from-cache) a reel render. Order: tier → hash → cache hit? →
 * stale-processing guard → configured? → kill-switch → limiter (fail OPEN) → presign → Lambda → stamp.
 * The caller (route) already verified the user OWNS this event.
 */
export async function requestReelRender(input: {
  eventId: string;
  ip: string;
}): Promise<RenderOutcome> {
  const { eventId, ip } = input;
  const admin = createAdminClient();

  // HMAC-of-IP for the log + the limiter scope (never a raw IP). Fail open if the hashing secret is unset.
  let ipHash: string | null = null;
  let scopeHash: string | null = null;
  try {
    const h = abuseHashes(ip, "reel_render", eventId);
    ipHash = h.ipHash;
    scopeHash = h.scopeHash;
  } catch {
    /* limiter secret unset → no hash, fail open */
  }

  // The event (host + name) — authoritative source for the tier read + the download filename.
  const { data: ev } = await admin
    .from("events")
    .select("host_id, name")
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!ev) return { ok: false, reason: "empty" };

  // Tier → watermark + the length cap (server-derived; never trust the client). max → pro via
  // toBillingTier.
  const { data: prof } = await admin
    .from("profiles")
    .select("tier")
    .eq("id", ev.host_id)
    .maybeSingle();
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
  const orientation: Orientation = row?.orientation === "landscape" ? "landscape" : "portrait";
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
  if (orderedApprovedIds.length === 0) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_empty",
    });
    return { ok: false, reason: "empty" };
  }

  const hash = renderHash({
    orderedApprovedIds,
    styleId,
    orientation,
    seed,
    lengthSeconds,
    coverMediaId,
    watermark,
  });

  // CACHE: an unchanged reel that already rendered → serve the existing mp4 for $0.
  if (row?.status === "ready" && row.rendered_hash === hash && row.output_key) {
    const downloadUrl = await reelDownloadUrl(eventId, ev.name);
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      renderId: row.render_id,
      outcome: "cached",
    });
    return { ok: true, status: "ready", downloadUrl };
  }

  // STALE-PROCESSING GUARD: a render is in flight → don't double-fire (unless it's gone stale).
  if (row?.status === "processing" && row.render_started_at) {
    const startedMs = new Date(row.render_started_at).getTime();
    if (Date.now() - startedMs < STALE_PROCESSING_MS) {
      return { ok: true, status: "processing" };
    }
  }

  // Configured? Fail closed (operational) if the render env is unset — nothing to render to.
  let cfg: ReturnType<typeof assertReelRenderEnv>;
  let r2: ReturnType<typeof assertR2Env>;
  try {
    cfg = assertReelRenderEnv();
    r2 = assertR2Env();
  } catch {
    return { ok: false, reason: "unconfigured" };
  }

  // Kill-switch: an operator can halt all new renders from /admin (no redeploy).
  if (!(await isRenderEnabled(admin))) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "rejected_mode",
    });
    return { ok: false, reason: "paused" };
  }

  // Abuse limiter (tight per-(IP,event); fail OPEN on a limiter error — getUser + host-owns is the gate).
  if (ipHash && scopeHash) {
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
  }

  // Build the render props from the FULL-RES originals (the export is the shareable "wow"; the live
  // player uses the small previews). Construct GridMedia-shaped entries with url = a long-TTL presigned
  // original and previewUrl = null, so buildReelProps(posterMode:false) resolves to originals + real
  // <Video>. Reuses the player's cover-hoist + length-cap + approved-filter (DRY, WYSIWYG).
  const byId = new Map<string, GridMedia>();
  await Promise.all(
    orderedApprovedIds.map(async (id) => {
      const m = approved.get(id)!;
      const url = await presignDownload({
        key: m.original_key,
        expiresInSeconds: ORIGINAL_PRESIGN_TTL_SEC,
      });
      byId.set(id, {
        id,
        type: m.type,
        url,
        previewUrl: null,
        status: "approved",
        width: m.width,
        height: m.height,
      });
    }),
  );

  const props = buildReelProps({
    orderedIds: orderedApprovedIds,
    byId,
    styleId,
    seed,
    orientation,
    coverMediaId,
    lengthSeconds,
    posterMode: false,
    watermark,
  });

  const siteUrl = await getSiteUrl();

  let renderId: string;
  try {
    const res = await renderMediaOnLambda({
      // The env is validated as a non-empty string; narrow to the AwsRegion union for the SDK.
      region: cfg.REMOTION_AWS_REGION as AwsRegion,
      functionName: cfg.REMOTION_LAMBDA_FUNCTION_NAME,
      serveUrl: cfg.REMOTION_SERVE_URL,
      composition: "Reel",
      inputProps: props,
      codec: "h264",
      ...(cfg.REMOTION_FRAMES_PER_LAMBDA
        ? { framesPerLambda: cfg.REMOTION_FRAMES_PER_LAMBDA }
        : {}),
      // The output key is STABLE per event, so a re-render (a config change, or the RENDER_VERSION bump)
      // must OVERWRITE the previous mp4 in place — without this, renderMediaOnLambda refuses ("output file
      // already exists") the moment a reel is rendered a second time.
      overwrite: true,
      // Direct-to-R2 — no S3→R2 copy (spike-proven). Stable key → a re-render overwrites in place.
      outName: {
        bucketName: r2.R2_BUCKET,
        key: reelOutputKey(eventId),
        s3OutputProvider: {
          endpoint: `https://${r2.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          accessKeyId: r2.R2_ACCESS_KEY_ID,
          secretAccessKey: r2.R2_SECRET_ACCESS_KEY,
        },
      },
      // The async completion callback: Lambda POSTs here on success/error/timeout. customData carries
      // which event + which hash this render is for (the webhook verifies + stamps 'ready').
      webhook: {
        url: `${siteUrl}/api/internal/reel-complete`,
        secret: cfg.REEL_RENDER_WEBHOOK_SECRET,
        customData: { eventId, hash },
      },
      // Credentials for the orchestrator come from REMOTION_AWS_* in the process env (set on Vercel).
    });
    renderId = res.renderId;
  } catch (e) {
    await recordRender(admin, {
      eventId,
      requesterHash: ipHash,
      outcome: "failed",
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, reason: "error" };
  }

  // Stamp 'processing' + the in-flight hash (so the poll/webhook can confirm this render matches the
  // current config). Upsert: the highlight_reels row may not exist yet (items added, config untouched);
  // create it with the resolved config so a later getReelConfig is consistent. Service-role write
  // (host table writes are revoked).
  await admin.from("highlight_reels").upsert(
    {
      event_id: eventId,
      style_id: styleId,
      theme: styleId, // keep the legacy column in sync with the style id during the transition
      orientation,
      seed,
      // Persist the HOST'S setting, not the render's resolved length: Auto stays null (so a later
      // upgrade lengthens an Auto reel with no re-save); an explicit over-cap value clamps down.
      length_seconds:
        storedLengthSeconds == null
          ? null
          : clampReelSeconds(tier, storedLengthSeconds),
      cover_media_id: coverMediaId,
      status: "processing",
      render_id: renderId,
      rendered_hash: hash,
      render_error: null,
      render_started_at: new Date().toISOString(),
    },
    { onConflict: "event_id" },
  );

  await recordRender(admin, {
    eventId,
    requesterHash: ipHash,
    renderId,
    outcome: "minted",
  });
  if (ipHash && scopeHash) {
    await recordAbuseEvent("reel_render", ipHash, scopeHash).catch(() => {});
  }

  return { ok: true, status: "processing" };
}

/**
 * Flip a 'processing' reel to 'ready' IFF this render's mp4 has landed in R2. Completion is detected by
 * the OBJECT (HEAD reelOutputKey with LastModified >= render_started_at), not by Remotion's progress API
 * — so it needs no persisted bucketName and works BOTH from the webhook (prod) AND the poll route (local
 * dev, where Lambda can't reach localhost; + prod resilience if the webhook is delayed/lost). Idempotent:
 * the status='processing' guard means whichever path fires first wins; a second call is a no-op. Returns
 * true if the reel is now ready.
 */
async function finalizeIfLanded(
  admin: Admin,
  eventId: string,
  row: Pick<ReelRow, "status" | "render_started_at" | "render_id">,
  costUsd?: number | null,
): Promise<boolean> {
  if (row.status !== "processing" || !row.render_started_at) return false;
  const meta = await headObject({ key: reelOutputKey(eventId) });
  const startedMs = new Date(row.render_started_at).getTime();
  const landed =
    meta &&
    meta.size > 0 &&
    meta.lastModified != null &&
    meta.lastModified.getTime() >= startedMs;
  if (!landed) return false;

  await admin
    .from("highlight_reels")
    .update({
      status: "ready",
      output_key: reelOutputKey(eventId),
      rendered_at: new Date().toISOString(),
      render_error: null,
      ...(costUsd != null ? { render_cost_usd: costUsd } : {}),
    })
    .eq("event_id", eventId)
    .eq("status", "processing"); // idempotent — only the first finalizer flips it
  await recordRender(admin, {
    eventId,
    requesterHash: null,
    renderId: row.render_id,
    outcome: "completed",
  });
  return true;
}

export type ReelRenderState =
  | { status: "ready"; downloadUrl: string }
  | { status: "processing" }
  | { status: "error" }
  | { status: "idle" };

/**
 * The poll endpoint's read: reflect the reel's render state, finalizing from R2 if the mp4 has landed
 * (the local-dev + resilience fallback for the webhook). 'error' = a recorded render_error with no
 * current 'ready'; 'idle' = never rendered / config changed since.
 */
export async function getReelRenderState(
  eventId: string,
  eventName: string,
): Promise<ReelRenderState> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("highlight_reels")
    .select("status, render_started_at, render_id, render_error")
    .eq("event_id", eventId)
    .maybeSingle();
  const row = (data ?? null) as Pick<
    ReelRow,
    "status" | "render_started_at" | "render_id" | "render_error"
  > | null;
  if (!row) return { status: "idle" };

  let status: ReelRow["status"] = row.status;
  if (
    status === "processing" &&
    (await finalizeIfLanded(admin, eventId, row))
  ) {
    status = "ready";
  }

  if (status === "ready") {
    const downloadUrl = await reelDownloadUrl(eventId, eventName);
    return { status: "ready", downloadUrl };
  }
  if (row.render_error) return { status: "error" };
  if (status === "processing") return { status: "processing" };
  return { status: "idle" };
}

/**
 * Apply a Remotion completion webhook. Success → finalize from R2 (confirm + stamp cost). Error/timeout
 * → record render_error and reset to 'pending' (clearing render_started_at) so a re-click re-renders
 * immediately rather than waiting out the stale-processing window. Guarded by render_id so a stale
 * webhook for a superseded render can't clobber a newer one.
 */
export async function applyReelWebhook(input: {
  eventId: string;
  renderId: string | null;
  type: "success" | "error" | "timeout";
  costUsd?: number | null;
  error?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("highlight_reels")
    .select("status, render_started_at, render_id")
    .eq("event_id", input.eventId)
    .maybeSingle();
  const row = (data ?? null) as Pick<
    ReelRow,
    "status" | "render_started_at" | "render_id"
  > | null;
  if (!row) return;
  // Ignore a stale callback for a render we've already superseded.
  if (input.renderId && row.render_id && input.renderId !== row.render_id) {
    return;
  }

  if (input.type === "success") {
    await finalizeIfLanded(admin, input.eventId, row, input.costUsd);
    return;
  }

  // error | timeout — only act on the in-flight render.
  if (row.status !== "processing") return;
  await admin
    .from("highlight_reels")
    .update({
      status: "pending",
      render_error: input.error ?? input.type,
      render_started_at: null,
    })
    .eq("event_id", input.eventId)
    .eq("status", "processing");
  await recordRender(admin, {
    eventId: input.eventId,
    requesterHash: null,
    renderId: input.renderId,
    outcome: "failed",
    error: input.error ?? input.type,
  });
}
