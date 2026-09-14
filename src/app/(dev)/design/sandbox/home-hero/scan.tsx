"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./scan.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Caption } from "@/components/marketing/system/caption";
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
 * THE SCAN (concept 2 of the home-hero board, round three: variation 2 off the
 * source, on the axis THE CAUSE MADE LITERAL).
 *
 * The argument. The source is right and Will ruled it: the code holds the
 * centre and the album branches out of it, so a stranger thinks "if I scan
 * this, I get all of these". But that stranger still has to INFER the scan,
 * because the only actor in the frame is a QR. This variation puts the act
 * itself in the picture. A guest's phone is in the near field at the lower
 * left, cropped by the edge of the frame the way your own hands are cropped by
 * your own field of view, and on its screen is the camera: the same code,
 * standing in the room, with the four corner brackets a scanner draws around a
 * code it has found. The eye completes the circuit in well under a second,
 * because the code on the screen and the code in the room are visibly the same
 * object at two scales. Cause and effect in one composition, nothing explained.
 *
 * The screen shows the CAMERA and never an app, which is not a detail: the
 * whole pitch is that a guest installs nothing (bible 4), so the one piece of
 * software in the hero has to be the one every guest already has. The only
 * chrome on that screen is the notch. No title bar, no buttons, no tabs.
 *
 * THE BEAT, and why it is the concept's best idea. The source's branch-out is
 * one tween of the seeded offsets over 1.75 s, and it fires at load, beside the
 * code. Here it fires BECAUSE of the code: the brackets sweep in and snap at
 * 760 ms, the screen flashes once, and the album branches out of the plate on
 * the snap. The corridor's own clock is held until then, so before the lock
 * every frame is inside the code at scale 0 and the room is empty. The whole
 * hero is therefore one sentence in time: camera finds code, code releases
 * album, album never stops. It costs one constant (LOCK_MS) and no new
 * machinery, and the causality is now sequential as well as spatial.
 *
 * Supporting elements, both new here. One Caption line under the plate names
 * the act ("Every guest scans the same code"), which is also the feature: ONE
 * code per event, not one per guest. Under it a count reads like a live album
 * and ticks up with the launches, so the number rising is the visible
 * consequence of the scan. It settles at 312 rather than climbing forever,
 * because an album fills and then is full. Both sit in the one genuinely clear
 * lane the corridor has: a frame is a speck while it is near the plate and only
 * grows once it is far out horizontally, so the column directly under the code
 * stays empty by the physics, not by a scrim.
 *
 * What is inherited from the source, deliberately and without change: the
 * corridor's physics (24 cards, two pools by index parity, one launch a side
 * every 900 ms, 9.6 s flights, position and scale on separate curves, the
 * recycling falling out of one modulo, one requestAnimationFrame loop writing
 * to 24 nodes and never to React state), the edge mask, the type above and
 * below the band, and the centred lockup. Rising tides says elevate what points
 * at the axis: the corridor already points at it, so it is kept exactly and the
 * variation is spent on the cause.
 */

/* The corridor's constants (the source's numbers, kept exactly) */

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
/** The scale curve reaches 1 only at progress 1, far off screen, so the DOM box
 *  is sized for the largest VISIBLE moment and the curve is multiplied up to
 *  match: 24 composited layers stay at ~292px instead of ~820px. */
const SCALE_GAIN = 2.81;

/** THE CAUSE, in time. The camera's lock lands here and the corridor's clock
 *  starts here, so the album is released BY the scan rather than beside it.
 *  Kept in step with scan.css's 760 ms bracket sweep; change both together. */
const LOCK_MS = 760;

/* The live album's count. A stand-in number, flagged on the board: the wiring
   round reads the demo event's real totals or the line goes. It starts below
   its settled value and climbs one per launch, so the rise IS the scan's
   consequence, then holds, because an album fills and then is full. */
const PHOTOS_SETTLED = 312;
const PHOTOS_START = 282;
const GUESTS = 48;

function countText(launches: number) {
  const n = Math.min(PHOTOS_START + launches, PHOTOS_SETTLED);
  return `${n} photos from ${GUESTS} guests`;
}

/** The phone in the near field: its box, its angle, and the viewfinder inside
 *  it. x and y are the CENTRE of the device, offset from the canvas centre, so
 *  the crop against a frame edge is a number rather than a guess. */
type Device = {
  w: number;
  x: number;
  y: number;
  /** Clockwise: a phone at the lower left aims its top up and to the right. */
  rz: number;
  /** Tipped away from the viewer, so the screen still faces us. */
  ry: number;
  /** The detected code's edge on the screen, quiet zone included. */
  qr: number;
  /** The bracket's arm, its gap from the plate, its stroke, and how far
   *  outward it starts before the lock. */
  arm: number;
  pad: number;
  stroke: number;
  throw: number;
};

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** The card's DOM box; the scale curve is normalized against it. */
  card: number;
  /** How far a frame travels from the centre at progress 1. */
  travel: number;
  perspective: number;
  /** Half the corridor's reserved band: where the type starts, from the axis. */
  offset: number;
  /** The corridor's axis, signed, from the canvas centre. Negative is up. */
  axis: number;
  /** The caption block's top, from the axis, inside the corridor's clear lane. */
  lane: number;
  /** Its measure. Kept narrow on purpose: a frame is only large once it is far
   *  out horizontally, so the lane is clear while the block stays inside it. */
  laneMax: number;
  captionClass: string;
  countClass: string;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
  /** The corridor's half-angle in degrees, before the per-card jitter. */
  rotate: number;
  /** The vertical scatter at full scale, so the rows are a row and not a rail. */
  yDrift: number;
  /** The h1's measure, tuned so the line breaks where it should. */
  h1Max: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
  device: Device;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    card: 330,
    travel: 1.65 * CANVAS.desktop.w,
    perspective: 900,
    offset: 196,
    axis: 0,
    lane: 94,
    laneMax: 300,
    captionClass: "text-[13px]",
    countClass: "text-[12px]",
    sizes: "360px",
    rotate: 9.5,
    yDrift: 44,
    h1Max: 1100,
    fade: "12%",
    device: {
      w: 300,
      x: -560,
      y: 390,
      rz: 13,
      ry: -12,
      qr: 116,
      arm: 22,
      pad: 11,
      stroke: 2,
      throw: 26,
    },
  },
  phone: {
    qr: 112,
    card: 140,
    travel: 1.65 * CANVAS.phone.w,
    perspective: 360,
    offset: 130,
    axis: 0,
    lane: 46,
    laneMax: 150,
    captionClass: "text-[11px]",
    countClass: "text-[10px]",
    sizes: "170px",
    rotate: 8.5,
    yDrift: 12,
    h1Max: 343,
    fade: "16%",
    device: {
      w: 100,
      x: -152,
      y: -4,
      rz: 8,
      ry: -10,
      qr: 44,
      arm: 9,
      pad: 4,
      stroke: 1.5,
      throw: 11,
    },
  },
};

/* The shader primitives the fountain is written in (the source's, kept) */

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

/** The two pools. The photo offset is half the manifest's length rather than a
 *  straight cycle of the global index, so each arm walks the WHOLE set and the
 *  two arms never carry the same frame at the same moment. */
function buildCards(): Card[] {
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: CARDS }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    return {
      key: `hhc-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      // Scatter and roll keep the corridor from reading as a conveyor. Both are
      // multiplied by the live scale, so every frame still converges exactly on
      // the plate: the source is a point, not a smear.
      yOff: (j * 2 - 1) * 1,
      sJit: 0.94 + jj * 0.12,
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

/** Frames fade up AT the plate instead of appearing beside it, and the ramp
 *  runs long enough that a frame is still arriving as it clears the code:
 *  emerging, never switched on. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.24, p));

/** The camera view on the phone's screen: the same code the room is holding,
 *  with the four brackets a scanner draws around a code it has found. It is
 *  FooterQr rather than DemoQr because the plate in the room already carries
 *  the link and the accessible name; a second link to the same place would be
 *  a second tab stop for a picture of a picture. The whole device is
 *  aria-hidden for the same reason. */
function Viewfinder({ url, d }: { url: string | null; d: Device }) {
  const corners = ["hhc-tl", "hhc-tr", "hhc-bl", "hhc-br"];
  return (
    <div
      className="hhc-lockbox flex"
      style={
        {
          "--hhc-arm": `${d.arm}px`,
          "--hhc-pad": `${d.pad}px`,
          "--hhc-stroke": `${d.stroke}px`,
          "--hhc-throw": `${d.throw}px`,
        } as CSSProperties
      }
    >
      <FooterQr value={url ?? "https://partyreel.com"} size={d.qr} />
      {corners.map((c) => (
        // data-hh-loop is board.css's pause hook. This is a one-shot rather
        // than a loop, and it wants the hook anyway: the concept holds its own
        // clock on the same data-paused, so pausing the sweep is what keeps
        // the beat and the corridor in step across a tab switch.
        <span key={c} data-hh-loop className={`hhc-bracket ${c}`} />
      ))}
    </div>
  );
}

function Scan({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const d = geo.device;
  const text = copyFor(scan, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement | null>(null);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let since = 0;
    let shown = -1;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // The stage sets data-paused on a hidden tab. Holding the CLOCK rather
      // than the loop is what matters: rAF does not fire in a background tab
      // either way, and an un-held clock teleports the corridor on return.
      // Read off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      since += dt;

      // THE CAUSE. Nothing moves in the corridor until the camera has locked:
      // at elapsed 0 every card is at progress 0, which is scale 0 and opacity
      // 0, so the room is genuinely empty while the brackets are closing.
      const elapsed = since > LOCK_MS ? since - LOCK_MS : 0;

      // The live album. One tick per launch, both arms, so the number rising is
      // the same event as a frame being born. Written straight to the node:
      // this is the only text in the hero that changes and it must not cost a
      // render. Settled, it holds.
      const launches = Math.floor(elapsed / LAUNCH_MS) * 2;
      if (launches !== shown) {
        shown = launches;
        const el = countRef.current;
        if (el) el.textContent = countText(launches);
      }

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
      {/* THE CORRIDOR, inherited from the source unchanged. Full bleed and
          decorative: the album is the consequence, but it is the type above
          and below that carries the sentence. */}
      <div
        aria-hidden
        className="hhc-band absolute inset-0"
        style={{ "--hhc-fade": geo.fade } as CSSProperties}
      >
        <div
          className="hhc-corridor"
          style={
            {
              "--hhc-persp": `${geo.perspective}px`,
              "--hhc-axis": `${geo.axis}px`,
            } as CSSProperties
          }
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
                className="hhc-card"
                style={
                  {
                    width: geo.card,
                    height: geo.card,
                    marginLeft: -geo.card / 2,
                    marginTop: -geo.card / 2,
                    "--hhc-rest": transformFor(c, at, geo),
                    "--hhc-rest-o": opacityAt(seed),
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

      {/* THE CAUSE, in the near field: a guest's phone, cropped by the frame's
          own edge the way your hands are cropped by your field of view, aimed
          up and to the right at the code. Its screen is the CAMERA and never
          an app, because the product needs none. Decorative in full: the code
          it is looking at is the real one, a few hundred pixels away. */}
      <div
        aria-hidden
        className="hhc-device z-20"
        style={
          {
            left: `calc(50% + ${d.x}px)`,
            top: `calc(50% + ${d.y}px)`,
            width: d.w,
            translate: "-50% -50%",
            "--hhc-w": `${d.w}px`,
            "--hhc-rz": `${d.rz}deg`,
            "--hhc-ry": `${d.ry}deg`,
          } as CSSProperties
        }
      >
        <div className="hhc-phone w-full" style={{ aspectRatio: "0.472" }}>
          <div className="hhc-screen">
            <div className="flex size-full items-center justify-center">
              <Viewfinder url={qrUrl} d={d} />
            </div>
            <div className="hhc-pill" />
            <div data-hh-loop className="hhc-flash" />
          </div>
        </div>
      </div>

      {/* THE OBJECT, at the exact centre of the viewport and of the corridor,
          above the frames so they are born behind it. Nothing about it moves:
          the stillness is the point, and a QR that breathes is a QR nobody can
          scan. Real, live and tappable; its own accessible name covers it. */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `calc(50% + ${geo.axis}px)` }}
      >
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE ACT, named, and its consequence, counted. Both live in the one
          lane the corridor leaves clear: a frame is a speck while it is near
          the plate and only grows once it is far out horizontally, so this
          column is empty by the physics rather than by a scrim. The count's
          settled value is what the server renders, so reduced motion and a
          crawler read a full album rather than a blank. */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.axis + geo.lane}px)` }}
      >
        <Caption
          className={`mx-auto text-white/70 ${geo.captionClass}`}
          style={{ maxWidth: geo.laneMax }}
        >
          Every guest scans the same code
        </Caption>
        <p
          className={`mx-auto mt-1 tabular-nums text-white/45 ${geo.countClass}`}
          style={{ maxWidth: geo.laneMax }}
        >
          <span ref={countRef}>{countText(PHOTOS_SETTLED)}</span>
        </p>
      </div>

      {/* THE HEADLINE, anchored off the corridor's axis rather than laid out in
          flow, so the code holds the exact middle whether the line runs to one
          row or two. At paint, at full opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ bottom: `calc(50% + ${geo.offset - geo.axis}px)` }}
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
          is what keeps the type off the photographs. */}
      <div
        className={`absolute inset-x-0 z-10 text-center ${GUTTER[mode].x}`}
        style={{ top: `calc(50% + ${geo.axis + geo.offset}px)` }}
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

export const scan: Concept = {
  id: "scan",
  n: 2,
  name: "The scan",
  rationale:
    "The source's corridor with the cause put in the frame. A guest's phone sits in the near field, cropped by the edge the way your own hands are, and on its screen is the camera: the same code that stands in the room, with a scanner's four brackets closing on it. The brackets snap, the screen flashes, and only then does the album branch out of the plate. Cause, then effect, in space and in time.",
  eyebrow:
    "The act itself, shown: a camera locked on the code, with one line under the plate naming what every guest does.",
  proposed: {
    h1: "One code. Every photo.",
    subhead:
      "Guests point a camera at it. Their photos and videos land in your album, with no app and no account.",
    secondary: "See the album it made",
  },
  departures: [
    "A phone in the hero, which Will named as the first thing to overrule because a phone can read as an app. Three things hold it to the camera rather than to software: the screen carries no chrome but the notch (no title bar, no buttons, no tabs), the device is cropped by the frame's edge so it reads as a held object in the room rather than a device mockup on a slide, and what it is looking at is visibly the same code standing a few hundred pixels away. Its bezel radius is a drawn object's proportion, a literal, not a surface token: a phone corner is not a UI surface.",
    "The hero is cinema and unlit, and this concept has one emissive object: the phone's screen. It lights itself and its own bezel and nothing else. No lamp, no Glow, no spill onto the room or onto a photograph.",
    "Bible 13, decorative layers only: the corridor's pre-burst state and the brackets' thrown-wide state sit inside the reduced-motion block, so with JavaScript off and motion allowed the album rests at the code and the brackets rest open. Putting either in an effect instead would paint the composition settled and then snap it back. The h1, the QR, the caption, the count, the subhead and the CTAs are plain markup and never gated, and reduced motion gets the whole composition deployed and locked.",
    "Precedent, not law, inherited from the source: the lockup is centred rather than left-aligned, because the code owns the axis. Kept, with the same caveat, and it is the second thing to overrule if the home hero should stay left.",
    "The count under the plate is a STAND-IN number, not a measurement: 312 photos from 48 guests, climbing to its settled value with the launches. It is the strongest supporting element on the concept and it must not ship as invented data. The wiring round reads the demo event's real totals, or the line goes.",
  ],
  assets: [
    "A hand-and-phone cutout, to replace the drawn device (.hhc-phone): PNG with alpha, 1200 px on the long edge, the SCREEN AREA fully transparent so the viewfinder composes underneath and stays live and real. Shot from just behind the holder's shoulder, the phone held up and angled away to the right, in low warm event light so the body is nearly a silhouette with one highlight along the edge. Two variants, a one-handed grip and a two-handed one, so the composition can be tuned without a reshoot. This is the single biggest lift available to the concept: a real hand is the difference between a held phone and a product render.",
    "The corridor runs on the 12 landscape stand-ins and wants the 24 squares already requested (ASSETS row 2, asked by hero-source): 512 x 512, one grade, framed tight enough to read at 120 px. Not a new ask, and nothing here needs the three phone-up photographs from row 3, because the device is drawn rather than photographed.",
  ],
  render: (p) => <Scan {...p} />,
};
