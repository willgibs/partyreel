"use client";

/**
 * THE BUILDER: the Reel section before a reel exists.
 *
 * Create-birth (ADR-0023 ruling 4): the reel is BORN when the host taps Create,
 * and that tap is the reveal's natural trigger. So this surface has exactly one
 * job — get the host to a set of moments they are happy with, then hand the beat
 * over. Two beats, never one: FILL (quick-add, or pick your own), then CREATE.
 * Collapsing them into a single button would fire the ratified reveal off an
 * empty reel.
 *
 * Honesty rules that are load-bearing here:
 *   * the quick-add LABEL switches on whether likes actually shaped the pick
 *     (pickQuickAdd's `signals.likes`). Promising "crowd favorites" off one stray
 *     heart is the kind of small lie that costs trust in everything else we say.
 *   * Create runs the reveal IMMEDIATELY and persists CONCURRENTLY. It can,
 *     because the reel is a client-side composition that genuinely exists at the
 *     tap; there is nothing to wait on and no fake progress. If the upsert fails,
 *     the theater still finishes (it was never a lie), then we say so and fall
 *     back to the builder.
 */

import { Clapperboard, Heart, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { type GridMedia } from "@/components/app/media-grid";
import { useReel } from "@/components/reel/reel-provider";
import { useReelStage } from "@/components/reel/reel-stage-provider";
import {
  ReelReveal,
  type RevealTile,
  useReelReveal,
} from "@/components/reel/reel-reveal";
import { type ReelConfigController } from "@/components/reel/use-reel-config";
import {
  pickQuickAdd,
  QUICK_ADD_MIN,
  type QuickAddCandidate,
} from "@/lib/reel/quick-add";
import { defaultReelSeed } from "@/lib/reel/seed-default";
import { UNIFORM_TILE_ASPECT } from "@/lib/media/tile-aspect";
import { cn } from "@/lib/utils";

/** How many ghosted tiles the empty state teases behind the copy. */
const GHOST_TILES = 8;

export function ReelBuilder({
  eventId,
  eventName,
  approved,
  config,
  onShare,
  sharing,
}: {
  eventId: string;
  eventName: string;
  /** The host's APPROVED gallery items (quick-add's candidate pool). */
  approved: GridMedia[];
  config: ReelConfigController;
  /** The reveal's settled "Share with guests". */
  onShare: () => void;
  sharing: boolean;
}) {
  const reel = useReel();
  const stageCtx = useReelStage();
  const [filling, setFilling] = useState(false);
  const [creating, setCreating] = useState(false);

  const membership = config.membership;
  const momentCount = membership.length;

  // The quick-add pick, computed over the whole approved pool. Deterministic
  // (seeded off the reel's own seed, never Math.random), so the button promises
  // the SAME cut it will actually add, however many times it re-renders.
  const quickAdd = useMemo(() => {
    const candidates: QuickAddCandidate[] = approved.map((m) => ({
      id: m.id,
      type: m.type,
      createdAt: m.createdAt ?? null,
      uploaderKey: m.uploaderKey ?? null,
      likeCount: m.likeCount,
    }));
    return pickQuickAdd(candidates, { seed: defaultReelSeed(eventId) });
  }, [approved, eventId]);

  const canQuickAdd = approved.length >= QUICK_ADD_MIN && quickAdd.ids.length > 0;

  // The flight's SOURCES: the tiles the host can already see. Pre-create with
  // moments picked, that is the builder card's own grid; the reveal's flying
  // copies are parked on exactly these rects.
  const sourceEls = useRef<(HTMLElement | null)[]>([]);
  const reveal = useReelReveal(momentCount);

  /** The flying copies' visual twins, in reel order. */
  const revealTiles: RevealTile[] = useMemo(
    () =>
      membership.map((m) => ({ id: m.id, src: m.previewUrl ?? m.url })),
    [membership],
  );

  // ★ The panel swap must wait for the THEATER, not the save. markCreated() flips
  // reel-panel's builder→marquee switch, which unmounts this component AND the
  // reveal stage portal it hosts — so calling it when the RPC resolves (~1s) killed
  // the 4.7s choreography mid-act (found live on the alias, 2026-07-30). The save
  // result lands in a ref; the swap fires only from finishReveal (the settled
  // card's exits), or from the .then() if the host somehow dismissed first.
  const savedRef = useRef<boolean | null>(null); // null = save still in flight
  const swapQueuedRef = useRef(false); // dismissed before the save resolved

  const finishReveal = useCallback(() => {
    reveal.reset();
    if (savedRef.current === true) {
      stageCtx?.markCreated();
    } else if (savedRef.current === null) {
      // The theater outran the save (slow network): swap the moment it lands.
      swapQueuedRef.current = true;
    }
    // savedRef false: the save failed — persistConfig's path already toasted and
    // the builder stays up for a retry.
  }, [reveal, stageCtx]);

  const create = useCallback(() => {
    if (creating || momentCount === 0 || reveal.running) return;
    setCreating(true);
    savedRef.current = null;
    swapQueuedRef.current = false;
    // The reveal FIRST, measured against the tiles as they still sit at rest.
    reveal.start(sourceEls.current.slice(0, momentCount));
    // ...and the write concurrently. persistConfig's upsert IS the lazy create,
    // so this row's existence is the reel's birth certificate.
    void config.persistConfig().then((saved) => {
      setCreating(false);
      savedRef.current = saved;
      if (saved) {
        if (swapQueuedRef.current) stageCtx?.markCreated();
        return;
      }
      // Let the theater finish (the reel really is there, client-side) and land
      // back in the builder so the host can retry. persistConfig already toasted
      // the save failure; this line names the consequence.
      toast.warning("Your reel didn't save. Give it another try.");
      reveal.reset();
    });
  }, [creating, momentCount, reveal, config, stageCtx]);

  // The settled card's Share: publish (optimistic, via the panel's controller),
  // then exit the theater once the transition lands. `sharing` goes true→false
  // around the action; finishing on the falling edge keeps the stage up while
  // the button shows its pending state.
  const shareTappedRef = useRef(false);
  const wasSharingRef = useRef(false);
  const handleShare = useCallback(() => {
    shareTappedRef.current = true;
    onShare();
  }, [onShare]);
  useEffect(() => {
    if (sharing) {
      wasSharingRef.current = true;
      return;
    }
    if (shareTappedRef.current && wasSharingRef.current) {
      shareTappedRef.current = false;
      wasSharingRef.current = false;
      finishReveal();
    }
  }, [sharing, finishReveal]);

  // The floating action bar's "Create reel" fires THIS create (the FLIP needs the
  // builder's own tiles). The bar only shows while the Reel section is the active
  // section, so the sources are on screen by construction.
  const registerCreate = stageCtx?.registerCreate;
  useEffect(() => {
    if (!registerCreate) return;
    registerCreate(create);
    return () => registerCreate(null);
  }, [registerCreate, create]);

  async function quickFill() {
    if (!reel || filling) return;
    setFilling(true);
    try {
      // The ids come back CHRONOLOGICAL (the night's story) and add_to_reel is
      // idempotent + approved-only; keeping that order is the point.
      const added = await reel.addMany(quickAdd.ids);
      if (added > 0) toast.success(`Added ${added} to your reel.`);
    } finally {
      setFilling(false);
    }
  }

  const empty = momentCount === 0;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          empty ? "border border-border" : "border border-border p-3",
        )}
      >
        {empty ? (
          <>
            {/* The ghosted grid: the host's OWN media, blurred back, so the empty
                state is a promise about their night rather than a generic icon. */}
            <div
              aria-hidden
              className="grid grid-cols-4 gap-[2px] opacity-25 blur-[1.5px]"
            >
              {(approved.length > 0
                ? approved.slice(0, GHOST_TILES)
                : []
              ).map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.previewUrl ?? m.url}
                  alt=""
                  style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
                  className="w-full object-cover"
                />
              ))}
              {/* Nothing uploaded yet: hold the card's height with plain blocks
                  so the copy never sits on a collapsed box. */}
              {approved.length === 0
                ? Array.from({ length: GHOST_TILES }).map((_, i) => (
                    <span
                      key={i}
                      style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
                      className="block w-full bg-muted"
                    />
                  ))
                : null}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Clapperboard className="size-6 text-reel" aria-hidden />
              <p className="font-heading text-base leading-tight">
                Your reel starts here
              </p>
              <p className="max-w-[260px] text-xs leading-snug text-muted-foreground">
                {quickAdd.signals.likes
                  ? "Your most liked moments, plus a few recent ones from everyone"
                  : "A mix of recent moments from across your guests"}
              </p>
              {canQuickAdd ? (
                <button
                  type="button"
                  onClick={quickFill}
                  disabled={filling}
                  className="mt-1 flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3.5 text-xs font-medium text-white outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 motion-reduce:active:scale-100"
                >
                  {quickAdd.signals.likes ? (
                    <Heart className="size-3.5" aria-hidden />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden />
                  )}
                  {filling
                    ? "Adding…"
                    : quickAdd.signals.likes
                      ? "Start with the crowd favorites"
                      : "Start with a first cut"}
                </button>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                {approved.length === 0
                  ? "Add some photos to the gallery first"
                  : "Pick them myself: tap the clapperboard on any photo in the gallery"}
              </p>
            </div>
          </>
        ) : (
          // Moments picked, no reel yet: the V3 builder-card pattern. The count is
          // the progress, and the tiles double as the reveal's FLIP sources.
          <>
            <div className="flex items-baseline justify-between">
              <p className="font-heading text-base leading-tight">
                {momentCount === 1
                  ? "1 moment picked"
                  : `${momentCount} moments picked`}
              </p>
              <p aria-hidden className="text-[11px] text-muted-foreground">
                ready when you are
              </p>
            </div>
            {/* data-rxp-ghost + data-hidden: the instant the flying copies take
                over, this grid vanishes with NO transition, so nothing is left
                fading behind the flight. */}
            <span
              data-rxp-ghost
              data-hidden={reveal.running || undefined}
              className="mt-2.5 block"
            >
              <div
                aria-hidden
                className="grid grid-cols-4 gap-[var(--gap-gallery)]"
              >
                {membership.map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.id}
                    ref={(el) => {
                      sourceEls.current[i] = el;
                    }}
                    src={m.previewUrl ?? m.url}
                    alt=""
                    style={{ aspectRatio: UNIFORM_TILE_ASPECT }}
                    className={cn(
                      "w-full rounded-[var(--radius-tile)] object-cover",
                      m.status === "hidden" && "opacity-30",
                    )}
                  />
                ))}
              </div>
            </span>
            {canQuickAdd ? (
              <div className="mt-2.5 flex items-center justify-between gap-2 rounded-[6px] bg-muted/70 p-2">
                <p className="text-[11px] text-muted-foreground">
                  {quickAdd.signals.likes
                    ? "Add more of the crowd favorites"
                    : "Add a few more recent moments"}
                </p>
                <button
                  type="button"
                  onClick={quickFill}
                  disabled={filling}
                  className="flex h-6 shrink-0 items-center gap-1 rounded-full border border-border px-2 text-[11px] font-medium outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 motion-reduce:active:scale-100"
                >
                  {filling ? "Adding…" : "Fill"}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={create}
              disabled={creating || reveal.running}
              aria-busy={creating || reveal.running}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-action-lg)] bg-reel text-sm font-semibold text-white outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 motion-reduce:active:scale-100"
            >
              <Clapperboard className="size-4" aria-hidden />
              Create reel
            </button>
          </>
        )}
      </div>

      {/* The stage is a body-level portal that rests fully transparent, so it can
          mount from here without covering the feed until Create fires.
          Gated on having moments: with nothing curated there is no reel to reveal
          and no tiles to fly, and mounting a player over an EMPTY clip list would
          ask the engine to draw a reel that does not exist. The moment the host
          fills, it mounts, which is still a separate user action (and at least a
          frame) before any Create tap, so the copies' first transform is a
          transition exactly as the ratified flight requires. */}
      {!empty ? (
        <ReelReveal
          stage={reveal}
          tiles={revealTiles}
          reelProps={config.reelProps}
          eventName={eventName}
          onShare={handleShare}
          onDismiss={finishReveal}
          sharing={sharing}
        />
      ) : null}
    </div>
  );
}
