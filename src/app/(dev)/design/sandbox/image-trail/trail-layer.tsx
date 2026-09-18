"use client";

// The layer's own sheet. It declares NO keyframe: the trail is one rAF loop
// writing inline transforms (src/app/keyframe-uniqueness.test.ts reads every
// sheet under the lab).
import "./trail.css";

import Image from "next/image";
import {
  createContext,
  type CSSProperties,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";

import {
  advance,
  boxOf,
  frameOf,
  type Path,
  type Pt,
  replay,
  type TrailSpec,
  type TrailState,
} from "./trail-engine";

/**
 * THE TRAIL'S ONE DRIVER (the image-trail lane, 2026-09-18).
 *
 * ★ THE REST STATE IS THE LOOP'S FIRST FRAME, AND IT IS A REPLAY. Every node
 * carries the transform and opacity it holds at `stillAt` on the board's
 * scripted path, as custom properties the sheet paints. So the server's HTML, a
 * reader with scripting off, a reduced-motion reader, the headless capture and
 * the loop's own first frame are ONE picture, and motion begins after the
 * resting composition rather than instead of it. It is also the only way a
 * POINTER board can be captured at all: a headless browser has no cursor, and
 * `lab:demo` emulates reduced motion on top of that.
 *
 * ★ THE PATH RUNS UNTIL A HAND ARRIVES. A pure cursor trail leaves an empty
 * first screen for every reader who has not moved yet, which is fine for a demo
 * and fatal for a hero. So under `drive="pointer"` the scripted path walks the
 * trail on its own, a real pointer TAKES OVER the moment it enters, and the
 * path resumes from where its own clock was left when the pointer leaves. One
 * ring, one code path: the engine never asks where a sample came from.
 *
 * ★ NO LAYOUT READ PER FRAME. The layer's box is read once, and again only when
 * a resize or a scroll marks it stale, never inside the loop and never inside
 * the pointer handler (which is passive and does nothing but store a client
 * point). A `getBoundingClientRect` on every `pointermove` is a forced layout on
 * every mouse event, which is the cheapest way there is to make a beautiful
 * effect feel heavy.
 *
 * ★ PAUSED WHEN IT CANNOT BE SEEN, three ways: an IntersectionObserver for
 * scrolled away, `document.hidden` for a background tab, and the host's own
 * reader for a lab option that is not on screen (see `TrailPause`). All three
 * hold the CLOCK rather than the loop: an unheld clock teleports the trail on
 * the way back.
 */

/** Whether the trail should hold still right now. The default reads only the
 *  tab, which is what a layer outside any lab host needs. */
export const TrailPause = createContext<() => boolean>(() =>
  typeof document !== "undefined" ? document.hidden : false,
);

/** The stand-in photograph for a card: the home hero's own twelve, through the
 *  media manifest (bible 18), so every hero shares one set until the Higgsfield
 *  month replaces it by id. An ask names the slot, never the picture. */
export const photoOf = (i: number) =>
  marketingImage(STREAM_FRAMES[i % STREAM_FRAMES.length]);

/** The crop per slot, as a short declared cycle: twelve photographs fill up to
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

/**
 * WHAT MOVES THE TRAIL.
 *  - `pointer`: the paths walk on their own until a hand enters, then the hand
 *    takes over path 0 and the paths resume from their own clock when it leaves.
 *    The hero is alive before anybody touches it, which is the difference
 *    between an effect and a demo.
 *  - `path`: the paths and nothing else, which is the privacy hero.
 *  - `hand`: only a hand. Nothing walks by itself, so the still settles and
 *    waits, which is exactly what a phone with no finger on it would show.
 *  - `still`: no loop at all. One photograph of a moving thing.
 */
export type Drive = "pointer" | "path" | "hand" | "still";

export type TrailSource = {
  /** The paths the trail walks when no hand is on it. One ring each. */
  paths: readonly Path[];
  drive: Drive;
  /** The moment on the paths the still composition is frozen at. */
  stillAt: number;
};

export function TrailLayer({
  spec,
  source,
  className,
}: {
  spec: TrailSpec;
  source: TrailSource;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const isPaused = useContext(TrailPause);
  const { paths, drive, stillAt } = source;

  const host = useRef<HTMLDivElement | null>(null);
  /** [pathIndex][slot] */
  const els = useRef<(HTMLDivElement | null)[][]>([]);
  const zNow = useRef<number[][]>([]);
  const hidden = useRef<boolean[][]>([]);

  /**
   * THE STILL, SOLVED ONCE. Plain arithmetic on both sides of the wire, so the
   * server and the browser agree and nothing hydrates with a warning.
   */
  const still = useMemo(
    () => replay(spec, paths, stillAt),
    [spec, paths, stillAt],
  );

  const sizes = `${spec.size}px`;

  useEffect(() => {
    if (reduced || drive === "still") {
      // Reduced motion is authoritative even when it arrives mid-visit: drop
      // what the loop wrote so the sheet's rest state takes over again, rather
      // than freezing the trail wherever it happened to be.
      for (const row of els.current) {
        for (const el of row ?? []) {
          if (!el) continue;
          el.style.transform = "";
          el.style.opacity = "";
          el.style.zIndex = "";
        }
      }
      zNow.current = [];
      hidden.current = [];
      return;
    }

    const node = host.current;
    if (!node) return;

    /**
     * ★ THE LOOP STARTS WHERE THE STILL LEFT OFF. Seeding from the replay (and
     * starting the path's clock at the same moment) is what makes the sentence
     * "motion begins after the resting frame, never instead of it" true here: a
     * loop that began from an empty ring would blank the composition the server
     * painted and refill it over the next second and a half, which reads as the
     * page breaking on hydration.
     */
    const states: TrailState[] = replay(spec, paths, stillAt);
    /** The path's own clock, which only runs while a path is driving. */
    let pathClock = stillAt;
    /** The last client point the pointer reported, in the layer's own px. */
    let hand: Pt | null = null;
    let handFresh = false;
    let onScreen = true;

    /* ── The box, read lazily and never inside the loop ──────────────────── */
    let box: DOMRect | null = null;
    let boxStale = true;
    const rect = () => {
      if (boxStale || !box) {
        box = node.getBoundingClientRect();
        boxStale = false;
      }
      return box;
    };
    const markStale = () => {
      boxStale = true;
    };

    const ro = new ResizeObserver(markStale);
    ro.observe(node);
    window.addEventListener("scroll", markStale, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", markStale, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(node);

    /* ── The pointer, passive and cheap ──────────────────────────────────── */
    // The layer itself is `pointer-events: none`, so the listener rides the
    // layer's PARENT: the whole hero is the surface a reader draws on, which is
    // what the effect is for.
    const surface = node.parentElement ?? node;
    const onMove = (e: PointerEvent) => {
      const r = rect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      hand = { x, y };
      handFresh = true;
    };
    const onLeave = () => {
      hand = null;
      handFresh = false;
    };
    const handDrives = drive === "pointer" || drive === "hand";
    const pathDrives = drive === "pointer" || drive === "path";
    if (handDrives) {
      surface.addEventListener("pointermove", onMove, { passive: true });
      surface.addEventListener("pointerleave", onLeave, { passive: true });
      // A touch drag is a pointer too, which is the phone answer this board
      // asks about: the trail follows a finger with no extra code.
      surface.addEventListener("pointerdown", onMove, { passive: true });
    }

    /* ── The loop ────────────────────────────────────────────────────────── */
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // Hold the CLOCK, not the loop.
      if (!onScreen || document.hidden || isPaused()) return;

      const handDriving = handDrives && hand !== null;
      if (!handDriving && pathDrives) pathClock += dt;

      for (let i = 0; i < states.length; i++) {
        const to =
          handDriving && i === 0
            ? handFresh
              ? hand
              : states[i].source
            : pathDrives
              ? paths[i](pathClock)
              : // Nothing is driving this ring: age it, birth nothing, and let
                // what the still put there decay away in its own time.
                null;
        states[i] = advance(states[i], spec, { to, dt });

        const row = els.current[i] ?? [];
        const zRow = (zNow.current[i] ??= []);
        const hideRow = (hidden.current[i] ??= []);
        for (let slot = 0; slot < row.length; slot++) {
          const el = row[slot];
          if (!el) continue;
          const card = states[i].cards[slot];
          const f = card ? frameOf(card, spec, states[i].t) : null;
          if (!f) {
            if (!hideRow[slot]) {
              hideRow[slot] = true;
              el.style.opacity = "0";
            }
            continue;
          }
          hideRow[slot] = false;
          const b = boxOf(spec, slot);
          el.style.transform = `translate3d(${(f.x - b.w / 2).toFixed(2)}px, ${(f.y - b.h / 2).toFixed(2)}px, 0) rotate(${f.rot.toFixed(2)}deg) scale(${f.scale.toFixed(4)})`;
          el.style.opacity = f.opacity.toFixed(3);
          if (zRow[slot] !== f.z) {
            zRow[slot] = f.z;
            el.style.zIndex = String(f.z);
          }
        }
      }
      handFresh = false;
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", markStale, { capture: true });
      window.removeEventListener("resize", markStale);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", onLeave);
      surface.removeEventListener("pointerdown", onMove);
    };
  }, [spec, paths, drive, stillAt, reduced, isPaused]);

  return (
    // aria-hidden and nothing focusable: this is weather, not content.
    <div aria-hidden className={`itr-layer ${className ?? ""}`} ref={host}>
      {paths.map((_, i) =>
        Array.from({ length: spec.pool }, (_, slot) => {
          const b = boxOf(spec, slot);
          const card = still[i]?.cards[slot] ?? null;
          const f = card ? frameOf(card, spec, stillAt) : null;
          const rest = f
            ? `translate3d(${(f.x - b.w / 2).toFixed(2)}px, ${(f.y - b.h / 2).toFixed(2)}px, 0) rotate(${f.rot.toFixed(2)}deg) scale(${f.scale.toFixed(4)})`
            : "none";
          return (
            <div
              key={`${i}-${slot}`}
              ref={(el) => {
                (els.current[i] ??= [])[slot] = el;
              }}
              className="itr-card"
              style={
                {
                  width: b.w,
                  height: b.h,
                  zIndex: f?.z ?? 2,
                  "--itr-rest": rest,
                  "--itr-rest-o": f ? f.opacity.toFixed(3) : "0",
                } as CSSProperties
              }
            >
              <div className="itr-photo">
                <Image
                  src={photoOf(card?.photo ?? i * spec.pool + slot).src}
                  alt=""
                  fill
                  sizes={sizes}
                  // Lit at rest is what a reduced-motion reader and a cold paint
                  // both see first, so it is worth the eager request.
                  loading={f && f.opacity > 0.05 ? "eager" : "lazy"}
                  className="object-cover"
                  style={{ objectPosition: CROPS[slot % CROPS.length] }}
                />
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}
