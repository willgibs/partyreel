"use client";

import { Clapperboard, Download, RotateCcw, Share2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { resolveTheme } from "@/lib/reel/engine/themes";
import { cn } from "@/lib/utils";

import { usePrefersReducedMotion } from "./marketing-lab-shared";

/**
 * Shared plumbing for the reel REVEAL-MOMENT round (lab-local, 2026-07-03).
 *
 * The substrate is the real CanvasReelPlayer on the /design fixtures: each
 * direction mounts the player up front HELD at frame 0 (the controlled-frame
 * prop, no clock), then "releases" it at its ignite beat so the reel starts
 * moving with ZERO swap. That mirrors the client-encode reality the round is
 * designed for: the reel exists the moment the host taps Create reel, so the
 * choreography is pure honest theater around a real playing reel (no fake
 * progress, nothing to wait on).
 *
 * Choreography = a tiny act machine (`useRevealActs`): a script of named acts
 * with hold times flips `data-act` on the stage root; ALL motion lives in
 * design.css under [data-rvl-*] hooks (final states outside the media queries,
 * transitions inside no-preference, the marketing-round convention). Reduced
 * motion jumps straight to the settled act: a fade, the reel paused on frame 0,
 * play one tap away (the player's own honest reduced-motion behavior).
 */

// LOCAL fixtures on purpose (the parity-harness lesson): a cross-origin host
// without CORS taints the canvas. Mixed aspects so the cinematic fit/cover
// framing shows; p12 is portrait and covers the 9:16 frame.
const FIXTURES: { src: string; w: number; h: number }[] = [
  { src: "/design/p12.jpg", w: 700, h: 1050 },
  { src: "/design/p01.jpg", w: 900, h: 600 },
  { src: "/design/p02.jpg", w: 900, h: 601 },
  { src: "/design/p03.jpg", w: 900, h: 600 },
  { src: "/design/p04.jpg", w: 800, h: 534 },
  { src: "/design/p05.jpg", w: 900, h: 600 },
  { src: "/design/p06.jpg", w: 900, h: 601 },
  { src: "/design/p07.jpg", w: 900, h: 600 },
];

/** The thumbnails the mock composer grid shows (the "curated set"). */
export const REVEAL_THUMBS = FIXTURES.map((f) => f.src);

/** The event every stage premieres (the brief's sample host). */
export const EVENT_NAME = "The Johnson Wedding";

/** One fixture reel for all three stages: Cinematic (the one ported engine
 *  style), portrait (the composer default; these stages are phones). */
export function useFixtureReelProps(): ReelProps {
  return useMemo(
    () => ({
      clips: FIXTURES.map(({ src, w, h }) => ({
        url: src,
        type: "photo" as const,
        width: w,
        height: h,
      })),
      theme: resolveTheme("classic"),
      seed: 73,
      styleId: "classic",
      orientation: "portrait" as const,
      posterMode: true,
      watermark: false,
    }),
    [],
  );
}

// ---------------------------------------------------------------------------
// The act machine
// ---------------------------------------------------------------------------

export type ActScript<A extends string> = { act: A; holdMs: number }[];

/**
 * Advance through a script of acts ("idle" is implicit rest). run() plays the
 * script; reset() returns to idle (and stops timers); replay() resets, lets the
 * pre-state re-enter, then runs.
 *
 * The script may be a FACTORY, resolved fresh on every run: the composite
 * builds its beats from the --tune-rvl-* vars via readCssMs (never a static
 * snapshot), so a motion-tuner drag retimes the very next replay.
 *
 * Reduced motion jumps straight to the FINAL act (the honest fallback: arrival
 * without theater) UNLESS the direction hands in a dedicated `reducedScript`;
 * that one PLAYS (the reduce CSS renders every act as a plain fade), keeping
 * the narrative order without the movement.
 */
export function useRevealActs<A extends string>(
  script: ActScript<A> | (() => ActScript<A>),
  reducedScript?: ActScript<A>,
) {
  const [act, setAct] = useState<A | "idle">("idle");
  const timers = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const play = (steps: ActScript<A>) => {
    let at = 0;
    steps.forEach((step, i) => {
      if (i === 0) setAct(step.act);
      else timers.current.push(window.setTimeout(() => setAct(step.act), at));
      at += step.holdMs;
    });
  };

  const run = () => {
    clear();
    if (reduced) {
      if (reducedScript) play(reducedScript);
      else {
        const steps = typeof script === "function" ? script() : script;
        setAct(steps[steps.length - 1].act);
      }
      return;
    }
    play(typeof script === "function" ? script() : script);
  };

  const reset = () => {
    clear();
    setAct("idle");
  };

  // The breather before a replay matters: the pre-state (the composer mock)
  // re-enters first, so the reveal is judged from its real starting point.
  const replay = () => {
    reset();
    timers.current.push(window.setTimeout(run, 700));
  };

  return { act, run, reset, replay, running: act !== "idle" };
}

// ---------------------------------------------------------------------------
// The mock composer chrome (the pre-state every direction starts from)
// ---------------------------------------------------------------------------

/** The composer mock's header: the event eyebrow + the reel heading. */
export function MockHeader() {
  return (
    <div aria-hidden>
      <p className="text-[9px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {EVENT_NAME}
      </p>
      <p data-dir-display className="mt-0.5 text-lg leading-tight">
        Your reel
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        8 moments, in your order
      </p>
    </div>
  );
}

/** The curated uniform grid (the production reel grid's 4/5 tiles). D2 renders
 *  its own copy with refs (its tiles fly); D1/D3 use this static one. */
export function MockGrid({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("grid grid-cols-4 gap-[3px]", className)}>
      {REVEAL_THUMBS.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="aspect-[4/5] w-full rounded-[3px] object-cover"
        />
      ))}
    </div>
  );
}

/** The trigger: the moment this whole round is about. */
export function CreateReelButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      data-dir-press
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white disabled:opacity-50"
    >
      <Clapperboard className="size-4" />
      Create reel
    </button>
  );
}

/** The post-reveal furniture: what production would offer once the reel is
 *  born. Decorative in the lab (the mp4 encode is not this round's subject). */
export function EndRow() {
  return (
    <div
      data-rvl-end
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex items-center justify-center gap-2"
    >
      <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-reel px-3 text-xs font-medium text-white">
        <Download className="size-3.5" />
        Save video
      </span>
      <span className="flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/25 px-3 text-xs font-medium text-white/85">
        <Share2 className="size-3.5" />
        Share
      </span>
    </div>
  );
}

/** The replay control under each phone + the guest-variant sketch. */
export function StageFooter({
  onReplay,
  running,
  guestNote,
}: {
  onReplay: () => void;
  running: boolean;
  guestNote: string;
}) {
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onReplay}
        disabled={!running}
        className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
      >
        <RotateCcw className="size-3" />
        Replay the reveal
      </button>
      <p className="mt-3 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        On /e/, for guests
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {guestNote}
      </p>
    </div>
  );
}
