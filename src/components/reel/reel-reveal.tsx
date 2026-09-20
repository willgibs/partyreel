"use client";

/**
 * THE COMPOSITE REVEAL — the beat where a host's reel first exists.
 *
 * Ruled by Will at T1 and ratified AS-BUILT at T2: the curated tiles assemble
 * into center screen, square up, hold, a camera flash, the stack scales to full
 * bleed, the title card names the event as it lands, the reel takes breath. The
 * grammar is CLOSED — the beats, the from-scale and the scatter are transplanted
 * verbatim (see reveal-constants.ts); this file is the production stage, modeled
 * on the lab's V3 real-grid implementation.
 *
 * WHY it is honest theater and not a progress bar: the reel is a CLIENT-side
 * canvas composition, so it genuinely exists the instant the host taps Create.
 * There is nothing to wait on. The player is mounted UP FRONT held on frame 0
 * (the controlled-frame prop, no clock) and RELEASED at the expansion, so motion
 * starts with zero swap and the flash covers the stack-to-canvas handoff.
 *
 * ALL motion lives in globals.css under the `[data-rvl-*]` hooks; this component
 * only says which beat we are on (`data-act`) and where the tiles start (the
 * FLIP measure). Reduced motion plays a 3-act FADE script instead: the reel
 * arrives, the title names the event, and the player stays paused on frame 0 with
 * its controls shown, so play is one tap away.
 */

import { Share2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { useRevealActs } from "@/lib/shared/use-reveal-acts";
import { cn } from "@/lib/utils";

import {
  COMPOSITE_REDUCED,
  COMPOSITE_RELEASED,
  compositeScript,
  REVEAL_FROM_SCALE,
  REVEAL_SCATTER_DEG,
  type RevealAct,
} from "./reveal-constants";

/** The portal host, as an external store (see the note in ReelReveal). The
 *  subscribe is a no-op: document.body never changes under us. */
const subscribeNever = () => () => {};
const getPortalHost = () => document.body;
const getNoPortalHost = () => null;

/** One flying copy: the tile the host can already see, cloned onto the stage. */
export type RevealTile = { id: string; src: string };

export type ReelRevealStage = {
  act: RevealAct | "idle";
  running: boolean;
  /** Is the player allowed to move yet? (the expansion onward) */
  released: boolean;
  /**
   * Park the always-mounted flying copies on these rest tiles' pixels, aim each
   * at the screen's center at the ratified from-scale, then play. Call it INSIDE
   * the tap handler: the sources must be measured while they are still at rest,
   * before the builder chrome ghosts out.
   */
  start: (sources: readonly (HTMLElement | null)[]) => void;
  reset: () => void;
  /**
   * Wiring the <ReelReveal> stage attaches to itself. Not for callers.
   * CALLBACK refs, not ref objects: the stage reads these nodes only inside
   * start() (never during render), and handing out ref objects to be spread in
   * JSX reads as a render-time ref access (`react-hooks/refs`).
   */
  wiring: {
    setStage: (el: HTMLDivElement | null) => void;
    setScreenBox: (el: HTMLDivElement | null) => void;
    setFlyTile: (el: HTMLElement | null, index: number) => void;
  };
};

/**
 * The act machine + the FLIP measure. Lives in the CALLER (the builder) so the
 * caller can ghost its own grid the instant the copies take over, and so the
 * measure happens synchronously in its tap handler.
 */
export function useReelReveal(tileCount: number): ReelRevealStage {
  // A factory, not a snapshot: every play re-reads the --tune-rvl-* vars, so a
  // motion-tuner drag retimes the very next reveal.
  const script = useCallback(() => compositeScript(tileCount), [tileCount]);
  const { act, run, reset } = useRevealActs<RevealAct>(
    script,
    COMPOSITE_REDUCED,
  );

  const stageEl = useRef<HTMLDivElement | null>(null);
  const screenBoxEl = useRef<HTMLDivElement | null>(null);
  const flyEls = useRef<(HTMLElement | null)[]>([]);

  const wiring = useMemo(
    () => ({
      setStage: (el: HTMLDivElement | null) => {
        stageEl.current = el;
      },
      setScreenBox: (el: HTMLDivElement | null) => {
        screenBoxEl.current = el;
      },
      setFlyTile: (el: HTMLElement | null, index: number) => {
        flyEls.current[index] = el;
      },
    }),
    [],
  );

  const start = useCallback(
    (sources: readonly (HTMLElement | null)[]) => {
      const stage = stageEl.current?.getBoundingClientRect();
      const box = screenBoxEl.current?.getBoundingClientRect();
      // No stage yet (pre-portal) or no screen box: still play. The reveal
      // degrades to the flash-and-expand half rather than refusing to run.
      if (stage && box) {
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const targetW = box.width * REVEAL_FROM_SCALE;
        sources.forEach((src, i) => {
          const dst = flyEls.current[i];
          if (!src || !dst) return;
          const r = src.getBoundingClientRect();
          // Park the copy exactly on the source's pixels...
          dst.style.left = `${r.left - stage.left}px`;
          dst.style.top = `${r.top - stage.top}px`;
          dst.style.width = `${r.width}px`;
          dst.style.height = `${r.height}px`;
          // ...then hand the CSS the delta to the screen's center. Only
          // `transform` transitions, so the parking above lands instantly and
          // the flight starts from the right place (the FLIP).
          dst.style.setProperty("--dx", `${cx - (r.left + r.width / 2)}px`);
          dst.style.setProperty("--dy", `${cy - (r.top + r.height / 2)}px`);
          dst.style.setProperty("--s", `${targetW / r.width}`);
          dst.style.setProperty(
            "--r",
            `${REVEAL_SCATTER_DEG[i % REVEAL_SCATTER_DEG.length]}deg`,
          );
          dst.style.setProperty("--i", `${i}`);
        });
      }
      run();
    },
    [run],
  );

  return {
    act,
    running: act !== "idle",
    released: COMPOSITE_RELEASED.has(act),
    start,
    reset,
    wiring,
  };
}

export function ReelReveal({
  stage,
  tiles,
  reelProps,
  eventName,
  onShare,
  onDismiss,
  sharing = false,
}: {
  stage: ReelRevealStage;
  /** The curated tiles, in reel order — the flight's sources' visual twins. */
  tiles: RevealTile[];
  reelProps: ReelProps;
  eventName: string;
  /** "Share with guests" on the settled card (the same action the Studio calls). */
  onShare: () => void;
  /** "Not yet" — leave the reel a draft and clear the stage. */
  onDismiss: () => void;
  sharing?: boolean;
}) {
  const { act, released, wiring } = stage;
  const reduced = usePrefersReducedMotion();
  const shareRef = useRef<HTMLButtonElement | null>(null);

  // The portal: a full-viewport theater must not inherit a transformed ancestor
  // (`position: fixed` is CONTAINED by one, which would break both the coverage
  // and the FLIP's viewport coordinates) and must out-stack the feed's floating
  // action bar. Both are free at document.body.
  //
  // useSyncExternalStore (not a mounted flag in an effect) is how you read a
  // client-only value without a hydration mismatch: React uses the SERVER
  // snapshot for the hydrating render, then swaps to the client one right after
  // — which is still long before any tap, so the flying copies are mounted when
  // it matters. Rendering the portal on the first client render instead would
  // hydrate children into a container the server never wrote.
  const portalEl = useSyncExternalStore(
    subscribeNever,
    getPortalHost,
    getNoPortalHost,
  );

  // Scroll-lock the page for the whole run: the reveal owns the viewport, and a
  // stray scroll mid-flight would slide the FLIP's destination out from under it.
  useEffect(() => {
    if (act === "idle") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [act]);

  // The settled card is a real decision, so give it the keyboard: focus its
  // primary action as it lands (preventScroll — the page underneath must not
  // jump while the stage still covers it).
  useEffect(() => {
    if (act === "settled") shareRef.current?.focus({ preventScroll: true });
  }, [act]);

  // The screen's footprint: the player caps its own WIDTH (360 portrait / 640
  // landscape) but not its height, so on a short window a 9:16 canvas would
  // overflow. Cap the box by the viewport too — width = height x aspect, in dvh
  // (never vh: mobile browser chrome makes vh taller than the visible area).
  const landscape = reelProps.orientation === "landscape";
  const screenWidth = landscape
    ? "max-w-[min(640px,149dvh)]"
    : "max-w-[min(360px,47dvh)]";
  const screenAspect = landscape ? "aspect-[16/9]" : "aspect-[9/16]";

  if (!portalEl) return null;

  return createPortal(
    <div
      ref={(el) => wiring.setStage(el)}
      data-rvl-stage
      data-rvl-composite
      data-act={act}
      // dvh, not vh, and inset-x-0 + top-0 rather than inset-0 so the explicit
      // height is never over-constrained by a `bottom`.
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden",
        // Idle it is fully transparent (every layer rests at opacity 0), but a
        // fixed full-viewport box still hit-tests, so it MUST not eat taps
        // aimed at the feed underneath.
        act === "idle" && "pointer-events-none",
      )}
    >
      {/* The cinema dark. */}
      <div
        data-rvl-veil
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
      />

      {/* The flying copies: ALWAYS mounted so their first transform is a
          TRANSITION and not an initial state. Positioned only by the FLIP
          measure (see useReelReveal.start). They deliberately carry no size at
          idle: they render at intrinsic size (invisible, the layer rests at
          opacity 0) which keeps them DECODED and ready, and the srcs are the
          very preview URLs the builder's grid is already showing, so being
          mounted early costs no extra request. */}
      <div
        data-rvl-grid
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
      >
        {tiles.map(({ id, src }, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={id}
            ref={(el) => wiring.setFlyTile(el, i)}
            data-rvl-tile
            src={src}
            alt=""
            className="absolute top-0 left-0 rounded-[var(--radius-tile)] object-cover"
          />
        ))}
      </div>

      {/* The screen: born under the flash at the stack's footprint (the ratified
          from-scale), it expands to its full frame on `open` with the reel
          already breathing. */}
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 z-30 mx-auto w-full -translate-y-1/2 px-2",
          screenWidth,
          // Hit-testing ignores opacity: while the screen is unreleased it must
          // not swallow real taps aimed at what is underneath.
          !released && "pointer-events-none",
        )}
      >
        {/* screenBoxRef sits on the UNTRANSFORMED parent on purpose: its rect is
            the screen's FULL footprint, while [data-rvl-screen] below is the
            element the CSS scales. Measuring the scaled node would feed the FLIP
            a 55%-of-target width and the flash would cover a size MISMATCH. */}
        <div ref={(el) => wiring.setScreenBox(el)} className="w-full">
          <div
            data-rvl-screen
            style={
              {
                "--rvl-screen-from": `scale(${REVEAL_FROM_SCALE})`,
              } as React.CSSProperties
            }
          >
            <CanvasReelPlayer
              reelProps={reelProps}
              frame={released ? undefined : 0}
              // Reduced motion never auto-plays, so hand it the controls: the
              // reel arrives paused on frame 0 and play is one tap away.
              showControls={released && reduced}
            />
          </div>
        </div>
      </div>

      {/* The camera flash: a WHITE bloom centered on the stack. It peaks fast and
          decays soft, so it reads as a shutter, never a full-white cut. */}
      <div
        data-rvl-flash
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,oklch(0.99_0_0)_0%,oklch(0.99_0_0_/_0.5)_32%,transparent_70%)] opacity-0"
      />

      {/* The title beat, glued to the SCREEN's geometry (not the viewport's) so
          the scrim and the name always sit over the canvas's lower third at any
          window size. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 z-30 mx-auto w-full -translate-y-1/2 px-2",
          screenWidth,
        )}
      >
        <div className={cn("relative w-full", screenAspect)}>
          <div
            data-rvl-scrim
            className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
          />
          <div
            data-rvl-title
            className="absolute inset-x-0 top-[68%] px-6 text-center"
          >
            <p className="text-label font-medium text-white/70 uppercase">
              The reel
            </p>
            {/* The title card names the event: the `page` step, like every
                other event title (the guest overlay's card matches it). */}
            <p className="mt-1 font-heading text-page text-white">
              {eventName}
            </p>
          </div>
        </div>
      </div>

      {/* The settled furniture IS the share prompt: the narrative's next line,
          not a toolbar. Its rest state is opacity-0 but still hit-testable AND
          focusable, so gate BOTH until settled or an invisible "Share with
          guests" sits over the feed and steals real taps (a verify catch). */}
      <div
        data-rvl-end
        inert={act !== "settled" || undefined}
        className={cn(
          "absolute inset-x-0 bottom-5 z-40 mx-auto max-w-md px-6",
          act !== "settled" && "pointer-events-none",
        )}
      >
        <div className="rounded-lg bg-white/95 p-3 shadow-layer">
          <p className="text-sm font-semibold text-zinc-900">
            Your reel is ready
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Share it with your guests?
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              ref={shareRef}
              type="button"
              onClick={onShare}
              disabled={sharing}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 active:scale-[0.98] disabled:opacity-70 motion-reduce:active:scale-100"
            >
              <Share2 className="size-4" />
              {sharing ? "Sharing…" : "Share with guests"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="h-10 shrink-0 rounded-[var(--radius-action)] border border-zinc-200 px-3.5 text-sm font-medium text-zinc-600 transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              Not yet
            </button>
          </div>
        </div>
      </div>
    </div>,
    portalEl,
  );
}
