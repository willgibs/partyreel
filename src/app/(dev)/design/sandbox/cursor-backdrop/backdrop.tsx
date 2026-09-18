"use client";

import Image from "next/image";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { STREAM_FRAMES } from "@/components/marketing/sections/home/hero-stream";
import { marketingImage } from "@/lib/constants/marketing-media";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  type Box,
  type Config,
  paint,
  type Painted,
  type PathId,
  PATH_PERIOD,
  type Pointer,
  pointerAt,
  start,
  type State,
  step,
  stillAt,
} from "./backdrop-engine";

/**
 * THE ROOM WHOSE PICTURE CHANGES AS YOU MOVE THROUGH IT.
 *
 * The engine decides everything (`backdrop-engine.ts`); this file owns only the
 * three things a pure module cannot: where the pointer is, when a frame
 * happens, and what gets written onto a node.
 *
 * ★ EVERY PHOTOGRAPH IS IN THE DOM FROM THE FIRST PAINT, and only one is
 * visible. With `band` the next photograph is whichever way the pointer moves,
 * so there is nothing to preload on demand: the pool IS the preload, and
 * `next/image` decodes each one once, at the section's own width, on the
 * browser's own schedule. What that costs is measured on the board rather than
 * assumed (the decoded weight is a caption there).
 *
 * ★ FRAME ZERO IS VISIBLE WITH NO JAVASCRIPT AND NO STYLE FROM HERE (bible 13).
 * The sheet hides every layer and shows the first; the loop writes inline
 * styles, which win over it. So a crawler, a throttled tab and a reader with
 * scripting off all get the section standing on one photograph, which is also
 * exactly what a reduced-motion reader gets (bible 14: the loop never starts).
 *
 * ★ NO LAYOUT IS READ IN A FRAME. The room's box is cached and refreshed by a
 * ResizeObserver, never inside the loop; `pointermove` is passive and stores
 * three numbers. The loop writes `transform`, `opacity`, `clip-path`,
 * `visibility` and `z-index` and nothing else, so a switch is compositor work
 * over a region that was going to be composited anyway.
 */

/**
 * THE POOL: eight of the hero's own photographs, in the hero's own order, which
 * was already sequenced so neighbours vary in palette and subject (the exact
 * property a backdrop that switches under copy needs). Eight rather than the
 * hero's twelve because a full-bleed photograph is decode-bound rather than
 * bandwidth-bound; the board measures both. The Higgsfield month replaces them
 * by SLOT, so nothing here names a picture.
 */
export const POOL = STREAM_FRAMES.slice(0, 8);

/** The copy's treatment over the photograph. */
export type LegibilityId = "plate" | "scrim" | "half";

/** Where the pointer comes from. */
export type DriveId =
  /** The reader's own pointer, and nothing when there is none: the live site. */
  | "live"
  /**
   * The scripted path UNTIL a real pointer enters the room, then the reader's,
   * and back to the path when it leaves. This is what a board preview wants: a
   * tile nobody is pointing at is alive (and a capture of it is evidence), and
   * a tile the reviewer reaches for answers them instead of ignoring them.
   */
  | "auto"
  /** One frame of the scripted path, written once and left alone. */
  | "still";

export type BackdropProps = {
  cfg: Omit<Config, "box">;
  drive: DriveId;
  /**
   * How far into the entrance a still is taken. 1 settles it, which is the
   * section's rest state and what reduced motion gets by default; a board
   * asking about the ENTRANCE holds it part-way, so three motions become three
   * pictures with nothing moving.
   */
  entranceAt?: number;
  /** Which scripted path drives it when no real pointer is in the room. */
  path?: PathId;
  /** The axis the section's cards run along, for the scripted path. */
  axis: "x" | "y";
  legibility: LegibilityId;
  /** Draw the index rail: the proposed delight, and `band`'s own readout. */
  rail?: boolean;
  /** Draw where the scripted pointer is, so a still shows its own cause. */
  ghost?: boolean;
  className?: string;
  children: ReactNode;
};

export function Backdrop({
  cfg,
  drive,
  entranceAt = 1,
  path = "sweep",
  axis,
  legibility,
  rail = false,
  ghost = false,
  className,
  children,
}: BackdropProps) {
  const reduced = usePrefersReducedMotion();
  const room = useRef<HTMLDivElement | null>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const ticks = useRef<(HTMLSpanElement | null)[]>([]);
  const dot = useRef<HTMLDivElement | null>(null);
  const box = useRef<Box>({ w: 1440, h: 720 });
  /** The reader's own pointer, or null when they are not in the room. */
  const held = useRef<Pointer | null>(null);

  /**
   * ★ THE CONFIG IS READ THROUGH A REF AND KEYED BY ITS VALUE. A board hands a
   * fresh object every render (it is derived from the dock's state), so an
   * effect depending on the object would tear the loop down on every render and
   * the backdrop would restart from frame zero. The key is the VALUES, so the
   * loop restarts when a rule changes and not when React does.
   */
  const cfgRef = useRef(cfg);
  const key = `${cfg.pool}/${cfg.trigger}/${cfg.entrance}/${cfg.travel}/${cfg.pace}/${cfg.cells}`;
  // ★ WRITTEN IN AN EFFECT, NEVER IN THE RENDER. A ref touched during render is
  // a compiler error under this config, and it is one for a real reason: the
  // render may be thrown away. Effects run in order, so this one lands before
  // the clock below reads it, and a rAF frame is always after both.
  useEffect(() => {
    cfgRef.current = cfg;
  });

  /** Paint one state onto the nodes. The only place a style is written. */
  const write = useCallback((s: State, b: Box) => {
    const painted: Painted[] = paint(s, { ...cfgRef.current, box: b });
    for (let i = 0; i < POOL.length; i++) {
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
      el.style.opacity = String(p.opacity);
      el.style.clipPath = p.clip ?? "none";
    }
    for (let i = 0; i < ticks.current.length; i++)
      ticks.current[i]?.toggleAttribute("data-on", i === s.index);
    if (dot.current && s.at) {
      dot.current.style.transform = `translate3d(${s.at.x.toFixed(1)}px, ${s.at.y.toFixed(1)}px, 0)`;
      // The ring is the SIMULATED cursor. The reader has one of their own, so
      // it goes the moment they take the room over.
      dot.current.style.opacity = held.current ? "0" : "1";
    }
  }, []);

  /* The room's box, cached. Never read inside the loop. */
  useEffect(() => {
    const el = room.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      box.current = { w: r.width || 1440, h: r.height || 720 };
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The reader's own pointer, whenever there could be one. */
  useEffect(() => {
    if (drive === "still" || reduced) return;
    const el = room.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cell = (e.target as Element | null)?.closest?.("[data-cb-cell]");
      held.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        cell: cell ? Number(cell.getAttribute("data-cb-cell")) : -1,
      };
      el.setAttribute("data-cb-inside", "");
      el.setAttribute("data-cb-held", "");
    };
    const leave = () => {
      held.current = null;
      el.removeAttribute("data-cb-held");
      if (drive === "live") el.removeAttribute("data-cb-inside");
    };
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave, { passive: true });
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [drive, reduced]);

  /* The clock. */
  useEffect(() => {
    const el = room.current;
    if (!el) return;

    // ★ REDUCED MOTION AND `still` ARE ONE PATH, DELIBERATELY. A reader who
    // asked for less motion gets one photograph and no loop; a capture gets one
    // frame of the same run. Neither invents a state the live effect does not
    // pass through, and neither leaves a rAF running.
    if (reduced || drive === "still") {
      const b = box.current;
      const { state } = stillAt(
        { ...cfgRef.current, box: b },
        {
          cells: cfgRef.current.cells,
          pool: cfgRef.current.pool,
          axis,
          path,
          entranceAt,
        },
      );
      write(state, b);
      if (drive !== "live") el.setAttribute("data-cb-inside", "");
      return;
    }

    let s = start();
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let onScreen = true;
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(el);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // Hold the CLOCK, not the loop: an un-held clock teleports the backdrop
      // on the way back from a hidden tab (the field's lesson, privacy-hero).
      if (!onScreen || document.visibilityState === "hidden") return;
      elapsed += dt;
      const b = box.current;
      const p =
        held.current ??
        (drive === "auto"
          ? pointerAt(elapsed, b, {
              cells: cfgRef.current.cells,
              pool: cfgRef.current.pool,
              axis,
              path,
            })
          : null);
      if (!p) return;
      s = step(s, { ...cfgRef.current, box: b }, p, dt);
      write(s, b);
    };
    raf = requestAnimationFrame(tick);
    if (drive === "auto") el.setAttribute("data-cb-inside", "");
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [axis, drive, entranceAt, key, path, reduced, write]);

  return (
    <div
      ref={room}
      data-cb-room=""
      data-cb-legibility={legibility}
      className={cn("cb-room", className)}
      style={PLATE_VARS}
    >
      <div className="cb-stack" aria-hidden>
        {POOL.map((frameId, i) => {
          const img = marketingImage(frameId);
          return (
            <div
              key={frameId}
              ref={(el) => {
                layers.current[i] = el;
              }}
              className="cb-frame"
            >
              <Image
                src={img.src}
                alt=""
                fill
                // Full-bleed: the section IS the window's width.
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
      {/* The copy's treatment, drawn between the photographs and the words. */}
      <div className="cb-veil" aria-hidden />
      {rail ? (
        <div className="cb-rail" aria-hidden>
          {POOL.map((frameId, i) => (
            <span
              key={frameId}
              ref={(el) => {
                ticks.current[i] = el;
              }}
              className="cb-tick"
            />
          ))}
        </div>
      ) : null}
      {ghost ? (
        <div className="cb-ghost-wrap" aria-hidden>
          <div ref={dot} className="cb-ghost" />
        </div>
      ) : null}
      <div className="cb-content">{children}</div>
    </div>
  );
}

/**
 * The plate the copy sits on when `legibility` is `plate`: the Glass board's
 * `frost` recipe, which is the one the app's chrome over photographs is being
 * asked about in the same round (`sandbox/glass/recipes.ts`). Numbers, not a
 * look, so a ruling there moves this with it.
 *
 * ★ ONE NUMBER IS OURS, AND IT WAS MEASURED. `frost` paints black at 12 percent
 * over the blurred backdrop, and a section-scale pane is a much bigger bet than
 * a pill: over the brightest photograph in this pool the copy lands at 4.00:1
 * through 12 percent and 4.88:1 through 22. The blur is what buys the rest (a
 * 26 px blur drops that photograph's worst local spot from a luminance of 1.0
 * to 0.93), which is the whole argument for a pane over a scrim.
 */
export const PLATE_VARS = {
  "--cb-blur": "26px",
  "--cb-brightness": "0.55",
  "--cb-saturate": "1.6",
  "--cb-tint": "0.22",
  "--cb-edge": "0.16",
} as CSSProperties;

/** One lap of the scripted path, for a caption that says how long a demo runs. */
export const LAP_MS = PATH_PERIOD;
