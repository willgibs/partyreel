"use client";

// the hero's own sheet; it declares no keyframe, deliberately (the stream is
// one rAF loop writing inline transforms, so there is nothing to collide with
// production: src/app/keyframe-uniqueness.test.ts).
import "./hero.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Caption } from "@/components/marketing/system/caption";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { DemoQr, GUTTER, LADDER, type Mode, Photo, RULED } from "./shared";
import {
  BUILT,
  frameAt,
  GEO,
  phaseOf,
  REVEAL_MS,
  restPhase,
  revealEase,
  type StreamId,
  STREAMS,
} from "./streams";

/**
 * THE HOME HERO, AS IT SHIPS (round seven, 2026-09-16).
 *
 * Every ruling this composition carries is Will's, taken on round five
 * (`docs/reviews/home-hero.json`): the SOURCE direction, the album coming out
 * of the code; the lockup CENTRED rather than left like every other marketing
 * page; the site's one ruled line as the headline; and no live count anywhere
 * in the frame. Round six's four scatterings were answered `none` with the
 * symmetric approach asked for by name, so what is open is which of the four
 * compositions in `streams.ts` ships, and this file renders one of them.
 *
 * The argument the composition is built on, unchanged since round two. Every
 * other hero we have drawn puts photographs behind words and then dims the
 * photographs so the words survive. This one refuses that trade by changing the
 * shape of the composition: the album is a stream out of the code, the type is
 * placed where the stream is measured never to reach, and the real demo QR
 * stands still at scanning size where the frames are born. The code is the
 * eyebrow, the object and the argument at once, and there is no darkening layer
 * anywhere over a photograph (bible 1).
 *
 * ★ THE LOCKUP IS THE STREAM'S, and there are four. `split` is round six's: the
 * code at the centre, the headline above the band, the caption, the sentence
 * and the actions below it. The three others keep the type together as ONE
 * block (Will: "don't split the H1 and other hero content with the QR"): a
 * stack hangs the block under the code or stands it over the code, and the
 * orbit hangs it under the code at the centre of the ring. `Geo.axis` says how
 * far down the canvas the code sits for each; the band box, the code and the
 * type all take their vertical from that one number.
 *
 * ★ THE TYPE'S CLEAR LANE IS MEASURED, NOT CHOSEN. `build` in streams.ts walks
 * every card over its whole flight and answers "how far from the axis does this
 * stream reach at the nearest line's own measure", and the block is placed
 * outside that answer plus a margin. So "no photograph is ever under a word" is
 * the condition the composition is drawn from, and swapping the stream
 * re-solves it rather than breaking it. The orbit's stations are drawn outside
 * the block's box instead, and `streams.test.ts` holds them there. The other
 * ceiling is the site header (a 4rem transparent overlay), which is
 * `Geo.headMax` for the split and the block-fits test for the rest.
 *
 * ★ NOTHING ABOUT THE CODE MOVES. The stillness is the point, and a QR that
 * breathes is a QR nobody can scan. It is the real demo event's, live from
 * NEXT_PUBLIC_DEMO_QR_TOKEN, and tappable.
 *
 * ★ REPLAY IS A REMOUNT. The board keys the stage on the run, so the entrance
 * runs again from its first frame with no state to reset; production wires the
 * same loop to useAmbientPause, which also pauses off screen, where the lab
 * pauses on a hidden TAB only through the stage's data-paused (side-by-side
 * comparison wants everything running).
 */

/**
 * The gap the reduced-motion split leaves, closed. The sheet paints the
 * branch-out's first frame (every card collapsed at the code) inside
 * `prefers-reduced-motion: no-preference`, because an effect would run after the
 * server's paint and the stream would flash deployed and snap back. That is
 * right for every reader except one: motion allowed, scripting off, nothing to
 * run the loop. A <noscript> block is parsed only in exactly that case, so this
 * rule lands only there, later in the document than the sheet, and restores the
 * rest state the cards already carry as custom properties.
 */
const NOSCRIPT_RULE = `<style>@media (prefers-reduced-motion: no-preference){.hhs-card{transform:var(--hhs-rest);opacity:var(--hhs-rest-o)}}</style>`;

export type HeroProps = {
  mode: Mode;
  stream: StreamId;
  /** The live demo's guest URL, or null when no demo is configured. */
  qrUrl: string | null;
  /**
   * Paint the rest state and never start the loop. The board's cost meter
   * stills every hero but the one it is measuring, which is the ONLY honest
   * isolation for a stream like this: `display: none` does not stop a
   * requestAnimationFrame callback, so a hidden hero costs exactly what a
   * visible one does and a run taken beside three of them measures the board.
   */
  still?: boolean;
};

export function CinemaHeroDraft({
  mode,
  stream,
  qrUrl,
  still = false,
}: HeroProps) {
  const geo = GEO[mode];
  const st = STREAMS[stream];
  const { cards, box, lock, cycle, flight } = BUILT[stream][mode];
  const axis = geo.axis[st.lockup];
  const persp = st.perspective?.[mode] ?? geo.perspective;
  const reduced = usePrefersReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // Filled every frame, never React state.
  const progress = useRef<number[]>([]);
  // The z-index each node is carrying, so it is written on change only.
  const zNow = useRef<number[]>([]);

  useEffect(() => {
    if (reduced || still) return;
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
      // off the closest ancestor so the hero owns no shell knowledge.
      if (root.closest('[data-paused="true"]')) return;
      elapsed += dt;

      // The branch-out: one tween of the launch times from nothing to their
      // steady spacing. The clock term runs the whole time, so there is no
      // handoff between the entrance and the loop, only one expression.
      const reveal = revealEase(elapsed / REVEAL_MS);
      const p = progress.current;
      for (let i = 0; i < cards.length; i++) {
        p[i] = phaseOf(cards[i], elapsed, reveal, cycle, flight);
      }
      for (let i = 0; i < cards.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const at = p[i];
        // On the ground between flights, past the canvas edge, or faded out,
        // and no longer worth a composited layer.
        if (at > box[i].exit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = frameAt(cards[i], at, st, mode, box[i].fit);
        el.style.transform = f.transform;
        el.style.opacity = String(f.opacity);
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards, box, cycle, flight, st, mode, reduced, still]);

  return (
    <div
      ref={rootRef}
      data-hhs-stream={stream}
      data-hhs-lockup={st.lockup}
      /* overflow-CLIP, not overflow-hidden: an `overflow: hidden` box is still a
         SCROLL container, and this one's content is several canvases wide, so a
         focus or an anchor inside it can shove the whole composition sideways.
         `clip` clips the same pixels and creates no scroll container. */
      className="relative size-full overflow-clip bg-background"
    >
      {/* THE STREAM. Full bleed and decorative: the album is the argument, but
          it is the type that carries the sentence. The band box is one canvas
          tall and centred on the axis, so a lockup that lifts or lowers the
          code moves the stream, the perspective's vanishing point and the
          mask's centre with it in one number. */}
      <div
        aria-hidden
        className="hhs-band absolute inset-x-0 h-full"
        data-hhs-mask={st.mask}
        style={
          {
            top: `${((axis - 0.5) * 100).toFixed(2)}%`,
            "--hhs-fade": geo.fade,
          } as CSSProperties
        }
      >
        <div
          className="hhs-corridor"
          style={{ "--hhs-persp": `${persp}px` } as CSSProperties}
        >
          {cards.map((c, i) => {
            const rest = frameAt(c, restPhase(c, st), st, mode, box[i].fit);
            return (
              <div
                key={c.key}
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                className="hhs-card"
                data-hhs-lane={c.lane}
                style={
                  {
                    width: box[i].w,
                    height: box[i].h,
                    marginLeft: -box[i].w / 2,
                    marginTop: -box[i].h / 2,
                    zIndex: rest.z,
                    // The REST state, as custom properties the sheet reads: the
                    // stream standing at its steady spacing, which is what
                    // reduced motion, a crawler, a cold paint and a reader with
                    // scripting off all get.
                    "--hhs-rest": rest.transform,
                    "--hhs-rest-o": rest.opacity,
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

      {/* THE OBJECT, on the axis and at the exact centre of the stream, above
          the frames so they are born behind it. */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ top: `${(axis * 100).toFixed(2)}%` }}
      >
        <DemoQr url={qrUrl} size={geo.qr} />
      </div>

      {st.lockup === "split" ? (
        <>
          {/* THE HEADLINE, anchored off the axis rather than laid out in flow,
              so the code holds the exact middle whether the line runs to one
              row or two, and so an extra line grows UPWARD, away from the
              stream. At paint, at full opacity, gated by nothing (bible 13). */}
          <div
            className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
            style={{
              bottom: `calc(${((1 - axis) * 100).toFixed(2)}% + ${lock.head}px)`,
            }}
          >
            <Headline mode={mode} />
          </div>
          {/* THE PROVENANCE, THE SENTENCE AND THE ACTIONS, below the stream, in
              one block anchored at the measured clear line. No scrim anywhere
              and no darkening layer over a frame: the geometry is what keeps the
              type off the photographs, which is the argument. */}
          <div
            className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
            style={{
              top: `calc(${(axis * 100).toFixed(2)}% + ${lock.low}px)`,
            }}
          >
            <Provenance mode={mode} />
            <Sentence mode={mode} className={mode === "phone" ? "mt-4" : "mt-5"} />
          </div>
        </>
      ) : st.lockup === "stack-below" ? (
        /* THE BLOCK OVER THE CODE: headline, sentence, actions, and the caption
           as the foot line, one gap over the plate, so "came from a guest who
           scanned it" reads straight into the thing to scan. */
        <div
          className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
          style={{
            bottom: `calc(${((1 - axis) * 100).toFixed(2)}% + ${lock.head}px)`,
          }}
        >
          <Headline mode={mode} />
          <Sentence mode={mode} className={mode === "phone" ? "mt-4" : "mt-5"} />
          <Provenance mode={mode} className={mode === "phone" ? "mt-5" : "mt-7"} />
        </div>
      ) : (
        /* THE BLOCK UNDER THE CODE (a stack with the code above, and the orbit):
           the caption first, one gap under the plate, then the headline, the
           sentence and the actions, together and never split. */
        <div
          className={`absolute inset-x-0 z-20 text-center ${GUTTER[mode].x}`}
          style={{
            top: `calc(${(axis * 100).toFixed(2)}% + ${lock.low}px)`,
          }}
        >
          <Provenance mode={mode} />
          <Headline mode={mode} className={mode === "phone" ? "mt-3" : "mt-4"} />
          <Sentence mode={mode} className={mode === "phone" ? "mt-4" : "mt-5"} />
        </div>
      )}

      {/* The one reader the reduced-motion split cannot reach: motion allowed,
          scripting off. See NOSCRIPT_RULE. */}
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_RULE }} />
    </div>
  );
}

/** The site's one ruled line, at the ladder's xl step resolved per canvas, at
 *  paint, at full opacity, gated by nothing (bible 13). */
function Headline({ mode, className = "" }: { mode: Mode; className?: string }) {
  const geo = GEO[mode];
  return (
    <h1
      className={`mx-auto font-heading text-balance text-white ${LADDER.xl[mode]} ${geo.h1Lead} ${className}`}
      style={{ maxWidth: geo.h1Max }}
    >
      {RULED.h1}
    </h1>
  );
}

/** The one thing the picture cannot say for itself: where the frames came
 *  from. It is the line that touches the code in every lockup. */
function Provenance({
  mode,
  className = "",
}: {
  mode: Mode;
  className?: string;
}) {
  return (
    <Caption
      className={`mx-auto text-white/60 ${className}`}
      style={{ maxWidth: GEO[mode].capMax }}
    >
      Every photo here came from a guest who scanned it
    </Caption>
  );
}

/** The ruled sentence and the two actions. */
function Sentence({ mode, className = "" }: { mode: Mode; className?: string }) {
  const geo = GEO[mode];
  return (
    <div className={className}>
      <p
        className="mx-auto text-[15px] leading-relaxed text-pretty text-white/80"
        style={{ maxWidth: geo.lowMax }}
      >
        {RULED.subhead}
      </p>
      <div
        className={`flex flex-wrap items-center justify-center gap-3 ${mode === "phone" ? "mt-5" : "mt-7"}`}
      >
        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href={RULED.primary.href}>{RULED.primary.label}</Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11 border-white/35 bg-white/5 px-5 text-base text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
        >
          {RULED.secondary}
        </Button>
      </div>
    </div>
  );
}
