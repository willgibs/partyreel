"use client";

// The hero's own sheet, the one `cinema-hero.tsx` imports: the drawing stands
// on production's `hhs-` classes, so it cannot drift from the page it draws.
import "@/components/marketing/sections/home/cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  memo,
  type ReactNode,
  useEffect,
  useMemo,
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
  HEADER,
  LG_MIN,
  phaseOf,
  placeAt,
  REVEAL_MS,
  restPhase,
  revealEase,
  smoothstep,
  TABLET_MIN,
  TABLET_STEP,
} from "@/components/marketing/sections/home/hero-stream";
import { Glow } from "@/components/shared/glow";
import { GlowFilter } from "@/components/shared/glow-filter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { showCode } from "./code";
import { type Guest, type Party, titleOf } from "./fixtures";
import { HeroObject, type Stand, STANDS, type TakeId } from "./objects";
import { CinemaRoom, useOffStage } from "./scene";
import { comingAt, type Score, typedAt, warpAt } from "./typing";

/**
 * THE HOME'S FIRST SCREEN, AS PRODUCTION DRAWS IT, WITH AN OBJECT OF ROUND
 * FIVE ON ITS AXIS.
 *
 * Everything is `cinema-hero.tsx` as it ships (the site header over it, the
 * band on `hero-stream.ts`'s own three tables, the block at the measured clear
 * line, without the eyebrow his round one note dropped) except what the
 * round draws: the object (`objects.tsx`), the turns (the stream drifting
 * while an address types and leaving it at lightspeed as it lands, `warpAt`),
 * a guest's credit inside every photograph's corner, and a lamp lit in the
 * party's own hues.
 *
 * ★ THE STREAM IS BORN BEHIND THE OBJECT, ON ITS AXIS. The object stands on
 * the band's axis at the point its stand names (`STANDS`), never floated to
 * the middle of its air as the shipped card is, because the album has to
 * visibly leave it. The axis's floor is re-solved for the object's own box,
 * so it always clears the header.
 *
 * ★ ONE CLOCK. The loop reads the typewriter's score (`typing.ts`) and writes
 * the address, the card's name and the band from it each frame, and the
 * code once a landing; a photograph born after a landing is that party's,
 * and a landing's warp sweeps the old party's out ahead of it.
 *
 * ★ A CODE IS NEVER EMPTIED. It is rewritten as an address lands (`showCode`
 * with the new address, the dots that differ turning in a ripple from its
 * heart) and never folded away while the next is typed: round four's empty
 * tile read as a code still loading.
 *
 * ★ A CREDIT IN EVERY PHOTOGRAPH'S CORNER, INSIDE IT (his round two note): the
 * guest's face and first name on the glass's tint and edges, sized in the
 * photograph's own units (`cqmin`), arriving once the photograph is large
 * enough to carry a name.
 *
 * ★ THE LOOP READS THE FRAME'S WINDOW: the breakpoint is the frame's, a hidden
 * option holds still (`useOffStage`), and reduced motion leaves the sheet's
 * rest state standing: the demo's own address, code and card, every
 * photograph credited, nothing typed.
 */

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

/** Room over the object's painted top for its lift and shadow. */
const OVERSHOOT = 10;

/**
 * Where a photograph's credit fades in, as its transform scale (0.17 at the
 * object, 0.92 at the edge): from about a third of its full size, so the
 * photographs crowding the object carry no specks of chips.
 */
const CREDIT_FROM = 0.3;
const CREDIT_TO = 0.46;

const mod = (a: number, n: number) => ((a % n) + n) % n;

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
  return { key: lg.key, photo: lg.photo, style: style as CSSProperties };
});

/**
 * PRODUCTION'S LAYOUT NUMBERS, RE-SOLVED FOR THE OBJECT. The block hangs from
 * the same measured clear line (`low`), or lower where the object's own foot
 * stands under the axis and needs its air, and loses the eyebrow's line
 * (round two's re-solve); the object is pinned to the axis at its stand's
 * point (`--hhs-lift`), and the axis's floor is the lowest axis at which its
 * painted top still clears the header by `airTop`. A tablet's numbers are
 * composed between the phone's and the desk's, as everything else there is.
 *
 * ★ A TABLET'S AXIS IS SOLVED FOR ITS OBJECT, as production solved it for the
 * shipped card (`hero-stream.ts` GEO_TABLET: 38 percent left the card's top
 * and the block's foot the same distance from the header and the fold at 900
 * by 1200). Each object stands a different height over the axis, so the one
 * percentage left the pane high and the card low on the first tablet any
 * round drew (measured at 820 by 1180: 164 px over the pane against 296 under
 * the block; 307 over the card against 173); here the axis is the point where
 * the two airs meet at the same reference, the clamp still holding it between
 * the header and the fold on any other screen.
 */
const TABLET_REF_H = 1200;
/** The block's height at 900 without its eyebrow (GEO_TABLET's 334, less 28). */
const TABLET_BLOCK_H = 306;

export function layoutOf(S: { base: Stand; lg: Stand }): CSSProperties {
  const mix = (a: number, b: number) => a + TABLET_STEP * (b - a);
  const standOf = (g: Geometry): Stand =>
    g === "base"
      ? S.base
      : g === "lg"
        ? S.lg
        : {
            box: mix(S.base.box, S.lg.box),
            axis: mix(S.base.axis, S.lg.axis),
            air: mix(S.base.air, S.lg.air),
          };
  return Object.fromEntries(
    GEOMETRIES.flatMap((g) => {
      const st = standOf(g);
      const low = Math.max(BUILT[g].low, Math.ceil(st.axis + st.air));
      const below = BUILT[g].below - EYEBROW[g] + (low - BUILT[g].low);
      const lift = st.box / 2 - st.axis;
      const axisMin = Math.ceil(
        HEADER + GEO[g].airTop + OVERSHOOT + st.box - st.axis,
      );
      // The tablet's own balance point: the object's top as far under the
      // header as the block's foot stands over the fold.
      const pct =
        g === "tablet"
          ? (100 *
              (TABLET_REF_H +
                HEADER +
                (st.box - st.axis) -
                low -
                TABLET_BLOCK_H)) /
            2 /
            TABLET_REF_H
          : GEO[g].axisPct;
      return [
        [`--hhs-axis-pct-${g}`, `${pct.toFixed(2)}%`],
        [`--hhs-axis-min-${g}`, `${axisMin}px`],
        [`--hhs-below-${g}`, `${below}px`],
        [`--hhs-min-h-${g}`, `${axisMin + below}px`],
        [`--hhs-low-${g}`, `${low}px`],
        [`--hhs-lift-${g}`, `${lift.toFixed(2)}px`],
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

/** The header's scroll postures, undone for a drawing (the frames sit far
 *  down the lab page, whose scroll the header reads). */
export const PINNED =
  "[data-df-hero] header[data-hidden]{translate:none!important}[data-df-hero] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}";

/** Where the object's centre stands: on the axis, at its stand's point. */
const AT_OBJECT: CSSProperties = {
  top: "calc(var(--hhs-axis) - var(--hhs-lift))",
};

/**
 * A party's lamp: its three hues at the house lamps' own register (L 0.72,
 * C 0.15, `sampled-palette.ts`), five as the engine reads them.
 */
export function lampOf(party: Party): string[] {
  const [a, b, c] = party.hues;
  const at = (h: number) => `oklch(0.72 0.15 ${((h % 360) + 360) % 360})`;
  return [at(a), at(b), at(c), at(a + 24), at(c - 24)];
}

/**
 * THE LAMP: production's `CardLamp`, the bloom behind the object, one per
 * party, the standing party's lit and the last fading under it. Law 3 (the
 * light takes its colour from the media it lights): the object turns to a
 * new party, so its light does too, as a crossfade rather than a swell, so the
 * hero keeps its one motion.
 */
function Lamps({
  parties,
  party,
}: {
  parties: readonly Party[];
  party: Party;
}) {
  return (
    <>
      {parties.map((p) => (
        <div
          key={p.slug}
          aria-hidden
          data-df-lamp={p.slug === party.slug ? p.slug : undefined}
          className="pointer-events-none absolute top-0 left-0 h-[520px] w-[min(680px,150vw)] -translate-x-1/2 -translate-y-1/2"
          style={{
            opacity: p.slug === party.slug ? 1 : 0,
            transition: "opacity 900ms var(--ease-emphasis)",
          }}
        >
          <Glow
            shape="bloom"
            drive="mask"
            colors={lampOf(p)}
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
      ))}
    </>
  );
}

/**
 * THE GUEST'S CREDIT, inside the photograph's corner: the face and the first
 * name on the glass's tint and its two edges. Every length is a share of the
 * photograph's own short side (`cqmin`, the frame is a size container), with
 * a floor so a phone's smallest frame still sets a name a reader can read.
 */
export function Credit({ guest }: { guest: Guest }) {
  return (
    <span
      data-df-credit={guest.name}
      className="pointer-events-none absolute flex items-center rounded-full text-white"
      style={{
        left: "max(5px, 4.6cqmin)",
        bottom: "max(5px, 4.6cqmin)",
        height: "max(18px, 13cqmin)",
        gap: "max(4px, 2.4cqmin)",
        paddingLeft: "max(2px, 1.6cqmin)",
        paddingRight: "max(7px, 4.4cqmin)",
        background: "rgb(0 0 0 / 0.34)",
        opacity: "var(--df-credit, 1)",
        boxShadow:
          "inset 0 1px 0 0 rgb(255 255 255 / 0.22), inset 0 0 0 1px rgb(255 255 255 / 0.12)",
      }}
    >
      <Avatar
        size="sm"
        seed={guest.seed}
        className="ring-1 ring-white/40"
        style={{ width: "max(14px, 9.6cqmin)", height: "max(14px, 9.6cqmin)" }}
      >
        <AvatarFallback
          className="font-semibold"
          style={{ fontSize: "max(7px, 4.6cqmin)" }}
        >
          {guest.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span
        className="leading-none font-medium"
        style={{
          fontSize: "max(10px, 6.4cqmin)",
          textShadow: "0 1px 2px rgb(0 0 0 / 0.45)",
        }}
      >
        {guest.name}
      </span>
    </span>
  );
}

/** One photograph of the band: its node (the loop writes its transform), its still and its credit. */
const BandFrame = memo(function BandFrame({
  style,
  photo,
  guest,
  setRef,
}: {
  style: CSSProperties;
  photo: string;
  guest: Guest;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={setRef} className="hhs-card" style={style}>
      <div
        className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset"
        style={{ containerType: "size" }}
      >
        <Image
          src={marketingImage(photo).src}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
        <Credit guest={guest} />
      </div>
    </div>
  );
});

/** What frame `i` shows for a party: its photograph and who added it. */
const pourOf = (party: Party, i: number) =>
  party.pours[FRAMES[i].photo % party.pours.length];

export function HeroStage({
  take,
  score,
  parties,
  addresses,
  block,
  forceLift = false,
}: {
  take: TakeId;
  /** The typewriter's score, or null for a still address. */
  score: Score | null;
  /** Every party the loop visits, the demo's own first. */
  parties: readonly Party[];
  /** Every address the loop types: a line is as wide as the widest. */
  addresses: readonly string[];
  block: ReactNode;
  /** Draw the object lifted, as a pointer would (a specimen, not a page). */
  forceLift?: boolean;
}) {
  const section = useRef<HTMLElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const zNow = useRef<number[]>([]);
  // The credit's opacity each node is carrying, so it is written on change only.
  const creditNow = useRef<string[]>([]);
  const elapsed = useRef(0);
  const clock = useRef(0);
  const off = useOffStage(section);
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const still = paused || off;

  const [standing, setStanding] = useState(0);
  // Whose light the object wears: the arriving party's while it is typed.
  const [coming, setComing] = useState(0);
  const [up, setUp] = useState(true);
  const [hovered, setHovered] = useState(false);
  // Which party each photograph is: the stream turns over one photograph at a
  // time, as each is born after a landing.
  const [who, setWho] = useState<readonly number[]>(() => FRAMES.map(() => 0));
  const shown = useRef({ standing: 0, coming: 0, up: true });

  const setRefs = useMemo(
    () =>
      FRAMES.map((_, i) => (el: HTMLDivElement | null) => {
        nodes.current[i] = el;
      }),
    [],
  );
  const layout = useMemo(() => layoutOf(STANDS[take]), [take]);

  useEffect(() => {
    const root = section.current;
    const els = nodes.current;
    const all = <T extends Element>(sel: string) =>
      root ? Array.from(root.querySelectorAll<T>(sel)) : [];
    const write = (text: string, caret: number) => {
      for (const el of all<HTMLElement>("[data-df-typed]")) {
        const node = el.firstChild;
        if (node && node.nodeValue !== text) node.nodeValue = text;
        else if (!node && text) el.textContent = text;
      }
      const title = titleOf(text);
      for (const el of all<HTMLElement>("[data-df-title]")) {
        const node = el.firstChild;
        if (node && node.nodeValue !== title) node.nodeValue = title;
        else if (!node && title) el.textContent = title;
      }
      for (const el of all<HTMLElement>("[data-df-caret]")) {
        const o = caret.toFixed(2);
        if (el.style.opacity !== o) el.style.opacity = o;
      }
    };
    // Idempotent: a code already showing the address is not touched.
    const code = (slug: string, photo: string) => {
      for (const el of all<SVGSVGElement>("svg[data-df-live]"))
        showCode(el, slug, photo);
    };
    if (reduced) {
      for (const el of els) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
        el.style.removeProperty("--df-credit");
      }
      zNow.current = [];
      creditNow.current = [];
      write(parties[0]?.slug ?? "", 0);
      if (parties[0]) code(parties[0].slug, parties[0].cover);
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
    const typing = score && score.steps.length > 1 ? score : null;
    // Where each frame's cycle stood last frame, to catch a rebirth.
    const lastMod: number[] = [];
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = win.requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;
      const t = elapsed.current;

      let pace = 1;
      let nowStanding = 0;
      let nowComing = 0;
      let nowUp = true;
      if (typing) {
        const typed = typedAt(typing, t);
        write(typed.text, typed.caret);
        nowStanding = typed.standing;
        nowComing = comingAt(typing, t);
        nowUp = typed.phase === "hold";
        pace = warpAt(typing, t);
        // The code is rewritten as its address lands, and stands whole (the
        // party standing) while the next is typed.
        const p = parties[typed.standing] ?? parties[0];
        if (nowUp && p) code(p.slug, p.cover);
      }
      if (nowStanding !== shown.current.standing) {
        shown.current.standing = nowStanding;
        setStanding(nowStanding);
      }
      if (nowComing !== shown.current.coming) {
        shown.current.coming = nowComing;
        setComing(nowComing);
      }
      if (nowUp !== shown.current.up) {
        shown.current.up = nowUp;
        setUp(nowUp);
      }

      clock.current += dt * pace;
      const { cards, box, cycle } = BUILT[g];
      const reveal = revealEase(t / REVEAL_MS);
      let reborn: number[] | null = null;
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const c = cards[i];
        const m = mod(c.at * reveal + clock.current, cycle);
        if (lastMod[i] !== undefined && m < lastMod[i]) (reborn ??= []).push(i);
        lastMod[i] = m;
        const at = phaseOf(c, clock.current, reveal, cycle);
        if (at > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = frameAt(c, at, g, box[i].fit);
        el.style.transform = f.transform;
        el.style.opacity = String(f.opacity);
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
        // The credit arrives once the photograph is large enough to carry a
        // name, so the object is never ringed by specks of chips.
        const credit = smoothstep(
          CREDIT_FROM,
          CREDIT_TO,
          placeAt(c, at, g).s,
        ).toFixed(2);
        if (creditNow.current[i] !== credit) {
          creditNow.current[i] = credit;
          el.style.setProperty("--df-credit", credit);
        }
      }
      if (reborn) {
        const born = reborn;
        const party = shown.current.standing;
        setWho((prev) => {
          if (born.every((i) => prev[i] === party)) return prev;
          const next = prev.slice();
          for (const i of born) next[i] = party;
          return next;
        });
      }
    };
    raf = win.requestAnimationFrame(tick);
    return () => {
      win.cancelAnimationFrame(raf);
      tablet.removeEventListener("change", onChange);
      desk.removeEventListener("change", onChange);
    };
  }, [reduced, still, score, parties]);

  // A pointer lifts the object only at a desk's width, which is the frame's.
  const deskWide = () =>
    (section.current?.ownerDocument.defaultView?.innerWidth ?? 0) >= DESK_MIN;
  const lift = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && deskWide()) setHovered(true);
    },
    onPointerLeave: () => setHovered(false),
    onFocus: () => {
      if (deskWide()) setHovered(true);
    },
    onBlur: () => setHovered(false),
  };

  // Reduced motion reads the demo's own address, card and album.
  const party = parties[reduced ? 0 : standing] ?? parties[0];
  const arriving = parties[reduced ? 0 : coming] ?? party;
  // The lamp is the object's own light: the card's and the door's turn to
  // the arriving party as its name is typed; the pane's is the party it shows.
  const lamp = take === "plate" ? party : arriving;
  const object = (
    <HeroObject
      take={take}
      parties={parties}
      live={{
        party,
        coming: arriving,
        addresses,
        up: reduced ? true : up,
        lifted: forceLift || hovered,
        still: still || reduced,
      }}
    />
  );

  return (
    <CinemaRoom>
      <style>{PINNED}</style>
      {/* The lamp's turbulence host, in THIS document: the root layout's lives
          in the lab page's, and a filter a frame cannot reach drops the whole
          chain, blur and all (glow.tsx's tripwire). */}
      <GlowFilter />
      <div data-df-hero className="h-full">
        <MarketingHeader skin="cinema" overlay />
        <section
          ref={(el) => {
            section.current = el;
            pauseRef(el);
          }}
          data-df-take={take}
          style={layout}
          className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
        >
          <div className="absolute left-1/2" style={AT_OBJECT}>
            <Lamps parties={parties} party={lamp} />
          </div>
          <div
            aria-hidden
            className="hhs-band absolute inset-x-0 h-full"
            style={{ top: "calc(var(--hhs-axis) - 50%)" }}
          >
            <div className="hhs-corridor">
              {FRAMES.map((f, i) => {
                const p = parties[reduced ? 0 : (who[i] ?? 0)] ?? parties[0];
                const pour = pourOf(p, i);
                return (
                  <BandFrame
                    key={f.key}
                    style={f.style}
                    photo={pour.photo}
                    guest={pour.guest}
                    setRef={setRefs[i]}
                  />
                );
              })}
            </div>
          </div>

          <div
            className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            style={AT_OBJECT}
          >
            <Link
              href="/demo"
              aria-label="Open the live demo"
              data-df-door=""
              className="block focus-halo rounded-[28px] outline-none active:scale-[0.99]"
              style={{ transition: "scale 150ms var(--ease-emphasis)" }}
              {...lift}
            >
              {object}
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
    </>
  );
}
