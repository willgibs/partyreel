"use client";

// The layer's own sheet. It declares NO keyframe: the stream is one rAF loop
// writing inline transforms (src/app/keyframe-uniqueness.test.ts).
import "./album-stream.css";

import Image from "next/image";
import {
  createContext,
  type CSSProperties,
  useContext,
  useEffect,
  useRef,
} from "react";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  ageOf,
  type Card,
  frameAt,
  framesSizes,
  LG_MIN,
  restAge,
  SHIPPED,
  type Solved,
  STAGE,
  STREAMS,
  type Variant,
} from "./stream-engine";

/**
 * THE PHOTOGRAPHS FALLING INTO THE ALBUM (the album-wiring lane, 2026-09-19).
 *
 * Will's `motion=stream` on the album page's hero, wired: the layer that draws
 * what `stream-engine.ts` decides. The engine owns every number; this file owns
 * only the three things a pure module cannot: when a frame happens, what gets
 * written onto a node, and who is allowed to hold the clock.
 *
 * ★ BOTH BREAKPOINTS ARE IN THE DOM AND CSS PICKS ONE. The two compositions are
 * different in KIND (at `lg` the frames are born in the empty space beside the
 * words; at `base` the words fill the column, so they are born in the strip
 * under them), so this is not one table stretched. Rendering both and letting a
 * media query show one keeps the whole thing server-rendered and free of a
 * width read, which is what `no-script=settled` needs; the hidden one costs no
 * decode, because `next/image` never fetches a `display: none` layer's frames
 * at these sizes until they are shown.
 *
 * ★ THE REST STATE IS THE LOOP'S FIRST FRAME. Every node carries its elapsed-0
 * transform and opacity as custom properties the sheet paints, so the server's
 * HTML, a reader with scripting off, reduced motion and the loop's own first
 * frame are ONE picture (Will's `no-script=settled`, album-hero round three).
 *
 * ★ IT COSTS NOTHING WHEN NOBODY IS LOOKING. `useAmbientPause` holds the CLOCK
 * (never the loop's existence) off screen and on a hidden tab: an un-held clock
 * teleports the composition on the way back, which is the lesson the field
 * lane paid for. A lab preview adds its own reader through `AlbumStreamPause`,
 * because a board draws the hero inside a same-origin frame whose DOM ancestors
 * never reach the step's `data-paused`.
 *
 * ★ DECORATIVE, AND NOTHING IN IT IS FOCUSABLE. `aria-hidden`, no links, no
 * buttons: the album under the words is the content, and this is the light
 * around it.
 */

/** A host's own "hold still now" reader, over the ambient one. The lab passes
 *  the step's paused flag through it; production passes nothing. */
export const AlbumStreamPause = createContext<(() => boolean) | null>(null);

/** The stand-in photograph for a frame: the home hero's own twelve, through the
 *  media manifest (bible 18), so the two compositions share one set until the
 *  Higgsfield month replaces them by id (ASSETS row 22). */
const photoOf = (i: number) =>
  marketingImage(STREAM_FRAMES[i % STREAM_FRAMES.length]);

/** The crop per frame, as a short declared cycle: twelve photographs fill up to
 *  three dozen frames, so each shows a different part of itself. */
const CROPS = [
  "50% 42%",
  "38% 50%",
  "62% 48%",
  "50% 58%",
  "44% 38%",
  "58% 60%",
  "50% 50%",
] as const;

export function AlbumStream({
  variant = SHIPPED,
  className,
}: {
  /** Which of the three the hero draws. Production takes the engine's
   *  `SHIPPED`; the `album-motion` board is the only caller that names one. */
  variant?: Variant;
  className?: string;
}) {
  return (
    <div aria-hidden className={className}>
      <Layer field={STREAMS[variant].lg} variant={variant} at="lg" />
      <Layer field={STREAMS[variant].base} variant={variant} at="base" />
    </div>
  );
}

function Layer({
  field,
  variant,
  at,
}: {
  field: Solved;
  variant: Variant;
  at: "base" | "lg";
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const held = useContext(AlbumStreamPause);
  const { cards, box, cycle, flight } = field;
  const sizes = framesSizes(variant);

  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  /** What each node carries, so each write happens on a change only. */
  const zNow = useRef<number[]>([]);
  const idle = useRef<boolean[]>([]);
  /** The pause readers, reached through a ref so the loop is not torn down and
   *  rebuilt every time the observer flips. Written in an effect, never during
   *  a render: the loop only ever reads it on the next frame. */
  const hold = useRef<{ paused: boolean; held: (() => boolean) | null }>({
    paused,
    held,
  });
  useEffect(() => {
    hold.current = { paused, held };
  });

  useEffect(() => {
    if (reduced) {
      // Reduced motion is authoritative even when it arrives mid-visit: drop
      // what the loop wrote so the sheet's rest state takes over again, rather
      // than freezing the stream wherever it happened to be.
      for (const el of nodes.current) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      zNow.current = [];
      idle.current = [];
      return;
    }
    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const hide = (i: number) => {
      if (idle.current[i]) return;
      idle.current[i] = true;
      const el = nodes.current[i];
      if (el) el.style.opacity = "0";
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      const { paused: off, held: reader } = hold.current;
      // Hold the CLOCK, not the loop.
      if (off || reader?.()) return;
      elapsed += dt;

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const age = ageOf(c, elapsed, cycle);
        if (age > flight || age > box[i].exit) {
          hide(i);
          continue;
        }
        idle.current[i] = false;
        const el = nodes.current[i];
        if (!el) continue;
        const f = frameAt(field, c, age, box[i].fit, box[i]);
        el.style.transform = f.transform;
        el.style.opacity = f.opacity.toFixed(3);
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [field, cards, box, cycle, flight, reduced]);

  return (
    <div
      ref={ref}
      className={`als-layer ${at === "lg" ? "als-at-lg" : "als-at-base"}`}
      style={
        {
          // The album's top edge, measured UP from the hero's foot. One number,
          // shared with the stage that draws the album (stream-engine.ts's
          // STAGE), so the photographs land on the edge that is really there.
          "--als-edge": `${STAGE[at].h + STAGE[at].floor}px`,
        } as CSSProperties
      }
    >
      {cards.map((c, i) => (
        <Frame
          key={c.key}
          field={field}
          card={c}
          box={box[i]}
          flight={flight}
          sizes={sizes}
          crop={CROPS[i % CROPS.length]}
          ref={(el) => {
            nodes.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}

function Frame({
  field,
  card,
  box,
  flight,
  sizes,
  crop,
  ref,
}: {
  field: Solved;
  card: Card;
  box: { w: number; h: number; fit: number; exit: number };
  flight: number;
  sizes: string;
  crop: string;
  ref: (el: HTMLDivElement | null) => void;
}) {
  const age = restAge(card);
  const lit = age <= flight && age <= box.exit;
  const rest = frameAt(field, card, age, box.fit, box);
  return (
    <div
      ref={ref}
      className="als-card"
      style={
        {
          width: box.w,
          height: box.h,
          zIndex: rest.z,
          "--als-rest": rest.transform,
          "--als-rest-o": lit ? rest.opacity.toFixed(3) : "0",
        } as CSSProperties
      }
    >
      <div className="als-photo">
        <Image
          src={photoOf(card.photo).src}
          alt=""
          fill
          sizes={sizes}
          // Lit at rest is what a reduced-motion reader and a cold paint see
          // first, so it is worth the eager request.
          loading={lit && rest.opacity > 0.02 ? "eager" : "lazy"}
          className="object-cover"
          style={{ objectPosition: crop }}
        />
      </div>
    </div>
  );
}

/** The breakpoint the two layers swap at, for the sheet that hides one. It is
 *  the home hero's own (`LG_MIN`), and the media query in album-stream.css says
 *  it too: a CSS media query cannot read a module, and that is the one
 *  duplication here. */
export const STREAM_LG_MIN = LG_MIN;
