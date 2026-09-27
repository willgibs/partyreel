"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import {
  type Bp,
  BUILT,
  FRAME_SIZES,
  frameAt,
  GEO,
  LG_MIN,
  phaseOf,
  REVEAL_MS,
  restPhase,
  revealEase,
  STREAM_FRAMES,
} from "@/components/marketing/sections/home/hero-stream";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { AlbumObject, LinkObject, PageObject, TodayObject } from "./cards";
import { CinemaRoom, px, Scene, stopLinks, useOffStage } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * THE HOME'S FIRST SCREEN, WITH ONE THING CHANGED: THE OBJECT.
 *
 * Everything but the object is `cinema-hero.tsx` as it ships: the site header
 * over it, the band on `hero-stream.ts`'s own tables and loop, the ruled block
 * at the measured clear line. Two things are added, and both are said here so
 * nobody mistakes them for a proposal:
 *
 * ★ THE EYEBROW IS `demo-doors`' AND IS DRAWN AS A STAND-IN. His "Try our demo
 * event" over the H1 is being built beside this board; until it lands it is
 * drawn in the eyebrow atom's own register (`system/eyebrow.tsx`: the label
 * step, uppercase, muted) with the learn chevron, as the FIRST LINE OF THE
 * BLOCK, so it hangs at the measured clear line and the headline moves down
 * under it. Every caption measures the object's air to the eyebrow, because
 * that is now the nearest word.
 *
 * ★ A CARD STANDS IN THE MIDDLE OF ITS AIR, NOT ON THE AXIS (a carried call,
 * his to overrule). Today's object is centred on the axis, which leaves it
 * 131px under the header and 25px over the words at 1440 (100 and 7 at 375).
 * A card stands at the midpoint between the header's foot and the block's top
 * instead, the axis passing through its lower half, so the band still leaves
 * from behind it and its air is even. The midpoint is a `calc()` on the
 * hero's own numbers, so it holds at any screen height.
 */

export type HeroId = "today" | "album" | "page" | "link";

const OBJECTS: Record<HeroId, { Obj: () => ReactNode; place: Place }> = {
  today: { Obj: TodayObject, place: "axis" },
  album: { Obj: AlbumObject, place: "mid" },
  page: { Obj: PageObject, place: "mid" },
  link: { Obj: LinkObject, place: "mid" },
};

/**
 * Where an object's centre stands: on the band's axis, or mid-air.
 *
 * ★ FOR THE WIRING ROUND: THE MIDPOINT NEEDS A FLOOR IN PRODUCTION. The board
 * draws two real screens (900 and 812 tall), where the axis runs through a
 * card's lower half. The axis rides 36 percent of the hero (32 below `lg`)
 * while the midpoint rides half of it, so on a tall enough screen (at `lg`,
 * about 1450px for the album card and 1150 for the link's shorter object) the
 * card lifts clear of the axis and the band would be born in the open under
 * it. Production's calc takes the larger of the midpoint and `axis - (half the
 * card - about 30px)`, so the card always covers where the frames are born.
 */
type Place = "axis" | "mid";

const PLACE: Record<Place, string> = {
  axis: "var(--hhs-axis)",
  mid: "calc((var(--mkt-header-h, 4rem) + var(--hhs-axis) + var(--hhs-low)) / 2)",
};

/* ── The hero ────────────────────────────────────────────────────────────── */

/** The frames, solved once at module load, exactly as the hero solves them. */
const FRAMES = BUILT.lg.cards.map((lg, i) => {
  const base = BUILT.base.cards[i];
  const lgBox = BUILT.lg.box[i];
  const baseBox = BUILT.base.box[i];
  const lgRest = frameAt(lg, restPhase(lg), "lg", lgBox.fit);
  const baseRest = frameAt(base, restPhase(base), "base", baseBox.fit);
  return {
    key: lg.key,
    image: marketingImage(STREAM_FRAMES[lg.photo % STREAM_FRAMES.length]),
    style: {
      "--hhs-w-base": `${baseBox.w}px`,
      "--hhs-h-base": `${baseBox.h}px`,
      "--hhs-w-lg": `${lgBox.w}px`,
      "--hhs-h-lg": `${lgBox.h}px`,
      "--hhs-rest-base": baseRest.transform,
      "--hhs-rest-o-base": baseRest.opacity,
      "--hhs-rest-lg": lgRest.transform,
      "--hhs-rest-o-lg": lgRest.opacity,
      "--hhs-z-base": baseRest.z,
      "--hhs-z-lg": lgRest.z,
    } as CSSProperties,
  };
});

/** The layout's numbers, the `-base` / `-lg` pairs the sheet chooses between. */
const LAYOUT = Object.fromEntries(
  (["base", "lg"] as const).flatMap((bp) => [
    [`--hhs-axis-pct-${bp}`, `${GEO[bp].axisPct}%`],
    [`--hhs-axis-min-${bp}`, `${BUILT[bp].axisMin}px`],
    [`--hhs-below-${bp}`, `${BUILT[bp].below}px`],
    [`--hhs-min-h-${bp}`, `${BUILT[bp].minH}px`],
    [`--hhs-low-${bp}`, `${BUILT[bp].low}px`],
    [`--hhs-fade-${bp}`, GEO[bp].fade],
    [`--hhs-persp-${bp}`, `${GEO[bp].perspective}px`],
    [`--hhs-qr-${bp}`, `${GEO[bp].qr}px`],
    [`--hhs-h1-max-${bp}`, `${GEO[bp].h1Max}px`],
    [`--hhs-low-max-${bp}`, `${GEO[bp].lowMax}px`],
  ]),
) as CSSProperties;

/** The home's first screen, the object in its slot. */
function HeroDrawn({ object, place }: { object: ReactNode; place: Place }) {
  const section = useRef<HTMLElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const zNow = useRef<number[]>([]);
  const elapsed = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;

  /**
   * THE BAND'S LOOP, production's own closed form (`cinema-hero.tsx`), the
   * clock held outside the effect so a return resumes rather than re-bursts.
   * Two things differ, and both are the frame's: the breakpoint is read off
   * the FRAME's window (the lab's is wider than a 375 frame), and a hidden
   * option holds still (`useOffStage`), since a step draws all four at once.
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
    let bp: Bp = mq.matches ? "lg" : "base";
    const onChange = () => {
      bp = mq.matches ? "lg" : "base";
    };
    mq.addEventListener("change", onChange);
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      const { cards, box, cycle } = BUILT[bp];
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const at = phaseOf(cards[i], elapsed.current, reveal, cycle);
        if (at > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = frameAt(cards[i], at, bp, box[i].fit);
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
  }, [reduced, still]);

  return (
    <CinemaRoom className="h-full">
      <div className="h-full" onClickCapture={stopLinks}>
        <MarketingHeader skin="cinema" overlay />
        <section
          ref={(el) => {
            section.current = el;
            pauseRef(el);
          }}
          style={LAYOUT}
          className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
        >
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
                  style={f.style}
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

          {/* The object's point: the axis, or the middle of its air. Each
              object centres itself on it. */}
          <div className="absolute left-1/2 z-10" style={{ top: PLACE[place] }}>
            <Link
              href="/demo"
              aria-label="Open the live demo"
              className="block transition-transform duration-150 active:scale-[0.99]"
            >
              {object}
            </Link>
          </div>

          <div
            className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 lg:px-8"
            style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
          >
            {/* demo-doors' eyebrow, drawn as a stand-in (the header note).
                One margin at both sizes: a lab-only `lg:` beside production's
                `mb-4` would lose to it (the kit's
                `lab-utility-loses-to-production` trap). */}
            <p data-hero-eyebrow className="mb-4 flex justify-center">
              <Link
                href="/demo"
                className="mkt-learn inline-flex items-center gap-1 text-label font-medium text-white/70 uppercase transition-colors duration-150 hover:text-white"
              >
                Try our demo event
                <LearnChevron />
              </Link>
            </p>
            <h1
              data-hero-h1
              className="mx-auto font-heading text-hero text-balance text-white"
              style={{ maxWidth: "var(--hhs-h1-max)" }}
            >
              {SITE_THESIS}
            </h1>
            <p
              className="mx-auto mt-4 text-copy text-pretty text-white/80 lg:mt-5"
              style={{ maxWidth: "var(--hhs-low-max)" }}
            >
              {SITE_SUBHEAD}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 lg:mt-7">
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
 * Every PAINTED box under an element, unioned: a plate hanging off a corner
 * or a print standing out of a card is part of the object a reader sees.
 * Painted means a photograph, a code or a filled surface; a wrapper's own
 * layout box is not.
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

/** The one visible copy of a thing, when a breakpoint pair draws two. */
function shown<T extends Element>(all: NodeListOf<T> | T[]): T | undefined {
  return [...all].find((n) => n.getBoundingClientRect().width > 0);
}

function measureHero(id: HeroId, root: HTMLElement, win: Window) {
  const obj = root.querySelector("[data-hero-object]");
  const brow = root.querySelector("[data-hero-eyebrow]");
  const header = root.querySelector("header");
  if (!obj || !brow || !header) return null;
  const box = extentOf(obj, win);
  if (!Number.isFinite(box.top)) return null;
  const over = box.top - header.getBoundingClientRect().bottom;
  const under = brow.getBoundingClientRect().top - box.bottom;
  const where = `${px(box.w)} by ${px(box.h)}, ${px(over)} under the header and ${px(under)} over the eyebrow`;
  if (id === "today") {
    return `The object is ${where}. One photograph; its code ${px(codeOf(obj))} on the corner plate.`;
  }
  const drawn = (sel: string) =>
    [...obj.querySelectorAll(sel)].filter(
      (n) => n.getBoundingClientRect().width > 0,
    ).length;
  const photos = drawn("[data-card-photo]");
  const videos = drawn("[data-card-video]");
  const code = codeOf(obj);
  const slug = shown(obj.querySelectorAll<HTMLElement>("[data-hero-slug]"));
  const size = slug
    ? Number.parseFloat(win.getComputedStyle(slug).fontSize)
    : 0;
  const faces = shown(obj.querySelectorAll("[data-card-faces]"));
  const people = faces
    ? faces.querySelectorAll("[data-slot=avatar]").length
    : 0;
  const code_ = code > 0 ? `the code ${px(code)}` : "the QR chip";
  const who = people > 0 ? `, ${people} guests' faces` : "";
  const film = videos > 0 ? ` (${videos} a video)` : "";
  return `The card is ${where}: ${photos} photographs${film}, ${code_}, the link at ${px(size)}${who}.`;
}

/** The drawn code's edge (FooterQr's svg, quiet zone included), or 0. */
function codeOf(obj: Element): number {
  const svg = [...obj.querySelectorAll("svg[shape-rendering=crispEdges]")].find(
    (s) => s.getBoundingClientRect().width > 0,
  );
  return svg ? svg.getBoundingClientRect().width : 0;
}

export function heroPreview(s: BoardState, id: HeroId) {
  const screen: ScreenId = screenOf(s.screen);
  const { Obj, place } = OBJECTS[id];
  return (
    <Scene
      id={`card-${id}`}
      screen={screen}
      title="The home's first screen"
      measure={(root, win) => measureHero(id, root, win)}
    >
      <HeroDrawn object={<Obj />} place={place} />
    </Scene>
  );
}
