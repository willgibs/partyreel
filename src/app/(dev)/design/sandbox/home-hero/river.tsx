"use client";

// the concept's own sheet; it leaves with the board when the ruling lands.
import "./river.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  type Concept,
  type ConceptProps,
  DemoQr,
  FRAMES,
  LADDER,
  type Mode,
  Photo,
  copyFor,
} from "./shared";

/**
 * THE RIVER (concept 4 of the home-hero board, round three: variation 4 off
 * the source, on the axis THE ORIGIN AT THE TOP AND THE PAGE AS THE ALBUM).
 *
 * The argument. The source put the code at the exact centre and made the
 * album a horizontal corridor around it: the still centre of a moving album.
 * That answers "where does the type live" beautifully, but it also makes the
 * hero a self-contained object, a diagram of the product sitting in the
 * middle of a page. The river asks the next question instead: if the scan is
 * where everything starts, the code belongs where a page starts. So the code
 * moves to the TOP, into the slot an eyebrow would occupy, with one Caption
 * line under it, and the album pours DOWN out of it: frames are born behind
 * the plate, fall, grow, part around the words, and dissolve through the
 * hero's bottom edge into the rest of the page. The page is not a page with
 * an album in it. The page IS the album the scan started, and the hero is
 * only its first screen.
 *
 * Phone-first, which is the real reason for the axis. A vertical stream is
 * what a 375 screen is shaped for: the source's corridor has to compress two
 * horizontal rows into one strip there, while a river only gets narrower. So
 * the phone is the primary composition and the desktop is the same stream
 * with room for both arms to stay in frame.
 *
 * The mechanism, one expression. A card's progress is a closed form of the
 * clock, ((slot + phase) * LAUNCH + elapsed) mod CYCLE / FLIGHT, which is the
 * source's lesson kept exactly: no state, no timers, no per-card bookkeeping,
 * and the recycling falls out of the modulo. Everything else is that one
 * number:
 *
 *   fall   0.6p^2 + 0.4p        gravity, so a frame leaves the code slowly
 *                               and is three times quicker at the bottom;
 *   scale  sMin -> 1 over the   a frame is about the plate's width when it
 *          distance fallen      emerges and its full size at the bottom edge,
 *                               so its box is never rasterized above 1:1;
 *   x      drift * open(p)      its own lane, fanning out of the code, PLUS
 *          + the parting        the parting: while a card's box could overlap
 *                               a block of type, its inner edge is held on
 *                               that block's wall. The clearing is therefore
 *                               a geometric guarantee rather than a hope, and
 *                               it stays a constant-width corridor even as
 *                               the frames grow, because the wall holds the
 *                               INNER EDGE while the centre moves outward.
 *
 * That last line is what makes the river a river: the album visibly opens
 * around the headline and closes under it, and nothing is ever dimmed to make
 * room for a word. No scrim, no darkening layer, no lamp. The white plate and
 * the photographs are the only light in the room.
 *
 * The count under the CTAs ticks once per launch, in step with the frames
 * being born, so the causality is legible in a second element: the code makes
 * the album, and the album is filling right now. It is a STAND-IN number (see
 * `departures`); production wires it to the demo event's real count or drops
 * it.
 */

/* ── The stream's constants ── */

const CARDS = 16;
/** Cards per arm. CARDS / 2 by the parity split (the source's). */
const POOL = CARDS / 2;
const FLIGHT_MS = 9800;
const LAUNCH_MS = 1500;
/** One card's full round trip: the flight plus its slack on the ground. */
const CYCLE_MS = POOL * LAUNCH_MS;
/** The seeded gap between neighbours in an arm, in progress units. */
const SEED_STEP = LAUNCH_MS / FLIGHT_MS;
const REVEAL_MS = 1900;
/** The right arm launches half a cadence after the left, so the two arms
 *  alternate instead of falling as mirrored pairs. */
const ARM_PHASE = 0.5;
/** The stand-in album count. Ticks once per launch; never a real figure. */
const COUNT_BASE = 248;
/** Slack between a block of type and the nearest frame edge, in canvas px. */
const SAFE = 14;
/** ★ Ink overshoot. A line box at leading 1.02 is SHORTER than the face's own
 *  ascent plus descent, so the h1's glyphs stand about 9 px above the element's
 *  layout box (measured on Urbanist at text-8xl). The clearing is grown by this
 *  at both ends, or a frame can graze the top of the headline while the layout
 *  boxes still say there is room. */
const INK = 14;

type Geo = {
  /** The QR's edge in px, quiet zone included, and the TOP BLOCK's top: the
   *  Caption line sits above the plate, so this is the line's top, not the
   *  plate's. */
  qr: number;
  qrTop: number;
  /** The code's centre: where every frame is born. */
  originY: number;
  /** The lockup's clearing: half the corridor, and the band it spans. */
  clearHalf: number;
  bandTop: number;
  bandBot: number;
  /** How far (in px of fall) the parting ramps in above a band and out below. */
  enter: number;
  release: number;
  /** The card's DOM box: its LARGEST visible size, so scale never exceeds 1. */
  card: number;
  /** The scale a frame has as it emerges from behind the plate. */
  sMin: number;
  /** How far an arm fans out on its own, before any parting. */
  drift: number;
  /** The fall at progress 1, in px. */
  travel: number;
  /** The fall fraction at the canvas's bottom edge: scale reaches 1 there. */
  fullAt: number;
  /** Canvas-relative, never a vw value: the stage is zoomed. */
  sizes: string;
  /** The type's measures, tuned so the ruled thesis breaks into good lines. */
  h1Max: number;
  subMax: number;
  /** The lockup's internal rhythm. */
  gapSub: number;
  gapCta: number;
  gapCount: number;
  /** How much of each edge the stream dissolves over. */
  fadeX: string;
  fadeB: string;
};

const GEO: Record<Mode, Geo> = {
  desktop: {
    qr: 124,
    qrTop: 66,
    originY: 164,
    clearHalf: 400,
    bandTop: 432,
    bandBot: 836,
    enter: 170,
    release: 320,
    card: 340,
    sMin: 0.32,
    drift: 330,
    travel: 990,
    fullAt: 0.8,
    sizes: "360px",
    h1Max: 740,
    subMax: 560,
    gapSub: 34,
    gapCta: 34,
    gapCount: 22,
    fadeX: "7%",
    fadeB: "16%",
  },
  phone: {
    qr: 96,
    qrTop: 30,
    originY: 114,
    clearHalf: 166,
    bandTop: 392,
    bandBot: 742,
    // Short on the phone, where the parting has to happen LATE: the album's
    // whole visible life is the band above the headline, and a long ramp
    // empties the middle of the screen before a single frame has been read.
    enter: 70,
    release: 220,
    card: 152,
    sMin: 0.44,
    drift: 84,
    // Short, and the reason is density, not speed: the phone's album is only
    // ever seen between the code and the headline, so a flight that spent most
    // of its clock below the words would leave two frames on screen. Same
    // cadence as the desktop, a third of the distance.
    travel: 500,
    // Full size as it reaches the headline, not at the canvas's bottom edge:
    // below the words both arms are out of frame, so a ramp that peaked down
    // there would only ever be seen at its small end.
    fullAt: 0.42,
    sizes: "180px",
    h1Max: 316,
    subMax: 330,
    gapSub: 22,
    gapCta: 22,
    gapCount: 14,
    fadeX: "13%",
    fadeB: "14%",
  },
};

/* ── The primitives the stream is written in ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Gravity: 60% quadratic, 40% linear. A frame leaves the code slowly enough
 *  to read as emerging and is about three times quicker at the bottom edge,
 *  which is what makes the stream read as falling rather than scrolling. */
const fallAt = (p: number) => 0.6 * p * p + 0.4 * p;

/** The arm's own fan: the delta's mouth, open by a fifth of the flight. Most
 *  of the stream's width is this, not the parting, which is what keeps the
 *  lateral motion reading as a stream spreading rather than as cards thrown
 *  aside when the words arrive. */
const openAt = (p: number) => smoothstep(0, 0.2, p);

/** Nothing pushes a frame sideways while it is still inside the plate. Without
 *  this the caption's clearing is already ramping at progress 0 (a frame's box
 *  reaches the caption within 80 px of its birth), and frames appear BESIDE the
 *  code instead of sliding out from behind it, which is the whole read. */
const birthAt = (p: number) => smoothstep(0, 0.09, p);

/** 1 exactly while a card's box could overlap [top, bot], ramping in above it
 *  and out below. `half` is the card's own half-height, so the guarantee is
 *  about the BOX and not about the centre. */
function bump(
  y: number,
  half: number,
  top: number,
  bot: number,
  enter: number,
  release: number,
) {
  const t = top - half;
  const b = bot + half;
  return smoothstep(t - enter, t, y) * (1 - smoothstep(b, b + release, y));
}

/** ease-in-out-quart, which IS --ease-in-out-strong's cubic-bezier
 *  (0.77, 0, 0.175, 1). Written out rather than solved so the reveal needs no
 *  bezier solver and stays engine-deterministic (the source's note). */
function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** A deterministic 0..1 per card. Integer ops only, on purpose: Math.sin is
 *  not bit-identical across JS engines, and the server and the browser have to
 *  produce the SAME rest transform or hydration warns (the source's note; the
 *  cosine inside `place` is covered by rounding the string instead). */
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
  /** Position in its own arm: the launch order and the seed. */
  slot: number;
  /** The right arm's half-cadence offset. */
  phase: number;
  photo: number;
  /** Where in its arm's width this card runs: 0.35 inner to 1 outer. */
  lane: number;
  /** Width factor: 1 is a square, 0.8 a 4:5 portrait. Heights are equal before
   *  the size jitter, so the stream's rhythm stays even while the shapes vary. */
  wf: number;
  /** Per-card size, 0.82 to 1 of the canvas's card. */
  sJit: number;
  /** Extra px this card holds off the corridor's wall, so the clearing's edge
   *  is ragged like a bank and not a ruled line. */
  wall: number;
  /** Degrees of tumble, held for the flight. */
  rz: number;
};

/**
 * The two arms. The photo offset is half the manifest's length, the source's
 * trick, so the arms never carry the same frame at the same moment. With the
 * 12 landscape stand-ins four frames are doubled; with Will's 24 squares every
 * card in the stream is unique.
 */
function buildCards(): Card[] {
  const half = Math.round(FRAMES.length / 2);
  return Array.from({ length: CARDS }, (_, g) => {
    const right = g % 2 === 1;
    const slot = (g - (right ? 1 : 0)) / 2;
    const j = hash01(g);
    const jj = hash01(g + 101);
    const jjj = hash01(g + 211);
    const j4 = hash01(g + 307);
    return {
      key: `hhv-${g}`,
      dir: (right ? 1 : -1) as 1 | -1,
      slot,
      phase: right ? ARM_PHASE : 0,
      photo: slot + (right ? half : 0),
      lane: 0.35 + j * 0.65,
      wf: jj < 0.45 ? 0.8 : 1,
      sJit: 0.82 + j4 * 0.18,
      wall: hash01(g + 421) * 46,
      rz: (jjj * 2 - 1) * 3.6,
    };
  });
}

/** Mode-independent, so the arms are built once for the module and a canvas
 *  switch never reshuffles which photograph is which. */
const CARD_POOL = buildCards();

/** A card's DOM box on this canvas: its LARGEST visible size, which is what
 *  the sheet lays out and what `place` scales down from. */
const boxW = (c: Card, geo: Geo) => geo.card * c.wf * c.sJit;
const boxH = (c: Card, geo: Geo) => geo.card * c.sJit;

/**
 * The whole composition for one card at one progress. The parting is the only
 * clever part: `need` is the |x| at which this card's PROJECTED inner edge
 * touches a clearing's wall, so holding x there while the bump is 1 keeps the
 * corridor a constant width however large the frame has grown, and no frame
 * can ever be under a word.
 */
function place(c: Card, p: number, geo: Geo) {
  const fall = fallAt(p);
  const y = geo.originY + fall * geo.travel;
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const w = boxW(c, geo) * s;
  const h = boxH(c, geo) * s;
  const rad = (c.rz * Math.PI) / 180;
  // The tumble widens the projected box; clear the corridor against THAT and
  // not against the unrotated width, or a corner clips the measure.
  const halfW = (w * Math.cos(rad) + h * Math.abs(Math.sin(rad))) / 2;

  const base = geo.drift * c.lane * openAt(p);
  // ONE clearing, the lockup's: nothing else is ever in the stream's way, which
  // is why the caption sits above the plate rather than under it (see the
  // departures). The push is what it takes for THIS frame's projected inner
  // edge to reach the corridor's wall, so the corridor keeps its width as the
  // frame grows, and it never crosses the axis on the way.
  const band =
    bump(
      y,
      h / 2,
      geo.bandTop - INK,
      geo.bandBot + INK,
      geo.enter,
      geo.release,
    ) * Math.max(0, geo.clearHalf + halfW + SAFE + c.wall - base);

  const x = c.dir * (base + birthAt(p) * band);
  const dy = y - geo.originY;
  // Rounded so the server's string and the browser's agree exactly: Math.cos
  // is not bit-identical across engines and this string is server-rendered.
  return `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${c.rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

/** Frames fade up while they are still behind the plate, so one slides out of
 *  the code rather than switching on beside it. The far end of the stream is
 *  dissolved by the sheet's mask, so there is no fade-out curve here. */
const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.12, p));

/** Deterministic thousands grouping. toLocaleString is locale-dependent and
 *  the server's locale is not the reader's, so the count would hydrate
 *  differently; this is the same string everywhere. */
function grouped(n: number) {
  const s = String(n);
  return s.length > 3 ? `${s.slice(0, s.length - 3)},${s.slice(-3)}` : s;
}

function River({ mode, copy, qrUrl }: ConceptProps) {
  const geo = GEO[mode];
  const text = copyFor(river, copy);
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const countRef = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(COUNT_BASE);
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
      // either way, and an un-held clock teleports the stream on return. Read
      // it off the closest ancestor so the concept owns no shell knowledge.
      if (root.closest("[data-paused]")) return;
      elapsed += dt;

      // The pour: one tween of the seeded offsets from nothing to their steady
      // spacing. The clock term runs the whole time, so there is no handoff
      // between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      const p = progress.current;
      for (let i = 0; i < CARD_POOL.length; i++) {
        const c = CARD_POOL[i];
        p[i] =
          mod((c.slot + c.phase) * LAUNCH_MS * reveal + elapsed, CYCLE_MS) /
          FLIGHT_MS;
      }
      for (let i = 0; i < CARD_POOL.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        if (at > 1) {
          // On the ground between flights, and far below the edge besides.
          el.style.opacity = "0";
          continue;
        }
        el.style.transform = place(CARD_POOL[i], at, geo);
        el.style.opacity = String(opacityAt(at));
      }

      // One photo per launch, so the number climbs in step with the frames
      // being born: the same clock, read a second way.
      const n = COUNT_BASE + Math.floor(elapsed / LAUNCH_MS);
      if (n !== shown.current && countRef.current) {
        shown.current = n;
        countRef.current.textContent = grouped(n);
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
      {/* THE STREAM. Full bleed and decorative: the album is the argument, but
          it is the code at the top and the type in the corridor that carry the
          sentence. Dissolved at both side edges and at the bottom so it is
          never guillotined by the stage: the album LEAVES the hero rather than
          stopping at it, which is the whole page-as-the-album claim. */}
      <div
        aria-hidden
        className="hhv-stream absolute inset-0"
        style={
          {
            "--hhv-fade-x": geo.fadeX,
            "--hhv-fade-b": geo.fadeB,
            "--hhv-origin": `${geo.originY}px`,
          } as CSSProperties
        }
      >
        <div className="hhv-flow">
          {CARD_POOL.map((c, i) => {
            // The REST state, written as custom properties the sheet reads: the
            // stream standing at its steady-state spacing, which is what reduced
            // motion, a crawler and the server's own HTML get.
            const seed = Math.min((c.slot + c.phase) * SEED_STEP, 1);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhv-card"
                style={
                  {
                    width: boxW(c, geo),
                    height: boxH(c, geo),
                    marginLeft: -boxW(c, geo) / 2,
                    marginTop: -boxH(c, geo) / 2,
                    "--hhv-rest": place(c, seed, geo),
                    "--hhv-rest-o": opacityAt(seed).toFixed(3),
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

      {/* THE CODE, at the top where the eyebrow sits, above the frames so they
          are born behind the plate and slide out from under it. Nothing about
          it moves: a QR that breathes is a QR nobody can scan. Real, live and
          tappable; its own accessible name covers it. */}
      <div
        className="absolute inset-x-0 z-10 flex flex-col items-center"
        style={{ top: geo.qrTop }}
      >
        <Caption className="mb-3 text-white/65">
          Scan it. The album is live.
        </Caption>
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {/* THE LOCKUP, in the corridor the stream parts around. At paint, at full
          opacity, gated by nothing (bible 13), and never over a photograph:
          the frames hold their inner edges on this block's walls, so there is
          no scrim here and there never needs to be one. */}
      <div
        className="absolute inset-x-0 z-10 text-center"
        style={{ top: geo.bandTop }}
      >
        <h1
          className={`mx-auto font-heading ${LADDER.xl[mode]} leading-[1.02] text-balance text-white`}
          style={{ maxWidth: geo.h1Max }}
        >
          {text.h1}
        </h1>
        <p
          className="mx-auto text-[15px] leading-relaxed text-pretty text-white/80"
          style={{ maxWidth: geo.subMax, marginTop: geo.gapSub }}
        >
          {text.subhead}
        </p>
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          style={{ marginTop: geo.gapCta }}
        >
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
        <Caption className="text-white/45" style={{ marginTop: geo.gapCount }}>
          <span ref={countRef} className="tabular-nums">
            {grouped(COUNT_BASE)}
          </span>{" "}
          photos in the demo album so far.
        </Caption>
      </div>
    </div>
  );
}

export const river: Concept = {
  id: "river",
  n: 4,
  name: "The river",
  rationale:
    "The origin at the top and the page as the album: the code takes the slot an eyebrow would, and the album pours down out of it, born behind the plate, growing as it falls, parting around the headline and dissolving through the hero's bottom edge into the rest of the page. Phone-first, because a vertical stream is the shape a 375 screen already has; the desktop is the same stream with room for both arms to stay in frame.",
  eyebrow:
    'The code itself at the top of the page, where an eyebrow sits, with one Caption line ABOVE the plate rather than under it: "Scan it. The album is live." (see the departures: a line under the code is the one thing the stream cannot get around).',
  proposed: {
    h1: "Everything, from one code.",
    subhead:
      "Guests scan it and everything they shoot lands here, full size, with no app and no account.",
    secondary: "See a real album",
  },
  departures: [
    "The code leaves the exact centre. The source's argument was the still centre of a moving album, and it is a good one; this variation trades it for causality read top to bottom. A code in the middle of a composition is an object the page is arranged around, and a stranger reads it as a thing to scan for more information. A code at the TOP, in the eyebrow's slot, with the album falling out of it, is a beginning: everything below it is what the scan produced, which is the sentence Will asked the hero to say. The stillness survives the move, and nothing about the plate animates.",
    "Precedent, not law: the lockup is centred rather than left-aligned, because the code owns the page's axis and the stream is symmetrical about it. This is the source's departure too, and the first thing to overrule if the home hero should stay left. Left-aligning costs the symmetry of the two arms, not the mechanism: the corridor's wall simply moves.",
    "Bible 13, decorative layer only: the stream's pre-pour state (every frame collapsed at the code) sits inside the reduced-motion block, so with JavaScript off and motion allowed the stream rests at the code and the hero is the code, the type and the CTAs alone. Putting it in an effect instead would paint the album deployed and then snap it back to the code. The h1, the code, the caption, the subhead and the CTAs are plain markup and never gated, and reduced motion gets the stream fully deployed.",
    "The brief put the Caption line UNDER the code and it is above it here, which is the one place this variation argues with its own brief. A line under the plate sits about 80 px below the point every frame is born at, so every frame has to escape sideways by roughly its own width before it has fallen a card\u0027s height: frames then appear BESIDE the code rather than sliding out from behind it, which is the single read the concept exists for (built it that way first, and that is exactly how it looked). Above the plate the line still labels the code, the eyebrow is still the object, and the stream leaves the plate straight down. Overrule it and the fix is a much smaller plate or a much shorter line, not a longer ramp.",
    "The count under the CTAs is a STAND-IN figure that ticks once per launch (248 and climbing). It is the supporting element that says the album is filling right now, and it is the one thing here that must not ship as drawn: before this goes near production it reads the demo event's real media count, or it goes. Flagged on the board rather than in a footnote, because a number nobody can stand behind is a claim and not a placeholder.",
  ],
  assets: [
    "24 event photographs as 512 x 512 squares, one grade, 6 to 35 KB webp each, across weddings, birthdays, corporate and festivals · already requested as ASSETS row 2 by the source, and the river takes the same set: the two arms carry disjoint halves, so with 24 every frame in the stream is unique (with the 12 landscape stand-ins four are doubled) · replaces the 12 landscape stand-ins in FRAMES (shared.tsx).",
    "12 event photographs as 4:5 portraits, 720 x 900, one grade, 15 to 60 KB webp each, from the same shoot as the squares · about 45 percent of the frames here run portrait, because that is what a guest's phone shoots and a vertical stream reads best when the shapes vary; the landscape stand-ins crop hard to 4:5 today · replaces the portrait cards (wf 0.8) in CARD_POOL, which draw from the same landscape stand-ins.",
    "Framed tight enough to read at 110 px: a face, two hands, a glass, a sparkler, a first dance · a frame is read here between 100 px at the code and 340 px at the bottom edge, and a wide room shot is grey mush at the top of the stream · the single biggest lift available to this concept, the source's ask restated.",
    "The demo event's live media count, as a number the hero can render · the shell hands a concept `qrUrl` only, so the count is hard-coded here; production wants the real figure (a build-time count on the demo event, or the RPC the guest page already uses) · replaces COUNT_BASE, the 248 stand-in.",
  ],
  render: (p) => <River {...p} />,
};
