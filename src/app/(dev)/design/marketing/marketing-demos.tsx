"use client";

import { lazy, Suspense, useRef, useState, type CSSProperties } from "react";

import { ConfettiBurst } from "@/components/marketing/sections/shared/confetti-burst";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Reveal } from "@/components/marketing/system/reveal";
import { StatBand } from "@/components/marketing/system/stat-band";
import { Button } from "@/components/ui/button";

import { LIBRARY_STATS } from "../reference/marketing-sample-data";

/**
 * The interactive corner of the marketing library: the specimens whose whole
 * point is an entrance or a beat, so they need a Replay, a Fire, or an Open.
 * Re-mounting by key is the honest replay (the components arm on mount, as
 * they do in production); nothing here is a copy of a component.
 */

const SampleReelOverlay = lazy(
  () =>
    import("@/components/marketing/sections/shared/sample-reel-overlay.lazy"),
);

function useRun() {
  const [run, setRun] = useState(0);
  return { run, replay: () => setRun((n) => n + 1) };
}

/** Reveal: three staggered lines behind the observer, replayed by re-mount. */
export function RevealDemo() {
  const { run, replay } = useRun();
  return (
    <div className="space-y-3">
      <Reveal key={run} className="space-y-2">
        {[
          "Every phone in the room",
          "feeds one album,",
          "and the album is yours.",
        ].map((line, i) => (
          <p
            key={line}
            data-mkt-reveal
            style={{ "--i": i } as CSSProperties}
            className="text-lg font-medium"
          >
            {line}
          </p>
        ))}
      </Reveal>
      <Button variant="outline" size="sm" onClick={replay}>
        Replay
      </Button>
    </div>
  );
}

/** TextsReveal: the class-keyed sibling of Reveal (.mkt-lines / .mkt-line). */
export function TextsRevealDemo() {
  const { run, replay } = useRun();
  return (
    <div className="space-y-3">
      <TextsReveal key={run} className="space-y-1">
        {["One scan.", "No app.", "Everything in one place."].map((line, i) => (
          <p
            key={line}
            className="mkt-line text-lg font-medium"
            style={{ "--i": i } as CSSProperties}
          >
            {line}
          </p>
        ))}
      </TextsReveal>
      <Button variant="outline" size="sm" onClick={replay}>
        Replay
      </Button>
    </div>
  );
}

/** StatBand in both animations; the final digits always server-render. */
export function StatBandDemo({ animate }: { animate: "spin" | "pop" }) {
  const { run, replay } = useRun();
  return (
    <div className="space-y-4">
      <StatBand key={run} stats={LIBRARY_STATS} animate={animate} />
      <Button variant="outline" size="sm" onClick={replay}>
        Replay {animate}
      </Button>
    </div>
  );
}

/** ConfettiBurst on a relative stage, colliding with the pill it celebrates. */
export function ConfettiDemo() {
  const [fire, setFire] = useState(0);
  const targetRef = useRef<HTMLDivElement | null>(null);
  return (
    <div className="space-y-3">
      <div className="relative flex h-40 items-end justify-center overflow-hidden rounded-lg bg-gallery pb-6">
        <ConfettiBurst fire={fire} targetRef={targetRef} />
        <div
          ref={targetRef}
          className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background"
        >
          Reel ready
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => setFire((n) => n + 1)}>
        Fire
      </Button>
    </div>
  );
}

/** The sample reel overlay, loaded lazily the way the hero loads it. */
export function OverlayDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open the sample reel
      </Button>
      {open && (
        <Suspense fallback={null}>
          <SampleReelOverlay onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
