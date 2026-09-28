"use client";

// The stream's own sheet (`.als-*`): the push draws its frames exactly as the
// other four do, and it declares no keyframe of its own.
import "@/components/shared/album-stream/album-stream.css";

import Image from "next/image";
import {
  type CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { AlbumStreamPause } from "@/components/shared/album-stream/album-stream";
import {
  ageOf,
  type Bp,
  frameAt,
  LG_MIN,
  restAge,
  STAGE,
} from "@/components/shared/album-stream/stream-engine";
import { marketingImage } from "@/lib/constants/marketing-media";
import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { launchOf, PUSH, type PushField } from "./push-engine";

/**
 * THE PUSH'S FRAMES, AND THE ONE THING THE OTHER FOUR NEVER DO: SAY WHEN ONE
 * ARRIVES. The layer is `album-stream.tsx`'s own (both breakpoints in the DOM,
 * CSS showing one, the rest state painted from custom properties, one rAF loop
 * writing transforms, the clock held off screen and on the step's
 * `data-paused`), plus `onArrive`: the moment a frame's centre crosses the
 * album's top edge, the stage opens its row for that photograph.
 *
 * ★ EVERY ARRIVAL IS A NEW PHOTOGRAPH. A card's picture is chosen per LAUNCH,
 * not per slot, so the album is never handed the same four photographs round
 * and round (a repeat near the head reads at once). The sequence walks the
 * album's own stills from its tail: arrival `n` is the one the album holds
 * furthest down, so its other copy is always a dozen places behind the head,
 * under the stage's dissolve.
 *
 * ★ ONLY THE SHOWN LAYER ARRIVES. Both breakpoints run in the DOM and a media
 * query hides one; two loops reporting would open the row twice. So each
 * layer asks its own window which composition it is (the frame's window in the
 * lab, which is the width being judged).
 */

/** The still for arrival `n`: the album's twelve, walked from its tail. */
export const arrivalPhoto = (n: number) =>
  (((STREAM_FRAMES.length - 1 - n) % STREAM_FRAMES.length) +
    STREAM_FRAMES.length) %
  STREAM_FRAMES.length;

const CROPS = ["50% 42%", "38% 50%", "62% 48%", "50% 58%", "44% 38%"] as const;

/** `(min-width: LG_MIN)` in the layer's own window: `album-stream.css`'s swap. */
function isShown(el: HTMLElement, at: Bp): boolean {
  const win = el.ownerDocument.defaultView;
  const wide = !!win?.matchMedia(`(min-width: ${LG_MIN}px)`).matches;
  return at === "lg" ? wide : !wide;
}

export function PushStream({
  onArrive,
}: {
  /** A photograph went in: arrival `n`, showing still `photo`. */
  onArrive: (n: number, photo: number) => void;
}) {
  return (
    <div aria-hidden>
      <Layer field={PUSH.lg} at="lg" onArrive={onArrive} />
      <Layer field={PUSH.base} at="base" onArrive={onArrive} />
    </div>
  );
}

function Layer({
  field,
  at,
  onArrive,
}: {
  field: PushField;
  at: Bp;
  onArrive: (n: number, photo: number) => void;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, paused } = useAmbientPause<HTMLDivElement>();
  const held = useContext(AlbumStreamPause);
  // The layer itself, for the loop's one question (which composition is
  // shown), beside the pause's own observer.
  const layer = useRef<HTMLDivElement | null>(null);
  const setLayer = useCallback(
    (el: HTMLDivElement | null) => {
      layer.current = el;
      ref(el);
    },
    [ref],
  );
  const { cards, box, cycle } = field;

  // The picture each card wears on its current launch (the rest state's at
  // first), rewritten only when a card leaves again: once a beat, never a frame.
  const [photos, setPhotos] = useState(() =>
    cards.map((c) => arrivalPhoto(launchOf(field, c, 0))),
  );

  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  // ★ THE CLOCK OUTLIVES THE LOOP. The loop restarts when reduced motion is
  // switched mid-visit (or on a fast refresh); from zero, its launches would
  // repeat arrival numbers the album already holds, and those rows never open.
  const clock = useRef(0);
  const hold = useRef({ paused, held, onArrive });
  useEffect(() => {
    hold.current = { paused, held, onArrive };
  });

  useEffect(() => {
    if (reduced) {
      for (const el of nodes.current) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      return;
    }
    let raf = 0;
    let last = 0;
    let elapsed = clock.current;
    const launch = cards.map((c) => launchOf(field, c, elapsed));
    const ages = cards.map((c) => ageOf(c, elapsed, cycle));

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      const { paused: off, held: reader, onArrive: arrive } = hold.current;
      if (off || reader?.()) return;
      elapsed += dt;
      clock.current = elapsed;
      const el0 = layer.current;
      const shown = !!el0 && isShown(el0, at);

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const age = ageOf(c, elapsed, cycle);
        const was = ages[i];
        ages[i] = age;
        const n = launchOf(field, c, elapsed);
        if (n !== launch[i]) {
          // It left again: a new photograph for a new arrival.
          launch[i] = n;
          const photo = arrivalPhoto(n);
          setPhotos((prev) =>
            prev[i] === photo
              ? prev
              : prev.map((p, j) => (j === i ? photo : p)),
          );
        } else if (shown && was < c.handover && age >= c.handover) {
          // Half through the edge, right over the head: the row opens.
          arrive(n, arrivalPhoto(n));
        }
        const el = nodes.current[i];
        if (!el) continue;
        if (age > c.arrive) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const f = frameAt(field, c, age, box[i].fit, box[i]);
        el.style.transform = f.transform;
        el.style.opacity = f.opacity.toFixed(3);
        el.style.zIndex = String(f.z);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [field, cards, box, cycle, reduced, at]);

  return (
    <div
      ref={setLayer}
      className={`als-layer ${at === "lg" ? "als-at-lg" : "als-at-base"}`}
      style={
        { "--als-edge": `${STAGE[at].h + STAGE[at].floor}px` } as CSSProperties
      }
    >
      {cards.map((c, i) => {
        const age = restAge(c);
        const lit = age <= c.arrive;
        const rest = frameAt(field, c, age, box[i].fit, box[i]);
        return (
          <div
            key={c.key}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            className="als-card"
            style={
              {
                width: box[i].w,
                height: box[i].h,
                zIndex: rest.z,
                "--als-rest": rest.transform,
                "--als-rest-o": lit ? rest.opacity.toFixed(3) : "0",
              } as CSSProperties
            }
          >
            <div className="als-photo">
              <Image
                src={marketingImage(STREAM_FRAMES[photos[i]]).src}
                alt=""
                fill
                sizes={`${box[i].w}px`}
                className="object-cover"
                style={{ objectPosition: CROPS[i % CROPS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
