"use client";

// The layer's own sheet. It declares NO keyframe: the stream is one rAF loop
// writing inline transforms (src/app/keyframe-uniqueness.test.ts).
import "./album-stream.css";

import Image from "next/image";
import {
  createContext,
  type CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  ageOf,
  arrivalPhoto,
  type Bp,
  type Card,
  frameAt,
  framesSizes,
  launchOf,
  restAge,
  type Solved,
  STAGE,
  STREAM,
  STREAM_LG_MIN,
} from "./stream-engine";

/**
 * THE PHOTOGRAPHS FALLING INTO THE ALBUM, EACH ONE PUSHED IN (the album-wiring
 * lane, 2026-09-19; the push, album-motion r1, 2026-09-29).
 *
 * Will's `motion=stream` on the album page's hero, wired: the layer that draws
 * what `stream-engine.ts` decides. The engine owns every number; this file owns
 * only what a pure module cannot: when a frame happens, what gets written onto
 * a node, who is allowed to hold the clock, and the one thing a falling
 * photograph says to the album it falls into: "take me" (`AlbumStreamTarget`),
 * at the moment the engine hands it over.
 *
 * ★ BOTH BREAKPOINTS ARE IN THE DOM AND CSS PICKS ONE. The two compositions are
 * different in KIND (at `lg` the frames are born in the empty space beside the
 * words; at `base` the words fill the column, so they are born in the strip
 * under them), so this is not one table stretched. Rendering both and letting a
 * media query show one keeps the whole thing server-rendered and free of a
 * width read, which is what `no-script=settled` needs; the hidden one costs no
 * decode, because `next/image` never fetches a `display: none` layer's frames
 * at these sizes until they are shown, and its clock is held, because the
 * ambient pause never sees a `display: none` box.
 *
 * ★ THE REST STATE IS THE LOOP'S FIRST FRAME. Every node carries its elapsed-0
 * transform and opacity as custom properties the sheet paints, so the server's
 * HTML, a reader with scripting off, reduced motion and the loop's own first
 * frame are ONE picture (Will's `no-script=settled`, album-hero round three).
 *
 * ★ IT COSTS NOTHING WHEN NOBODY IS LOOKING. `useAmbientPause` holds the CLOCK
 * (never the loop's existence) off screen and on a hidden tab: an un-held clock
 * teleports the composition on the way back, which is the lesson the field
 * lane paid for. A held clock also holds the arrivals: the album takes nothing
 * while nobody watches the stream.
 *
 * ★ DECORATIVE, AND NOTHING IN IT IS FOCUSABLE. `aria-hidden`, no links, no
 * buttons: the album under the words is the content, and this is the light
 * around it.
 */

/**
 * THE ALBUM A STREAM FALLS INTO, as the stream sees it: which photographs it
 * will take, in order, and the moment one goes in. A stage that holds an album
 * provides it (`LiveAlbum`, live-album-stage.tsx); with none, the frames still
 * fall and dissolve and simply hand nothing over.
 */
export type StreamTarget = {
  /** The still the arrival `ahead` of the next one will be: the album's tail
   *  first, since that is the photograph it takes in next. */
  upcoming: (ahead: number) => number;
  /** A frame's photograph went in: the album opens its row for it. */
  arrive: (photo: number) => void;
};

export const AlbumStreamTarget = createContext<StreamTarget | null>(null);

/** A still of the shared twelve, through the media manifest, so the stream and
 *  the album it falls into draw one set until the Higgsfield month replaces
 *  them by id (ASSETS row 22). */
const photoOf = (i: number) =>
  marketingImage(STREAM_FRAMES[i % STREAM_FRAMES.length]);

/** The crop per frame, as a short declared cycle, so a still that falls again
 *  shows a different part of itself. */
const CROPS = [
  "50% 42%",
  "38% 50%",
  "62% 48%",
  "50% 58%",
  "44% 38%",
  "58% 60%",
  "50% 50%",
] as const;

/** One `sizes` for every frame at both breakpoints: the engine's own boxes. */
const SIZES = framesSizes();

export function AlbumStream({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <Layer field={STREAM.lg} at="lg" />
      <Layer field={STREAM.base} at="base" />
    </div>
  );
}

/**
 * Whether this layer is the composition its own window shows
 * (`album-stream.css`'s swap). ★ ONLY THE SHOWN ONE HANDS OVER: the hidden
 * layer's clock is held already, but two layers announcing would open the row
 * twice, so the rule is written here rather than trusted to the observer.
 */
function isShown(el: HTMLElement, at: Bp): boolean {
  const win = el.ownerDocument.defaultView;
  const wide = !!win?.matchMedia(`(min-width: ${STREAM_LG_MIN}px)`).matches;
  return at === "lg" ? wide : !wide;
}

function Layer({ field, at }: { field: Solved; at: Bp }) {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const target = useContext(AlbumStreamTarget);
  const { cards, box, cycle, flight } = field;

  // The layer itself, for the one question the loop asks at a handover (is it
  // the composition on screen), beside the pause's own observer.
  const layer = useRef<HTMLDivElement | null>(null);
  const setLayer = useCallback(
    (el: HTMLDivElement | null) => {
      layer.current = el;
      ref(el);
    },
    [ref],
  );

  /**
   * ★ EVERY LAUNCH IS DRESSED FOR ITS ARRIVAL. A card's photograph is chosen
   * each time it leaves, as the one the album will take when it gets there
   * (`arrivalPhoto`: the album's tail, then the one above it), so the photograph
   * that dissolves at the edge is the one whose row opens, and the album is
   * never handed a still it already shows. Rewritten only when a card leaves
   * again: once a beat, never a frame. The rest state's is the same answer at
   * elapsed 0, on the server and in the browser alike.
   */
  const [photos, setPhotos] = useState(() =>
    cards.map((c) =>
      arrivalPhoto(field, launchOf(field, c, 0), 0, target?.upcoming),
    ),
  );
  /** What each card wears right now, for the loop (state lands a render late). */
  const worn = useRef(photos);

  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  /** What each node carries, so each write happens on a change only. */
  const zNow = useRef<number[]>([]);
  const idle = useRef<boolean[]>([]);
  /**
   * ★ THE CLOCK OUTLIVES THE LOOP. The loop restarts when reduced motion is
   * switched mid-visit (or on a fast refresh); from zero, its launches would
   * repeat arrivals the album has already taken.
   */
  const clock = useRef(0);
  /** The pause and the album, reached through a ref so the loop is not torn
   *  down and rebuilt every time the observer flips. Written in an effect,
   *  never during a render: the loop only ever reads it on the next frame. */
  const hold = useRef({ paused, target });
  useEffect(() => {
    hold.current = { paused, target };
  });

  /** Dress every card again, from the clock as it stands. */
  const redress = useCallback(
    (elapsed: number, album: StreamTarget | null) => {
      const next = cards.map((c) =>
        arrivalPhoto(
          field,
          launchOf(field, c, elapsed),
          elapsed,
          album?.upcoming,
        ),
      );
      if (next.every((p, i) => p === worn.current[i])) return;
      worn.current = next;
      setPhotos(next);
    },
    [cards, field],
  );

  // ★ A LAYER THAT COMES BACK ASKS THE ALBUM AGAIN. The other composition may
  // have been handing photographs over while this one was held (a window
  // resized across the swap, a tablet turned), so the frames it holds are
  // re-dressed for the album as it is now: its next arrival is the album's tail
  // again, and nothing it pushes is already showing. A layer returning from
  // off screen finds the album where it left it and changes nothing.
  useEffect(() => {
    if (!paused && !reduced) redress(clock.current, target);
  }, [paused, reduced, redress, target]);

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
    let elapsed = clock.current;
    const launch = cards.map((c) => launchOf(field, c, elapsed));
    const ages = cards.map((c) => ageOf(c, elapsed, cycle));

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
      const { paused: off, target: album } = hold.current;
      // Hold the CLOCK, not the loop.
      if (off) return;
      elapsed += dt;
      clock.current = elapsed;

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const age = ageOf(c, elapsed, cycle);
        const was = ages[i];
        ages[i] = age;
        const n = launchOf(field, c, elapsed);
        if (n !== launch[i]) {
          // It left again: dressed for the arrival it is now.
          launch[i] = n;
          const photo = arrivalPhoto(field, n, elapsed, album?.upcoming);
          if (worn.current[i] !== photo) {
            worn.current = worn.current.map((p, j) => (j === i ? photo : p));
            setPhotos(worn.current);
          }
        } else if (
          album &&
          was < c.handover &&
          age >= c.handover &&
          layer.current &&
          isShown(layer.current, at)
        ) {
          // Half dissolved at the album's edge: its row opens.
          album.arrive(worn.current[i]);
        }
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
  }, [field, cards, box, cycle, flight, reduced, at]);

  return (
    <div
      ref={setLayer}
      className={`als-layer ${at === "lg" ? "als-at-lg" : "als-at-base"}`}
      style={
        {
          // The album's top edge, measured UP from the hero's foot. One number,
          // shared with the stage that draws the album (stream-engine.ts's
          // STAGE), so the photographs dissolve on the edge that is really there.
          "--als-edge": `${STAGE[at].h + STAGE[at].floor}px`,
        } as CSSProperties
      }
    >
      {cards.map((c, i) => (
        <Frame
          key={c.key}
          field={field}
          card={c}
          photo={photos[i]}
          box={box[i]}
          flight={flight}
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
  photo,
  box,
  flight,
  crop,
  ref,
}: {
  field: Solved;
  card: Card;
  photo: number;
  box: { w: number; h: number; fit: number; exit: number };
  flight: number;
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
          src={photoOf(photo).src}
          alt=""
          fill
          sizes={SIZES}
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
