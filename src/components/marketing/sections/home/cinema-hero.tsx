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

import { DemoFrame } from "@/components/marketing/system/demo-ticket";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/web";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

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
} from "./hero-stream";

/**
 * THE HOME HERO: THE ALBUM LEAVING THE CODE (the hero's wiring round,
 * 2026-09-17; it replaces the living album wall of 2026-08-25).
 *
 * Will's rulings, in order: the SOURCE direction,
 * the album coming out of the code, the lockup CENTRED rather than left like
 * every other marketing page, the site's one ruled line as the headline and no
 * live count anywhere (round five); the symmetric approach by name over the
 * four scatterings (round six); and the pick this file is,
 * `stream=stack-above`, with "we can drop the 'Every photo here came from a
 * guest who scanned it' label underneath the QR code" (round seven).
 *
 * ★ THE ARGUMENT. Every other hero we have drawn puts photographs behind words
 * and then dims the photographs so the words survive, which is what the wall
 * this replaces did with three stacked scrims. This one refuses the trade by
 * changing the shape of the composition: the album is a band streaming out of
 * the code, the type is placed where the band is MEASURED never to reach
 * (hero-stream.ts solves the clear line), and the real demo QR stands still at
 * scanning size where the frames are born. The code is the eyebrow, the object
 * and the argument at once, and there is no darkening layer anywhere over a
 * photograph (bible 1).
 *
 * ★ NOTHING ABOUT THE CODE MOVES. The stillness is the point, and a QR that
 * breathes is a QR nobody can scan. It is the real demo event's, live from
 * NEXT_PUBLIC_DEMO_QR_TOKEN, server-rendered and tappable.
 *
 * ★ THE LCP IS THE HEADLINE, which is why it is plain markup at full opacity
 * gated by nothing (bible 13, marketing-h1-policy.test.ts). The frames lit at
 * rest load eager, because they are what a reduced-motion reader sees on the
 * first paint; the two born inside the code load lazy.
 *
 * ★ WHAT LEFT WITH THE WALL, so nobody goes looking: WALL_ORDER, WALL_TILES,
 * TALL_TILES, the three scrims, the reel card in the wall, HERO_EYEBROW, the
 * DemoTicket under the actions (the code IS the demo affordance now) and the
 * kinetic SpliceWord, whose pre-agreed fallback was exactly this, the ruled
 * thesis rendered static. Git holds them at `85aa65d9`.
 */

const SampleReelOverlay = lazy(
  () => import("../shared/sample-reel-overlay.lazy"),
);

/**
 * The gap the reduced-motion split leaves, closed. The sheet paints the
 * branch-out's first frame (every frame collapsed at the code) inside
 * `prefers-reduced-motion: no-preference`, because an effect would run after
 * the server's paint and the band would flash deployed and snap back. That is
 * right for every reader except one: motion allowed, scripting off, nothing to
 * run the loop. A <noscript> block is parsed only in exactly that case, so
 * these rules land only there, later in the document than the sheet, and
 * restore the rest state the frames already carry as custom properties. Two
 * rules, because the rest state is per breakpoint.
 */
const NOSCRIPT_RULE = `<style>@media (prefers-reduced-motion:no-preference){.hhs-card{transform:var(--hhs-rest-base);opacity:var(--hhs-rest-o-base)}}@media (prefers-reduced-motion:no-preference) and (min-width:${LG_MIN}px){.hhs-card{transform:var(--hhs-rest-lg);opacity:var(--hhs-rest-o-lg)}}</style>`;

/**
 * ★ ONE SET OF NODES SERVES BOTH GEOMETRIES. The band's pool works out at nine
 * a side at either breakpoint, so frame `i` is the same photograph in the same
 * launch order on a phone and on a desktop: only its box, its launch time and
 * its rest transform differ, and those ride as `-base` / `-lg` custom property
 * pairs that the sheet chooses between. Nothing remounts at the breakpoint and
 * no layout is ever measured to decide. `hero-stream.test.ts` holds the two
 * pools equal, which is what this rests on.
 *
 * Solved once at module load, off pure arithmetic the server and the browser
 * both agree on, so the rest state hydrates without a warning.
 */
const FRAMES = BUILT.lg.cards.map((lg, i) => {
  const base = BUILT.base.cards[i];
  const lgBox = BUILT.lg.box[i];
  const baseBox = BUILT.base.box[i];
  const lgRest = frameAt(lg, restPhase(lg), "lg", lgBox.fit);
  const baseRest = frameAt(base, restPhase(base), "base", baseBox.fit);
  return {
    key: lg.key,
    image: marketingImage(STREAM_FRAMES[lg.photo % STREAM_FRAMES.length]),
    // Lit at rest means a reduced-motion reader, a crawler and a cold paint all
    // see it, so it is worth the eager request; the two born inside the code
    // are invisible until the loop moves them.
    eager: lgRest.opacity > 0.02 || baseRest.opacity > 0.02,
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

/**
 * Every number the sheet lays the composition out from, in one place and taken
 * from `hero-stream.ts` rather than retyped. They ride as `-base` / `-lg` pairs
 * because an inline style beats any selector: the sheet resolves the plain
 * names from these inside its media query, which is the only place a media
 * query can win.
 */
const LAYOUT = {
  "--hhs-axis-pct-base": `${GEO.base.axisPct}%`,
  "--hhs-axis-pct-lg": `${GEO.lg.axisPct}%`,
  "--hhs-axis-min-base": `${BUILT.base.axisMin}px`,
  "--hhs-axis-min-lg": `${BUILT.lg.axisMin}px`,
  "--hhs-below-base": `${BUILT.base.below}px`,
  "--hhs-below-lg": `${BUILT.lg.below}px`,
  "--hhs-min-h-base": `${BUILT.base.minH}px`,
  "--hhs-min-h-lg": `${BUILT.lg.minH}px`,
  "--hhs-low-base": `${BUILT.base.low}px`,
  "--hhs-low-lg": `${BUILT.lg.low}px`,
  "--hhs-fade-base": GEO.base.fade,
  "--hhs-fade-lg": GEO.lg.fade,
  "--hhs-persp-base": `${GEO.base.perspective}px`,
  "--hhs-persp-lg": `${GEO.lg.perspective}px`,
  "--hhs-qr-base": `${GEO.base.qr}px`,
  "--hhs-qr-lg": `${GEO.lg.qr}px`,
  "--hhs-h1-max-base": `${GEO.base.h1Max}px`,
  "--hhs-h1-max-lg": `${GEO.lg.h1Max}px`,
  "--hhs-low-max-base": `${GEO.base.lowMax}px`,
  "--hhs-low-max-lg": `${GEO.lg.lowMax}px`,
} as CSSProperties;

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
   * reader came back: the band would re-burst out of the code on every return,
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

    // The geometry the loop solves against, read off the same breakpoint the
    // sheet is on. A resize across it re-points the tables; nothing remounts.
    const mq = window.matchMedia(`(min-width: ${LG_MIN}px)`);
    let bp: Bp = mq.matches ? "lg" : "base";
    const onChange = () => {
      bp = mq.matches ? "lg" : "base";
    };
    mq.addEventListener("change", onChange);

    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      elapsed.current += dt;

      const { cards, box, cycle } = BUILT[bp];
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
        const f = frameAt(cards[i], at, bp, box[i].fit);
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
      mq.removeEventListener("change", onChange);
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
        {/* THE BAND. Full bleed and decorative: the album is the argument, but
            it is the type that carries the sentence. The box is one hero tall
            and centred on the axis, so the code, the band, the perspective's
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
                    needs one has not solved its composition (bible 1). */}
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

        {/* THE OBJECT, on the axis and at the exact centre of the band, above
            the frames so they are born behind it. Positioned entirely by
            Tailwind utilities and the inline top, never by the retired
            `hhs-qr` class: that class's one job in cinema-hero.css was
            sizing a bare QR's own svg to `--hhs-qr`, and DemoFrame's corner
            code is deliberately a different, smaller size now (its own
            header note) — carrying the class here would silently force it
            back to the old bare-QR pixels. */}
        <div
          className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
          style={{ top: "var(--hhs-axis)" }}
        >
          <DemoQr />
        </div>

        {/* THE BLOCK: the headline, the sentence and the two actions, together
            and never split (Will's ask on round six), anchored at the measured
            clear line rather than laid out in flow, so the code holds its place
            whether the line runs to one row or two. No scrim and no darkening
            layer over a frame anywhere: the geometry is what keeps the type off
            the photographs, which is the argument. */}
        <div
          className="absolute inset-x-0 z-20 px-4 text-center sm:px-6 lg:px-8"
          style={{ top: "calc(var(--hhs-axis) + var(--hhs-low))" }}
        >
          <h1
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
            {/* The reel stays the secondary action even though the code beside
                it is the demo affordance: the code answers "what do my guests
                do?" and the reel answers "what do I get?", and they are
                different questions. */}
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
 * THE OBJECT (`door=frame`, round two, 2026-09-20/21, overriding round one's
 * `doors=pile`; "the closing sitting's second batch"). His note on the
 * board's own drawing: "this visual is the same
 * height as the image banner behind, and isn't as noticeable as it could
 * be" — the frame below is sized against the REAL corridor rather than the
 * board's flat mock, measured on this shipped hero (`pnpm dev`, a
 * `.hhs-card` + object sweep in the browser console, 2026-09-21): at 1440
 * the visible tiles run 48-253px tall (the busiest cluster 60-204) against
 * the frame's own 218x258, and at 375 they run 24-137px against 162x191 —
 * clearly past the cluster at both, and past even the single largest
 * outlier at 1440. `heroCompact` is the same object at the size the hero's
 * own measured axis-to-headline clearance allows below `lg` (113px there,
 * 39px of it left over once the frame stands, against 168px at `lg`, also
 * 39px left over), swapped by a plain CSS pair rather than a client
 * breakpoint read, so the server render already carries the right one.
 * `hhs-qr`, the class that used to force a bare QR's svg to `--hhs-qr`, is
 * deliberately NOT on this mount's wrapper any more (below): the corner
 * code here is a smaller, different size on purpose (DemoFrame's own note
 * on why), and that class would have silently overridden it back to the
 * old bare-QR pixels.
 *
 * Still zero-JS for the code (FooterQr's path, inside DemoFrame): drawn
 * once per breakpoint, an SVG viewBox scales without a second copy in the
 * markup, and crispEdges keeps the modules sharp. When no demo is
 * configured the whole object still stands (DemoFrame reads its `value`
 * from the caller, not from the env), but nothing links to it.
 */
function DemoQr() {
  const value = DEMO_EVENT_URL ?? "https://partyreel.com";
  const frame = (
    <>
      <DemoFrame value={value} size="heroCompact" className="lg:hidden" />
      <DemoFrame value={value} size="hero" className="hidden lg:inline-flex" />
    </>
  );
  if (!DEMO_EVENT_URL) return frame;
  return (
    <Link
      href={DEMO_EVENT_URL}
      aria-label="Scan with your phone, or tap to open the live demo"
      className="inline-flex transition-transform duration-150 active:scale-[0.99]"
      {...trackAttrs("cta_click", { cta: "demo-qr", location: "hero" })}
    >
      {frame}
    </Link>
  );
}
