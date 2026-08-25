"use client";

/**
 * THE reel's config + export controller, in ONE place.
 *
 * Lifted BODILY out of reel-composer.tsx (R3), not rewritten: the composer had
 * two consumers coming (the Marquee in the feed and the Studio route) and every
 * one of the subtleties below was learned the hard way, so the move is
 * deliberately mechanical. What it owns:
 *
 *   * the config state, initialized from the stored row with the legacy-`theme`
 *     fallback and the tier clamp for a downgraded host;
 *   * the deterministic seed (no shuffle — one stable, reproducible take);
 *   * the ReelProps memo the player renders AND the encoder steps (one draw fn,
 *     so the preview pixels ARE the export pixels);
 *   * persistConfig (upsert_reel_config, which LAZILY CREATES the reel row — so
 *     it doubles as the builder's "create the reel" call) + the 600ms debounced
 *     auto-save with a first-run skip, so merely LOOKING at a reel never writes;
 *   * the whole on-device export pipeline: flush-config-first (a failed flush
 *     STOPS the export), the WebCodecs capability probe, encode → local save →
 *     mint → PUT → finalize, and the progress-dialog state.
 *
 * Mount it ONCE per surface and pass the result down. Two live instances over
 * one event would run two debounce timers against the same row.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { type GridMedia } from "@/components/app/media-grid";
import { useReel } from "@/components/reel/reel-provider";
import { type ReelEncodeState } from "@/components/reel/reel-stitching-dialog";
import {
  clampReelSeconds,
  MAX_REEL_SECONDS,
  type Tier,
} from "@/lib/constants/tiers";
import { type ReelConfig } from "@/lib/db/queries/reel";
import { buildReelProps } from "@/lib/reel/build-reel-props";
// The two device-save helpers live in lib/reel/client-save so the Marquee, the Studio and the guest
// overlay share ONE implementation of the anchor dance. Module functions, so NOT dependencies.
import { downloadReel, saveBlobLocally } from "@/lib/reel/client-save";
import type { Orientation } from "@/lib/reel/engine/constants";
// NOTE: `encodeReel` is deliberately NOT imported here. See the dynamic import in the export
// pipeline below. `shouldClientEncode` stays static: it is a tiny pure gate the surface needs on
// mount to decide whether to offer Download at all.
import { shouldClientEncode } from "@/lib/reel/engine/encode-gate";
import { probeEngineSupport } from "@/lib/reel/engine/support";
import {
  DEFAULT_STYLE_ID,
  resolveStyleEntry,
  STYLE_IDS,
} from "@/lib/reel/engine/style-registry";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import type {
  ReelUploadBeginResponse,
  ReelUploadBody,
  ReelUploadErrorResponse,
  ReelUploadFinalizeResponse,
  ReelUploadMintResponse,
} from "@/lib/reel/upload-contract";
import { createClient } from "@/lib/supabase/client";

/** The length options every tier SEES; a value past the tier cap renders locked
 *  (the house upgrade-hint pattern — the visible-but-locked 60s IS the nudge). */
export const REEL_LENGTHS: { label: string; value: number | null }[] = [
  { label: "Auto", value: null },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
];

/** The honest notice when this browser can't encode the mp4 (no WebCodecs). The reel still plays;
 *  the download just needs a modern browser. No em-dashes (user-facing copy). */
export const NO_EXPORT_NOTICE =
  "Video export needs a modern browser. Your reel still plays here, and any modern phone or desktop browser can download it.";

function rpcOk(data: unknown): boolean {
  return (
    !!data && typeof data === "object" && (data as { ok?: boolean }).ok === true
  );
}

export type ReelConfigController = ReturnType<typeof useReelConfig>;

export function useReelConfig({
  eventId,
  items,
  reelConfig,
  watermark,
  tier,
}: {
  eventId: string;
  /** All visible gallery items (already presigned); the reel is a subset by id. */
  items: GridMedia[];
  reelConfig: ReelConfig | null;
  /** Free tier → stamp the partyreel.com wordmark in the live player (mirrors the export). */
  watermark: boolean;
  /** The host's billing tier — drives the length cap (30s Free / 60s paid, ADR-0021). UX only;
   *  the reel-config RPC and the render path re-enforce server-side. */
  tier: Tier;
}) {
  const reel = useReel();
  const orderedIds = useMemo(() => reel?.orderedIds ?? [], [reel?.orderedIds]);

  // The chosen catalog style — from the stored style_id, else the legacy theme (if it's a valid
  // style id), else the default mood.
  const [styleId, setStyleId] = useState<string>(() => {
    if (reelConfig?.styleId && STYLE_IDS.includes(reelConfig.styleId))
      return reelConfig.styleId;
    if (reelConfig?.theme && STYLE_IDS.includes(reelConfig.theme))
      return reelConfig.theme;
    return DEFAULT_STYLE_ID;
  });
  const [orientation, setOrientation] = useState<Orientation>(() =>
    reelConfig?.orientation === "landscape" ? "landscape" : "portrait",
  );
  // The seed is deterministic per reel (no shuffle) — one stable, reproducible take.
  const seed = useMemo(
    () => reelConfig?.seed ?? defaultReelSeed(eventId),
    [reelConfig?.seed, eventId],
  );
  const [coverMediaId, setCoverMediaId] = useState<string | null>(
    () => reelConfig?.coverMediaId ?? null,
  );
  // The tier length cap (ADR-0021). A stored value past the cap (a downgraded host) initializes
  // clamped, so the UI never shows a locked option as active; the next save persists the clamp
  // (matching what the server would store anyway).
  const maxSeconds = MAX_REEL_SECONDS[tier];
  const [lengthSeconds, setLengthSeconds] = useState<number | null>(() => {
    const stored = reelConfig?.lengthSeconds ?? null;
    return stored != null && stored > maxSeconds ? maxSeconds : stored;
  });

  const byId = useMemo(() => new Map(items.map((m) => [m.id, m])), [items]);

  // ★ TWO membership predicates, deliberately (R3). MEMBERSHIP = approved + hidden: a hidden item
  // stays a member (shown dimmed) so reorder commits the complete set the RPC's set-equality guard
  // requires. The TIMELINE (below, and buildReelProps) is approved-ONLY, for exact parity with the
  // render context's hash identity. Divergence is intentional; do not "fix" one to match the other.
  const membership = useMemo(
    () =>
      orderedIds
        .map((id) => byId.get(id))
        .filter((m): m is GridMedia => !!m),
    [orderedIds, byId],
  );
  /** The rendered timeline: approved-only, in reel order (the cover picker + the filmstrip). */
  const timeline = useMemo(
    () => membership.filter((m) => m.status === "approved"),
    [membership],
  );

  /** The effective length in seconds: Auto fills to the tier cap, an explicit choice clamps to it. */
  const effectiveSeconds = clampReelSeconds(tier, lengthSeconds);

  const reelProps = useMemo(
    () =>
      buildReelProps({
        orderedIds,
        byId,
        styleId,
        seed,
        orientation,
        coverMediaId,
        // The tier clamp, applied to the PREVIEW too: Auto fills up to the cap (30/60), so the
        // player shows exactly what the export renders (the render path applies the same clamp).
        lengthSeconds: effectiveSeconds,
        watermark,
      }),
    [
      orderedIds,
      byId,
      styleId,
      seed,
      orientation,
      coverMediaId,
      effectiveSeconds,
      watermark,
    ],
  );

  // The single config-persist (upsert_reel_config lazily creates the reel row). Shared by the
  // debounced auto-save, the BUILDER's Create (the lazy create IS the birth) AND the Download
  // handler (which flushes the latest config FIRST, so the rendered .mp4 matches exactly what the
  // player shows — no debounce race).
  const supabase = useMemo(() => createClient(), []);
  const persistConfig = useCallback(async (): Promise<boolean> => {
    const args: {
      p_event_id: string;
      p_style_id: string;
      p_orientation: string;
      p_seed: number;
      p_length_seconds?: number;
      p_cover_media_id?: string;
    } = {
      p_event_id: eventId,
      p_style_id: styleId,
      p_orientation: orientation,
      p_seed: seed,
    };
    // Omit (→ SQL default null) to CLEAR length/cover; pass to set.
    if (lengthSeconds != null) args.p_length_seconds = lengthSeconds;
    if (coverMediaId != null) args.p_cover_media_id = coverMediaId;
    const { data, error } = await supabase.rpc("upsert_reel_config", args);
    if (error || !rpcOk(data)) {
      toast.error("Couldn't save your reel settings.");
      return false;
    }
    return true;
  }, [
    eventId,
    styleId,
    orientation,
    seed,
    lengthSeconds,
    coverMediaId,
    supabase,
  ]);

  // Debounced auto-save. Skips the first run (the config is already server truth / defaults) so just
  // viewing the reel never writes; a real edit (style/orientation/cover/length) lazily upserts the row.
  const firstRun = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persistConfig();
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [persistConfig]);

  // Download → the on-device .mp4 encode. `encodeState` drives the shared progress dialog's stages.
  const [downloading, setDownloading] = useState(false);
  const [stitchOpen, setStitchOpen] = useState(false);
  const [encodeState, setEncodeState] = useState<ReelEncodeState | null>(null);
  const encodeAbortRef = useRef<AbortController | null>(null);

  // Proactively probe whether THIS browser can encode at the current orientation/style, so a browser
  // without WebCodecs sees an honest notice instead of a Download button it can't fulfill. null =
  // probing (assume yes so the button shows); false = show the notice. Re-probes on orientation/style.
  const [exportSupported, setExportSupported] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    probeEngineSupport(orientation)
      .then((support) => {
        if (alive) setExportSupported(shouldClientEncode(support, styleId));
      })
      .catch(() => {
        if (alive) setExportSupported(false);
      });
    return () => {
      alive = false;
    };
  }, [orientation, styleId]);

  const closeEncode = useCallback(() => {
    encodeAbortRef.current = null;
    setEncodeState(null);
    setStitchOpen(false);
  }, []);

  // Closing the dialog mid-encode is the cancel gesture (the pipeline is local, so it just stops).
  const handleStitchOpenChange = useCallback(
    (open: boolean) => {
      if (!open && encodeState) {
        encodeAbortRef.current?.abort();
        closeEncode();
        return;
      }
      setStitchOpen(open);
    },
    [encodeState, closeEncode],
  );

  const postUpload = useCallback(async (body: ReelUploadBody) => {
    const res = await fetch("/api/reel/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | ReelUploadBeginResponse
      | ReelUploadMintResponse
      | ReelUploadFinalizeResponse
      | ReelUploadErrorResponse
      | null;
    return { ok: res.ok && data?.ok === true, data };
  }, []);

  /** The on-device export pipeline: begin (cache?) → encode → local save → mint → PUT → finalize. */
  const runClientEncode = useCallback(async () => {
    const begin = await postUpload({ phase: "begin", event_id: eventId });
    if (!begin.ok || begin.data?.ok !== true || !("mode" in begin.data)) {
      const message =
        begin.data && "message" in begin.data ? begin.data.message : null;
      toast.error(
        message ?? "Couldn't start your reel video. Please try again.",
      );
      return;
    }
    if (begin.data.mode === "cached") {
      // Nothing changed since the last export: the stored mp4 IS this config's output.
      downloadReel(begin.data.downloadUrl);
      toast.success("Your reel is ready.");
      return;
    }
    const { hash, filename } = begin.data;

    const controller = new AbortController();
    encodeAbortRef.current = controller;
    setEncodeState({ stage: "encoding", progress: 0 });
    setStitchOpen(true);

    // Encode the EXACT props the player is showing (the literal-WYSIWYG claim of the canvas engine).
    let blob: Blob;
    try {
      // DYNAMIC IMPORT: the mp4 encoder (WebCodecs muxing + the asset loader)
      // is the heaviest thing this surface can reach, and only an EXPORT ever
      // needs it, but importing it statically dragged the whole encoder into
      // the host event page's FIRST-LOAD bundle. Every host paid that download
      // just to look at their gallery. It now loads on the first Download tap;
      // the browser caches the chunk, so a repeat export starts instantly.
      const { encodeReel } = await import("@/lib/reel/engine/encode");
      const encoded = await encodeReel(reelProps, {
        signal: controller.signal,
        onProgress: (progress) =>
          setEncodeState((s) =>
            s?.stage === "encoding" ? { stage: "encoding", progress } : s,
          ),
      });
      blob = encoded.blob;
    } catch {
      if (controller.signal.aborted) return; // host cancelled — already cleaned up
      setEncodeState({ stage: "error" });
      return;
    }
    if (controller.signal.aborted) return;

    // The host's artifact FIRST: save the local copy the moment the encode lands, so a flaky
    // network can never take the video away. The upload below only feeds the cached online copy.
    saveBlobLocally(blob, filename);

    setEncodeState({ stage: "uploading" });
    try {
      const mint = await postUpload({
        phase: "mint",
        event_id: eventId,
        hash,
        size_bytes: blob.size,
      });
      if (!mint.ok || mint.data?.ok !== true || !("uploadUrl" in mint.data)) {
        throw new Error("mint refused");
      }
      const put = await fetch(mint.data.uploadUrl, {
        method: "PUT",
        headers: mint.data.headers,
        body: blob,
        signal: controller.signal,
      });
      if (!put.ok) throw new Error("upload failed");
      const fin = await postUpload({
        phase: "finalize",
        event_id: eventId,
        hash,
      });
      if (!fin.ok) throw new Error("finalize refused");
      toast.success("Your reel is ready.");
    } catch {
      if (!controller.signal.aborted) {
        // The video is already on the device; only the stored copy (the instant re-download +
        // future guest surface) is missing. Say so honestly, don't fail the download.
        toast.warning(
          "Your video downloaded, but we couldn't store an online copy. The next download will re-create it.",
        );
      }
    } finally {
      closeEncode();
    }
    // downloadReel/saveBlobLocally are module functions now, so they are not dependencies.
  }, [eventId, reelProps, postUpload, closeEncode]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Flush the latest config FIRST so the export matches exactly what the player shows. A
      // failed flush must STOP the export: the server derives the artifact hash from the DB
      // config, so encoding un-flushed client state would cache pixels under a hash describing a
      // different reel (persistConfig already surfaced its save-failure toast).
      const saved = await persistConfig();
      if (!saved) return;
      // Encode on-device (WebCodecs). Re-probe at the CURRENT orientation as a guard: if this browser
      // can't encode, say so honestly (the inline notice already covers the proactive case). The reel
      // still plays here regardless.
      const support = await probeEngineSupport(orientation).catch(() => null);
      if (!shouldClientEncode(support, styleId)) {
        toast.info(NO_EXPORT_NOTICE);
        return;
      }
      await runClientEncode();
    } finally {
      setDownloading(false);
    }
  }, [persistConfig, orientation, styleId, runClientEncode]);

  return {
    // Config state + setters (the labeled control rows / the Studio sheets drive these).
    styleId,
    setStyleId,
    styleEntry: resolveStyleEntry(styleId),
    orientation,
    setOrientation,
    coverMediaId,
    setCoverMediaId,
    lengthSeconds,
    setLengthSeconds,
    seed,
    maxSeconds,
    effectiveSeconds,
    tier,

    // Derived media views.
    /** approved + hidden, reel-ordered (the reorder set). */
    membership,
    /** approved only, reel-ordered (what actually renders). */
    timeline,
    reelProps,

    // Persistence + export.
    persistConfig,
    handleDownload,
    downloading,
    exportSupported,
    stitchOpen,
    encodeState,
    handleStitchOpenChange,
    watermark,
  };
}
