"use client";

// The layer's own sheet. It declares NO keyframe: the field is one rAF loop
// writing inline transforms (src/app/keyframe-uniqueness.test.ts reads every
// sheet under the lab).
import "./field.css";

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
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import { ageOf, type Card, frameAt, restAge, type Solved } from "./field";

/**
 * THE FIELD'S ONE DRIVER (the heroes lane, 2026-09-18): round three's rAF loop
 * (`album-hero/hero.tsx`), lifted once and shared by both boards.
 *
 * ★ THE REST STATE IS THE LOOP'S FIRST FRAME. Every node carries its elapsed-0
 * transform and opacity as custom properties the sheet paints, so the server's
 * HTML, a reader with scripting off, reduced motion and the loop's own first
 * frame are ONE picture (Will's `no-script=settled`): motion begins after the
 * resting frame, never instead of it.
 *
 * ★ THE PAUSE COMES FROM THE HOST, NOT FROM HERE. A preview is drawn inside a
 * lab `Frame` (a same-origin iframe, the only real 375 the lab has), so this
 * layer's DOM ancestors stop at the frame's own body and never reach the
 * step's `data-paused` on a hidden option. The component that mounts the frame
 * lives in the lab page's document and CAN see it, so it hands a reader down
 * through context (which does cross a portal) and the loop holds its CLOCK on
 * it: rAF may keep firing, the composition does not move.
 */

/** Whether the field should hold still right now. The default reads only the
 *  tab, which is what a layer outside any lab host needs. */
export const FieldPause = createContext<() => boolean>(() =>
  typeof document !== "undefined" ? document.hidden : false,
);

/** The stand-in photograph for a card: the home hero's own twelve, through
 *  the media manifest (bible 18), so the three heroes share one set until the
 *  Higgsfield month replaces it by id. */
export const photoOf = (i: number) =>
  marketingImage(STREAM_FRAMES[i % STREAM_FRAMES.length]);

/** The crop per card, as a short declared cycle: twelve photographs fill up
 *  to three dozen frames, so each shows a different part of itself. */
const CROPS = [
  "50% 42%",
  "38% 50%",
  "62% 48%",
  "50% 58%",
  "44% 38%",
  "58% 60%",
  "50% 50%",
] as const;

export function FieldLayer<C extends Card>({
  field,
  className,
}: {
  field: Solved<C>;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const isPaused = useContext(FieldPause);
  const { cards, box, cycle, flight, trail } = field;
  const sizes = `${Math.max(...box.map((b) => b.w))}px`;

  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const trailEls = useRef<(HTMLDivElement | null)[][]>([]);
  /** What each node carries, so each write happens on a change only. */
  const zNow = useRef<number[]>([]);
  const idle = useRef<boolean[]>([]);

  useEffect(() => {
    if (reduced) {
      // Reduced motion is authoritative even when it arrives mid-visit: drop
      // what the loop wrote so the sheet's rest state takes over again, rather
      // than freezing the field wherever it happened to be (cinema-hero.tsx).
      for (const el of [...cardEls.current, ...trailEls.current.flat()]) {
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
      const el = cardEls.current[i];
      if (el) el.style.opacity = "0";
      for (const t of trailEls.current[i] ?? []) if (t) t.style.opacity = "0";
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // Hold the CLOCK, not the loop: an un-held clock teleports the field on
      // the way back from a hidden tab or a hidden option.
      if (isPaused()) return;
      elapsed += dt;

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const age = ageOf(c, elapsed, cycle);
        if (age > flight || age > box[i].exit) {
          hide(i);
          continue;
        }
        idle.current[i] = false;
        const el = cardEls.current[i];
        if (!el) continue;
        const f = frameAt(field, c, age, box[i].fit, box[i]);
        el.style.transform = f.transform;
        el.style.opacity = f.opacity.toFixed(3);
        if (zNow.current[i] !== f.z) {
          zNow.current[i] = f.z;
          el.style.zIndex = String(f.z);
        }
        if (!trail) continue;
        const row = trailEls.current[i] ?? [];
        for (let k = 0; k < row.length; k++) {
          const t = row[k];
          if (!t) continue;
          const n = trail.at(c, age, k, box[i].fit, box[i]);
          if (n.opacity > 0.002) t.style.transform = n.transform;
          t.style.opacity = n.opacity.toFixed(3);
        }
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [field, cards, box, cycle, flight, trail, reduced, isPaused]);

  return (
    <div aria-hidden className={`fld-layer ${className ?? ""}`}>
      {trail && (
        <div className="fld-trails" data-fld-trail={trail.kind}>
          {cards.map((c, i) => {
            const age = restAge(c);
            const lit = age <= flight && age <= box[i].exit;
            return Array.from({ length: trail.count }, (_, k) => {
              const n = trail.at(c, age, k, box[i].fit, box[i]);
              return (
                <div
                  key={`${c.key}-t${k}`}
                  ref={(el) => {
                    (trailEls.current[i] ??= [])[k] = el;
                  }}
                  className={trail.kind === "smear" ? "fld-smear" : "fld-ghost"}
                  style={
                    {
                      width: box[i].w,
                      height: box[i].h,
                      "--fld-rest": n.transform || "none",
                      "--fld-rest-o":
                        lit && n.transform ? n.opacity.toFixed(3) : "0",
                    } as CSSProperties
                  }
                >
                  <div className="fld-photo">
                    <Image
                      src={photoOf(c.photo).src}
                      alt=""
                      fill
                      // A smear is blurred to nothing finer than a few pixels,
                      // so it asks for the smallest file there is.
                      sizes={trail.kind === "smear" ? "64px" : sizes}
                      className="object-cover"
                      style={{ objectPosition: CROPS[i % CROPS.length] }}
                    />
                  </div>
                </div>
              );
            });
          })}
        </div>
      )}
      <div className="fld-cards">
        {cards.map((c, i) => {
          const age = restAge(c);
          const lit = age <= flight && age <= box[i].exit;
          const rest = frameAt(field, c, age, box[i].fit, box[i]);
          return (
            <div
              key={c.key}
              ref={(el) => {
                cardEls.current[i] = el;
              }}
              className="fld-card"
              style={
                {
                  width: box[i].w,
                  height: box[i].h,
                  zIndex: rest.z,
                  "--fld-rest": rest.transform,
                  "--fld-rest-o": lit ? rest.opacity.toFixed(3) : "0",
                } as CSSProperties
              }
            >
              <div className="fld-photo">
                <Image
                  src={photoOf(c.photo).src}
                  alt=""
                  fill
                  sizes={sizes}
                  // Lit at rest is what a reduced-motion reader and a cold
                  // paint see first, so it is worth the eager request.
                  loading={lit && rest.opacity > 0.02 ? "eager" : "lazy"}
                  className="object-cover"
                  style={{ objectPosition: CROPS[i % CROPS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
