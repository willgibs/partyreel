"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { GroundBox, ReplayButton, useReplay } from "@/components/lab";
import { Glow } from "@/components/shared/glow";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { StageOnly, TileOnly, TrueFit, useArmed } from "./fit";

/**
 * THE ONE MOMENT OF LIGHT STILL OPEN, AND IT RUNS (round eight).
 *
 * Three moments were drawn here. Will finished round seven's walk on the alias
 * while this round was on the tree and ruled two of them on their old cards
 * (2026-09-17): the bloom is kept, and the halo is kept "only to light objects
 * from behind", never as a button wrapper. Both left with their specimens; the
 * streak is the one he sent back, so it is the one that stays.
 *
 * Will's note on the sweep ended his second sitting on this board: "I see the
 * static gray edge ring, but can't get the animation to play, even by clicking
 * replay. Stopping here." It was three bugs, found live before anything was
 * redrawn, and the same three were waiting on the cards he never reached:
 *
 * 1. ★ THE LIGHT WAS BEHIND AN OPAQUE OBJECT THE SAME SIZE AS ITSELF. The
 *    sweep's host was `absolute inset-0` on the reel frame and came BEFORE the
 *    frame in the markup, so the frame (an opaque card) painted over all of it
 *    and `[data-glw]`'s own `overflow: hidden` kept any of it from escaping.
 *    Measured: the host's rect and the frame's rect were the same four numbers,
 *    `elementFromPoint` at its centre was the frame's play icon, and the band's
 *    `mask-position` was travelling the whole time (116.7% to 99.4% in 500 ms)
 *    under it. The "static gray edge ring" he saw was the frame's own border.
 *    The halo's two button usages had the same fault (an opaque `Button` over
 *    the wash: "it reads" read as nothing at all). A mark that lands ON an
 *    object is drawn OVER it, after it in the markup, clipped to its corner.
 *
 * 2. ★ REPLAY WAS A NO-OP. `Glow` re-keys its field on `runId` only when the
 *    shape is a bloom, and the card handed `runId` to a sweep. So every mark
 *    here remounts its whole specimen, keyed on the run, and the engine's own
 *    re-key is a detail it no longer depends on.
 *
 * 3. ★ THE STORY WAS AN ARRIVAL AND THE DRAWING WAS A LOOP. The engine's sweep
 *    is `infinite` on `--glw-dur`, held paused by `useAmbientPause` off screen,
 *    on a hidden tab and under reduced motion. "An object arriving... It ends"
 *    cannot be told by a six second loop, so the board plays the engine's own
 *    two keyframes ONCE (board.css, `[data-lgt-once]`): the same layers, the
 *    same travel, one pass, armed when the specimen is actually on the screen.
 *    The engine is not edited; the Handoff says what it would need to ship this.
 *
 * ★ A TILE REPLAYS ITSELF AND THE STAGE NEVER DOES. A tile is `inert`, so
 * nobody can press Replay on it, and a one-shot that ran while the question was
 * being read is a still picture by the time it is looked at. The stage is the
 * honest one: it plays once when it is on the screen, and again on Replay.
 */

const TILE_EVERY_MS = 3600;

/**
 * The run counter, and the tile's own replay. The interval skips a turn while
 * its specimen is not displayed (the half board.css hides), so the hidden twin
 * of every picture is not remounting itself for nobody.
 */
function useRun(auto: boolean) {
  const { runId, replay } = useReplay();
  const reduced = usePrefersReducedMotion();
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!auto || reduced) return;
    const t = window.setInterval(() => {
      if (box.current?.offsetParent && !document.hidden) replay();
    }, TILE_EVERY_MS);
    return () => window.clearInterval(t);
  }, [auto, reduced, replay]);
  return { runId, replay, box };
}

/** The stage's furniture: Replay, and one line saying what it does. */
function ReplayRow({
  runId,
  onReplay,
  children,
}: {
  runId: number;
  onReplay?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {onReplay ? <ReplayButton runId={runId} onReplay={onReplay} /> : null}
      <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

/* ── The streak of light over an arriving photo (the sweep) ──────────────── */

const SWEEP_W = 560;
const PHOTO = { w: 400, h: 300 } as const;

/**
 * ONE PHOTOGRAPH LANDING IN AN ALBUM.
 *
 * ★ THE TILE IS A REAL `[data-media-tile]`, so "as today" is production's own
 * arrival to the frame: the 240 ms fade and rise every guest tile already does
 * on mount (globals.css, `@starting-style`). A remount replays it, in both
 * halves, which makes the streak the only difference between them.
 */
function SweepSpecimen({ on, auto }: { on: boolean; auto: boolean }) {
  const { runId, replay, box } = useRun(auto);
  const [armRef, armed] = useArmed(runId);
  const img = marketingImage("wedding-toast");
  return (
    <div ref={box} style={auto ? undefined : { maxWidth: SWEEP_W }}>
      <TrueFit natural={SWEEP_W}>
        <GroundBox
          ground="app-dark"
          className="flex justify-center rounded-lg py-12"
          style={{ width: SWEEP_W }}
        >
          {/* ★ THE PHOTO IS NOT MOUNTED UNTIL IT IS LOOKED AT, because the thing
            being judged is an ARRIVAL. The stage sits under the tiles, so a
            photo mounted with the page has landed (and its light has passed)
            before anybody scrolls to it. The box holds the room; the tile
            mounts when all of it is on the screen, and again on Replay. */}
          <div ref={armRef} style={{ width: PHOTO.w, height: PHOTO.h }}>
            {auto || armed ? (
              <div
                key={runId}
                data-media-tile
                className="relative isolate size-full overflow-hidden"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes={`${PHOTO.w}px`}
                  className="object-cover"
                />
                {on ? (
                  // ★ ADDITIVE, BECAUSE THIS LIGHT IS OVER A PHOTOGRAPH. The
                  // engine blends normally, which is right for a lamp BEHIND
                  // content and reads as a milky haze laid on top of it: a lit
                  // photo "looking washed out rather than lit" is the engine's
                  // own words for the symptom. The wrapper is the board's, so
                  // the blend is set here and the engine is untouched.
                  <div
                    aria-hidden
                    data-lgt-once
                    className="pointer-events-none absolute inset-0"
                    style={{ mixBlendMode: "plus-lighter" }}
                  >
                    <Glow
                      shape="sweep"
                      edge
                      runId={runId}
                      vars={{
                        // A pass leaves nothing behind: it ends, which is the
                        // whole difference between this and a lamp.
                        "--glw-base": "0",
                        "--glw-strength": "0.9",
                        "--glw-scale": "2",
                        "--glw-radius": "var(--radius-tile)",
                        "--glw-from-y": "50%",
                        "--glw-reach": "150%",
                        "--glw-blur": "22px",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </GroundBox>
      </TrueFit>
      {auto ? null : (
        <ReplayRow runId={runId} onReplay={replay}>
          {on
            ? "The photo lands, the light crosses it once, and it is gone. The small picture above repeats so you can catch it; the real one never loops."
            : "The photo fades in, as every new photo does today. Nothing else plays."}
        </ReplayRow>
      )}
    </div>
  );
}

export function SweepStage({ on }: { on: boolean }) {
  return (
    <div data-lgt-step="sweep">
      <TileOnly>
        <SweepSpecimen on={on} auto />
      </TileOnly>
      <StageOnly>
        <SweepSpecimen on={on} auto={false} />
      </StageOnly>
    </div>
  );
}
