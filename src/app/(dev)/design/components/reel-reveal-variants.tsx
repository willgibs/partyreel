"use client";

import { Clapperboard } from "lucide-react";
import { useRef } from "react";

import { MotionTuner } from "@/components/dev/motion-tuner";
import {
  EASING_OPTIONS,
  type TunerControl,
} from "@/components/dev/motion-tuner-config";
import { CanvasReelPlayer } from "@/lib/reel/engine/player";
import { readCssMs } from "@/lib/shared/read-css-ms";

import { usePrefersReducedMotion } from "./marketing-lab-shared";
import {
  type ActScript,
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
 * V1 is the RULED COMPOSITE (Will, T1 2026-07-05; touchpoints.ts decisionNote
 * is the binding record): from the shared base state the curated tiles
 * assemble into center screen (the Assembly flight), hold, a camera flash,
 * the stack scales to full bleed from center (the First-frame-held expansion
 * feel), the Lights-down title card plays as it lands, the reel takes breath.
 * Its beats are T2-tunable: every duration is a --tune-rvl-* var read by BOTH
 * the CSS (var(..., fallback)) and the act script (readCssMs, the parseInt-
 * proof helper), and the house MotionTuner mounts on this page so a device
 * session can retime it live and Copy CSS the result.
 *
 * The three source directions stay below for reference, each a working
 * choreography around the REAL CanvasReelPlayer (held at frame 0, released at
 * its ignite beat, so motion starts with zero swap):
 *   2 Lights down       hush > bloom          (the cinema premiere)
 *   3 Assembly          gather > spark        (the making-of made visible)
 *   4 First frame held  memory > motion       (photo becomes cinema)
 *
 * All motion is CSS under the [data-rvl-*] hooks in design.css; the stages are
 * phone-framed because the composer is used on phones. Reduced motion jumps to
 * the settled act (fade only, reel paused on frame 0, play one tap away); the
 * composite instead plays a short fade-only script that keeps the narrative.
 */
export function ReelRevealVariants() {
  return (
    <div className="py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        Tap Create reel inside each phone to play its choreography (Replay
        re-runs it after the composer re-enters). The reel is the real canvas
        engine playing the fixture cut: each stage holds it on its first frame
        and releases it at its ignite beat, which is exactly what client-side
        encode makes honest, the reel exists the moment the button is tapped.
        The composite is the ruled direction; the motion tuner (bottom corner)
        retimes its beats live, and Replay plays the new values.
      </p>
      <div className="mx-auto mt-10 w-full max-w-sm">
        <Variant
          n={1}
          name="Composite (ruled)"
          rationale="The T1 composite: the curated tiles assemble into center screen, hold, a camera flash, the stack scales to full bleed, and the title card names the event as the reel takes breath. Gather, flash, bloom."
          framed={false}
        >
          <CompositeStage />
        </Variant>
      </div>
      <p className="mt-14 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        The three source directions, for reference
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-3">
        <Variant
          n={2}
          name="Lights down"
          rationale="The cinema premiere: the composer dims to a dark stage, a held beat, then the reel blooms in with a title card. Hush, then bloom."
          framed={false}
        >
          <LightsDownStage />
        </Variant>
        <Variant
          n={3}
          name="Assembly"
          rationale="The making-of made visible: the curated tiles fly from the grid into the frame, square up, and ignite into the playing reel. Gather, then spark."
          framed={false}
        >
          <AssemblyStage />
        </Variant>
        <Variant
          n={4}
          name="First frame held"
          rationale="Photo becomes cinema: the cover appears as a still print, develops, holds a breath, then starts moving as the mat falls away. Memory, then motion."
          framed={false}
        >
          <FirstFrameStage />
        </Variant>
      </div>
      {/* The T2 harness: the same design-key-gated tuner the event page uses,
          scoped to the composite's beats. Its unmount cleanup drops every
          override, so the knobs never outlive this page. */}
      <MotionTuner controls={REVEAL_TUNER_CONTROLS} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1 · Composite (ruled) - the T1 sequence on the three directions' mechanics
// ---------------------------------------------------------------------------

type CompositeAct =
  | "gather"
  | "condense"
  | "held"
  | "ignite"
  | "open"
  | "title"
  | "settled";

/**
 * The T2 knobs, ONE JS source of truth: the act script reads these as
 * readCssMs fallbacks, the tuner opens on them as defaults, and the
 * design.css var() fallbacks MUST mirror them (the motion-tuner contract:
 * the panel is a no-op until a slider moves).
 */
const TUNE_MS = {
  "--tune-rvl-fly-ms": 640, // per-tile assembly flight (Assembly's ratified 640)
  "--tune-rvl-stagger-ms": 42, // per-tile flight delay step (Assembly's 42)
  "--tune-rvl-hold-ms": 700, // the stack hold before the flash (the arrival-beat class)
  "--tune-rvl-flash-ms": 360, // the camera flash (Assembly's ignite 360)
  "--tune-rvl-expand-ms": 720, // the full-bleed expansion (First frame held's breath 720)
  "--tune-rvl-title-ms": 1700, // the title hold (Lights down's 1700)
} as const;

const tuneMs = (v: keyof typeof TUNE_MS) => readCssMs(v, TUNE_MS[v]);

const REVEAL_TUNER_CONTROLS: TunerControl[] = [
  {
    kind: "range",
    cssVar: "--tune-rvl-fly-ms",
    label: "Assembly flight",
    min: 300,
    max: 1100,
    step: 20,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-fly-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-stagger-ms",
    label: "Flight stagger",
    min: 0,
    max: 120,
    step: 6,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-stagger-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-hold-ms",
    label: "Stack hold",
    min: 0,
    max: 1600,
    step: 50,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-hold-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-flash-ms",
    label: "Camera flash",
    min: 160,
    max: 700,
    step: 20,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-flash-ms"],
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-expand-ms",
    label: "Full-bleed expansion",
    min: 300,
    max: 1400,
    step: 20,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-expand-ms"],
  },
  {
    kind: "select",
    cssVar: "--tune-rvl-expand-ease",
    label: "Expansion easing",
    options: EASING_OPTIONS,
    default: "cubic-bezier(0.77, 0, 0.175, 1)", // in-out-strong (on-screen movement)
  },
  {
    kind: "range",
    cssVar: "--tune-rvl-title-ms",
    label: "Title hold",
    min: 600,
    max: 3000,
    step: 50,
    unit: "ms",
    default: TUNE_MS["--tune-rvl-title-ms"],
  },
];

/** The screen's birth pose = the tile stack's footprint (one shared scale, so
 *  the flash covers a same-size swap): 55% of the full-bleed width, centered. */
const COMPOSITE_FROM_SCALE = 0.55;

/**
 * The beat script, built FRESH each run so a tuner drag retimes the next
 * replay. Derived holds carry small margins with reasons, not magic:
 * the gather hold covers the LAST tile's landing (flight + final stagger
 * step) plus a settle breath; the open hold ends slightly BEFORE the
 * expansion lands so the title enters "as it reaches full screen" (the
 * ruling's words), not after a dead stop.
 */
function compositeScript(): ActScript<CompositeAct> {
  const fly = tuneMs("--tune-rvl-fly-ms");
  const stagger = tuneMs("--tune-rvl-stagger-ms");
  const expand = tuneMs("--tune-rvl-expand-ms");
  return [
    { act: "gather", holdMs: fly + stagger * (REVEAL_THUMBS.length - 1) + 60 },
    { act: "condense", holdMs: 360 }, // Assembly's squaring beat (320ms move + settle)
    { act: "held", holdMs: tuneMs("--tune-rvl-hold-ms") },
    { act: "ignite", holdMs: tuneMs("--tune-rvl-flash-ms") },
    { act: "open", holdMs: Math.max(expand - 90, 120) },
    { act: "title", holdMs: tuneMs("--tune-rvl-title-ms") },
    { act: "settled", holdMs: 0 },
  ];
}

/** Reduced motion keeps the NARRATIVE as plain fades (the reduce CSS strips
 *  all transforms): the reel arrives full bleed, the title names the event,
 *  then settled with the player paused on frame 0, play one tap away. */
const COMPOSITE_REDUCED: ActScript<CompositeAct> = [
  { act: "open", holdMs: 700 },
  { act: "title", holdMs: 1600 },
  { act: "settled", holdMs: 0 },
];

// The reel starts moving at the expansion: the flash covers the stack-to-
// canvas swap on frame 0, then the First-frame-held grammar plays out (the
// still takes breath AS it scales, so full bleed arrives already alive).
const COMPOSITE_RELEASED = new Set<CompositeAct | "idle">([
  "open",
  "title",
  "settled",
]);

// Assembly's seeded scatter, reused verbatim (determinism is the house rule).
const COMPOSITE_SCATTER_DEG = [-6, 4, -2, 7, -5, 2, -8, 5];

function CompositeStage() {
  const reelProps = useFixtureReelProps();
  const { act, run, replay, running } = useRevealActs(
    compositeScript,
    COMPOSITE_REDUCED,
  );
  const released = COMPOSITE_RELEASED.has(act);
  const reduced = usePrefersReducedMotion();

  const tileRefs = useRef<(HTMLElement | null)[]>([]);
  const screenBoxRef = useRef<HTMLDivElement | null>(null);

  // The FLIP measure (Assembly's, retargeted): at rest, aim every tile at the
  // CENTER of the full-bleed screen box and size it to the screen's birth
  // width (full width x COMPOSITE_FROM_SCALE). The outer box's rect ignores
  // the inner scale transform, so it measures the full footprint.
  const gatherAndRun = () => {
    const box = screenBoxRef.current?.getBoundingClientRect();
    if (box) {
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const targetW = box.width * COMPOSITE_FROM_SCALE;
      tileRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--dx", `${cx - (r.left + r.width / 2)}px`);
        el.style.setProperty("--dy", `${cy - (r.top + r.height / 2)}px`);
        el.style.setProperty("--s", `${targetW / r.width}`);
        el.style.setProperty(
          "--r",
          `${COMPOSITE_SCATTER_DEG[i % COMPOSITE_SCATTER_DEG.length]}deg`,
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
          data-rvl-composite
          data-act={act}
          className="absolute inset-0 overflow-hidden bg-background"
        >
          {/* The composer mock, the SAME base state as every direction
              (gallery at top, no reel placeholder). Its grid slot is an
              invisible spacer: the real tiles live on the FLIP layer below so
              they survive the chrome's exit. */}
          <div
            data-rvl-chrome
            className="absolute inset-0 z-0 flex flex-col gap-3 p-4 pt-9"
          >
            <MockHeader />
            <MockGrid className="invisible" />
            <div className="mt-auto">
              <CreateReelButton onClick={gatherAndRun} disabled={running} />
            </div>
          </div>

          <div
            data-rvl-veil
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[oklch(0.09_0_0)]"
          />

          {/* The FLIP grid mirrors the chrome's flow (an invisible header
              spacer) so its tiles occupy the mock grid's exact pixels at
              idle. The whole layer is pointer-transparent: it spans the
              stage, and the Create button lives underneath it. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 flex flex-col gap-3 p-4 pt-9"
          >
            <div className="invisible">
              <MockHeader />
            </div>
            <div data-rvl-grid className="grid grid-cols-4 gap-[3px]">
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
          </div>

          {/* The screen at FULL BLEED (inset-x-0): born under the flash at
              the stack's footprint (the from-scale), it expands to the edges
              on open with the reel already breathing. */}
          <div
            ref={screenBoxRef}
            className="absolute inset-x-0 top-1/2 z-30 -translate-y-1/2"
          >
            <div
              data-rvl-screen
              style={
                {
                  "--rvl-screen-from": `scale(${COMPOSITE_FROM_SCALE})`,
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

          {/* The camera flash: a WHITE bloom centered on the stack (not
              Assembly's violet spark). rvl-flash peaks fast and decays soft,
              so it reads as a shutter, never a full-white cut. */}
          <div
            data-rvl-flash
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(circle_at_50%_50%,oklch(0.99_0_0)_0%,oklch(0.99_0_0_/_0.5)_32%,transparent_70%)] opacity-0"
          />

          {/* The Lights-down title beat at full-bleed geometry (scrim over
              the screen's lower third keeps it legible). */}
          <div
            data-rvl-scrim
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 z-30 aspect-[9/16] -translate-y-1/2 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-transparent"
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
        guestNote="The composite translates to /e/ with one substitution: the flight sources from the album grid the guest was just scrolling (Assembly's guest cut, doubling as proof the reel is made of this album), then the flash, the full-bleed expansion, and the title card play unchanged, naming the event for someone who was there. First visit only; replays skip straight to the reel."
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2 · Lights down
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
// 3 · Assembly
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
// 4 · First frame held
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
