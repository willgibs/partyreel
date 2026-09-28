"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import {
  FRAME_SIZES,
  LG_MIN,
  phaseOf,
  REVEAL_MS,
  restPhase,
  revealEase,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LiveDot } from "@/components/marketing/system/demo-modal/demo-door";
import { Glow } from "@/components/shared/glow";
import { GlowFilter } from "@/components/shared/glow-filter";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { type CardId, CARDS, type Size } from "./cards";
import { CinemaRoom, px, Scene, stopLinks, useOffStage } from "./scene";
import { type ScreenId, screenOf } from "./screens";
import { type Geometry, type Table, TABLES } from "./tablet";

/**
 * THE HOME'S FIRST SCREEN, WITH ONE THING CHANGED: THE OBJECT.
 *
 * Everything but the object is `cinema-hero.tsx` as it ships: the site header
 * over it, the band on `hero-stream.ts`'s own tables and loop, and the block at
 * the measured clear line, its first line demo-doors' "Try our demo event"
 * with the live dot, exactly as production draws it.
 *
 * ★ THE HEADER IS PINNED AS THE TOP OF THE PAGE DRAWS IT, AND THAT IS THE ONE
 * LIBERTY. It hides on the way down (`use-scroll-direction.ts`) and fades its
 * glass in once scrolled, and it reads the LAB page's scroll: the frames sit a
 * long way down the board, so the reader arrived scrolling down and round one
 * drew every first screen with no header at all. The real first screen is
 * read at the top of the page, bare header and all.
 *
 * ★ A CARD STANDS IN THE MIDDLE OF ITS AIR, NOT ON THE AXIS (round one's
 * carried `place`). A card stands at the midpoint between the header's foot and
 * the block's top, the axis passing through its lower half, so the band still
 * leaves from behind it and its air is even. The midpoint is a `calc()` on the
 * hero's own numbers, so it holds at any screen height.
 *
 * ★ AND IT HAS A FLOOR, drawn here since round two's 900 frame needed it. The
 * axis rides 36 percent of the hero (32 below `lg`) while the midpoint rides
 * half of it, so on a tall screen (a tablet held upright) the midpoint lifts a
 * card clear of the axis and the band is born in the open under it. The card
 * stands at the larger of the midpoint and `axis - (half the card - inset)`,
 * the inset being how far above its foot the axis must run for a frame born
 * there to stay hidden until it is solid: half the height a frame has reached
 * by then (`opacityAt` is 1 at 0.14 out, where one stands about 35px tall on
 * the phone's band and 67 on the desktop's), and a hair more. It never moves
 * round one's link at 1440 by 900 or 375 by 812, so the reference stands
 * exactly where he picked it; the shorter cards settle onto it. The wiring
 * round lands the same `max()` with each card's own height (`CARDS`).
 */

export const cardOf = (v: string | undefined): CardId =>
  v && v in CARDS ? (v as CardId) : "link";

/** Where a card's centre stands: the middle of its air, or its floor. */
const PLACE =
  "max(calc((var(--mkt-header-h, 4rem) + var(--hhs-axis) + var(--hhs-low)) / 2), calc(var(--hhs-axis) - var(--card-lift)))";

/** How far above its foot the axis must run, per band (the floor's note). */
const INSET: Record<Size, number> = { base: 20, tablet: 27, lg: 34 };

/** How far over the axis a card's centre may stand: half its box, less the inset. */
const liftOf = (card: CardId, size: Size) =>
  `${CARDS[card].height[size] / 2 - INSET[size]}px`;

/** The card's size under each geometry the `tablet` ask draws. */
const SIZE_OF: Record<Geometry, Size> = {
  today: "base",
  tablet: "tablet",
  early: "lg",
};

/* ── The hero ────────────────────────────────────────────────────────────── */

/** One set of frames per table, solved once at module load as the hero
 *  solves its own: the same nodes, only their boxes and rest states differ. */
function framesOf(table: Table) {
  return table.cards.map((c, i) => {
    const box = table.box[i];
    const rest = table.frameAt(c, restPhase(c), box.fit);
    return {
      "--hhs-w-base": `${box.w}px`,
      "--hhs-h-base": `${box.h}px`,
      "--hhs-rest-base": rest.transform,
      "--hhs-rest-o-base": rest.opacity,
      "--hhs-z-base": rest.z,
    } as CSSProperties;
  });
}

const LG = framesOf(TABLES.early).map((s) =>
  Object.fromEntries(
    Object.entries(s).map(([k, v]) => [k.replace(/-base$/, "-lg"), v]),
  ),
);

/** A forced geometry's frames, in the `-base` slots a 900 frame reads. */
const FORCED: Record<Geometry, CSSProperties[]> = {
  today: framesOf(TABLES.today),
  tablet: framesOf(TABLES.tablet),
  early: framesOf(TABLES.early),
};

/** Production's frames: the `-base` / `-lg` pairs the sheet chooses between. */
const FRAMES = TABLES.today.cards.map((c, i) => ({
  key: c.key,
  image: marketingImage(STREAM_FRAMES[c.photo % STREAM_FRAMES.length]),
  style: { ...FORCED.today[i], ...LG[i] } as CSSProperties,
}));

/** The layout's numbers, the `-base` / `-lg` pairs the sheet chooses between. */
const pairs = (bp: "base" | "lg", t: Table) => [
  [`--hhs-axis-pct-${bp}`, `${t.geo.axisPct}%`],
  [`--hhs-axis-min-${bp}`, `${t.axisMin}px`],
  [`--hhs-below-${bp}`, `${t.below}px`],
  [`--hhs-min-h-${bp}`, `${t.minH}px`],
  [`--hhs-low-${bp}`, `${t.low}px`],
  [`--hhs-fade-${bp}`, t.geo.fade],
  [`--hhs-persp-${bp}`, `${t.geo.perspective}px`],
  [`--hhs-qr-${bp}`, `${t.geo.qr}px`],
  [`--hhs-h1-max-${bp}`, `${t.geo.h1Max}px`],
  [`--hhs-low-max-${bp}`, `${t.geo.lowMax}px`],
];

const LAYOUT = Object.fromEntries([
  ...pairs("base", TABLES.today),
  ...pairs("lg", TABLES.early),
]) as CSSProperties;

/**
 * A geometry forced at a tablet's width: the plain names the sheet otherwise
 * resolves from the pairs, written inline, where they win over its media query
 * (the sheet's own note on the suffixes, read the other way round).
 */
const forcedLayout = (g: Geometry) =>
  Object.fromEntries(
    pairs("base", TABLES[g]).map(([k, v]) => [k.replace(/-base$/, ""), v]),
  ) as CSSProperties;

/**
 * The block's air under a forced geometry. `today` keeps production's own
 * classes (the base column's air at 900); `tablet` and `early` wear `lg`'s air,
 * because the action row sits on one line at 900 and the block is `lg`'s.
 * Inline, because a lab `md:` would lose to production's classes (the kit's
 * `lab-utility-loses-to-production` trap).
 */
const LG_AIR = {
  eyebrow: { marginTop: 0, marginBottom: 12 },
  sentence: { marginTop: 20 },
  actions: { marginTop: 28 },
  block: { paddingInline: 32 },
} as const;

export type Light = "none" | "pool" | "bloom";

/**
 * A LIGHT OF THE CARD'S OWN, from the house's two object recipes: `pool` is
 * the Library's throw under a plate (the lamp under the card's foot, cast out
 * and up), `bloom` is /features/qr's plate (an ignition from behind the card
 * that rests lit, "the resting glow that says the code is live"). The box is
 * larger than the card and centred on it, because a lamp whose box IS the
 * object is clipped to the object and hidden behind it.
 *
 * ★ IT STANDS BEHIND THE BAND, NEVER OVER IT. The hero's argument is that
 * nothing is laid over a photograph (`cinema-hero.tsx`), so the lamp is the
 * section's first layer and every frame paints over it: the light is the
 * room's, seen round the card and between the photographs as they leave. Its
 * reach stops inside its box, or the box's edge draws a line across the air.
 */
function Lamp({ light }: { light: Exclude<Light, "none"> }) {
  return (
    <div
      aria-hidden
      data-card-lamp={light}
      className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      style={{ width: "min(680px, 150vw)", height: 520 }}
    >
      {light === "pool" ? (
        <Glow
          shape="throw"
          drive="transform"
          vars={{
            "--glw-from-x": "50%",
            "--glw-from-y": "62%",
            "--glw-reach": "46%",
            "--glw-strength": "0.5",
            "--glw-base": "0.5",
            "--glw-blur": "30px",
            "--glw-dur": "var(--spill-cadence)",
          }}
        />
      ) : (
        <Glow
          shape="bloom"
          drive="mask"
          vars={{
            "--glw-from-x": "50%",
            "--glw-from-y": "50%",
            "--glw-reach": "56%",
            "--glw-strength": "0.95",
            "--glw-base": "0.34",
            "--glw-blur": "26px",
          }}
        />
      )}
    </div>
  );
}

function HeroDrawn({
  card,
  geometry,
  light = "none",
}: {
  card: CardId;
  /** A geometry forced at a tablet's width; production's pair when left out. */
  geometry?: Geometry;
  light?: Light;
}) {
  const { Obj } = CARDS[card];
  const size = geometry ? SIZE_OF[geometry] : undefined;
  // The floor's lift: one size's when a geometry is forced, else the pair the
  // sheet below chooses between at `lg`, as the hero's own numbers ride.
  const lift: Record<string, string> = size
    ? { "--card-lift": liftOf(card, size) }
    : {
        "--card-lift-base": liftOf(card, "base"),
        "--card-lift-lg": liftOf(card, "lg"),
      };
  const section = useRef<HTMLElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const zNow = useRef<number[]>([]);
  const elapsed = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;
  const air = geometry && geometry !== "today" ? LG_AIR : null;

  /**
   * THE BAND'S LOOP, production's own closed form (`cinema-hero.tsx`), the
   * clock held outside the effect so a return resumes rather than re-bursts.
   * Three things differ, and all are the frame's: the breakpoint is read off
   * the FRAME's window (the lab's is wider than a 375 frame), a hidden option
   * holds still (`useOffStage`), since a step draws every option at once, and a
   * forced geometry runs its own table rather than the breakpoint's.
   */
  useEffect(() => {
    const els = nodes.current;
    if (reduced) {
      for (const el of els) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      zNow.current = [];
      return;
    }
    if (still) return;
    const win = section.current?.ownerDocument.defaultView ?? window;
    const mq = win.matchMedia(`(min-width: ${LG_MIN}px)`);
    const tableNow = () =>
      geometry ? TABLES[geometry] : mq.matches ? TABLES.early : TABLES.today;
    let table = tableNow();
    const onChange = () => {
      table = tableNow();
    };
    mq.addEventListener("change", onChange);
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      const { cards, box, cycle } = table;
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const at = phaseOf(cards[i], elapsed.current, reveal, cycle);
        if (at > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = table.frameAt(cards[i], at, box[i].fit);
        el.style.transform = f.transform;
        el.style.opacity = String(f.opacity);
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
      }
    };
    raf = win.requestAnimationFrame(tick);
    return () => {
      win.cancelAnimationFrame(raf);
      mq.removeEventListener("change", onChange);
    };
  }, [reduced, still, geometry]);

  return (
    <CinemaRoom className="h-full">
      {/* The header pinned as the top of the page draws it (the header
          note): its hide is a translate on `[data-hidden]`, and its glass
          fades in on `[data-stuck]`, which the lab's scroll trips too; both
          are undone here and nowhere else. */}
      <style>{`[data-hero-scene] header[data-hidden]{translate:none!important}[data-hero-scene] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}[data-card-slot]{--card-lift:var(--card-lift-base)}@media (min-width:${LG_MIN}px){[data-card-slot]{--card-lift:var(--card-lift-lg)}}`}</style>
      {/* The lamps' turbulence host, in THIS document: the root layout's
          lives in the lab page's, and a filter a frame cannot reach drops
          the whole chain, blur and all (glow.tsx's tripwire). */}
      {light !== "none" ? <GlowFilter /> : null}
      <div data-hero-scene className="h-full" onClickCapture={stopLinks}>
        <MarketingHeader skin="cinema" overlay />
        <section
          ref={(el) => {
            section.current = el;
            pauseRef(el);
          }}
          style={geometry ? { ...LAYOUT, ...forcedLayout(geometry) } : LAYOUT}
          className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
        >
          {light !== "none" ? (
            <div
              data-card-slot
              className="absolute left-1/2"
              style={{ top: PLACE, ...lift }}
            >
              <Lamp light={light} />
            </div>
          ) : null}
          <div
            aria-hidden
            className="hhs-band absolute inset-x-0 h-full"
            style={{ top: "calc(var(--hhs-axis) - 50%)" }}
          >
            <div className="hhs-corridor">
              {FRAMES.map((f, i) => (
                <div
                  key={f.key}
                  ref={(el) => {
                    nodes.current[i] = el;
                  }}
                  className="hhs-card"
                  style={
                    geometry ? { ...f.style, ...FORCED[geometry][i] } : f.style
                  }
                >
                  <div className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset">
                    <Image
                      src={f.image.src}
                      alt=""
                      fill
                      sizes={FRAME_SIZES}
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The object's point: the middle of its air, or its floor. Each
              object centres itself on it. */}
          <div
            data-card-slot
            className="absolute left-1/2 z-10"
            style={{ top: PLACE, ...lift }}
          >
            <Link
              href="/demo"
              aria-label="Open the live demo"
              className="block transition-transform duration-150 active:scale-[0.99]"
            >
              <Obj size={size} />
            </Link>
          </div>

          <div
            data-hero-block
            className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 lg:px-8"
            style={{
              top: "calc(var(--hhs-axis) + var(--hhs-low))",
              ...air?.block,
            }}
          >
            {/* demo-doors' eyebrow, as `cinema-hero.tsx` draws it: the live
                dot, the words and the chevron, a plain link here (a board
                never opens the page's demo modal). */}
            <div
              className="mt-3 mb-2 flex justify-center lg:mt-0 lg:mb-3"
              style={air?.eyebrow}
            >
              <Link
                href="/demo"
                data-hero-eyebrow
                className="mkt-learn inline-flex items-center gap-2 text-label font-medium text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
              >
                <LiveDot />
                <span className="inline-flex items-center gap-1">
                  Try our demo event
                  <LearnChevron />
                </span>
              </Link>
            </div>
            <h1
              data-hero-h1
              className="mx-auto font-heading text-hero text-balance text-white"
              style={{ maxWidth: "var(--hhs-h1-max)" }}
            >
              {SITE_THESIS}
            </h1>
            <p
              className="mx-auto mt-4 text-copy text-pretty text-white/80 lg:mt-5"
              style={{ maxWidth: "var(--hhs-low-max)", ...air?.sentence }}
            >
              {SITE_SUBHEAD}
            </p>
            <div
              data-hero-actions
              className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:mt-7"
              style={air?.actions}
            >
              <Button asChild size="cta">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                size="cta"
                variant="outline"
                className="gap-2 border-white/35 bg-white/5 px-5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
              >
                <Play className="size-4 fill-current" />
                Watch a sample reel
              </Button>
            </div>
          </div>
        </section>
      </div>
    </CinemaRoom>
  );
}

/* ── The measurement ─────────────────────────────────────────────────────── */

/**
 * Every PAINTED box under an element, unioned: a print standing out of a card
 * or a pill hanging off it is part of the object a reader sees. Painted means
 * a photograph, a code or a filled surface; a wrapper's own layout box is not.
 */
function extentOf(el: Element, win: Window) {
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;
  for (const node of [el, ...el.querySelectorAll("*")]) {
    const cs = win.getComputedStyle(node);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const painted =
      node.tagName === "IMG" ||
      node.tagName.toLowerCase() === "svg" ||
      (cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
        cs.backgroundColor !== "transparent");
    if (!painted) continue;
    const r = node.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
  }
  return { top, bottom, w: right - left, h: bottom - top };
}

/** Only what is drawn: a breakpoint pair draws two copies, one hidden. */
const drawn = (root: Element, sel: string) =>
  [...root.querySelectorAll(sel)].filter(
    (n) => n.getBoundingClientRect().width > 0,
  );

/** The drawn code's edge (FooterQr's svg, quiet zone included), or 0. */
function codeOf(obj: Element): number {
  const svg = drawn(obj, "svg[shape-rendering=crispEdges]")[0];
  return svg ? svg.getBoundingClientRect().width : 0;
}

/** How many lines an element sets in, from its height and its line height. */
function linesOf(el: Element, win: Window): number {
  const lh = Number.parseFloat(win.getComputedStyle(el).lineHeight);
  return Math.max(1, Math.round(el.getBoundingClientRect().height / lh));
}

function measureCard(root: HTMLElement, win: Window) {
  const obj = root.querySelector("[data-hero-object]");
  const brow = drawn(root, "[data-hero-eyebrow]")[0];
  const header = root.querySelector("header");
  if (!obj || !brow || !header) return null;
  const box = extentOf(obj, win);
  if (!Number.isFinite(box.top)) return null;
  const over = box.top - header.getBoundingClientRect().bottom;
  const under = brow.getBoundingClientRect().top - box.bottom;
  const photos = drawn(obj, "[data-card-photo]").length;
  const videos = drawn(obj, "[data-card-video]").length;
  const slug = drawn(obj, "[data-hero-slug]")[0];
  const size = slug
    ? Number.parseFloat(win.getComputedStyle(slug).fontSize)
    : 0;
  const row = drawn(obj, "[data-card-faces]")[0];
  const inRow = row ? row.querySelectorAll("[data-slot=avatar]").length : 0;
  const pinned = drawn(obj, "[data-card-guest]").length;
  const who =
    pinned > 0
      ? `, a guest's face on each of ${pinned}`
      : inRow > 0
        ? `, ${inRow} guests' faces`
        : "";
  const film = videos > 0 ? ` (${videos} a video)` : "";
  return `The card is ${px(box.w)} by ${px(box.h)}, ${px(over)} under the header and ${px(under)} over the eyebrow: ${photos} photographs${film}, the code ${px(codeOf(obj))}, the link at ${px(size)}${who}.`;
}

function measureTablet(root: HTMLElement, win: Window) {
  const obj = root.querySelector("[data-hero-object]");
  const h1 = root.querySelector("[data-hero-h1]");
  const actions = root.querySelector("[data-hero-actions]");
  if (!obj || !h1 || !actions) return null;
  const box = extentOf(obj, win);
  if (!Number.isFinite(box.top)) return null;
  const fold = win.innerHeight;
  const left = fold - actions.getBoundingClientRect().bottom;
  const cells = drawn(root, ".hhs-card").map((n) => n.getBoundingClientRect());
  const tallest = cells.length ? Math.max(...cells.map((r) => r.height)) : 0;
  return `The card is ${px(box.w)} by ${px(box.h)}; the headline sets in ${linesOf(h1, win)} lines at ${px(h1.getBoundingClientRect().width)}; the band's largest photograph is ${px(tallest)} tall; the block ends ${px(left)} above the fold.`;
}

/** The card ask: a card in production's own geometry, at the knob's screen. */
export function heroPreview(s: BoardState, id: CardId) {
  const screen: ScreenId = screenOf(s.screen);
  return (
    <Scene
      id={`card-${id}`}
      screen={screen}
      title="The home's first screen"
      measure={measureCard}
    >
      <HeroDrawn card={id} />
    </Scene>
  );
}

/** The tablet ask: the picked card, at a tablet's width, in one geometry. */
export function tabletPreview(s: BoardState, geometry: Geometry) {
  const card = cardOf(s.card);
  return (
    <Scene
      id={`tablet-${geometry}-${card}`}
      screen="900"
      title="The home's first screen"
      measure={measureTablet}
    >
      <HeroDrawn card={card} geometry={geometry} />
    </Scene>
  );
}

/** The light ask: the picked card, at the knob's screen, in one light. */
export function lightPreview(s: BoardState, light: Light) {
  const screen: ScreenId = screenOf(s.screen);
  const card = cardOf(s.card);
  return (
    <Scene
      id={`light-${light}-${card}`}
      screen={screen}
      title="The home's first screen, lit"
      measure={measureCard}
    >
      <HeroDrawn card={card} light={light} />
    </Scene>
  );
}
