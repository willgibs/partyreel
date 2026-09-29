"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import {
  BUILT,
  FRAME_SIZES,
  frameAt,
  GEO,
  type Geometry,
  GEOMETRIES,
  LG_MIN,
  phaseOf,
  REVEAL_MS,
  restPhase,
  revealEase,
  STREAM_FRAMES,
  TABLET_MIN,
  TABLET_STEP,
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

import { CinemaRoom, stopLinks, useOffStage } from "./scene";

/**
 * THE HOME'S FIRST SCREEN, WITH ONE THING CHANGED: THE CARD.
 *
 * Everything but the object is `cinema-hero.tsx` as it ships: the site header
 * over it, the card's lamp, the band on `hero-stream.ts`'s own three tables
 * and loop, and the block at the measured clear line, its first line the demo
 * door's "Try our demo event" with the live dot. The object slot takes the
 * board's mock card, so a party is judged where the card really stands.
 *
 * ★ THE NUMBERS ARE SOLVED HERE AS PRODUCTION SOLVES THEM, from the same
 * exports (`BUILT`, `GEO`, `frameAt`), because `cinema-hero.tsx` keeps its
 * `LAYOUT` and `FRAMES` private. Each is the same expression over the same
 * tables, so a retuned hero re-solves this drawing with it.
 *
 * ★ THE HEADER IS PINNED AS THE TOP OF THE PAGE DRAWS IT. It hides on the way
 * down and fades its glass in once scrolled, and it reads the LAB page's
 * scroll: the frames sit far down the board, so both are undone here, and the
 * real first screen is read at the top of the page, bare header and all.
 *
 * ★ THE LOOP READS THE FRAME'S WINDOW: the breakpoint is the frame's (the
 * lab's window is wider than a 375 frame), a hidden option holds still
 * (`useOffStage`, since a step draws every option at once), and reduced motion
 * leaves the sheet's rest state standing, which is what `lab:demo` compares.
 */

const MIN_WIDTH: Record<Geometry, number> = {
  base: 0,
  tablet: TABLET_MIN,
  lg: LG_MIN,
};

/** Production's frames, one set of nodes for all three geometries. */
const FRAMES = BUILT.lg.cards.map((lg, i) => {
  const style: Record<string, string | number> = {};
  for (const g of GEOMETRIES) {
    const card = BUILT[g].cards[i];
    const box = BUILT[g].box[i];
    const rest = frameAt(card, restPhase(card), g, box.fit);
    style[`--hhs-w-${g}`] = `${box.w}px`;
    style[`--hhs-h-${g}`] = `${box.h}px`;
    style[`--hhs-rest-${g}`] = rest.transform;
    style[`--hhs-rest-o-${g}`] = rest.opacity;
    style[`--hhs-z-${g}`] = rest.z;
  }
  return {
    key: lg.key,
    image: marketingImage(STREAM_FRAMES[lg.photo % STREAM_FRAMES.length]),
    style: style as CSSProperties,
  };
});

/** Production's layout numbers, the per-geometry triples the sheet picks from. */
const LAYOUT = Object.fromEntries(
  GEOMETRIES.flatMap((g) => [
    [`--hhs-axis-pct-${g}`, `${GEO[g].axisPct}%`],
    [`--hhs-axis-min-${g}`, `${BUILT[g].axisMin}px`],
    [`--hhs-below-${g}`, `${BUILT[g].below}px`],
    [`--hhs-min-h-${g}`, `${BUILT[g].minH}px`],
    [`--hhs-low-${g}`, `${BUILT[g].low}px`],
    [`--hhs-lift-${g}`, `${BUILT[g].lift.toFixed(2)}px`],
    [`--hhs-fade-${g}`, GEO[g].fade],
    [`--hhs-persp-${g}`, `${GEO[g].perspective}px`],
    [`--hhs-h1-max-${g}`, `${GEO[g].h1Max}px`],
    [`--hhs-low-max-${g}`, `${GEO[g].lowMax}px`],
    [
      `--hhs-k-${g}`,
      g === "base" ? "0" : g === "lg" ? "1" : TABLET_STEP.toFixed(5),
    ],
  ]),
) as CSSProperties;

/** The header's scroll postures, undone for a drawing (the header note). */
const PINNED =
  "[data-df-hero] header[data-hidden]{translate:none!important}[data-df-hero] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}";

/** The card's lamp: production's `CardLamp`, the bloom behind the card. */
function CardLamp() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 h-[520px] w-[min(680px,150vw)] -translate-x-1/2 -translate-y-1/2"
    >
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
    </div>
  );
}

export function HomeHero({ card }: { card: ReactNode }) {
  const section = useRef<HTMLElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const zNow = useRef<number[]>([]);
  const elapsed = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;

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
    const tablet = win.matchMedia(`(min-width: ${MIN_WIDTH.tablet}px)`);
    const desk = win.matchMedia(`(min-width: ${MIN_WIDTH.lg}px)`);
    const read = (): Geometry =>
      desk.matches ? "lg" : tablet.matches ? "tablet" : "base";
    let g = read();
    const onChange = () => {
      g = read();
    };
    tablet.addEventListener("change", onChange);
    desk.addEventListener("change", onChange);
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      const { cards, box, cycle } = BUILT[g];
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const at = phaseOf(cards[i], elapsed.current, reveal, cycle);
        if (at > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = frameAt(cards[i], at, g, box[i].fit);
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
      tablet.removeEventListener("change", onChange);
      desk.removeEventListener("change", onChange);
    };
  }, [reduced, still]);

  return (
    <CinemaRoom>
      <style>{PINNED}</style>
      {/* The lamp's turbulence host, in THIS document: the root layout's lives
          in the lab page's, and a filter a frame cannot reach drops the whole
          chain, blur and all (glow.tsx's tripwire). */}
      <GlowFilter />
      <div data-df-hero className="h-full" onClickCapture={stopLinks}>
        <MarketingHeader skin="cinema" overlay />
        <section
          ref={(el) => {
            section.current = el;
            pauseRef(el);
          }}
          style={LAYOUT}
          className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
        >
          <div className="hhs-object absolute left-1/2">
            <CardLamp />
          </div>
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

          <div className="hhs-object absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <Link
              href="/demo"
              aria-label="Open the live demo"
              className="block transition-transform duration-150 active:scale-[0.99]"
            >
              {card}
            </Link>
          </div>

          <div
            className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 md:px-8"
            style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
          >
            {/* The demo door's eyebrow, as `cinema-hero.tsx` draws it: a plain
                link here, since a board never opens the page's demo modal. */}
            <div className="mt-3 mb-2 flex justify-center md:mt-0 md:mb-3">
              <Link
                href="/demo"
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
              className="mx-auto font-heading text-hero text-balance text-white"
              style={{ maxWidth: "var(--hhs-h1-max)" }}
            >
              {SITE_THESIS}
            </h1>
            <p
              className="mx-auto mt-4 text-copy text-pretty text-white/80 md:mt-5"
              style={{ maxWidth: "var(--hhs-low-max)" }}
            >
              {SITE_SUBHEAD}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:mt-7">
              <Button asChild size="cta">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button
                size="cta"
                variant="outline"
                tabIndex={-1}
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
