"use client";

import "./card-river.css";

import Image from "next/image";
import qrcode from "qrcode-generator";
import { type CSSProperties, useEffect, useMemo, useRef } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * THE RIVER, CUT FOR THE QR DOOR (river-card, round one, 2026-09-18).
 *
 * ★ A COPY, AND THE HANDOFF SAYS SO. The engine is `RiverVisual` from
 * `sandbox/river-visual/river.tsx`, which this lane may import and never edit,
 * and the door needs three things that component cannot give it:
 *
 *  1  THE CODE'S HEIGHT. river.tsx fixes the plate's top at `round(h * 0.055)`
 *     inside `riverGeo`, with no prop to move it, and where the code sits is
 *     this board's first question. Here it is `plateTop`, handed in.
 *  2  TWO LAYERS. The door is a picture under two scrims with its copy on top.
 *     The code has to sit ABOVE both scrims or they grey its white plate into a
 *     square nobody can scan (feature-door.tsx's own note on the plate this
 *     replaces), while the photographs sit at whichever layer the board's
 *     `fall` answer puts them (door.tsx). RiverVisual draws both in one box on
 *     one layer. Here they are two parts of one root that makes no stacking
 *     context of its own: the stream paints where the root is inserted in the
 *     door, and the plate rises over everything on `z-10`.
 *  3  ITS OWN CLOCK. river.tsx's cadence is a module constant. Will's note on
 *     the card ("how it works can use a more dedicated animation") may ask for
 *     one, so the clock is a prop; the board runs the bank's, which is the one
 *     he saw, until the manifest's question about that note is answered.
 *
 * Everything else is the bank's river line for line: the closed form of the
 * clock, the gravity, the fan over a third of the distance, the golden-ratio
 * lanes, the top-edge recycle, the rest state as the loop's own expression, the
 * derived geometry. The river-visual board retires at its wiring, and whichever
 * of the two files the wiring promotes, the other goes with it.
 */

/* ── The clock ── */

export type RiverClock = {
  /** How many photographs are in the pool (one per manifest still at most). */
  cards: number;
  /** One photograph's whole fall, in ms. */
  flight: number;
};

/**
 * THE BANK'S CLOCK, as river.tsx runs it: the reference the card's own clock is
 * drawn against, never a cap. Will saw this one in the card slot on river-visual
 * round two and called it "our first truly beautiful card visual".
 */
export const BANK_CLOCK: RiverClock = { cards: 12, flight: 7600 };

/** The gap between two launches: the cycle a hair SHORTER than the flight, so
 *  every card is always airborne and gravity does the spacing (river.tsx). */
export const launchOf = (clock: RiverClock) =>
  Math.round((clock.flight * 0.965) / clock.cards);

/** The reveal that fans the seeded offsets apart, once, at the pour. */
const REVEAL_MS = 1500;
/** How much of the DISTANCE fallen the fan opens over (river.tsx's OPEN). */
const OPEN = 0.34;

/** The twelve manifest stills, in river.tsx's order and with its crops, so the
 *  card pours the same photographs the bank does (bible 18: ids, never paths). */
const FRAMES = [
  "wedding-golden",
  "party-dj",
  "reception-table",
  "festival-lights",
  "wedding-petals",
  "concert-confetti",
  "wedding-toast",
  "festival-crowd",
  "wedding-rings",
  "reception-hall",
  "party-balloons",
  "wedding-arch",
] as const;

const CROP = [
  "45% 44%",
  "42% 42%",
  "44% 50%",
  "46% 42%",
  "44% 34%",
  "50% 40%",
  "58% 50%",
  "52% 44%",
  "42% 52%",
  "42% 52%",
  "50% 40%",
  "32% 46%",
] as const;

/* ── The code and its scan floor ── */

/** The plate's padding around the code (river.tsx's PLATE_PAD). */
export const PLATE_PAD = 10;
/** FooterQr's quiet zone in modules per side, and the px a module needs to
 *  survive a phone camera reading it off a screen (footer-qr.tsx). */
const QUIET_ZONE_MODULES = 4;
export const MODULE_FLOOR_PX = 3;
/** The code's share of the box when the box can afford more than the floor. */
const QR_SHARE = 0.2;

/**
 * ★ THE SCAN FLOOR, MEASURED OFF THE VALUE and never typed (river.tsx's rule):
 * FooterQr draws the quiet zone INSIDE its box, so a module gets size / span,
 * not size / count. partyreel.com and partyreel.com/demo are 25 modules, span
 * 33, a 99 px floor; the demo event's full link is 33 modules, span 41, 123.
 */
export function spanOf(value: string) {
  const code = qrcode(0, "M");
  code.addData(value);
  code.make();
  return code.getModuleCount() + QUIET_ZONE_MODULES * 2;
}

/** The code's edge in a box this wide: its floor, or a fifth of the box. */
export function codeEdge(w: number, value: string) {
  return Math.max(
    Math.ceil(spanOf(value) * MODULE_FLOOR_PX),
    Math.round(w * QR_SHARE),
  );
}

/** The white plate's edge: the code plus its padding on both sides. */
export const plateOf = (w: number, value: string) =>
  codeEdge(w, value) + PLATE_PAD * 2;

/* ── The geometry, derived from the box ── */

type Geo = {
  w: number;
  h: number;
  qr: number;
  plateTop: number;
  originY: number;
  card: number;
  sMin: number;
  fullAt: number;
  spread: number;
  travel: number;
  deadY: number;
  sizes: string;
};

function geoOf(w: number, h: number, plateTop: number, value: string): Geo {
  const qr = codeEdge(w, value);
  // Every frame is born at the code's centre and hidden until it clears the
  // plate's bottom edge, so the album slides out from under the object.
  const originY = plateTop + PLATE_PAD + Math.round(qr / 2);
  return {
    w,
    h,
    qr,
    plateTop,
    originY,
    // A frame is 40 percent of the box (river.tsx measured a third as a
    // scatter and a half as a wall).
    card: Math.round(w * 0.4),
    sMin: 0.3,
    fullAt: 0.6,
    spread: Math.round(w * 0.2),
    // Over travel on purpose: a card recycles only once none of it can be seen.
    travel: Math.round(h * 1.26) - originY,
    deadY: h,
    sizes: `${Math.round(w * 0.4)}px`,
  };
}

/* ── The primitives (river.tsx's, unchanged) ── */

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const fallAt = (p: number) => 0.38 * p * p + 0.62 * p;
const openAt = (fall: number) => smoothstep(0, OPEN, fall);

function revealEase(t: number) {
  const u = clamp01(t);
  if (u < 0.5) return 8 * u * u * u * u;
  const v = 1 - u;
  return 1 - 8 * v * v * v * v;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Integer hashing only, so the server's rest transform and the browser's are
 *  bit identical and hydration never warns (river.tsx). */
function hash01(n: number) {
  let hv = Math.imul(n + 1, 2654435761) >>> 0;
  hv = (hv ^ (hv >>> 15)) >>> 0;
  hv = Math.imul(hv, 2246822519) >>> 0;
  hv = (hv ^ (hv >>> 13)) >>> 0;
  return hv / 4294967296;
}

type Card = {
  key: string;
  slot: number;
  photo: number;
  lane: number;
  wf: number;
  sJit: number;
  rz: number;
};

const angleAt = (c: Card, p: number) =>
  c.rz * (1 - 0.88 * smoothstep(0, 0.75, p));

/** ONE FLOW on the golden-ratio lanes, for however many cards the clock asks
 *  for. The seeds are river.tsx's, so the card's first twelve ARE the bank's. */
function buildCards(n: number): Card[] {
  const phi = 0.618033988749895;
  return Array.from({ length: n }, (_, g) => {
    const j = hash01(g + 101);
    const jj = hash01(g + 211);
    const j4 = hash01(g + 307);
    return {
      key: `rcd-${g}`,
      slot: g + (hash01(g + 517) - 0.5) * 0.34,
      photo: g,
      lane: ((g * phi) % 1) * 2 - 1,
      wf: j < 0.45 ? 0.8 : 1,
      sJit: 0.84 + j4 * 0.16,
      rz: (jj * 2 - 1) * 8.5,
    };
  });
}

const boxW = (c: Card, geo: Geo) => geo.card * c.wf * c.sJit;
const boxH = (c: Card, geo: Geo) => geo.card * c.sJit;

/** The topmost pixel a card can reach at this progress: the recycle's test. */
function topEdgeAt(c: Card, p: number, geo: Geo) {
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const rad = (angleAt(c, p) * Math.PI) / 180;
  const half =
    (boxH(c, geo) * s * Math.abs(Math.cos(rad)) +
      boxW(c, geo) * s * Math.abs(Math.sin(rad))) /
    2;
  return geo.originY + fall * geo.travel - half;
}

function place(c: Card, p: number, geo: Geo) {
  const fall = fallAt(p);
  const s = geo.sMin + (1 - geo.sMin) * clamp01(fall / geo.fullAt);
  const deg = angleAt(c, p);
  const x = c.lane * geo.spread * openAt(fall);
  const dy = fall * geo.travel;
  return `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${deg.toFixed(2)}deg) scale(${s.toFixed(4)})`;
}

const opacityAt = (p: number) => (p > 1 ? 0 : smoothstep(0, 0.1, p));

/* ── The visual ── */

export type CardRiverProps = {
  /** The door's box in px, read off the door rather than typed. */
  width: number;
  height: number;
  /** Where the plate's top edge sits, in px from the door's top. */
  plateTop: number;
  /** What the code encodes; its module count sets the code's size. */
  value: string;
  clock?: RiverClock;
  /** The rest state, what a reader who asked for less motion gets. */
  still?: boolean;
};

/**
 * THE STREAM AND THE CODE, as two parts of a root that makes NO stacking
 * context (no z-index, no transform, no filter, no mask on the root itself), so
 * the stream paints exactly where the root is inserted in the door and the
 * plate's `z-10` lifts it over the scrims and the copy the way the plate it
 * replaces did. The stream's own mask makes a context for the stream alone.
 */
export function CardRiver({
  width,
  height,
  plateTop,
  value,
  clock = BANK_CLOCK,
  still = false,
}: CardRiverProps) {
  const geo = useMemo(
    () => geoOf(width, height, plateTop, value),
    [width, height, plateTop, value],
  );
  const pool = useMemo(() => buildCards(clock.cards), [clock.cards]);
  const launch = launchOf(clock);
  const cycle = clock.cards * launch;
  const rest = usePrefersReducedMotion() || still;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const lastO = useRef<number[]>([]);

  useEffect(() => {
    if (rest) {
      // Clear the two properties the loop wrote, never the style attribute:
      // the rest state lives in inline custom properties on the same nodes.
      for (const el of nodes.current) {
        if (!el) continue;
        el.style.removeProperty("transform");
        el.style.removeProperty("opacity");
      }
      lastO.current = [];
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    // ★ THE PAUSE CROSSES THE FRAME. The step keeps every option mounted and
    // marks the hidden ones `data-paused` (stage.tsx's source, step.tsx's
    // views), and river.tsx reads it with `closest`. A door drawn inside a 375
    // `Frame` lives in the frame's own document, where `closest` stops at the
    // frame's <html>, so its clock would run on behind a hidden option. The
    // frame's element is in the board's document, same origin, so ask it too.
    const frame = root.ownerDocument.defaultView?.frameElement ?? null;
    const paused = () =>
      Boolean(root.closest("[data-paused]") || frame?.closest("[data-paused]"));
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      if (paused()) return;
      elapsed += dt;
      const reveal = revealEase(elapsed / REVEAL_MS);
      for (let i = 0; i < pool.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const c = pool[i];
        const at =
          mod(c.slot * launch * reveal + elapsed, cycle) / clock.flight;
        if (at > 1 || topEdgeAt(c, at, geo) > geo.deadY) {
          if (lastO.current[i] !== 0) {
            el.style.opacity = "0";
            lastO.current[i] = 0;
          }
          continue;
        }
        el.style.transform = place(c, at, geo);
        const o = opacityAt(at);
        if (o !== lastO.current[i]) {
          el.style.opacity = String(o);
          lastO.current[i] = o;
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [geo, rest, pool, launch, cycle, clock.flight]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-rcd-still={rest ? "" : undefined}
      className="rcd absolute inset-x-0 top-0"
      style={{ height }}
    >
      <div
        className="rcd-stream absolute inset-0"
        style={{ "--rcd-origin": `${geo.originY}px` } as CSSProperties}
      >
        <div className="rcd-flow">
          {pool.map((c, i) => {
            const seed = mod(c.slot * launch, cycle) / clock.flight;
            const dead = topEdgeAt(c, seed, geo) > geo.deadY;
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="rcd-card"
                style={
                  {
                    width: boxW(c, geo),
                    height: boxH(c, geo),
                    marginLeft: -boxW(c, geo) / 2,
                    marginTop: -boxH(c, geo) / 2,
                    "--rcd-rest": place(c, seed, geo),
                    "--rcd-rest-o": dead ? "0" : opacityAt(seed).toFixed(3),
                    "--rcd-pos": CROP[c.photo % CROP.length],
                  } as CSSProperties
                }
              >
                <Photo index={c.photo} sizes={geo.sizes} />
              </div>
            );
          })}
        </div>
      </div>

      {/* THE CODE, above both scrims. No link and no label: the whole door is
          one link already, and Will wants the code as an Easter egg ("we don't
          need the 'scan it' label text"). The hover mirrors the plate it
          replaces (feature-door.tsx's QrPlateArt), keyed off the door's own
          `group`. */}
      <div
        className="absolute inset-x-0 z-10 flex justify-center"
        style={{ top: geo.plateTop }}
      >
        <span
          className={cn(
            "rcd-plate",
            "transition-transform duration-500 ease-emphasis group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          )}
          style={{ padding: PLATE_PAD }}
        >
          <FooterQr value={value} size={geo.qr} className="p-0" />
        </span>
      </div>
    </div>
  );
}

/** One photograph at full luminance, with the tile corner. */
function Photo({ index, sizes }: { index: number; sizes: string }) {
  const img = marketingImage(FRAMES[index % FRAMES.length]);
  return (
    <div className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset">
      <Image
        src={img.src}
        alt=""
        fill
        sizes={sizes}
        className="rcd-img object-cover"
      />
    </div>
  );
}
