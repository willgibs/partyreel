"use client";

/**
 * THE GUEST ARRIVAL — what a guest meets when they tap the reel card on /e/ (R3, ADR-0022 ruling 2).
 *
 * It is the composite reveal's BACK HALF, deliberately: the host's Create beat earns the full
 * assembly (tiles flying in from their own grid), while a guest has no tiles on screen to fly. So the
 * cut starts where the host's cut lands: a camera flash covers the card-to-canvas swap at the card's
 * footprint, the screen expands to full bleed already breathing, the title names the event, then the
 * reel takes over and the take-away row arrives. Same closed grammar, one cut shorter.
 *
 * ALL motion lives in globals.css under `[data-rxp-g*]` (Track B owns that block). This component only
 * says which beat we are on (`data-act`) and hands the CSS the from-pose. Reduced motion skips the
 * theater entirely and lands on `settled` with the player paused and its controls shown, so a guest
 * who asked for less movement gets the reel with play one tap away instead of an autoplaying canvas.
 *
 * The player is CHROME-LESS while playing on purpose: the engine's clock loops (`% durationInFrames`),
 * so the reel repeats like a poster rather than freezing on a last frame, and a 30-second loop needs
 * no scrubber. The take-away row underneath is the actual interaction.
 *
 * LAZY by construction: this module reaches the whole canvas engine, so the card React.lazy-loads it
 * on the first tap (the EntryModalLazy precedent). No guest who never taps the card downloads it.
 */

import { Download, Share2 } from "lucide-react";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { GalleryPayload } from "@/components/guest/live-gallery";
import { rvlMs } from "@/components/reel/reveal-constants";
import { Progress } from "@/components/ui/progress";
import { buildReelProps } from "@/lib/reel/build-reel-props";
import { downloadReel, saveBlobLocally } from "@/lib/reel/client-save";
import { shouldClientEncode } from "@/lib/reel/engine/encode-gate";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { probeEngineSupport } from "@/lib/reel/engine/support";
import type { ReelDownloadResponse } from "@/lib/reel/guest-download-contract";
import {
  needsEncodeProbe,
  planReelDownload,
} from "@/lib/reel/guest-download-plan";
import type { GuestReelPayload } from "@/lib/reel/guest-reel-payload";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { useRevealActs, type ActScript } from "@/lib/shared/use-reveal-acts";
import { cn } from "@/lib/utils";

/** The guest cut's beats (the composite's back half). */
type GuestAct = "flash" | "open" | "title" | "settled";

/**
 * The card's footprint, as the screen's birth pose. An inline poster card is roughly this fraction of
 * the full-bleed screen, so the flash covers a near-same-size swap (the composite's grammar) rather
 * than a visible jump. Ratified with the cut; not a tuning knob.
 */
const GUEST_FROM_POSE = "scale(0.42)";

/** Built FRESH per run off the CLOSED reveal vars, so a motion-tuner drag retimes the next play. */
function guestArrivalScript(): ActScript<GuestAct> {
  const expand = rvlMs("--tune-rvl-expand-ms");
  return [
    { act: "flash", holdMs: rvlMs("--tune-rvl-flash-ms") },
    // Ends slightly BEFORE the expansion lands, so the title enters as the screen reaches full bleed.
    { act: "open", holdMs: Math.max(expand - 90, 120) },
    { act: "title", holdMs: rvlMs("--tune-rvl-title-ms") },
    { act: "settled", holdMs: 0 },
  ];
}

/** When the reel is allowed to MOVE: from the expansion on (the flash covered frame 0). */
const GUEST_RELEASED = new Set<GuestAct | "idle">(["open", "title", "settled"]);

/** The Download tap's progress, surfaced as the inline bar in the settled row. */
type DownloadPhase =
  | { phase: "idle" }
  | { phase: "asking" }
  | { phase: "encoding"; progress: number };

/**
 * The one dead end in the ladder, named honestly (pre-approved copy): this device cannot encode and
 * the host has never made an mp4, so the only way to a file is the host making one.
 */
const ASK_HOST_COPY =
  "This video isn’t available on this device yet. Ask the host to download the reel once, then yours will be ready here.";

export function GuestReelOverlay({
  payload,
  eventName,
  joinUrl,
  qrToken,
  galleryPromise,
  onClose,
}: {
  payload: GuestReelPayload;
  eventName: string;
  /** The canonical /e/ link (the share target: guests share the ALBUM, not a video url). */
  joinUrl: string;
  qrToken: string;
  /**
   * The page's gallery load — the SAME promise LiveGallery consumes. use() resolves a promise once
   * per promise identity, so the overlay's clips are the already-presigned items the album is showing:
   * no second presign, no second RPC, and the media is decoded/cached by the time the cut plays.
   */
  galleryPromise: Promise<GalleryPayload>;
  onClose: () => void;
}) {
  // Suspends on the first render if the gallery is still in flight (the card's Suspense fallback holds
  // on the cover); resolved synchronously in the normal case, since the album already rendered.
  const gallery = use(galleryPromise);
  const reduced = usePrefersReducedMotion();

  // The script FACTORY, passed by reference (module-level, so it is stable without useCallback): the
  // hook resolves it fresh per run, which is what lets a motion-tuner drag retime the next play.
  // No reducedScript: useRevealActs then jumps straight to the LAST act. The guest asked to watch, so
  // reduced motion delivers the reel immediately rather than replaying the narrative as fades.
  const { act, run } = useRevealActs<GuestAct>(guestArrivalScript);
  const released = GUEST_RELEASED.has(act);
  const settled = act === "settled";

  // The cut plays once, when the reel can actually draw (after the use() above resolved).
  useEffect(() => {
    run();
  }, [run]);

  const byId = useMemo(
    () => new Map(gallery.items.map((item) => [item.id, item])),
    [gallery.items],
  );
  // The EXACT props the guest is watching — and, on the self-encode rung, the exact props encoded
  // (the engine's literal-WYSIWYG claim). Watermark rides the payload: the server derived it from the
  // host's tier, never the client.
  const reelProps = useMemo(
    () =>
      buildReelProps({
        orderedIds: payload.orderedIds,
        byId,
        styleId: payload.styleId,
        seed: payload.seed,
        orientation: payload.orientation,
        coverMediaId: payload.coverMediaId,
        lengthSeconds: payload.lengthSeconds,
        watermark: payload.watermark,
      }),
    [payload, byId],
  );

  const [download, setDownload] = useState<DownloadPhase>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  // Closing IS the cancel gesture: the card unmounts this component, which aborts any encode in
  // flight (the pipeline is local, so it just stops).
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleShare = useCallback(async () => {
    // A boolean, not `"share" in navigator`: the `in` check NARROWS navigator away in the else branch
    // (the DOM lib types share as always-present), which then hides `clipboard` from the fallback.
    const canNativeShare = typeof navigator.share === "function";
    if (canNativeShare) {
      try {
        await navigator.share({
          title: eventName,
          text: `Watch the reel from ${eventName}`,
          url: joinUrl,
        });
      } catch {
        // Dismissed the share sheet, or the platform refused. Nothing to say.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }, [eventName, joinUrl]);

  const handleDownload = useCallback(async () => {
    if (download.phase !== "idle") return;
    setDownload({ phase: "asking" });

    let response: ReelDownloadResponse | null = null;
    try {
      const res = await fetch("/api/reel/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The token IS the capability: the route re-derives the event, the access level and the
        // publish state from it. Nothing else is sent, and nothing client-side is trusted.
        body: JSON.stringify({ qr_token: qrToken }),
      });
      response = (await res.json()) as ReelDownloadResponse;
    } catch {
      response = null;
    }

    // Only probe WebCodecs where a local encode could actually be chosen (configuring an encoder is
    // not free, and on the fresh-hit / refusal rungs the plan is the same either way).
    let canEncode = false;
    if (needsEncodeProbe(response)) {
      const support = await probeEngineSupport(payload.orientation).catch(
        () => null,
      );
      canEncode = shouldClientEncode(support, payload.styleId);
    }

    const plan = planReelDownload(response, canEncode);

    if (plan.kind === "artifact") {
      downloadReel(plan.url);
      setDownload({ phase: "idle" });
      return;
    }
    if (plan.kind === "ask_host") {
      toast.info(ASK_HOST_COPY, { duration: 8000 });
      setDownload({ phase: "idle" });
      return;
    }
    if (plan.kind === "rate_limited") {
      const wait = plan.retryAfterSec
        ? ` Try again in about ${Math.max(1, Math.ceil(plan.retryAfterSec / 60))} min.`
        : "";
      toast.error(`Too many downloads from this network right now.${wait}`);
      setDownload({ phase: "idle" });
      return;
    }
    if (plan.kind === "unavailable") {
      toast.error("Couldn't get the video right now. Please try again.");
      setDownload({ phase: "idle" });
      return;
    }

    // The self-encode rung: $0, on this device, of the cut on screen. NO mint, NO upload, no server
    // call at all from here (a guest has no write path, ruling 4).
    const controller = new AbortController();
    abortRef.current = controller;
    setDownload({ phase: "encoding", progress: 0 });
    try {
      // DYNAMIC import: the mp4 encoder is the heaviest thing this overlay can reach and only a
      // Download ever needs it, so it stays out of even the overlay's own chunk.
      const { encodeReel } = await import("@/lib/reel/engine/encode");
      const encoded = await encodeReel(reelProps, {
        signal: controller.signal,
        onProgress: (progress) =>
          setDownload((current) =>
            current.phase === "encoding" ? { phase: "encoding", progress } : current,
          ),
      });
      if (controller.signal.aborted) return;
      // Straight from memory, before anything else can fail: the copy they are standing there
      // waiting for never depends on the network again.
      saveBlobLocally(encoded.blob, plan.filename);
      toast.success("Saved to your device.");
    } catch {
      if (controller.signal.aborted) return;
      toast.error("Couldn't make the video on this device.");
    } finally {
      abortRef.current = null;
      setDownload({ phase: "idle" });
    }
  }, [download.phase, payload.orientation, payload.styleId, qrToken, reelProps]);

  // The screen's footprint: the player caps its own WIDTH but not its height, so a 9:16 canvas would
  // overflow a short window. Cap by the viewport too, in dvh (never vh: mobile browser chrome makes
  // vh taller than the visible area).
  const landscape = payload.orientation === "landscape";
  const screenWidth = landscape
    ? "max-w-[min(640px,149dvh)]"
    : "max-w-[min(360px,47dvh)]";
  const screenAspect = landscape ? "aspect-[16/9]" : "aspect-[9/16]";

  // Defensive: the RSC's reel read and the gallery load are two reads of the same moment, so a
  // curated item removed BETWEEN them would leave the timeline empty here. Drawing zero clips is not
  // a state the engine promises to survive, and a blank cinema screen is a worse answer than a line.
  if (reelProps.clips.length === 0) {
    return (
      <div
        data-rxp-gstage
        data-act={act}
        className="absolute inset-0 z-20 flex items-center justify-center bg-[oklch(0.09_0_0)] px-8"
      >
        <p className="text-center text-[15px] text-white/70">
          This reel isn&rsquo;t ready to watch right now. Please try again in a
          moment.
        </p>
      </div>
    );
  }

  return (
    <div
      data-rxp-gstage
      data-act={act}
      // data-rxp-swap: this stage MOUNTS at a state transition (the tap), which is the only place
      // @starting-style may be used — it fires on first paint, so it must never sit on page furniture.
      data-rxp-swap
      className="absolute inset-0 z-20 overflow-hidden bg-[oklch(0.09_0_0)]"
    >
      {/* The screen: born under the flash at the card's footprint, expanding to full bleed with the
          reel already breathing. */}
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 z-30 mx-auto w-full -translate-y-1/2 px-2",
          screenWidth,
        )}
      >
        <div
          data-rxp-gscreen
          style={{ "--rxp-g-from": GUEST_FROM_POSE } as React.CSSProperties}
        >
          <CanvasReelPlayer
            reelProps={reelProps}
            frame={released ? undefined : 0}
            // Reduced motion never autoplays, so hand it the controls: the reel arrives paused on
            // frame 0 and play is one tap away.
            showControls={released && reduced}
          />
        </div>
      </div>

      {/* The camera flash: a white bloom that peaks fast and decays soft, so it reads as a shutter
          covering the card-to-canvas handoff rather than a full-white cut. */}
      <div
        data-rxp-gflash
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,oklch(0.99_0_0)_0%,oklch(0.99_0_0_/_0.5)_32%,transparent_70%)] opacity-0"
      />

      {/* The title beat, glued to the SCREEN's geometry (not the viewport's), so the scrim and the
          name always sit over the canvas's lower third at any window size. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 z-30 mx-auto w-full -translate-y-1/2 px-2",
          screenWidth,
        )}
      >
        <div className={cn("relative w-full", screenAspect)}>
          <div
            data-rxp-gscrim
            className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
          />
          <div
            data-rxp-gtitle
            className="absolute inset-x-0 top-[68%] px-6 text-center"
          >
            <p className="text-[9px] font-medium tracking-[0.24em] text-white/70 uppercase">
              The reel
            </p>
            <p className="font-heading mt-1 text-xl leading-tight text-white">
              {eventName}
            </p>
          </div>
        </div>
      </div>

      {/* The take-away row: the guest's two verbs, arriving as the title clears. Its rest state is
          opacity-0 but still hit-testable AND focusable, so gate both until settled (the host
          reveal's verify catch: an invisible button that eats real taps). */}
      <div
        data-rxp-gend
        inert={!settled || undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
          !settled && "pointer-events-none",
        )}
      >
        {download.phase === "encoding" ? (
          // Inline, in the row itself: the guest keeps WATCHING while their copy is made. (The host's
          // export uses a dialog because it is a multi-step upload; this is one local step.)
          <div className="mb-2.5">
            <Progress
              value={Math.round(download.progress * 100)}
              className="h-1 bg-white/15 [&_[data-slot=progress-indicator]]:bg-white"
            />
            <p className="mt-1.5 text-center text-[11px] text-white/60">
              Making your copy, {Math.round(download.progress * 100)}%
            </p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-white/12 text-sm font-medium text-white backdrop-blur-sm outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:active:scale-100"
          >
            <Share2 className="size-4" />
            Share
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={download.phase !== "idle"}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-white text-sm font-medium text-zinc-900 outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Download className="size-4" />
            {download.phase === "idle" ? "Download" : "Working…"}
          </button>
        </div>
        {/* The honest expectation-setter for the ladder: sometimes the host's file, sometimes one made
            right here. Either way the guest gets a video. */}
        <p className="mt-2 text-center text-[11px] text-white/45">
          Download uses the host&rsquo;s video when it is ready
        </p>
      </div>

      {/* Close: outside the settled gating, so a guest can always leave mid-cut. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close the reel"
        className="absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-50 flex size-9 items-center justify-center rounded-full bg-white/10 text-white/85 backdrop-blur-sm outline-none transition-transform duration-150 ease-emphasis active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:active:scale-100"
      >
        <CloseGlyph />
      </button>
    </div>
  );
}

/** The X, inline: one 14px glyph is not worth an icon import in a lazily-loaded chunk. */
function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
      className="size-4"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
