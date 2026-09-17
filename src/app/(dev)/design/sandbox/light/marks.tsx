"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";

import { GroundBox, ReplayButton, useReplay } from "@/components/lab";
import { ReelFrame } from "@/components/marketing/frames";
import { Glow } from "@/components/shared/glow";
import { Card } from "@/components/ui/card";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { StageOnly, TileOnly, TrueFit, useArmed } from "./fit";

/**
 * THE THREE MOMENTS OF LIGHT, AND EVERY ONE OF THEM RUNS (round eight).
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
 *    `mask-position` was travelling the whole time (110% to 99% in 500 ms)
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

/* ── 1. The streak of light over an arriving photo (the sweep) ───────────── */

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
    <div ref={box}>
      <GroundBox
        ground="app-dark"
        className="flex justify-center rounded-lg py-12"
        style={{ width: SWEEP_W }}
      >
        {/* ★ THE PHOTO IS NOT MOUNTED UNTIL IT IS LOOKED AT, because the thing
            being judged is an ARRIVAL. The stage sits under the tiles, so a
            photo mounted with the page has landed (and its light has passed)
            before anybody scrolls to it. The box holds the room; the tile
            mounts when most of it is on the screen, and again on Replay. */}
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
        <TrueFit natural={SWEEP_W}>
          <SweepSpecimen on={on} auto />
        </TrueFit>
      </TileOnly>
      <StageOnly>
        <TrueFit natural={SWEEP_W} className="max-w-[560px]">
          <SweepSpecimen on={on} auto={false} />
        </TrueFit>
      </StageOnly>
    </div>
  );
}

/* ── 2. The glow that stays lit after a publish (the bloom) ──────────────── */

const BLOOM_W = 632;
const REEL_W = 440;

/**
 * THE REEL'S FRAME, AT THE MOMENT A HOST PUBLISHES.
 *
 * ★ BOTH HALVES ARE THE FIVE HOUSE COLOURS, BECAUSE THAT IS RULED. Will answered
 * the colour at round seven (`publish=house-five`: "Don't need a single stray
 * glow color"), so the shipped violet is not drawn here and nobody is asked it
 * twice. The ONE variable left is what the swell leaves behind: `--glw-base`,
 * nothing else. That is also the question the `aurora-wiring` lane is waiting
 * on for the publish moment ("whether a one-shot rests on a base or on nothing
 * is the same unruled bloom card").
 *
 * ★ THE NUMBERS ARE THE QR CARD'S, WHICH SHIPS (qr-hero.tsx): strength 0.95
 * decaying to a resting 0.34, a 26 pixel blur, a 60 percent reach on a host
 * well outside the object, so the whole falloff stays inside the box and the
 * light never ends on a straight edge.
 */
function BloomSpecimen({ rests, auto }: { rests: boolean; auto: boolean }) {
  const { runId, replay, box } = useRun(auto);
  const [armRef, armed] = useArmed(runId);
  return (
    <div ref={box}>
      <GroundBox
        ground="app-dark"
        className="overflow-hidden rounded-lg"
        style={{ width: BLOOM_W, padding: (BLOOM_W - REEL_W) / 2 }}
      >
        <div ref={armRef} className="relative isolate" style={{ width: REEL_W }}>
          {/* The frame is there from the start (it is the object); the light is
              the event, so it mounts when the frame is looked at and remounts
              on Replay. The engine arms a bloom on its own arrival, but at 35
              percent of a host this large, which is before the frame is on
              the screen. */}
          <div aria-hidden className="pointer-events-none absolute -inset-24">
            {auto || armed ? (
              <Glow
                key={runId}
                shape="bloom"
                runId={runId}
                vars={{
                  "--glw-from-x": "50%",
                  "--glw-from-y": "50%",
                  "--glw-reach": "60%",
                  "--glw-strength": "0.95",
                  "--glw-base": rests ? "0.34" : "0",
                  "--glw-blur": "26px",
                }}
              />
            ) : null}
          </div>
          <div className="relative">
            <ReelFrame />
          </div>
        </div>
      </GroundBox>
      {auto ? null : (
        <ReplayRow runId={runId} onReplay={replay}>
          {rests
            ? "The glow swells and settles to a soft light that stays. Look at the frame a second after it ends."
            : "The glow swells and fades to nothing. A second later the frame is exactly as it was."}
        </ReplayRow>
      )}
    </div>
  );
}

export function BloomStage({ rests }: { rests: boolean }) {
  return (
    <div data-lgt-step="bloom">
      <TileOnly>
        <TrueFit natural={BLOOM_W}>
          <BloomSpecimen rests={rests} auto />
        </TrueFit>
      </TileOnly>
      <StageOnly>
        <TrueFit natural={BLOOM_W} className="max-w-[632px]">
          <BloomSpecimen rests={rests} auto={false} />
        </TrueFit>
      </StageOnly>
    </div>
  );
}

/* ── 3. The glow behind a button (the halo) ──────────────────────────────── */

const HALO_W = 520;

/**
 * A BUTTON LIT FROM BEHIND, DRAWN THE WAY THE RECIPE DRAWS IT.
 *
 * ★ THE WASH LIVES ON THE PILL, UNDER THE LABEL AND OVER THE FILL. Round seven
 * wrapped a real `Button` and put the wash behind it, and a button's fill is
 * opaque: both of its usages rendered as plain buttons, and the caption under
 * one of them said "it reads". The glow-doctrine board had the structure right
 * (the pill carries the fill, the wash sits on it clipped by the pill's own
 * radius, the label is above both), so this is that, at the app's own tokens.
 */
function HaloPill({
  tone,
  lit,
  children,
}: {
  tone: "secondary" | "primary";
  lit: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "relative isolate inline-flex h-10 items-center overflow-hidden rounded-[var(--radius-action)] px-5 text-sm font-medium",
        tone === "primary"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
      style={{ "--glw-radius": "var(--radius-action)" } as CSSProperties}
    >
      {lit ? (
        <Glow
          shape="halo"
          vars={{
            "--glw-blur": "8px",
            "--glw-core": "36%",
            "--glw-strength": "0.95",
            "--glw-base": "0.8",
            "--glw-dur": "5s",
          }}
        />
      ) : null}
      <span className="relative">{children}</span>
    </span>
  );
}

function HaloSpecimen({ on, both }: { on: boolean; both: boolean }) {
  return (
    <GroundBox
      ground="app-dark"
      className="flex flex-col items-center gap-6 rounded-lg px-10 py-12"
      style={{ width: HALO_W }}
    >
      <Card className="w-full gap-0 py-0" inert aria-hidden>
        <div className="flex flex-col gap-1.5 p-5">
          <p className="text-base font-medium">Your reel is ready</p>
          <p className="text-sm text-muted-foreground">
            48 photos and 6 clips, cut to 0:48. Guests can watch it from the
            album.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <HaloPill tone="primary" lit={false}>
              Publish the reel
            </HaloPill>
            <HaloPill tone="secondary" lit={on}>
              See the album
            </HaloPill>
          </div>
        </div>
      </Card>
      {both ? (
        <div className="flex w-full flex-col items-start gap-2" inert aria-hidden>
          <HaloPill tone="primary" lit={on}>
            Publish the reel
          </HaloPill>
        </div>
      ) : null}
    </GroundBox>
  );
}

export function HaloStage({ on }: { on: boolean }) {
  return (
    <div data-lgt-step="halo">
      <TileOnly>
        <TrueFit natural={HALO_W}>
          <HaloSpecimen on={on} both={false} />
        </TrueFit>
      </TileOnly>
      <StageOnly>
        <TrueFit natural={HALO_W} className="max-w-[520px]">
          <HaloSpecimen on={on} both />
        </TrueFit>
        <p className="mt-3 max-w-xl text-[11px] leading-relaxed text-muted-foreground">
          {on
            ? "The dark button in the panel wears it. The white button under the panel wears the same glow: white cannot get brighter, so it turns pastel instead of lit."
            : "Both buttons as they ship today."}
        </p>
      </StageOnly>
    </div>
  );
}
