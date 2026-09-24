"use client";

// The section's own sheet: the rest state, the plate and the rail. It declares
// no keyframe (the switch is one rAF loop), so nothing in it can collide with a
// keyframe anywhere else.
import "./photo-section.css";

import Image from "next/image";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  atRest,
  type Config,
  DEFAULTS,
  paint,
  type Painted,
  type SourceId,
  start,
  type State,
  step,
} from "./backdrop-engine";
import { ROOM_FRAMES, roomFrame, SCROLL_STEPS } from "./room-frames";

/**
 * THE ROOM WHOSE PICTURE CHANGES AS YOU MOVE THROUGH IT.
 *
 * A section that stands on a full-bleed photograph and switches it as the
 * reader moves: the pointer's position across the room for a reader with a
 * cursor, the section's own progress up the screen for a reader without one.
 * Its copy sits on a glass plate so it stays legible over every photograph in
 * the pool. Ruled whole by Will on 2026-09-18
 * ("full-image sections are chapter transitions"), where it also became a
 * page-level device: a full-image section "can close a chapter, open a chapter,
 * or exist individually to separate two chapters", used sometimes and never at
 * every cut. Its first home closes the home page's first chapter.
 *
 * The engine decides everything (`backdrop-engine.ts`); this file owns only the
 * three things a pure module cannot: where the reader is, when a frame happens,
 * and what gets written onto a node.
 *
 * ★ FRAME ZERO IS VISIBLE WITH NO JAVASCRIPT AND NO STYLE FROM HERE (bible 5).
 * The sheet hides every layer and shows the first; the loop writes inline
 * styles, which win over it. So a crawler, a throttled tab and a reader with
 * scripting off all get the section standing on one photograph, which is also
 * exactly what a reader who asked for less motion gets (bible 5: the loop
 * never starts, no listener is attached, and nothing is observed).
 *
 * ★ IT COSTS NOTHING WHEN NOBODY IS MOVING. The loop runs only while a
 * photograph is in flight or the reader is somewhere the section has not caught
 * up to (`atRest`), and it is held off screen and on a hidden tab. A reader who
 * stops scrolling to read is reading beside a section running no frame callback
 * at all, which is precisely what Will asked the phone rule for: "it's nice
 * visitors can stop scrolling to read without any motion clash".
 *
 * ★ NO LAYOUT IS READ IN A FRAME, AND NONE AT ALL ON A PHONE. The slide is a
 * percentage of the layer, so the room's width is never needed by the loop; the
 * pointer's position needs the room's left edge and width, which arrive free on
 * an IntersectionObserver entry and are refreshed by a ResizeObserver; and the
 * scroll source measures nothing at all, because it reads five invisible trip
 * wires passing through a band across the middle of the screen instead of a
 * rect per scroll frame.
 *
 * ★ EVERY PHOTOGRAPH IS IN THE DOM FROM THE FIRST PAINT, and only one is
 * visible. The next photograph is whichever way the reader moves, so there is
 * nothing to preload on demand: the pool IS the preload, and `next/image`
 * decodes each one once at the capped width `room-frames.ts` states.
 */

const FINE_POINTER_MQ = "(hover: hover) and (pointer: fine)";

/**
 * THE READING BAND: the middle tenth of the screen, where a reader's eyes are.
 * A trip wire passing through it is what moves the section on a step. Ten
 * percent rather than a line because a zero-height root never intersects a
 * hairline (see the observer below), and narrow enough that the wires, which
 * sit a fifth of the section apart, enter it one at a time.
 */
const READING_BAND = "-45% 0px -45% 0px";

/**
 * ★ THE SOURCE IS A CAPABILITY, NEVER A WIDTH. A cursor is what the band rule
 * needs, and a narrow window on a laptop still has one while a large tablet
 * does not. The store shape is `usePrefersReducedMotion`'s, for the same
 * reason: the query IS the external store, so there is no setState and no extra
 * render on mount, and a tablet that gains a trackpad re-answers it.
 */
function subscribeFinePointer(onChange: () => void) {
  const mq = window.matchMedia(FINE_POINTER_MQ);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useSourceId(): SourceId {
  return useSyncExternalStore(
    subscribeFinePointer,
    () => (window.matchMedia(FINE_POINTER_MQ).matches ? "pointer" : "scroll"),
    // The server cannot know, and nothing in the markup depends on the answer:
    // both the wires and the rail are always rendered and the sheet gates them
    // off `data-bkd-source`, so this can never be a hydration mismatch.
    () => "pointer",
  );
}

export type PhotoSectionProps = {
  /**
   * The photographs, in the order the band walks them. Marketing image ids;
   * defaults to the room frames (ASSETS row 20's slot).
   */
  frames?: readonly string[];
  /**
   * How many a reader without a cursor passes on the way through. Never the
   * whole pool by default: see `room-frames.ts`.
   */
  steps?: number;
  /**
   * The copy. Rendered on the glass plate (Will's `legibility=plate`); a
   * section with no copy takes no plate, which is the "separate two chapters"
   * instance of the device.
   */
  children?: ReactNode;
  className?: string;
  /**
   * WHICH RULE DRIVES IT, forced. Production never passes this: the section
   * asks the reader's own device (a cursor scrubs, a thumb steps) and that is
   * the ruling. It exists so the Library can put both rules on one screen,
   * which is the only way a reviewer on a laptop can see the phone's.
   */
  source?: SourceId;
};

export function PhotoSection({
  frames = ROOM_FRAMES,
  steps = SCROLL_STEPS,
  children,
  className,
  source: forced,
}: PhotoSectionProps) {
  const reduced = usePrefersReducedMotion();
  // The query is always asked (a hook behind a `??` would be a conditional
  // hook); `forced` only decides whether the answer is used.
  const detected = useSourceId();
  const source = forced ?? detected;
  const room = useRef<HTMLDivElement | null>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const ticks = useRef<(HTMLSpanElement | null)[]>([]);
  const wires = useRef<(HTMLSpanElement | null)[]>([]);

  const pool = frames.length;

  /** Paint one state onto the nodes. The only place a style is written. */
  const write = useCallback(
    (s: State) => {
      const painted: Painted[] = paint(s);
      for (let i = 0; i < pool; i++) {
        const el = layers.current[i];
        if (!el) continue;
        const p = painted.find((q) => q.frame === i);
        if (!p) {
          if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.zIndex = String(p.z);
        el.style.transform = p.transform;
      }
      for (let i = 0; i < ticks.current.length; i++)
        ticks.current[i]?.toggleAttribute("data-on", i === s.index);
    },
    [pool],
  );

  useEffect(() => {
    const el = room.current;
    // Reduced motion is the whole story: no listener, no observer, no loop, and
    // the sheet's rest state (the pool's first photograph) is left standing.
    if (!el || reduced) return;

    const cfg: Config = { ...DEFAULTS, pool, steps, source };

    let s = start();
    /** Where the reader is along the section's driving axis, 0 to 1. */
    let at = 0;
    let raf = 0;
    let last = 0;
    let onScreen = false;
    /** The room's left edge and width, cached; the loop never reads them. */
    let left = 0;
    let width = 1;

    const tick = (now: number) => {
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      s = step(s, cfg, at, dt);
      write(s);
      // Stop the moment there is nothing left to advance, or the section has
      // left the screen. An event or its return starts it again, from the state
      // it stopped on rather than from the top.
      if (!onScreen || atRest(s, cfg, at)) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (raf || !onScreen || document.visibilityState === "hidden") return;
      // Nothing to advance and nowhere to go: a frame here would do no work and
      // immediately stop itself, which is a frame a section standing still on
      // the page has no business asking for.
      if (atRest(s, cfg, at)) return;
      // ★ THE CLOCK RESTARTS, THE STATE DOES NOT. A zero-length first frame is
      // what stops a section that was off screen or on a hidden tab teleporting
      // through a whole entrance on the way back (the field's lesson,
      // privacy-hero).
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    /* The reader with a cursor: where they are across the room. */
    const move = (e: PointerEvent) => {
      at = (e.clientX - left) / width;
      el.setAttribute("data-bkd-held", "");
      kick();
    };
    const leave = () => {
      // The section RESTS on the photograph it was left on rather than snapping
      // back to the pool's first: leaving a room does not redecorate it.
      el.removeAttribute("data-bkd-held");
    };

    /* On screen, and the tab in front: the two gates on the clock. The entry
       carries the room's rect, so the pointer's frame of reference is refreshed
       here for free rather than measured in the handler. */
    const seen = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        left = entry.boundingClientRect.left;
        width = entry.boundingClientRect.width || width;
        if (onScreen) kick();
      },
      { rootMargin: "120px" },
    );
    seen.observe(el);

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      left = r.left;
      width = r.width || 1;
    });
    ro.observe(el);

    const woke = () => kick();
    document.addEventListener("visibilitychange", woke);

    /**
     * ★ THE PHONE'S STEPS ARE TRIP WIRES, NOT A SCROLL LISTENER. Five invisible
     * hairlines spread through the room, watched by one IntersectionObserver
     * whose root is squeezed down to a band across the middle of the screen
     * (`READING_BAND`): a wire reports in as it passes through that band, so a
     * step costs one callback and ZERO layout reads, scrolling back up returns
     * the photograph just left exactly as the band rule does, and a reader who
     * stops scrolling generates no events at all. A scroll handler would have
     * to read a rect every frame to answer the same question.
     *
     * ★ THE BAND HAS HEIGHT, AND IT HAS TO. Collapsing the root to a zero-height
     * LINE (`-50% 0px -50%`) is the usual recipe and it silently never fires
     * here: a hairline crossing a line intersects over zero area, and Chrome
     * calls that no intersection. Measured, not reasoned about; the phone run
     * showed one photograph for the whole section until the band was given its
     * height.
     *
     * ★ WHICHEVER WIRE IS NEAREST THE MIDDLE WINS. On a short section more than
     * one can sit inside the band at once, and picking the last entry in the
     * callback would make the step depend on delivery order. The entries carry
     * their own rects, so the tie is broken with arithmetic rather than with a
     * measurement.
     */
    const inBand = new Map<Element, number>();
    const cross =
      source === "scroll"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (entry.isIntersecting)
                  inBand.set(entry.target, entry.boundingClientRect.top);
                else inBand.delete(entry.target);
              }
              if (!inBand.size) return;
              const middle = window.innerHeight / 2;
              let best: Element | null = null;
              let bestGap = Infinity;
              for (const [el, top] of inBand) {
                const gap = Math.abs(top - middle);
                if (gap < bestGap) {
                  bestGap = gap;
                  best = el;
                }
              }
              const k = Number((best as HTMLElement).dataset.bkdWire ?? "0");
              // The middle of that wire's own band, so `stepIndex` maps it back
              // to exactly this step with no rounding on a boundary.
              at = (k + 0.5) / Math.max(1, steps);
              kick();
            },
            { rootMargin: READING_BAND, threshold: 0 },
          )
        : null;

    if (cross) {
      for (const wire of wires.current) if (wire) cross.observe(wire);
    } else {
      el.addEventListener("pointermove", move, { passive: true });
      el.addEventListener("pointerleave", leave, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      seen.disconnect();
      ro.disconnect();
      cross?.disconnect();
      document.removeEventListener("visibilitychange", woke);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      el.removeAttribute("data-bkd-held");
    };
  }, [pool, reduced, source, steps, write]);

  return (
    <div ref={room} data-bkd-source={source} className={cn("bkd", className)}>
      <div className="bkd-stack" aria-hidden>
        {frames.map((id, i) => {
          const img = roomFrame(id);
          return (
            <div
              key={id}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className="bkd-frame"
            >
              <Image
                src={img.src}
                alt=""
                fill
                // Full-bleed: the section IS the window's width. The ceiling on
                // what this can ever fetch is the ASSET's own width, which
                // room-frames.ts states and ASSETS row 20 asks for.
                sizes="100vw"
                // The first is the section's rest state, so it is never lazy;
                // the rest are the pool and the browser fetches them as it can.
                priority={i === 0}
                className="object-cover"
              />
            </div>
          );
        })}
      </div>
      {/* The phone's steps (see the observer above). Inert, invisible and
          weightless: hairlines that exist only to be crossed. */}
      <div className="bkd-wires" aria-hidden>
        {Array.from({ length: steps }, (_, k) => (
          <span
            key={k}
            ref={(el) => {
              wires.current[k] = el;
            }}
            data-bkd-wire={k}
            className="bkd-wire"
            style={{ top: `${((k + 0.5) / steps) * 100}%` }}
          />
        ))}
      </div>
      {/* THE RAIL: Will's delight ("I absolutely love the rail of the foot, and
          tracking the Cursor's position justifies this delight"). It is the
          cursor's position made visible, so it is drawn for the reader who has
          one and for nobody else: the sheet shows it only under
          [data-bkd-source="pointer"][data-bkd-held]. */}
      <div className="bkd-rail" aria-hidden>
        {frames.map((id, i) => (
          <span
            key={id}
            ref={(el) => {
              ticks.current[i] = el;
            }}
            className="bkd-tick"
          />
        ))}
      </div>
      <div className="bkd-content">
        {children ? <div className="bkd-plate">{children}</div> : null}
      </div>
    </div>
  );
}
