"use client";

// the concept's own sheet; everything it declares carries the hhi- prefix.
import "./inflow.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

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
 * THE INFLOW (variation 3 of the home-hero board, round four, 2026-09-15).
 *
 * Will's ruling, verbatim: "Let's create a new variation off of 1 that has the
 * images streaming into the QR rather than away. This may be more conceptually
 * sound (guest images go into QR) but may not present as well visually, in
 * which case we'll keep in 1's direction."
 *
 * So this file has a job beyond being pretty: it is the honest test of the
 * truer reading, and its rationale on the board carries the verdict.
 *
 * THE ONE RISK, NAMED FIRST. Reverse the source and you get a picture of
 * photographs shrinking and disappearing into a black-and-white square. The
 * fear is "the album is being sucked away"; the hope is "everything in the
 * room goes into this code". The two readings share the same geometry, so the
 * composition has to settle it. Five things settle it here, and they are the
 * whole design:
 *
 *  1. NOTHING DISSOLVES. A frame is never faded out at the code. It shrinks,
 *     it meets the white plate, it slides UNDER it, and the plate hides it.
 *     An object that goes behind something opaque has gone SOMEWHERE; an
 *     object that fades to nothing has been erased. This is the single
 *     load-bearing move, and the geometry is tuned for it: the scale curve and
 *     the travel curve are set so a frame's whole box is inside the plate's
 *     footprint before it would otherwise need to fade, with the last stretch
 *     visibly half in and half out, like a photograph going into a slot.
 *  2. THE ARRIVAL LEAVES EVIDENCE. Each landing pushes a hairline ring out of
 *     the plate's edge, the way an impact moves a surface, and ticks the count
 *     under the code by one. The ring is fired by the loop at the exact frame
 *     a photograph is swallowed, so the beat is caused rather than decorative.
 *  3. THE FIELD IS CRISPEST AT THE CODE. The source fades its frames IN at the
 *     QR, so the frames nearest the object are the faintest. This one inverts
 *     that: a frame emerges out of the dark at the edge of the room and is at
 *     full strength when it lands. In a still, that gradient is the only thing
 *     that tells the two directions apart, and it points the right way.
 *  4. IT LANDS RATHER THAN FALLS IN. Read on the reversed axis the source's
 *     travel curve DECELERATES into the code: a frame comes in briskly from
 *     the room and settles the last stretch. Acceleration into a point reads
 *     as a drain, which is exactly the reading to avoid.
 *  5. THE COPY NAMES THE ACT. "Everything they shoot lands here", with the
 *     code as the "here", and a count under it that is going up.
 *
 * THE GATHER, which is the first beat. The source opens by branching the album
 * out of the code over 1.75 s. The mirror of that (everything off screen, then
 * a long wait for the first arrival) is a bad opening, so the inflow's
 * entrance is a LAG ON THE CLOCK instead: at mount the whole field is one beat
 * further out and the album plays at about 2.2x for 1.5 s, easing to its
 * steady cadence. The eye sees the entire room close on the code once, which
 * establishes the direction before a single word is read, and because the lag
 * tweens to zero there is no handoff between the entrance and the loop: it is
 * one expression, the way the source's reveal is.
 *
 * THE MECHANICS, from the source (source.tsx, read-only, the ruled reference).
 * Twenty-four cards split by index parity into a left pool and a right pool;
 * one launch a side every 900 ms; a 9.6 s flight; the recycling falling out of
 * one modulo, so a card's progress is a closed form of the clock and there is
 * no per-card bookkeeping. ONE requestAnimationFrame loop fills a progress[]
 * ref and writes transforms to 24 nodes; React state is never touched. What is
 * reversed is the reading of progress: here p = 0 is born far out in the room
 * and p = 1 is arrived at the code, so every curve is evaluated at 1 - p. The
 * corridor's own shape is retuned rather than mirrored, because a funnel wants
 * a wider mouth than a fountain: the frames enter on a taller fan and close on
 * the axis, which is what convergence looks like.
 */

/* ── The corridor's constants (the source's cadence, kept so the two concepts
      on the board can be compared beat for beat) ── */

const CARDS = 24;
/** Cards per side. CARDS / 2 by the parity split. */
const POOL = CARDS / 2;
const FLIGHT_MS = 9600;
/** How long the opening rush takes to ease back to the steady cadence. */
const GATHER_MS = 1500;
/** How far behind the steady clock the field starts. Also the JS-off rest. */
const GATHER_LAG_MS = 1750;
/**
 * The scale curve reaches 1 only at p = 0, which is far off screen, so a
 * card's DOM box is sized for the LARGEST VISIBLE moment and the curve is
 * multiplied up to match: 24 composited layers stay near 380 px instead of
 * near 900. The source's number, unchanged.
 */
const SCALE_GAIN = 2.81;
/** The widest per-card jitter (see sJit), used when solving for the plate. */
const SCALE_JIT_MAX = 1.06;
/** The album's count under the code at first paint. A stand-in: at wiring it
 *  is the demo event's own total, and the tick is one real arrival. */
const COUNT_BASE = 312;
const GUEST_COUNT = 48;

type Geo = {
  /** The QR's edge in px, quiet zone included. */
  qr: number;
  /** The white plate's edge: the code plus FooterQr's own p-2 on each side.
   *  This is the number the whole occlusion tuning is solved against. */
  plate: number;
  /** The card's DOM box; the scale curve is normalized against it. */
  card: number;
  /** How far out in the room a frame is born, from the centre. */
  travel: number;
  /** The gap between launches on one side. The desktop keeps the source's
   *  900 ms so the two concepts on the board compare beat for beat; the phone
   *  launches at 1250, because 188 px of runway each side is not enough for
   *  the source's cadence. Measured: at 900 ms the phone's neighbours sit 0.5
   *  of a card apart and the funnel reads as a pile with nothing legible in
   *  it; at 1250 they sit 0.75 apart and it reads as a procession. The count
   *  ticks slower there as a result, which is the truth of the picture. */
  launch: number;
  perspective: number;
  /** Half the corridor's reserved band: where the type starts, from the centre. */
  offset: number;
  /** Canvas-relative, never a vw value: the stage may be zoom-fitted. */
  sizes: string;
  /** The corridor's half-angle in degrees, before the per-card jitter. */
  rotate: number;
  /** The mouth of the funnel: the vertical scatter at full scale. Wider than
   *  the source's, because a frame that closes on the axis from a tall fan
   *  reads as converging, and a frame on a rail reads as a conveyor. */
  yDrift: number;
  /** The h1's measure, tuned so the line breaks into two at 1440. */
  h1Max: number;
  /** How much of each edge the band dissolves over. */
  fade: string;
  /** Where the count sits below the plate, and how wide the axis is clear
   *  there. Both measured against the funnel rather than guessed: at the
   *  desktop's 92 px the nearest frame edge reaches x = 176, which carries the
   *  whole line; at the phone's 76 px it reaches x = 55, which carries the
   *  number and nothing else, so the phone says only what it has room for. */
  countTop: number;
  countFull: boolean;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 144,
    plate: 160,
    card: 310,
    travel: 1.65 * CANVAS.desktop.w,
    launch: 900,
    perspective: 900,
    offset: 216,
    sizes: "384px",
    rotate: 9.5,
    yDrift: 60,
    h1Max: 1100,
    fade: "12%",
    countTop: 118,
    countFull: true,
  },
  phone: {
    qr: 112,
    plate: 128,
    card: 162,
    travel: 1.65 * CANVAS.phone.w,
    launch: 1250,
    perspective: 360,
    offset: 148,
    sizes: "200px",
    rotate: 8.5,
    yDrift: 28,
    h1Max: 343,
    fade: "16%",
    countTop: 92,
    countFull: false,
  },
};

/** One card's full round trip on this canvas: the flight plus its slack off
 *  screen. Twelve launches a side, so the modulo recycles the pool exactly. */
const cycleOf = (geo: Geo) => POOL * geo.launch;

/* ── The shader primitives, unchanged from the source: the two concepts have
      to share physics or the board is comparing two things at once ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Half eased-in-quad, half linear, both over a smoothstep. Evaluated at
 *  1 - p here, which is what turns the source's acceleration OUT of the code
 *  into a deceleration INTO it. */
function reachAt(p: number) {
  const s = smoothstep(0, 1, 1 - p);
  return 0.5 * (s * s) + 0.5 * s;
}

/** The source's scale ramp on the reversed axis: full size out in the room,
 *  collapsing through the plate's footprint in the last tenth of the flight. */
function sizeAt(p: number) {
  const x = 1 - p;
  return 0.125 * smoothstep(0, 0.15, x) + 0.875 * smoothstep(0.2, 1, x);
}

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the gather needs no
 *  bezier solver and stays engine-deterministic. */
function gatherEase(t: number) {
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
  /** -1 = born to the left, 1 = born to the right. */
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
 * two arms never carry the same frame at the same moment.
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
      key: `hhi-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      photo: slot + (right ? half : 0),
      // The scatter is multiplied by the live scale, so a frame born high in
      // the room closes on the axis exactly as it shrinks: the funnel's mouth
      // is tall and its throat is a point, which is the whole read.
      yOff: j * 2 - 1,
      sJit: 0.94 + jj * 0.12,
      // The inner edge, the one pointing at the code, recedes: the corridor's
      // vanishing point is the destination. Kept at the source's sign after
      // trying the reverse, which splays the frames outward and reads as
      // turning away from the code rather than travelling at it.
      rz: (jj * 2 - 1) * 1.1,
      ry: (right ? -1 : 1) * (1 + (jjj * 2 - 1) * 0.19),
    };
  });
}

/** Mode-independent, so the pools are built once for the module. */
const CARD_POOLS = buildCards();

function transformFor(c: Card, p: number, geo: Geo) {
  const s = sizeAt(p) * SCALE_GAIN * c.sJit;
  const x = c.dir * reachAt(p) * geo.travel;
  const y = c.yOff * geo.yDrift * s;
  const ry = c.ry * geo.rotate;
  return (
    `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ` +
    `rotateY(${ry.toFixed(2)}deg) rotateZ(${c.rz.toFixed(2)}deg) scale(${s.toFixed(4)})`
  );
}

/**
 * The progress at which a frame's whole box, jitter and drift included, is
 * inside the plate's footprint. Solved rather than guessed, so retuning the
 * geometry cannot silently leave a frame popping out of existence beside the
 * code: everything downstream (the fade, the ring, the count) keys off this.
 */
function solveLanding(geo: Geo) {
  const half = geo.plate / 2;
  for (let i = 500; i <= 1000; i++) {
    const p = i / 1000;
    const s = sizeAt(p) * SCALE_GAIN * SCALE_JIT_MAX;
    const box = (geo.card * s) / 2;
    if (geo.travel * reachAt(p) + box <= half && geo.yDrift * s + box <= half) {
      return p;
    }
  }
  return 0.95;
}

const LANDING: Record<Mode, number> = {
  desktop: solveLanding(GEO.desktop),
  phone: solveLanding(GEO.phone),
};

/**
 * A frame emerges out of the dark of the room as it crosses into the canvas
 * (p 0.50 to 0.63 on both canvases, because travel is 1.65 x the canvas width
 * on both, so the threshold is the same fraction of the flight), and is at
 * full strength from there to the plate. The tail exists only as insurance: by
 * the time it runs the frame is entirely behind the plate, so nothing a reader
 * can see ever fades at the code. That is the concept's first rule.
 */
function opacityAt(p: number, landing: number) {
  if (p > 1) return 0;
  return (
    smoothstep(0.5, 0.63, p) *
    (1 - smoothstep(landing + 0.02, landing + 0.06, p))
  );
}

/**
 * Landings between two points on the flow clock. A card lands when its own
 * offset plus the clock hits the landing progress, so the whole count is two
 * floors per card and stays exact across a pause, a gather and an hour.
 */
function landingsBetween(from: number, to: number, geo: Geo, landing: number) {
  const at = landing * FLIGHT_MS;
  const cycle = cycleOf(geo);
  let n = 0;
  for (const c of CARD_POOLS) {
    const base = c.slot * geo.launch - at;
    n += Math.floor((base + to) / cycle) - Math.floor((base + from) / cycle);
  }
  return n;
}

/** How many rings can be in the air at once. A landing every 450 ms on the
 *  desktop against a 760 ms ring means two, and the third is the slack that
 *  makes the round-robin safe at the gather's 2.2x. */
const RINGS = 3;

function Inflow({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const landing = LANDING[mode];
  const text = copyFor(inflow, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const rings = useRef<(HTMLSpanElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const countLine = useRef<HTMLParagraphElement | null>(null);
  // The contract's progress[]: filled every frame, never React state.
  const progress = useRef<number[]>([]);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let landed = 0;
    let ring = 0;
    const cycle = cycleOf(geo);

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

      // THE GATHER: one lag on the clock, eased to nothing. At mount the whole
      // field sits GATHER_LAG_MS further out (which is exactly the state the
      // sheet paints, so there is no jump on hydration) and the album plays at
      // about 2.2x until the lag is spent. After that this term is zero and
      // the clock alone carries the corridor, with no handoff.
      const lag = GATHER_LAG_MS * (1 - gatherEase(elapsed / GATHER_MS));
      const flow = elapsed - lag;

      const p = progress.current;
      for (let i = 0; i < CARD_POOLS.length; i++) {
        p[i] = mod(CARD_POOLS[i].slot * geo.launch + flow, cycle) / FLIGHT_MS;
      }
      for (let i = 0; i < CARD_POOLS.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        if (at > 1) {
          // Landed, and out in the room again on the next turn of the modulo.
          el.style.opacity = "0";
          continue;
        }
        el.style.transform = transformFor(CARD_POOLS[i], at, geo);
        el.style.opacity = String(opacityAt(at, landing));
      }

      // THE EVIDENCE. Every landing since the gather's first frame, counted in
      // closed form off the same clock, so a pause or the gather's speed-up
      // can never desynchronise the number from the picture.
      const total = landingsBetween(-GATHER_LAG_MS, flow, geo, landing);
      if (total !== landed) {
        landed = total;
        if (countRef.current) {
          countRef.current.textContent = String(COUNT_BASE + total);
        }
        const el = rings.current[ring % RINGS];
        ring += 1;
        // The one reliable way to restart a CSS animation: drop the hook,
        // flush layout, put it back. Twice a second, on four small nodes.
        for (const node of [el, countLine.current]) {
          if (!node) continue;
          node.removeAttribute("data-hhi-live");
          void node.offsetWidth;
          node.setAttribute("data-hhi-live", "");
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo, landing, reduced]);

  return (
    // overflow-CLIP, not hidden: `overflow: hidden` is still a scroll
    // container, and this composition is about 4700 px wide, so focusing a
    // button inside it makes the browser "reveal" the hero sideways with the
    // headline cut off. The scan found it on this board; clip has no such box.
    <div
      ref={rootRef}
      className="relative size-full overflow-clip bg-background"
    >
      {/* THE ROOM, ARRIVING. Full bleed and decorative: the album is the
          argument, but the type above and below carries the sentence. */}
      <div
        aria-hidden
        className="hhi-band absolute inset-0"
        style={{ "--hhi-fade": geo.fade } as CSSProperties}
      >
        <div
          className="hhi-corridor"
          style={{ "--hhi-persp": `${geo.perspective}px` } as CSSProperties}
        >
          {CARD_POOLS.map((c, i) => {
            // Two states, both written as custom properties the sheet reads:
            // the steady corridor (outside every query, so reduced motion, a
            // crawler and the server's HTML get the album flowing) and the
            // gather's first frame (inside no-preference, so the opening beat
            // cannot flash). Neither is a collapsed composition.
            const seed = (c.slot * geo.launch) / FLIGHT_MS;
            const lagged =
              mod(c.slot * geo.launch - GATHER_LAG_MS, cycleOf(geo)) /
              FLIGHT_MS;
            const rest = Math.min(seed, 1);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhi-card"
                style={
                  {
                    width: geo.card,
                    height: geo.card,
                    marginLeft: -geo.card / 2,
                    marginTop: -geo.card / 2,
                    "--hhi-rest": transformFor(c, rest, geo),
                    "--hhi-rest-o": opacityAt(seed, landing),
                    "--hhi-lag": transformFor(c, Math.min(lagged, 1), geo),
                    "--hhi-lag-o": opacityAt(lagged, landing),
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

      {/* THE DESTINATION, at the exact centre of the viewport and of the
          corridor, above the frames so they go BEHIND it rather than fade.
          Nothing about it moves: a QR that breathes is a QR nobody can scan,
          so the reaction to a landing is the ring around it, never the plate.
          Real, live and tappable; its own accessible name covers it. */}
      <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div aria-hidden className="hhi-splash">
          {Array.from({ length: RINGS }, (_, i) => (
            <span
              key={i}
              ref={(el) => {
                rings.current[i] = el;
              }}
              className="hhi-ring"
              data-hh-loop
            />
          ))}
        </div>
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE EVIDENCE, on the axis just under the plate, in the lane the funnel
          leaves clear (see countTop). The number is the only thing in the
          frame that is not already true, and it is what turns "vanishing" into
          "arriving", so it says what it is counting and nothing more. The
          phone keeps the number alone, because 110 px of clear axis is what
          the funnel leaves there and a line that runs under a photograph is
          the one thing this whole composition exists to avoid. */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 text-center"
        style={{ top: `calc(50% + ${geo.countTop}px)` }}
      >
        <Caption
          ref={countLine}
          className="hhi-count whitespace-nowrap text-white"
        >
          <span ref={countRef}>{COUNT_BASE}</span> photos
          {geo.countFull ? ` from ${GUEST_COUNT} guests, still arriving` : ""}
        </Caption>
      </div>

      {/* THE HEADLINE, anchored off the centre rather than laid out in flow, so
          the code holds the exact middle whether the line runs to one row or
          two. At paint, at full opacity, gated by nothing (bible 13). */}
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

/**
 * The engine, and nothing else (the Library x Lab migration wave, 2026-09-15).
 * The name, the rationale, the copy proposal, the departures and the assets
 * this concept asks for are `spec.ts`'s `inflow` candidate now: a board's
 * argument has to be pure data, because `sandbox/registry.ts` is imported by a
 * server page and by node tests. Nothing above this line changed.
 */
export const inflow: Concept = {
  id: "inflow",
  render: (p) => <Inflow {...p} />,
};
