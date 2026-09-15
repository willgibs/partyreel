"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * THE STAGE BITS every scene shares (extracted at round four, when the
 * direction scenes joined the primitive scenes and both needed the same three
 * things). Nothing here is a candidate: it is the content a floating layer
 * sits over, the replay hook the board fires at a frame, and the one-frame
 * delay the nav viewport needs to measure itself.
 */

/** The content a floating layer sits over. Bible 10 turns on the words "a layer
 *  over content", so no scene judges a panel against an empty ground: these are
 *  the real event photographs the marketing pages use. */
const PHOTOS = [
  "/marketing/img/mkt-wedding-toast-01.jpg",
  "/marketing/img/mkt-party-dj-01.jpg",
  "/marketing/img/mkt-festival-lights-01.jpg",
  "/marketing/img/mkt-wedding-petals-01.jpg",
  "/marketing/img/mkt-reception-table-01.jpg",
  "/marketing/img/mkt-concert-confetti-01.jpg",
  "/marketing/img/mkt-party-balloons-01.jpg",
  "/marketing/img/mkt-wedding-golden-01.jpg",
  "/marketing/img/mkt-festival-crowd-01.jpg",
];

export function Backdrop({
  phone,
  variant = "photos",
  chrome = true,
}: {
  phone: boolean;
  /** `calm` is for the corner work only: a 6px corner against a 12px one is
   *  read at the corner itself, and a busy photograph behind it hides the very
   *  thing being judged. Every other scene keeps the photographs, because that
   *  is the condition bible 10 is written for. */
  variant?: "photos" | "calm";
  chrome?: boolean;
}) {
  const cols = phone ? 3 : 6;
  return (
    <div className="absolute inset-0 flex flex-col">
      {chrome ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">Ana and Theo</p>
          <p className="text-xs text-muted-foreground">218 photos</p>
        </div>
      ) : null}
      {variant === "calm" ? (
        <div className="min-h-0 flex-1 bg-background" />
      ) : (
        <div
          className="grid min-h-0 flex-1 content-start"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: "var(--gap-gallery)",
            padding: "var(--gap-gallery)",
          }}
        >
          {Array.from({ length: cols * 8 }).map((_, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden bg-muted"
              style={{ borderRadius: "var(--radius-tile)" }}
            >
              {/* Eager, against the usual instinct. Every frame on this board
                  is an iframe, and a browser defers a LAZY image inside an
                  iframe that is off the parent's screen: scrolling down the
                  board met empty grids that filled a beat later, which is the
                  worst possible thing to happen to a comparison. The cost is
                  nothing: nine files, one optimized URL each, shared by all
                  nineteen frames through the HTTP cache. */}
              <Image
                src={PHOTOS[i % PHOTOS.length]}
                alt=""
                fill
                sizes="200px"
                loading="eager"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Closes every held-open panel and re-opens it a frame later, so an entrance
 *  can be replayed without hunting for triggers. The parent board fires
 *  `flt:replay` straight at this window: same origin, no postMessage dance. */
export function useReplay(initial = true) {
  const [on, setOn] = useState(initial);
  useEffect(() => {
    const replay = () => {
      setOn(false);
      // A timer, not requestAnimationFrame: rAF does not fire while the tab is
      // in the background, and a board with several frames is exactly where a
      // panel would sit half-replayed on a tab nobody is looking at. Long
      // enough for radix to unmount the panel and the browser to paint the
      // closed state before the entrance starts again.
      window.setTimeout(() => setOn(true), 60);
    };
    window.addEventListener("flt:replay", replay);
    return () => window.removeEventListener("flt:replay", replay);
  }, []);
  return on;
}

/** Mirrors a flag one frame late. The nav viewport sizes itself from a
 *  ResizeObserver that radix only runs across a real open TRANSITION: a Root
 *  mounted already-open never measures, and the panel sits at 0x0 forever (the
 *  primitive's own comment describes the one-frame version of this). Every other
 *  panel is happy to be born open. */
export function useNextFrame(on: boolean): boolean {
  // `ticked` only ever goes forward; the flag reads `on && ticked`, so a replay
  // closes the panel the moment `on` drops without a second state write.
  const [ticked, setTicked] = useState(false);
  useEffect(() => {
    if (!on) return;
    const id = window.setTimeout(() => setTicked(true), 32);
    return () => window.clearTimeout(id);
  }, [on]);
  return on && ticked;
}

