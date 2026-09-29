"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import {
  BUILT,
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
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Glow } from "@/components/shared/glow";
import { GlowFilter } from "@/components/shared/glow-filter";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import {
  DEMO_CTA_LABEL,
  SITE_SUBHEAD,
  SITE_THESIS,
} from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import type { TouchId } from "./card";
import type { Party } from "./fixtures";
import { CinemaRoom, stopLinks, useOffStage } from "./scene";
import { rateAt, type Score, TOGETHER_RATE, typedAt } from "./typing";

/**
 * THE HOME'S FIRST SCREEN, AS PRODUCTION DRAWS IT, WITH WHAT THIS ROUND ASKS.
 *
 * Everything is `cinema-hero.tsx` as it ships (the site header over it, the
 * card's lamp, the band on `hero-stream.ts`'s own three tables and loop, the
 * block at the measured clear line) except three things the round asks about:
 * the object (the card, or the address on the stage), how the address moves
 * with the stream (`Motion`), and the touch that says the object opens. The
 * eyebrow is gone from every drawing: his round one note dropped it.
 *
 * ★ THE BLOCK WITHOUT ITS EYEBROW IS RE-SOLVED AS PRODUCTION SOLVES IT. The
 * eyebrow was the block's first line inside the measured `GEO.blockH` (28 px
 * of line and air from the tablet up, 36 at a phone), so the block's reach
 * below the axis and the hero's floor lose exactly that; the clear line the
 * block hangs from is the stream's, and it does not move. At 1440 by 900 the
 * axis drops 4 px; at 375 by 812 nothing but the block's foot moves.
 *
 * ★ ONE CLOCK DRIVES THE BAND AND THE TYPEWRITER, so `turns` can hand the
 * stage from one to the other: the loop integrates the band's own clock at the
 * pace the score asks for (full, a drift, or `together`'s calm), and the
 * branch-out keeps the wall clock, so it is the same burst in every option.
 *
 * ★ THE LOOP READS THE FRAME'S WINDOW: the breakpoint is the frame's (the
 * lab's window is wider than a 375 frame), a hidden option holds still
 * (`useOffStage`, since a step draws every option at once), and reduced motion
 * leaves the sheet's rest state standing with the demo's own address, still.
 */

export type Motion = "still" | "turns" | "together" | "stage";

/** The eyebrow's measured line and air, per geometry (`hero-stream.ts` `Geo.blockH`). */
const EYEBROW: Record<Geometry, number> = { base: 36, tablet: 28, lg: 28 };

const MIN_WIDTH: Record<Geometry, number> = {
  base: 0,
  tablet: TABLET_MIN,
  lg: LG_MIN,
};

/** A desk's press opens the demo's modal from 640 up (the Sheet's split), and a
 *  pointer's lift answers there only: a phone has no pointer to lift under. */
const DESK_MIN = 640;

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

/** Production's layout numbers, the per-geometry triples the sheet picks from,
 *  with or without the eyebrow's line in the block (see the header). */
function layoutOf(eyebrow: boolean): CSSProperties {
  return Object.fromEntries(
    GEOMETRIES.flatMap((g) => {
      const less = eyebrow ? 0 : EYEBROW[g];
      return [
        [`--hhs-axis-pct-${g}`, `${GEO[g].axisPct}%`],
        [`--hhs-axis-min-${g}`, `${BUILT[g].axisMin}px`],
        [`--hhs-below-${g}`, `${BUILT[g].below - less}px`],
        [`--hhs-min-h-${g}`, `${BUILT[g].minH - less}px`],
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
      ];
    }),
  ) as CSSProperties;
}

const LAYOUT = { home: layoutOf(false), withEyebrow: layoutOf(true) };

/** The header's scroll postures, undone for a drawing (the frames sit far
 *  down the lab page, whose scroll the header reads). */
const PINNED =
  "[data-df-hero] header[data-hidden]{translate:none!important}[data-df-hero] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}";

/** How long a pace between the lamp's swells is, under `lamp` (the touch). */
const SWELL_EVERY_MS = 6500;
const SWELL_MS = 2200;

/** The card's lamp box: production's `CardLamp`, 520 tall and min(680px, 150vw) wide. */
export const CARD_LAMP = { w: "min(680px, 150vw)", h: 520 };

/**
 * THE LAMP'S SWELL, under `lamp` (the touch): now and then the second lamp
 * rises and settles, on the in-out curve the house moves things across a
 * screen on. Never under reduced motion, and never in a hidden option.
 */
export function useSwell(
  ref: React.RefObject<HTMLDivElement | null>,
  on: boolean,
) {
  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    const win = el.ownerDocument.defaultView ?? window;
    let run: Animation | null = null;
    const go = () => {
      run = el.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.42 }, { opacity: 0 }],
        { duration: SWELL_MS, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
      );
    };
    const first = win.setTimeout(go, 2400);
    const every = win.setInterval(go, SWELL_EVERY_MS);
    return () => {
      win.clearTimeout(first);
      win.clearInterval(every);
      run?.cancel();
    };
  }, [ref, on]);
}

/**
 * THE OBJECT'S LAMP: production's `CardLamp`, the bloom behind the card, its
 * box sized to what it lights. Under `lamp` a second lamp over it swells and
 * settles now and then: the house's own light, from the same point, which is
 * the whole of that touch.
 */
export function ObjectLamp({
  w,
  h,
  swell,
}: {
  w: string;
  h: number;
  swell: React.RefObject<HTMLDivElement | null> | null;
}) {
  const box = `pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2`;
  const size = { width: w, height: h };
  return (
    <>
      <div aria-hidden className={box} style={size}>
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
      {swell ? (
        <div
          ref={swell}
          aria-hidden
          data-df-swell
          className={box}
          style={{ ...size, opacity: 0 }}
        >
          <Glow
            shape="bloom"
            drive="mask"
            vars={{
              "--glw-from-x": "50%",
              "--glw-from-y": "50%",
              "--glw-reach": "50%",
              "--glw-strength": "0.9",
              "--glw-base": "0.9",
              "--glw-blur": "30px",
            }}
          />
        </div>
      ) : null}
    </>
  );
}

/** What the object is drawn from, each frame of the loop. */
export type Live = {
  /** Whose address stands: 0 is the demo's own. */
  readonly standing: number;
  /** Whether the standing party's prints are dealt out (`stage`). */
  readonly dealt: boolean;
  /** Under a pointer or its focus, at a desk. */
  readonly lifted: boolean;
  /** Reduced motion or a paused frame. */
  readonly still: boolean;
};

export function HeroStage({
  motion,
  score,
  parties,
  touch,
  object,
  block,
  lamp,
  forceLift = false,
  eyebrow = false,
}: {
  motion: Motion;
  /** The typewriter's score, or null for a still address. */
  score: Score | null;
  /** Every party the loop visits, the demo's own first. */
  parties: readonly Party[];
  touch: TouchId;
  object: (live: Live) => ReactNode;
  block: ReactNode;
  /** The lamp's box: as wide as what it lights. */
  lamp: { w: string; h: number };
  /** Draw the object lifted, as a pointer would (a specimen, not a page). */
  forceLift?: boolean;
  /** Whether the block keeps an eyebrow line (a feature page's own label). */
  eyebrow?: boolean;
}) {
  const section = useRef<HTMLElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const swell = useRef<HTMLDivElement | null>(null);
  const zNow = useRef<number[]>([]);
  const elapsed = useRef(0);
  const bandClock = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;
  const band = motion !== "stage";

  const [standing, setStanding] = useState(0);
  const [dealt, setDealt] = useState(true);
  const [hovered, setHovered] = useState(false);
  const shown = useRef({ standing: 0, dealt: true });

  // Reduced motion reads the demo's own address, its own prints, still.
  const live: Live = {
    standing: reduced ? 0 : standing,
    dealt: reduced ? true : dealt,
    lifted: forceLift || hovered,
    still: still || reduced,
  };

  useEffect(() => {
    const root = section.current;
    const els = nodes.current;
    const typedEls = () =>
      root
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-df-typed]"))
        : [];
    const caretEls = () =>
      root
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-df-caret]"))
        : [];
    const write = (text: string, caret: number) => {
      for (const el of typedEls()) {
        const node = el.firstChild;
        if (node && node.nodeValue !== text) node.nodeValue = text;
      }
      for (const el of caretEls()) {
        const o = caret.toFixed(2);
        if (el.style.opacity !== o) el.style.opacity = o;
      }
    };
    if (reduced) {
      for (const el of els) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      zNow.current = [];
      write(parties[0]?.slug ?? "", 0);
      return;
    }
    if (still) return;
    const win = root?.ownerDocument.defaultView ?? window;
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
    // Where each frame's cycle stood last frame, to catch its relaunch.
    const lastMod: number[] = [];
    let poured = 0;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;

      let rate = motion === "together" ? TOGETHER_RATE : 1;
      if (score && score.steps.length > 1) {
        const typed = typedAt(score, elapsed.current);
        write(typed.text, typed.caret);
        if (motion === "turns") rate = rateAt(score, elapsed.current);
        const isDealt = typed.phase === "hold";
        if (typed.standing !== shown.current.standing) {
          shown.current.standing = typed.standing;
          setStanding(typed.standing);
        }
        if (isDealt !== shown.current.dealt) {
          shown.current.dealt = isDealt;
          setDealt(isDealt);
        }
      }
      if (!band) return;
      bandClock.current += dt * rate;

      const { cards, box, cycle } = BUILT[g];
      // The branch-out keeps the wall clock: the same burst in every option.
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      const pours = parties[shown.current.standing]?.pours ?? STREAM_FRAMES;
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const m =
          (((cards[i].at * reveal + bandClock.current) % cycle) + cycle) %
          cycle;
        // A frame whose cycle wrapped has just been reborn behind the card:
        // under `together` it takes the standing party's next photograph.
        if (
          motion === "together" &&
          lastMod[i] !== undefined &&
          m < lastMod[i]
        ) {
          const img = imgs.current[i];
          const next = marketingImage(pours[poured++ % pours.length]).src;
          if (img && !img.src.endsWith(next)) img.src = next;
        }
        lastMod[i] = m;
        const at = phaseOf(cards[i], bandClock.current, reveal, cycle);
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
  }, [reduced, still, motion, score, parties, band]);

  useSwell(swell, touch === "lamp" && !reduced && !still);

  // A pointer lifts the object only at a desk's width, which is the frame's.
  const desk = () =>
    (section.current?.ownerDocument.defaultView?.innerWidth ?? 0) >= DESK_MIN;

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
          data-df-motion={motion}
          style={eyebrow ? LAYOUT.withEyebrow : LAYOUT.home}
          className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
        >
          <div className="hhs-object absolute left-1/2">
            <ObjectLamp
              w={lamp.w}
              h={lamp.h}
              swell={touch === "lamp" ? swell : null}
            />
          </div>
          {band ? (
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
                        ref={(el) => {
                          imgs.current[i] = el;
                        }}
                        src={f.image.src}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="hhs-object absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <Link
              href="/demo"
              aria-label="Open the live demo"
              data-df-door
              className="block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-background active:scale-[0.99]"
              style={{ transition: "scale 150ms var(--ease-emphasis)" }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && desk()) setHovered(true);
              }}
              onPointerLeave={() => setHovered(false)}
              onFocus={() => {
                if (desk()) setHovered(true);
              }}
              onBlur={() => setHovered(false)}
            >
              {object(live)}
            </Link>
          </div>

          <div
            className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 md:px-8"
            style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
          >
            {block}
          </div>
        </section>
      </div>
    </CinemaRoom>
  );
}

/** The two actions, as the home draws them (the reel a still button here). */
function Actions({ demo }: { demo?: boolean }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:mt-7">
      <Button asChild size="cta">
        <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
      </Button>
      {demo ? (
        // `DemoCtaLink`'s own face, as a plain link: a board never opens the
        // page's demo modal (its door would open it on the lab page).
        <Link
          href="/demo"
          className="mkt-learn inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <LiveDot />
          <span className="inline-flex items-center gap-1">
            {DEMO_CTA_LABEL}
            <LearnChevron />
          </span>
        </Link>
      ) : (
        <Button
          size="cta"
          variant="outline"
          tabIndex={-1}
          className="gap-2 border-white/35 bg-white/5 px-5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
        >
          <Play className="size-4 fill-current" />
          Watch a sample reel
        </Button>
      )}
    </div>
  );
}

/** THE HOME'S BLOCK, WITHOUT ITS EYEBROW: the headline is its first line now. */
export function HomeBlock() {
  return (
    <>
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
      <Actions />
    </>
  );
}

/**
 * THE QR CODE PAGE'S BLOCK, IN THE HOME'S COMPOSITION (`stage=centre` moves
 * the card and its stream there): the page's own label, headline, sentence
 * and actions from `feature-pages.ts`, centred at the clear line the stream
 * leaves, with the headline at the feature pages' own size.
 */
export function QrBlock() {
  const page = featurePage("qr");
  return (
    <>
      <div className="mt-3 mb-2 flex justify-center md:mt-0 md:mb-3">
        <Eyebrow>{page.navLabel}</Eyebrow>
      </div>
      <h1
        className="mx-auto font-heading text-title text-balance text-white"
        style={{ maxWidth: "var(--hhs-h1-max)" }}
      >
        {page.h1}
      </h1>
      <p
        className="mx-auto mt-4 text-copy text-pretty text-white/80 md:mt-5"
        style={{ maxWidth: "var(--hhs-low-max)" }}
      >
        {page.heroSub}
      </p>
      <Actions demo />
    </>
  );
}
