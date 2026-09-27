"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import type { BoardState } from "@/components/lab/board-spec";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
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
import { DemoFrame } from "@/components/marketing/system/demo-ticket";
import { qrSpanOf } from "@/components/shared/river/qr-plate";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import { px, useOffStage } from "./parts";
import { CinemaRoom, Scene, stopLinks } from "./scene";
import { type ScreenId, screenOf } from "./screens";

/**
 * THE HOME HERO'S OBJECT, POLISHED: FOUR OBJECTS IN THE ONE REAL HERO.
 *
 * Everything but the object is `cinema-hero.tsx` as it ships: the site header
 * over it, the band on `hero-stream.ts`'s own tables and loop, the ruled block
 * at the measured clear line. Only the thing the album streams out of changes,
 * so the four frames differ in exactly what the question asks.
 *
 * ★ WHAT TODAY'S OBJECT GETS WRONG, MEASURED ON THE SHIPPED HERO (2026-09-27).
 * Its mat is `bg-card`, which on the cinema ground is near-black, so the mat
 * reads as a dark box with a grey hairline rather than as anything held: the
 * exact failure `event-object.tsx` names ("a border in it is a GAP") and
 * solves with literal white paper. Its code hangs off the corner on a white
 * plate of its own, off the band's axis in a composition that is otherwise
 * symmetric about it. And it sits centred on the axis, so at 375 it ends 6px
 * above the headline with 100px of air over it (24 and 131 at 1440).
 *
 * ★ THE POLISHED TAKES' CODE IS `/demo`, THE QR DOOR'S VALUE (Will's
 * `opens=short`): 25 modules against the event link's 33, so the same pixels
 * scan (`qr-plate.tsx`'s floor, 3px a module). A carried call, his to overrule.
 *
 * The object is drawn at both breakpoints as a CSS pair, exactly as `DemoQr`
 * does, so a frame at 375 and one at 1440 each wear the size the page would.
 */

export type HeroId = "today" | "refined" | "print" | "plate";

/** What today's object encodes: `DemoQr`'s own value. */
const TODAY_VALUE = DEMO_EVENT_URL ?? "https://partyreel.com";

/** What the polished takes encode: the QR door's short value. */
const SHORT_VALUE = `${SITE_URL}/demo`;

/* ── The objects ─────────────────────────────────────────────────────────── */

/**
 * Both breakpoints' drawings at once, one hidden by CSS: `DemoQr`'s pair.
 *
 * ★ ONE DISPLAY UTILITY PER BOX, NEVER A PAIR. The lab's utilities compile
 * into a sublayer of production's (`utilities.lab`), and a rule directly in a
 * layer beats every rule in its sublayers, so `hidden lg:contents` stays
 * hidden at 1440: production generates `hidden` and only the lab generates
 * `lg:contents` (measured, 2026-09-27). A lone `max-lg:hidden` has nothing to
 * lose to.
 */
function ByBp({ base, lg }: { base: ReactNode; lg: ReactNode }) {
  return (
    <>
      <div className="lg:hidden">{base}</div>
      <div className="max-lg:hidden">{lg}</div>
    </>
  );
}

/** Paper: literal white, never `bg-card` (`event-object.tsx`'s own rule).
 *  A flex box, so a code inside it is never sat on a line box (an
 *  inline-flex child of a block paper grew six pixels of descender under the
 *  code, measured). */
function Paper({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("flex bg-white ring-1 ring-black/10", className)}
      style={style}
    >
      {children}
    </span>
  );
}

/** A photograph in its window, the tile radius, filling the box it is given. */
function Photo({ id, w, h }: { id: string; w: number; h: number }) {
  const img = marketingImage(id);
  return (
    <span
      className="relative block overflow-hidden rounded-[var(--radius-tile)]"
      style={{ width: w, height: h }}
    >
      <Image
        src={img.src}
        alt=""
        fill
        sizes={`${w}px`}
        className="object-cover"
      />
    </span>
  );
}

/** The one still every take carries, as today's does: the wedding arch. */
const STILL = "wedding-arch";

/** `today`: the shipped `DemoFrame`, centred on the axis as `DemoQr` sets it. */
function TodayObject() {
  return (
    <span data-hero-object className="block -translate-x-1/2 -translate-y-1/2">
      <ByBp
        base={<DemoFrame value={TODAY_VALUE} size="heroCompact" />}
        lg={<DemoFrame value={TODAY_VALUE} size="hero" />}
      />
    </span>
  );
}

/**
 * `refined`: TODAY'S ANATOMY, MADE WITH CARE. The same two pieces, a
 * photograph and its code, each on paper: the print white with a thin border,
 * and the code on a card of the same stock set into its corner at a slight
 * turn, so the overlap reads as a card someone tucked there rather than a
 * badge stuck on. Lifted a little off the axis so the air over and under it
 * evens out (today's is all over it).
 */
const REFINED = {
  lg: { photo: { w: 184, h: 220 }, pad: 6, code: 100, off: 26 },
  base: { photo: { w: 124, h: 148 }, pad: 5, code: 72, off: 16 },
} as const;

function RefinedAt({ bp }: { bp: Bp }) {
  const g = REFINED[bp];
  return (
    <span className="relative block -translate-x-1/2 -translate-y-[57%]">
      <Paper className="rounded-[8px] shadow-layer" style={{ padding: g.pad }}>
        <Photo id={STILL} {...g.photo} />
      </Paper>
      <Paper
        className="absolute rotate-[4deg] rounded-[8px] shadow-lift"
        style={{ padding: g.pad, right: -g.off, bottom: -g.off }}
      >
        <FooterQr value={SHORT_VALUE} size={g.code} className="p-0" />
      </Paper>
    </span>
  );
}

function RefinedObject() {
  return (
    <span data-hero-object className="block">
      <ByBp base={<RefinedAt bp="base" />} lg={<RefinedAt bp="lg" />} />
    </span>
  );
}

/**
 * `print`: ONE PIECE OF PAPER, THE CODE PRINTED ON IT. The photograph above,
 * the code in the print's deeper foot, and the print hung so the CODE sits on
 * the band's axis: the album leaves the code again, as the hero's own concept
 * says, and the photograph stands above the band. The code's quiet zone is the
 * paper's own margin (FooterQr bakes four modules into its box), so nothing is
 * a second plate. `lift` is how far the print rises over the axis: its
 * photograph and top margin, plus half the code.
 */
const PRINT = {
  lg: { photo: 160, pad: 10, code: 104, gap: 2, foot: 4 },
  base: { photo: 108, pad: 8, code: 84, gap: 2, foot: 3 },
} as const;

function PrintAt({ bp }: { bp: Bp }) {
  const g = PRINT[bp];
  const lift = g.pad + g.photo + g.gap + g.code / 2;
  return (
    <span
      className="block"
      style={{ transform: `translate(-50%, -${lift}px)` }}
    >
      <Paper
        className="flex flex-col items-center rounded-[8px] shadow-layer"
        style={{
          padding: `${g.pad}px ${g.pad}px ${g.foot}px`,
          gap: g.gap,
        }}
      >
        <Photo id={STILL} w={g.photo} h={g.photo} />
        <FooterQr value={SHORT_VALUE} size={g.code} className="p-0" />
      </Paper>
    </span>
  );
}

function PrintObject() {
  return (
    <span data-hero-object className="block">
      <ByBp base={<PrintAt bp="base" />} lg={<PrintAt bp="lg" />} />
    </span>
  );
}

/**
 * `plate`: THE CODE ALONE, AT THE QR DOOR'S FINISH. The object the band's
 * geometry was solved for (`GEO.qr`, 144 and 128, and `PLATE_PAD`), dressed
 * the way the QR door dresses its plate (`.rvr-plate`: white, the tile
 * radius, a deep two-part shadow), which Will called the first truly
 * beautiful card. Nothing else: the band is the photographs.
 */
const PLATE_SHADOW =
  "0 8px 16px -4px oklch(0 0 0 / 0.45), 0 16px 32px -8px oklch(0 0 0 / 0.55)";

function PlateAt({ bp }: { bp: Bp }) {
  return (
    <span
      className="flex -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-tile)] bg-white p-2"
      style={{ boxShadow: PLATE_SHADOW }}
    >
      <FooterQr value={SHORT_VALUE} size={GEO[bp].qr} className="p-0" />
    </span>
  );
}

function PlateObject() {
  return (
    <span data-hero-object className="block">
      <ByBp base={<PlateAt bp="base" />} lg={<PlateAt bp="lg" />} />
    </span>
  );
}

const OBJECTS: Record<HeroId, () => ReactNode> = {
  today: TodayObject,
  refined: RefinedObject,
  print: PrintObject,
  plate: PlateObject,
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
export function HeroDrawn({ object }: { object: ReactNode }) {
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

          {/* The axis point. Each object places itself against it, because
              the print hangs by its code rather than by its middle. */}
          <div
            className="absolute left-1/2 z-10"
            style={{ top: "var(--hhs-axis)" }}
          >
            <Link
              href="/demo"
              aria-label="Scan with your phone, or tap to open the live demo"
              className="block transition-transform duration-150 active:scale-[0.99]"
            >
              {object}
            </Link>
          </div>

          <div
            className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 lg:px-8"
            style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
          >
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
 * Every PAINTED box under an element, unioned: the plate that hangs off the
 * corner is part of the object a reader sees. Painted means a photograph, a
 * code or a filled surface; a wrapper's own layout box is not, because an
 * object translated off its anchor leaves that box behind at the anchor.
 */
function extentOf(el: Element, win: Window) {
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;
  for (const node of [el, ...el.querySelectorAll("*")]) {
    const cs = win.getComputedStyle(node);
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

function measureHero(id: HeroId, root: HTMLElement, win: Window) {
  const obj = root.querySelector("[data-hero-object]");
  const h1 = root.querySelector("[data-hero-h1]");
  const header = root.querySelector("header");
  const svg = [...(obj?.querySelectorAll("svg") ?? [])].find(
    (s) => s.getBoundingClientRect().width > 0,
  );
  if (!obj || !h1 || !header || !svg) return null;
  const box = extentOf(obj, win);
  // The svg's own layout width, never its box on screen: a turned card's
  // bounding box is wider than the code it holds.
  const code = svg.clientWidth || svg.getBoundingClientRect().width;
  const span = qrSpanOf(id === "today" ? TODAY_VALUE : SHORT_VALUE);
  const per = code / span;
  const over = box.top - header.getBoundingClientRect().bottom;
  const under = h1.getBoundingClientRect().top - box.bottom;
  const scans = per >= 3 ? "scans" : "under the 3px scan floor";
  return `The object is ${px(box.w)} by ${px(box.h)}, ${px(over)} under the header and ${px(under)} over the headline. Its code is ${px(code)} for ${span} modules, quiet zone included: ${per.toFixed(1)}px a module (${scans}).`;
}

export function heroPreview(s: BoardState, id: HeroId) {
  const screen: ScreenId = screenOf(s.screen);
  const Obj = OBJECTS[id];
  return (
    <Scene
      id={`hero-${id}`}
      screen={screen}
      viewport="screen"
      title="The home's first screen"
      measure={(root, win) => measureHero(id, root, win)}
    >
      <HeroDrawn object={<Obj />} />
    </Scene>
  );
}
