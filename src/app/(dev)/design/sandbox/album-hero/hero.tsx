"use client";

// The hero's own sheet. It declares NO keyframe, deliberately: the composition
// is one requestAnimationFrame loop writing inline transforms, so there is
// nothing here that could collide with a production keyframe
// (src/app/keyframe-uniqueness.test.ts reads every sheet under the lab).
import "./hero.css";

import Link from "next/link";
import { type CSSProperties, useEffect, useRef } from "react";

import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Button } from "@/components/ui/button";
import { featurePage } from "@/lib/constants/feature-pages";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { GUTTER, LADDER, type Mode, Photo } from "../home-hero/shared";
import {
  BLOCK,
  BUILT,
  type CompId,
  COMPOSITIONS,
  frameAt,
  phaseOf,
  restPhase,
  type Step,
} from "./compositions";

/**
 * THE ALBUM PAGE'S HERO (round three, 2026-09-17): one lockup, four pictures
 * behind it.
 *
 * ★ THE LOCKUP IS ONE BLOCK AND THERE IS NO HOLE IN IT. Round two borrowed the
 * home hero's shape, where the QR code sat between the headline and the
 * sentence, and dropped the code: Will read the result as "copying the exact H1
 * content component from the home hero but dropping the QR code, leaving a
 * ridiculous looking center gap", and asked for a hero that "feels custom"
 * rather than repurposed. So the eyebrow, the headline, the sentence and the
 * two actions stand together on PageHero's own `gap-6`, centred on the canvas,
 * and the photographs are composed around THEM. Nothing is born inside the
 * type, so there is no vent to hold open.
 *
 * ★ THE WORDS ARE THE PAGE'S, NOT A PROPOSAL. The eyebrow is the feature's nav
 * label, the headline and the sentence are `feature-pages.ts`'s, and the two
 * buttons are `arrivals-hero.tsx`'s, untinted: the cinema ground already
 * resolves the outline variant, and a board that re-tints them stops telling
 * the truth about the page. Whatever the brand voice round lands reaches this
 * hero for free.
 *
 * ★ THE QUIET ZONE IS GEOMETRY, NOT A SCRIM. `compositions.ts` places every
 * photograph outside the block's own box, at both headline steps, and
 * `compositions.test.ts` holds it there. That is what lets the media stay at
 * 100 percent with no darkening layer anywhere on the hero (bible 1).
 *
 * ★ THE STILL IS THE LOOP'S FIRST FRAME, which is new this round and is why the
 * no-script question has a cheap answer now. There is no branch-out tween: a
 * card's phase is `((its launch time + elapsed) mod cycle) / flight`, so at
 * elapsed 0 every card is exactly where the rest state draws it. Painting the
 * album settled for everyone therefore costs no snap, no second state and no
 * flash: the loop simply picks it up.
 *
 * ★ REPLAY IS A REMOUNT (the stage key), so there is no state to reset. The lab
 * pauses on a hidden TAB through the stage's `data-paused`; production wiring
 * swaps that for `useAmbientPause`, which also pauses off screen.
 */

export type Paint =
  /** The composition running, which is what the page ships. */
  | "running"
  /** What a reader with scripting off would get under the `lockup` answer. */
  | "lockup"
  /** What that reader would get under the `settled` answer. */
  | "settled";

/** The crop, per card, as a short declared cycle rather than a hash: twelve
 *  stand-in photographs have to fill up to seventeen frames, so the same
 *  picture is on screen twice and the eye pairs them at once. Moving each
 *  frame's object-position is honest rather than a trick (the guest media
 *  these stand in for is cropped to its tile exactly this way), and it keeps
 *  paying once Will's squares land, because 24 still have to fill 17. */
const CROPS = [
  "50% 42%",
  "38% 50%",
  "62% 48%",
  "50% 58%",
  "44% 38%",
  "58% 60%",
  "50% 50%",
] as const;

export function AlbumHero({
  mode,
  comp,
  step,
  paint = "running",
}: {
  mode: Mode;
  comp: CompId;
  step: Step;
  paint?: Paint;
}) {
  const composition = COMPOSITIONS[comp];
  const built = BUILT[comp][mode][step];
  const { cards, box, cycle, flight } = built;
  const page = featurePage("album");
  const reduced = usePrefersReducedMotion();
  const block = BLOCK[mode][step];

  // ★ ONE `sizes`, READ OFF THE SOLVED BOXES rather than typed: every card's
  // DOM box is known at module load, so the largest of them IS the right
  // candidate width. Canvas-relative and never a vw value, because a lab stage
  // may be zoomed and a vw would pick the wrong file (stage.tsx).
  const sizes = `${Math.max(...box.map((b) => b.w))}px`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  /** The z-index and the opacity each node is carrying, so each is written on
   *  change only. The z write is the expensive one: it re-sorts a stacking
   *  context, and a calm composition changes bucket a handful of times a
   *  minute rather than sixty times a second. */
  const zNow = useRef<number[]>([]);
  const oNow = useRef<string[]>([]);

  useEffect(() => {
    if (reduced || paint !== "running") return;
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
      // either way, and an un-held clock teleports the composition on return.
      // Read off the closest ancestor so the hero owns no shell knowledge.
      if (root.closest('[data-paused="true"]')) return;
      elapsed += dt;

      for (let i = 0; i < cards.length; i++) {
        const el = nodes.current[i];
        if (!el) continue;
        const p = phaseOf(cards[i], elapsed, cycle, flight);
        // Faded out, or on the ground between flights: not worth a composited
        // layer, and not worth a write either.
        if (p > box[i].exit) {
          if (oNow.current[i] !== "0") {
            el.style.opacity = "0";
            oNow.current[i] = "0";
          }
          continue;
        }
        const f = frameAt(cards[i], p, composition, mode, box[i].fit);
        el.style.transform = f.transform;
        if (oNow.current[i] !== f.opacity) {
          el.style.opacity = f.opacity;
          oNow.current[i] = f.opacity;
        }
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cards, box, cycle, flight, composition, mode, reduced, paint]);

  return (
    <div
      ref={rootRef}
      data-abh-comp={comp}
      /* overflow-CLIP, not overflow-hidden: an `overflow: hidden` box is still
         a SCROLL container, and this one's content runs past every edge, so
         focusing an action inside it could let the browser "reveal" the button
         by scrolling the whole composition sideways. `clip` clips the same
         pixels and creates no scroll container. */
      className="abh-hero relative size-full overflow-clip bg-background"
    >
      {/* THE PHOTOGRAPHS. Full bleed and decorative: the album is what the
          picture argues, but it is the type that carries the sentence. */}
      <div
        aria-hidden
        className="abh-field"
        data-abh-mask={composition.mask}
        data-abh-noscript={paint === "lockup" ? "lockup" : undefined}
        hidden={paint === "lockup"}
      >
        {cards.map((c, i) => {
          const rest = frameAt(
            c,
            restPhase(c, flight),
            composition,
            mode,
            box[i].fit,
          );
          return (
            <div
              key={c.key}
              ref={(el) => {
                nodes.current[i] = el;
              }}
              className="abh-card"
              style={
                {
                  width: box[i].w,
                  height: box[i].h,
                  marginLeft: -box[i].w / 2,
                  marginTop: -box[i].h / 2,
                  zIndex: rest.z,
                  // The REST state, as custom properties the sheet reads: the
                  // composition standing at its steady spacing, which is what
                  // reduced motion, a crawler, a cold paint and a reader with
                  // scripting off all get, and which is also the loop's own
                  // first frame.
                  "--abh-rest": rest.transform,
                  "--abh-rest-o": rest.opacity,
                  "--abh-crop": CROPS[i % CROPS.length],
                } as CSSProperties
              }
            >
              <Photo
                index={c.photo}
                sizes={sizes}
                className="size-full rounded-[var(--radius-tile)] ring-1 ring-white/10 ring-inset"
              />
            </div>
          );
        })}
      </div>

      {/* THE LOCKUP, ONE BLOCK, ON THE EXACT CENTRE OF THE CANVAS, which is
          the point the whole composition is solved around. At paint, at full
          opacity, gated by nothing (bible 13). */}
      <div
        className={`absolute inset-0 z-10 flex items-center justify-center ${GUTTER[mode].x}`}
      >
        <div
          data-abh-block=""
          className="flex flex-col items-center gap-6 text-center"
          style={{ maxWidth: block.w }}
        >
          <Eyebrow>{page.navLabel}</Eyebrow>
          <h1
            className={`font-heading text-balance ${LADDER[step][mode]} ${mode === "phone" ? "leading-[1.06]" : "leading-[1.0]"}`}
          >
            {page.h1}
          </h1>
          {/* PageHero's own subhead: text-lg, balanced, at the lockup's
              measure, so what is judged here is this page's hero and not a
              board's idea of one. */}
          <p className="max-w-xl text-lg text-balance text-muted-foreground">
            {page.heroSub}
          </p>
          {/* mt-2 on top of the shared gap, which is the offset every feature
              hero ships: a control row wants a touch more air than a text
              slot. The buttons are arrivals-hero.tsx's, verbatim. */}
          <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
