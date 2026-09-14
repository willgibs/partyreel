"use client";

// the concept's own sheet; keyframes here would carry the hhs- prefix (it
// declares none: the corridor is one rAF loop writing inline transforms).
import "./source.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  CANVAS,
  type Concept,
  type ConceptProps,
  DemoQr,
  FRAMES,
  GUTTER,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE SOURCE (concept 1 of the home-hero board, round two).
 *
 * The argument. Every other hero we have drawn puts photographs behind words
 * and then dims the photographs so the words survive. This one refuses the
 * trade by changing the shape of the composition: the album is a horizontal
 * CORRIDOR through the middle of the frame, and the type lives above it and
 * below it, so no photograph is ever darkened and no word is ever over one.
 * At the exact centre of that corridor, the real demo QR sits perfectly still
 * at scanning size. The frames are born behind it and fly outward forever.
 * The QR is the eyebrow, the object and the argument at once: the still centre
 * of a moving album, which is literally what the product is.
 *
 * The mechanism, ported from Melius's three.js fountain to DOM transforms.
 * Twenty-four cards, split by index parity into a left pool and a right pool.
 * Each pool launches one card every 900 ms; a flight lasts 9600 ms, so 10.67
 * of the 12 are airborne at any moment and the twelfth is the slack that makes
 * the round-robin work. Position and scale ride SEPARATE curves, which is the
 * whole trick: position accelerates outward (half eased-in-quad over a
 * smoothstep, half the smoothstep) while scale holds tiny for the first fifth
 * and then opens up. A frame therefore leaves the QR slowly and small, and is
 * large and quick by the time it dissolves at the edge.
 *
 * No state, no timers, no per-card bookkeeping: a card's progress is a closed
 * form of the clock, `((slot * 900 + elapsed) mod 10800) / 9600`, so the whole
 * corridor is one expression and the recycling falls out of the modulo. ONE
 * rAF loop fills a progress[] ref and then writes translate3d/rotate/scale to
 * 24 nodes; nothing here ever touches React state.
 *
 * The branch-out is the same expression with one extra factor: the seeded
 * offsets are multiplied by a reveal that tweens 0 to 1 over 1.75 s on the
 * house strong in-out curve. At elapsed 0 every seed is zero, so the album is
 * inside the QR; 1.75 s later it has opened into the steady corridor and the
 * clock alone carries it from there. One beat, no stagger machinery.
 */

/* ── The corridor's constants (the reference's numbers, kept exactly) ── */

const CARDS = 24;
/** Cards per side. CARDS / 2 by the parity split. */
const POOL = CARDS / 2;
const FLIGHT_MS = 9600;
const LAUNCH_MS = 900;
/** One card's full round trip: the flight plus its slack on the ground. */
const CYCLE_MS = POOL * LAUNCH_MS;
/** The seeded gap between neighbours, in progress units: 900 / 9600. */
const SEED_STEP = LAUNCH_MS / FLIGHT_MS;
const REVEAL_MS = 1750;
/**
 * The scale curve reaches 1 only at progress 1, which is far off screen, so a
 * card's DOM box is sized for the LARGEST VISIBLE moment and the curve is
 * multiplied up to match. The box is then never rasterized above 1:1 while it
 * is on screen, and 24 composited layers stay at ~292px instead of ~820px.
 */
const SCALE_GAIN = 2.81;

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** The card's DOM box; the scale curve is normalized against it. */
  card: number;
  /** How far a frame travels from the centre at progress 1. */
  travel: number;
  perspective: number;
  /** Half the corridor's reserved band: where the type starts, from the centre. */
  offset: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
  /** The corridor's half-angle in degrees, before the per-card jitter. */
  rotate: number;
  /** The vertical scatter at full scale, so the rows are a row and not a rail. */
  yDrift: number;
  /** The h1's measure, tuned so the ruled thesis breaks into two good lines. */
  h1Max: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    card: 330,
    travel: 1.65 * CANVAS.desktop.w,
    perspective: 900,
    offset: 196,
    sizes: "360px",
    rotate: 9.5,
    yDrift: 44,
    h1Max: 1100,
    fade: "12%",
  },
  phone: {
    qr: 112,
    card: 140,
    travel: 1.65 * CANVAS.phone.w,
    perspective: 360,
    offset: 130,
    sizes: "170px",
    rotate: 8.5,
    yDrift: 12,
    h1Max: 343,
    fade: "16%",
  },
};

/* ── The shader primitives the fountain is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Half eased-in-quad, half linear, both over a smoothstep of progress: slow
 *  out of the source, quick at the edges. */
function travelAt(p: number) {
  const s = smoothstep(0, 1, p);
  return 0.5 * (s * s) + 0.5 * s;
}

/** A fast ramp to an eighth over the first 15%, then the rest from 20% on: the
 *  frame is a speck while it is still inside the code, then it opens. */
function scaleAt(p: number) {
  return 0.125 * smoothstep(0, 0.15, p) + 0.875 * smoothstep(0.2, 1, p);
}

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic. */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is not
 *  bit-identical across JS engines, and the server and the browser have to
 *  produce the SAME transform string or hydration warns. */
function hash01(n: number) {
  let h = Math.imul(n + 1, 2654435761) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

type Card = {
  key: string;
  /** -1 = the left arm, 1 = the right arm. */
  dir: 1 | -1;
  /** Position in its own pool: the launch order and the seed. */
  slot: number;
  photo: number;
  yOff: number;
  sJit: number;
  ry: number;
  rz: number;
};

/**
 * The two pools. The photo offset is half the manifest's length rather than a
 * straight cycle of the global index, so each arm walks the WHOLE set and the
 * two arms never carry the same frame at the same moment. With the 12 landscape
 * stand-ins each arm repeats after 12 launches, which is ~108 s; with Will's 24
 * squares the offset becomes 12 and every card in the corridor is unique.
 */
function buildCards(): Card[] {
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: CARDS }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    return {
      key: `hhs-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      // Scatter and roll keep the corridor from reading as a conveyor. Both are
      // multiplied by the live scale, so every frame still converges exactly on
      // the QR: the source is a point, not a smear.
      yOff: (j * 2 - 1) * 1,
      sJit: 0.94 + jj * 0.12,
      // The inner edge of a frame, the one pointing at the QR, is the one that
      // recedes: the left arm turns one way and the right the other, so the two
      // rows read as a corridor whose vanishing point is the object.
      rz: (jj * 2 - 1) * 1.1,
      ry: (right ? -1 : 1) * (1 + (jjj * 2 - 1) * 0.19),
    };
  });
}

/** Mode-independent, so the pools are built once for the module. */
const CARD_POOLS = buildCards();

function transformFor(c: Card, p: number, geo: Geo) {
  const s = scaleAt(p) * SCALE_GAIN * c.sJit;
  const x = c.dir * travelAt(p) * geo.travel;
  const y = c.yOff * geo.yDrift * s;
  const ry = c.ry * geo.rotate;
  return `translate3d(${x}px, ${y}px, 0) rotateY(${ry}deg) rotateZ(${c.rz}deg) scale(${s})`;
}

/** Frames fade up AT the QR instead of appearing beside it, and the ramp runs
 *  long enough that a frame is still arriving as it clears the plate: emerging,
 *  never switched on. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.24, p));

function Source({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const text = copyFor(source, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the corridor on return.
      // Read off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // The branch-out: one tween of the seeded offsets from nothing to their
      // steady spacing. The clock term runs the whole time, so there is no
      // handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      const p = progress.current;
      for (let i = 0; i < CARD_POOLS.length; i++) {
        p[i] =
          mod(CARD_POOLS[i].slot * LAUNCH_MS * reveal + elapsed, CYCLE_MS) /
          FLIGHT_MS;
      }
      for (let i = 0; i < CARD_POOLS.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        if (at > 1) {
          // On the ground between flights, and far off screen besides.
          el.style.opacity = "0";
          continue;
        }
        el.style.transform = transformFor(CARD_POOLS[i], at, geo);
        el.style.opacity = String(opacityAt(at));
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo, reduced]);

  return (
    <div
      ref={rootRef}
      className="relative size-full overflow-hidden bg-background"
    >
      {/* THE CORRIDOR. Full bleed and decorative: the album is the argument,
          but it is the type above and below that carries the sentence. */}
      <div
        aria-hidden
        className="hhs-band absolute inset-0"
        style={{ "--hhs-fade": geo.fade } as CSSProperties}
      >
        <div
          className="hhs-corridor"
          style={{ "--hhs-persp": `${geo.perspective}px` } as CSSProperties}
        >
          {CARD_POOLS.map((c, i) => {
            // The REST state, written as custom properties the sheet reads:
            // the corridor standing at its steady-state spacing, which is what
            // reduced motion, a crawler and the server's own HTML get.
            const seed = c.slot * SEED_STEP;
            const at = Math.min(seed, 1);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhs-card"
                style={
                  {
                    width: geo.card,
                    height: geo.card,
                    marginLeft: -geo.card / 2,
                    marginTop: -geo.card / 2,
                    "--hhs-rest": transformFor(c, at, geo),
                    "--hhs-rest-o": opacityAt(seed),
                  } as CSSProperties
                }
              >
                <Photo
                  index={c.photo}
                  sizes={geo.sizes}
                  className="size-full rounded-[var(--radius-tile)] ring-1 ring-white/10 ring-inset"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* THE OBJECT, at the exact centre of the viewport and of the corridor,
          above the frames so they are born behind it. Nothing about it moves:
          the stillness is the point, and a QR that breathes is a QR nobody can
          scan. Real, live and tappable; its own accessible name covers it. */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE HEADLINE, anchored off the centre rather than laid out in flow, so
          the QR holds the exact middle whether the line runs to one row or two.
          At paint, at full opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ bottom: `calc(50% + ${geo.offset}px)` }}
      >
        <h1
          className={`mx-auto font-heading leading-[1.02] text-balance text-white ${LADDER.xl[mode]}`}
          style={{ maxWidth: geo.h1Max }}
        >
          {text.h1}
        </h1>
      </div>

      {/* THE SENTENCE AND THE ACTIONS, below the corridor. No scrim anywhere on
          this concept and no darkening layer over a frame: the band's geometry
          is what keeps the type off the photographs, which is the argument. */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.offset}px)` }}
      >
        <p className="mx-auto max-w-xl text-[15px] leading-relaxed text-pretty text-white/80">
          {text.subhead}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href={text.primary.href}>{text.primary.label}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-11 border-white/35 bg-white/5 px-5 text-base text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
          >
            {text.secondary}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const source: Concept = {
  id: "source",
  n: 1,
  name: "The source",
  rationale:
    "The scan is where everything starts, so the hero makes that literal: the real demo QR holds the exact centre, still and scannable, and the album branches out of it in two perspective rows that never stop. The type sits above and below the corridor, so nothing is ever dimmed to make room for a word.",
  eyebrow:
    "The QR itself, at the centre, with no label: the eyebrow is the object.",
  proposed: {
    h1: "The album starts here.",
    subhead:
      "Guests scan the code. Their photos and videos land in your album, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [
    "Bible 13, decorative layer only: the frames' pre-burst state sits inside the reduced-motion block, so with JavaScript off and motion allowed the corridor rests at the source. Putting it in an effect instead would paint the album deployed and then snap it back to the QR. The h1, the QR, the subhead and the CTAs are plain markup and never gated, and reduced motion gets the corridor fully deployed.",
    "Precedent, not law: the lockup is centred rather than left-aligned, because the QR owns the axis. The first thing to overrule if the home hero should stay left.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals. They replace the 12 landscape stand-ins the corridor cycles (FRAMES in shared.tsx); the left arm takes the first 12 and the right arm the last 12, so the two arms never carry the same frame.",
    "Framed tight enough to read at 120 px: a face, two hands, a glass, a sparkler, a first dance. Frames are read between 70 and 290 px here, and a wide room shot is grey mush at that size.",
    "Nothing else. The QR is the real demo event's, live from NEXT_PUBLIC_DEMO_QR_TOKEN, and there is no plate art, no lamp and no video in this concept.",
  ],
  render: (p) => <Source {...p} />,
};
