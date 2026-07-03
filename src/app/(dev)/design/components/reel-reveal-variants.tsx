"use client";

import { Clapperboard } from "lucide-react";
import { useRef } from "react";

import { CanvasReelPlayer } from "@/lib/reel/engine/player";

import { usePrefersReducedMotion } from "./marketing-lab-shared";
import {
  CreateReelButton,
  EndRow,
  EVENT_NAME,
  MockGrid,
  MockHeader,
  REVEAL_THUMBS,
  StageFooter,
  useFixtureReelProps,
  useRevealActs,
} from "./reel-reveal-shared";
import { PhoneShell } from "../screens/phone-shell";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: the reel REVEAL MOMENT. The beat where a host who just tapped
 * Create reel watches their reel exist for the first time. This is the North
 * Star "wow" and a RARE moment, so by animate-by-frequency it is allowed real
 * delight (the arrival choreography's sibling on the host side).
 *
 * Three directions with genuinely different emotional shapes, each a working
 * choreography around the REAL CanvasReelPlayer (held at frame 0, released at
 * its ignite beat, so motion starts with zero swap):
 *   1 Lights down       hush > bloom          (the cinema premiere)
 *   2 Assembly          gather > spark        (the making-of made visible)
 *   3 First frame held  memory > motion       (photo becomes cinema)
 *
 * All motion is CSS under the [data-rvl-*] hooks in design.css; the stages are
 * phone-framed because the composer is used on phones. Reduced motion jumps to
 * the settled act (fade only, reel paused on frame 0, play one tap away).
 */
export function ReelRevealVariants() {
  return (
    <div className="py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Tap Create reel inside each phone to play its choreography (Replay
        re-runs it after the composer re-enters). The reel is the real canvas
        engine playing the fixture cut: each direction holds it on its first
        frame and releases it at the ignite beat, which is exactly what
        client-side encode makes honest, the reel exists the moment the button
        is tapped.
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <Variant
          n={1}
          name="Lights down"
          rationale="The cinema premiere: the composer dims to a dark stage, a held beat, then the reel blooms in with a title card. Hush, then bloom."
          framed={false}
        >
          <LightsDownStage />
        </Variant>
        <Variant
          n={2}
          name="Assembly"
          rationale="The making-of made visible: the curated tiles fly from the grid into the frame, square up, and ignite into the playing reel. Gather, then spark."
          framed={false}
        >
          <AssemblyStage />
        </Variant>
        <Variant
          n={3}
          name="First frame held"
          rationale="Photo becomes cinema: the cover appears as a still print, develops, holds a breath, then starts moving as the mat falls away. Memory, then motion."
          framed={false}
        >
          <FirstFrameStage />
        </Variant>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Lights down
// ---------------------------------------------------------------------------

type LightsAct = "dimming" | "held" | "bloom" | "title" | "settled";

const LIGHTS_SCRIPT: { act: LightsAct; holdMs: number }[] = [
  { act: "dimming", holdMs: 480 },
  // The held beat matches the ratified arrival-beat class (700ms): the same
  // product breathes the same way before its rare moments.
  { act: "held", holdMs: 700 },
  { act: "bloom", holdMs: 680 },
  { act: "title", holdMs: 1700 },
  { act: "settled", holdMs: 0 },
];

const LIGHTS_RELEASED = new Set<LightsAct | "idle">([
  "bloom",
  "title",
  "settled",
]);

function LightsDownStage() {
  const reelProps = useFixtureReelProps();
  const { act, run, replay, running } = useRevealActs(LIGHTS_SCRIPT);
  const released = LIGHTS_RELEASED.has(act);
  const reduced = usePrefersReducedMotion();

  return (
    <div>
      <PhoneShell>
        <div
          data-rvl-stage
          data-act={act}
          className="absolute inset-0 overflow-hidden bg-background"
        >
          {/* The composer mock (the pre-state the reveal leaves behind). */}
          <div
            data-rvl-chrome
            className="absolute inset-0 z-0 flex flex-col gap-3 p-4 pt-9"
          >
            <MockHeader />
            <MockGrid />
            <div className="mt-auto">
              <CreateReelButton onClick={run} disabled={running} />
            </div>
          </div>

          {/* The cinema veil: the lights going down. */}
          <div
            data-rvl-veil
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
          />

          {/* The held-beat cue: one quiet breath, no progress theater. */}
          <div
            data-rvl-cue
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          >
            <Clapperboard className="size-6 text-reel" />
          </div>

          {/* The screen: the real reel, held at frame 0 until the bloom. */}
          <div className="absolute inset-x-[4%] top-1/2 z-30 -translate-y-1/2">
            <div
              data-rvl-screen
              style={
                {
                  "--rvl-screen-from": "scale(0.94)",
                  "--rvl-screen-blur": "blur(10px)",
                } as React.CSSProperties
              }
            >
              <CanvasReelPlayer
                reelProps={reelProps}
                frame={released ? undefined : 0}
                showControls={released && reduced}
              />
            </div>
          </div>

          {/* The title beat over the lower third (a scrim keeps it legible). */}
          <div
            data-rvl-scrim
            aria-hidden
            className="pointer-events-none absolute inset-x-[4%] top-1/2 z-30 aspect-[9/16] -translate-y-1/2 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
          />
          <div
            data-rvl-title
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-[68%] z-40 px-6 text-center"
          >
            <p className="text-[9px] font-medium tracking-[0.24em] text-white/70 uppercase">
              The reel
            </p>
            <p
              data-dir-display
              className="mt-1 text-xl leading-tight text-white"
            >
              {EVENT_NAME}
            </p>
          </div>

          <EndRow />
        </div>
      </PhoneShell>
      <StageFooter
        onReplay={replay}
        running={running}
        guestNote="A guest already enters through the arrival choreography, so lights-down rides the same grammar one layer deeper: the album header offers Watch the reel, the album dims to the same cinema stage, the held beat drops to the 350ms return-visit class, and the title card names the event for someone who was there. The bloom itself is identical: the reel is the star for both audiences."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2 · Assembly
// ---------------------------------------------------------------------------

type AssemblyAct = "gather" | "condense" | "ignite" | "open" | "settled";

const ASSEMBLY_SCRIPT: { act: AssemblyAct; holdMs: number }[] = [
  { act: "gather", holdMs: 980 },
  { act: "condense", holdMs: 360 },
  { act: "ignite", holdMs: 360 },
  { act: "open", holdMs: 620 },
  { act: "settled", holdMs: 0 },
];

const ASSEMBLY_RELEASED = new Set<AssemblyAct | "idle">([
  "ignite",
  "open",
  "settled",
]);

// A seeded-feeling scatter (fixed per index so replays square up identically:
// determinism is the house reel rule).
const SCATTER_DEG = [-6, 4, -2, 7, -5, 2, -8, 5];

function AssemblyStage() {
  const reelProps = useFixtureReelProps();
  const { act, run, replay, running } = useRevealActs(ASSEMBLY_SCRIPT);
  const released = ASSEMBLY_RELEASED.has(act);
  const reduced = usePrefersReducedMotion();

  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const frameRef = useRef<HTMLDivElement | null>(null);

  // The FLIP measure: at rest, aim every tile at the ghost frame's center and
  // size it to the frame's width. Runs on the trigger (the DOM is at the idle
  // layout), writes per-tile vars, then the act flip plays the CSS transition.
  const gatherAndRun = () => {
    const target = frameRef.current?.getBoundingClientRect();
    if (target) {
      const cx = target.left + target.width / 2;
      const cy = target.top + target.height / 2;
      tileRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--dx", `${cx - (r.left + r.width / 2)}px`);
        el.style.setProperty("--dy", `${cy - (r.top + r.height / 2)}px`);
        el.style.setProperty("--s", `${target.width / r.width}`);
        el.style.setProperty(
          "--r",
          `${SCATTER_DEG[i % SCATTER_DEG.length]}deg`,
        );
        el.style.setProperty("--i", `${i}`);
      });
    }
    run();
  };

  return (
    <div>
      <PhoneShell>
        <div
          data-rvl-stage
          data-act={act}
          className="absolute inset-0 overflow-hidden bg-background"
        >
          {/* Header + trigger leave first; the grid stays: the tiles ARE the show. */}
          <div
            data-rvl-chrome
            className="absolute inset-0 z-0 flex flex-col p-4 pt-9"
          >
            <MockHeader />
            <div className="mt-auto">
              <CreateReelButton onClick={gatherAndRun} disabled={running} />
            </div>
          </div>

          <div
            data-rvl-veil
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
          />

          {/* The ghost frame: where the reel will land (the flight target). */}
          <div
            ref={frameRef}
            data-rvl-frame
            aria-hidden
            className="pointer-events-none absolute top-[13%] left-1/2 z-20 flex aspect-[9/16] w-[55%] -translate-x-1/2 items-center justify-center rounded-lg border border-dashed border-border"
          >
            <Clapperboard className="size-5 text-muted-foreground/50" />
          </div>

          {/* The curated grid: each tile flies to the frame on gather. */}
          <div
            data-rvl-grid
            aria-hidden
            className="absolute inset-x-4 top-[62%] z-20 grid grid-cols-4 gap-[3px]"
          >
            {REVEAL_THUMBS.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                data-rvl-tile
                src={src}
                alt=""
                className="aspect-[4/5] w-full rounded-[3px] object-cover"
              />
            ))}
          </div>

          {/* The ignite flash: the spark that turns the stack into the reel. */}
          <div
            data-rvl-flash
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_38%,oklch(0.98_0.02_300)_0%,oklch(0.62_0.2_300_/_0.35)_38%,transparent_70%)] opacity-0"
          />

          {/* The screen, born at the stack's footprint, opening to full bleed.
              translateY(-16.6%) scale(0.6) parks its VISUAL box exactly on the
              ghost frame (all geometry is aspect-locked, so the percentages
              hold at any stage width). */}
          <div className="absolute inset-x-[4%] top-1/2 z-30 -translate-y-1/2">
            <div
              data-rvl-screen
              style={
                {
                  "--rvl-screen-from": "translateY(-16.6%) scale(0.6)",
                  "--rvl-screen-ease": "var(--ease-in-out-strong)",
                } as React.CSSProperties
              }
            >
              <CanvasReelPlayer
                reelProps={reelProps}
                frame={released ? undefined : 0}
                showControls={released && reduced}
              />
            </div>
          </div>

          <EndRow />
        </div>
      </PhoneShell>
      <StageFooter
        onReplay={replay}
        running={running}
        guestNote="Assembly is host-emotional (their own curation flying together), so the guest cut sources the flight from the album grid the guest was just scrolling: the first visible photos gather into the frame, which doubles as social proof that this reel is made of this album. Fewer tiles and a shorter stagger keep it quick, it plays on the first visit only, and replays skip straight to the reel."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3 · First frame held
// ---------------------------------------------------------------------------

type FirstFrameAct = "print" | "held" | "breath" | "settled";

const FIRST_FRAME_SCRIPT: { act: FirstFrameAct; holdMs: number }[] = [
  { act: "print", holdMs: 1500 },
  { act: "held", holdMs: 850 },
  { act: "breath", holdMs: 720 },
  { act: "settled", holdMs: 0 },
];

const FIRST_FRAME_RELEASED = new Set<FirstFrameAct | "idle">([
  "breath",
  "settled",
]);

function FirstFrameStage() {
  const reelProps = useFixtureReelProps();
  const { act, run, replay, running } = useRevealActs(FIRST_FRAME_SCRIPT);
  const released = FIRST_FRAME_RELEASED.has(act);
  const reduced = usePrefersReducedMotion();

  return (
    <div>
      <PhoneShell>
        <div
          data-rvl-stage
          data-act={act}
          className="absolute inset-0 overflow-hidden bg-background"
        >
          <div
            data-rvl-chrome
            className="absolute inset-0 z-0 flex flex-col gap-3 p-4 pt-9"
          >
            <MockHeader />
            <MockGrid />
            <div className="mt-auto">
              <CreateReelButton onClick={run} disabled={running} />
            </div>
          </div>

          <div
            data-rvl-veil
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
          />

          {/* The print: the REAL first frame on canvas, matted like a photo
              print. On breath the mat falls away, the tilt squares up, and the
              same canvas simply starts ticking (zero swap by construction). */}
          <div className="absolute inset-x-[12%] top-1/2 z-30 -translate-y-1/2">
            <div
              data-rvl-print
              style={{ "--rvl-breath": "1.316" } as React.CSSProperties}
            >
              {/* The mat: white backing with the print's bottom band. */}
              <div
                data-rvl-mat
                aria-hidden
                className="absolute -inset-x-2 -top-2 -bottom-10 rounded-[2px] bg-white shadow-[0_18px_44px_-18px_rgba(0,0,0,0.55)]"
              />
              <div data-rvl-develop className="relative">
                <CanvasReelPlayer
                  reelProps={reelProps}
                  frame={released ? undefined : 0}
                  showControls={released && reduced}
                />
              </div>
              <p
                data-rvl-caption
                aria-hidden
                className="absolute inset-x-0 -bottom-8 text-center font-heading text-[11px] tracking-wide text-zinc-800"
              >
                {EVENT_NAME}
              </p>
            </div>
          </div>

          <EndRow />
        </div>
      </PhoneShell>
      <StageFooter
        onReplay={replay}
        running={running}
        guestNote="First frame held translates one to one: the cover print rises over the album with the event name on the mat (an invitation-card feel), holds a shorter beat, then takes breath. It is the naturally guest-safe direction because it never references curation, and the print motif can become the reel's share and OG image so the moment on /e/ matches the link preview the guest just tapped."
      />
    </div>
  );
}
