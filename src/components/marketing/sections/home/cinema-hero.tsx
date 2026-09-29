"use client";

// The hero's own sheet. It declares no keyframe, deliberately: the stream is
// one rAF loop writing inline transforms, so there is nothing to collide with
// (src/app/keyframe-uniqueness.test.ts, and the note in the sheet's header).
import "./cinema-hero.css";

import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";

import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import {
  DemoDoor,
  LiveDot,
} from "@/components/marketing/system/demo-modal/demo-door";
import { Glow } from "@/components/shared/glow";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/web";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { SITE_URL } from "@/lib/constants/site";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { LinkCard } from "./cinema-hero-card";
import {
  BUILT,
  FRAME_SIZES,
  frameAt,
  GEO,
  type Geometry,
  GEOMETRIES,
  LG_MIN,
  OBJECT_CODE_PATH,
  phaseOf,
  REVEAL_MS,
  restPhase,
  revealEase,
  STREAM_FRAMES,
  TABLET_MIN,
  TABLET_STEP,
} from "./hero-stream";

/**
 * THE HOME HERO: THE ALBUM LEAVING THE LINK CARD.
 *
 * The lockup is CENTRED rather than left like every other marketing page, its
 * headline the site's one ruled line with no live count anywhere; the album is
 * one file of photographs a side on one axis, the symmetric approach; and the
 * object it pours from is the link card (`cinema-hero-card.tsx`), a small
 * white invite carrying the event link's code and custom address, the guests
 * on the photographs they added, and the rest of them counted in.
 *
 * ★ THE ARGUMENT. Every other hero we have drawn puts photographs behind words
 * and then dims the photographs so the words survive, which is what the wall
 * this replaced did with three stacked scrims. This one refuses the trade by
 * changing the shape of the composition: the album is a band streaming out of
 * the one link, the type is placed where the band is MEASURED never to reach
 * (hero-stream.ts solves the clear line), and the card stands still where the
 * frames are born. There is no darkening layer anywhere over a photograph.
 *
 * ★ NOTHING ON THE CARD MOVES. The band is the hero's one motion, and the lamp
 * behind the card swells once and rests.
 *
 * ★ THE LCP IS THE HEADLINE, which is why it is plain markup at full opacity
 * gated by nothing (marketing-h1-policy.test.ts). The frames lit at rest and
 * the card's four prints load eager, because they are what a reduced-motion
 * reader sees on the first paint; the frames born behind the card load lazy.
 * Nothing asks for a preload of its own (no `preload`, no `priority`), but an
 * eager image IS one: React's server render preloads every eager image it
 * draws, one link per srcset and sizes, so the eager set is kept to what the
 * first paint shows, and the card's prints share the band's copies rather than
 * adding four of their own (`printSizes`, build 19's red-team).
 */

const SampleReelOverlay = lazy(
  () => import("../shared/sample-reel-overlay.lazy"),
);

/** Each geometry's media query, and the one the loop reads its table from. */
const MIN_WIDTH: Record<Geometry, number> = {
  base: 0,
  tablet: TABLET_MIN,
  lg: LG_MIN,
};

/** A rule for one geometry: bare for the base, inside its own query above it. */
const atGeometry = (g: Geometry, rule: string) =>
  g === "base" ? rule : `@media (min-width:${MIN_WIDTH[g]}px){${rule}}`;

/**
 * The gap the reduced-motion split leaves, closed. The sheet paints the
 * branch-out's first frame (every frame collapsed behind the card) inside
 * `prefers-reduced-motion: no-preference`, because an effect would run after
 * the server's paint and the band would flash deployed and snap back. That is
 * right for every reader except one: motion allowed, scripting off, nothing to
 * run the loop. A <noscript> block is parsed only in exactly that case, so
 * these rules land only there, later in the document than the sheet, and
 * restore the rest state the frames already carry as custom properties. One
 * rule per geometry, because the rest state is per geometry.
 */
const NOSCRIPT_RULE = `<style>@media (prefers-reduced-motion:no-preference){${GEOMETRIES.map(
  (g) =>
    atGeometry(
      g,
      `.hhs-card{transform:var(--hhs-rest-${g});opacity:var(--hhs-rest-o-${g})}`,
    ),
).join("")}}</style>`;

/**
 * ★ ONE SET OF NODES SERVES ALL THREE GEOMETRIES. The band's pool works out at
 * nine a side in every geometry, so frame `i` is the same photograph in the
 * same launch order on a phone, a tablet and a desk: only its box, its launch
 * time and its rest transform differ, and those ride as `-base` / `-tablet` /
 * `-lg` custom properties that the sheet chooses between. Nothing remounts at
 * a breakpoint and no layout is ever measured to decide. `hero-stream.test.ts`
 * holds the three pools equal, which is what this rests on.
 *
 * Solved once at module load, off pure arithmetic the server and the browser
 * both agree on, so the rest state hydrates without a warning.
 */
const FRAMES = BUILT.lg.cards.map((lg, i) => {
  const style: Record<string, string | number> = {};
  let eager = false;
  for (const g of GEOMETRIES) {
    const card = BUILT[g].cards[i];
    const box = BUILT[g].box[i];
    const rest = frameAt(card, restPhase(card), g, box.fit);
    style[`--hhs-w-${g}`] = `${box.w}px`;
    style[`--hhs-h-${g}`] = `${box.h}px`;
    style[`--hhs-rest-${g}`] = rest.transform;
    style[`--hhs-rest-o-${g}`] = rest.opacity;
    style[`--hhs-z-${g}`] = rest.z;
    // Lit at rest means a reduced-motion reader, a crawler and a cold paint all
    // see it, so it is worth the eager request; the ones born behind the card
    // are invisible until the loop moves them.
    if (rest.opacity > 0.02) eager = true;
  }
  return {
    key: lg.key,
    image: marketingImage(STREAM_FRAMES[lg.photo % STREAM_FRAMES.length]),
    eager,
    style: style as CSSProperties,
  };
});

/**
 * Every number the sheet lays the composition out from, in one place and taken
 * from `hero-stream.ts` rather than retyped. They ride as per-geometry triples
 * because an inline style beats any selector: the sheet resolves the plain
 * names from these inside its media queries, which is the only place a media
 * query can win.
 */
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
    // How far from the phone's card to the desk's this geometry's card stands
    // (`cinema-hero-card.tsx` sizes every length off it).
    [
      `--hhs-k-${g}`,
      g === "base" ? "0" : g === "lg" ? "1" : TABLET_STEP.toFixed(5),
    ],
  ]),
) as CSSProperties;

export function CinemaHero() {
  const reduced = usePrefersReducedMotion();
  const { ref: pauseRef, paused } = useAmbientPause<HTMLElement>();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // The z-index each node is carrying, so it is written on change only.
  const zNow = useRef<number[]>([]);
  /**
   * ★ THE CLOCK LIVES OUTSIDE THE EFFECT, and that is the whole pause. The loop
   * tears down whenever `paused` flips (scrolled away, hidden tab), and an
   * elapsed counter declared inside it would restart at zero every time a
   * reader came back: the band would re-burst out of the card on every return,
   * and a hero that replays its entrance whenever you scroll past it is a hero
   * nobody trusts. Held here, the stream resumes on the frame it stopped on.
   */
  const elapsed = useRef(0);

  useEffect(() => {
    const els = nodes.current;
    if (reduced) {
      // Reduced motion is authoritative even when it is switched on mid-visit:
      // drop everything the loop wrote so the sheet's rest state takes back
      // over, rather than freezing the band wherever it happened to be.
      for (const el of els) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      zNow.current = [];
      return;
    }
    if (paused) return;

    // The geometry the loop solves against, read off the same breakpoints the
    // sheet is on. A resize across one re-points the tables; nothing remounts.
    const tablet = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desk = window.matchMedia(`(min-width: ${LG_MIN}px)`);
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
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;

      const { cards, box, cycle } = BUILT[g];
      // The branch-out: one tween of the launch times from nothing to their
      // steady spacing. The clock term runs the whole time, so there is no
      // handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed.current / REVEAL_MS);
      for (let i = 0; i < cards.length; i++) {
        const el = els[i];
        if (!el) continue;
        const at = phaseOf(cards[i], elapsed.current, reveal, cycle);
        // Past the edge of the screen, and no longer worth a composited layer.
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

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      tablet.removeEventListener("change", onChange);
      desk.removeEventListener("change", onChange);
    };
  }, [reduced, paused]);

  return (
    <>
      <section
        ref={pauseRef}
        /* Mirrored for the loop-pause contract's own grammar, and because it is
           otherwise the one signal that is invisible while debugging; the loop
           itself reads the hook, not the attribute. */
        data-paused={paused ? "true" : undefined}
        style={LAYOUT}
        /* overflow-CLIP, not overflow-hidden: an `overflow: hidden` box is
           still a SCROLL container, and this one's content is several viewports
           wide, so a focus or an anchor inside it could shove the whole
           composition sideways. `clip` clips the same pixels and creates no
           scroll container. */
        className="hhs-hero relative -mt-[var(--mkt-header-h,4rem)] overflow-clip bg-background"
      >
        {/* THE CARD'S LAMP, the section's FIRST layer so every frame paints
            over it: nothing is laid over a photograph, so the light is the
            room's, seen round the card and between the photographs as they
            leave. It stands at the card's own point (the sheet's
            `.hhs-object`). */}
        <div className="hhs-object absolute left-1/2">
          <CardLamp />
        </div>

        {/* THE BAND. Full bleed and decorative: the album is the argument, but
            it is the type that carries the sentence. The box is one hero tall
            and centred on the axis, so the card, the band, the perspective's
            vanishing point and the mask's centre all move together in one
            number. */}
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
                {/* At FULL luminance, and there is no scrim prop: a hero that
                    needs one has not solved its composition. */}
                <div className="relative size-full overflow-hidden rounded-[var(--radius-tile)] bg-white/5 ring-1 ring-white/10 ring-inset">
                  <Image
                    src={f.image.src}
                    alt=""
                    fill
                    sizes={FRAME_SIZES}
                    loading={f.eager ? "eager" : "lazy"}
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THE OBJECT, above the frames so they are born behind it, centred on
            its point: the middle of its air between the header and the block,
            or its floor over the axis on a tall screen (`.hhs-object`). */}
        <div className="hhs-object absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <DemoCard />
        </div>

        {/* THE BLOCK: the headline, the sentence and the two actions, together
            and never split, anchored at the measured clear line rather than
            laid out in flow, so the card holds its place whether the line runs
            to one row or two. No scrim and no darkening layer over a frame
            anywhere: the geometry is what keeps the type off the photographs,
            which is the argument. From the tablet up the block wears the
            desk's air (its action row sits on one line there), which is what
            `blockH` measures. */}
        <div
          className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 md:px-8"
          style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
        >
          {/* ★ THE EYEBROW IS THE DEMO'S DOOR: a modal at a desk, the demo in
              a new tab on a phone. It wears the eyebrow's own register, the
              demo link's live dot and the learn chevron that says it goes
              somewhere. It is the block's first line, so it is inside the
              measured box (`GEO.blockH`, `hero-stream.ts`). No demo, no
              eyebrow: never a dead door. */}
          {DEMO_EVENT_URL && (
            <div className="mt-3 mb-2 flex justify-center md:mt-0 md:mb-3">
              <DemoDoor
                href={DEMO_EVENT_URL}
                source="hero-eyebrow"
                className="mkt-learn inline-flex items-center gap-2 text-label font-medium text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground"
              >
                <LiveDot />
                <span className="inline-flex items-center gap-1">
                  Try our demo event
                  <LearnChevron />
                </span>
              </DemoDoor>
            </div>
          )}
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
              <Link
                href={MARKETING_CTA.href}
                {...trackAttrs("cta_click", {
                  cta: "start-free",
                  location: "hero",
                })}
              >
                {MARKETING_CTA.label}
              </Link>
            </Button>
            {/* The reel stays the secondary action even though the card above
                is the demo's door: the card answers "what do my guests do?"
                and the reel answers "what do I get?", and they are different
                questions. */}
            <Button
              size="cta"
              variant="outline"
              onClick={() => {
                track("reel_play");
                setOverlayOpen(true);
              }}
              className="gap-2 border-white/35 bg-white/5 px-5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
            >
              <Play className="size-4 fill-current" />
              Watch a sample reel
            </Button>
          </div>
        </div>

        {/* The one reader the reduced-motion split cannot reach: motion
            allowed, scripting off. See NOSCRIPT_RULE. */}
        <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_RULE }} />
      </section>

      {/* A sibling of the hero, never a child: the hero clips its overflow and
          the overlay covers the viewport. */}
      {overlayOpen && (
        <Suspense fallback={null}>
          <SampleReelOverlay onClose={() => setOverlayOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

/**
 * THE CARD'S LIGHT: the bloom, /features/qr's plate recipe, the house's own
 * light for a live code. What emits is the card, the source the album pours
 * from; it is lit from behind, centred on the card; it samples nothing, since
 * the card carries no colour of its own, so it wears the lamp set; and the
 * bloom is admitted because it swells once as the band opens and then rests lit
 * and still, so the hero keeps one motion. Under reduced motion it stands lit
 * from the first paint.
 *
 * ★ THE BOX IS LARGER THAN THE CARD AND CENTRED ON IT, because a lamp whose box
 * IS the object is clipped to the object and hidden behind it; its reach stops
 * inside the box, or the box's edge would draw a line across the air. The
 * turbulence host is the root layout's `GlowFilter`, in this same document.
 */
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

/**
 * THE OBJECT'S DOOR: pressing the card opens the demo, as every pointer to it
 * does (`DemoDoor`: the demo modal on a plain press at a desk, the demo itself
 * in a new tab on a phone). Its code encodes the demo's short door rather than
 * the event link, for how it draws at a card's size (`OBJECT_CODE_PATH`). When
 * no demo is configured the card still stands, but nothing links to it.
 */
function DemoCard() {
  const card = <LinkCard value={`${SITE_URL}${OBJECT_CODE_PATH}`} />;
  if (!DEMO_EVENT_URL) return card;
  return (
    <DemoDoor
      href={DEMO_EVENT_URL}
      source="hero-card"
      aria-label="Open the live demo"
      className="block transition-transform duration-150 active:scale-[0.99]"
    >
      {card}
    </DemoDoor>
  );
}
