"use client";

// The trail's own sheet. It declares NO keyframe: the trail is one rAF loop
// writing inline transforms (src/app/keyframe-uniqueness.test.ts).
import "./trail.css";

import Image from "next/image";
import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

import {
  advance,
  atRest,
  type Box,
  boxOf,
  frameOf,
  type Path,
  PHONE_BELOW,
  type Pt,
  pickPhase,
  replay,
  shyWindow,
  stillAt,
  trailSpec,
  trailWalk,
  type TrailSpec,
  type TrailState,
} from "./trail-engine";
import { trailFrame } from "./trail-frames";

/**
 * THE IMAGE TRAIL: photographs laid down behind a moving point, each sliding
 * after it and then fading and shrinking away where it lies. Will ruled its look
 * and its home on 2026-09-19 (`d140`, a three-second decay, `flick`, 180 px and
 * 100 at a phone, `home=notfound`, `phone=walks`); the arithmetic is in
 * `trail-engine.ts` and every number in it is one of those rulings.
 *
 * ★ TWO SOURCES, ONE MECHANISM. `pointer` walks the path on its own until a real
 * hand enters and then follows the hand, resuming the walk when it leaves;
 * `path` is the walk and nothing else, which is a phone (`phone=walks`: "so the
 * screen is alive the moment it is opened and a finger is never asked for"). The
 * engine never asks which one it is being fed.
 *
 * ★ DECORATIVE, ENTIRELY. aria-hidden, every image `alt=""`, nothing in it
 * focusable, no link and no code, and the layer takes no pointer events: the
 * words a placement needs stand INSIDE the stage, over the photographs, and the
 * shy fade is what keeps them the loudest thing on the screen (never a scrim,
 * which bible 6 refuses).
 *
 * ★ IT COSTS NOTHING WHEN NOBODY IS LOOKING, four ways: one rAF loop, suspended
 * off screen (IntersectionObserver), suspended on a hidden tab, never started
 * under reduced motion, and — the one this engine can do that a conveyor cannot
 * — SUSPENDED AT REST, because at rest the keeper holds one photograph whole and
 * every following frame would write the identical transform to the identical
 * node. It wakes on the next pointer move.
 *
 * ★ NO LAYOUT READ PER FRAME. The stage's box is read on mount and again only
 * when a resize or a scroll marks it stale, never inside the loop and never
 * inside the pointer handler (which is passive and does nothing but store a
 * client point). A `getBoundingClientRect` on every `pointermove` is a forced
 * layout on every mouse event, which is the cheapest way there is to make a
 * beautiful effect feel heavy.
 */

/** Whether the trail should hold still right now. The default reads only the
 *  tab, which is what a layer outside any lab host needs. */
export const TrailPause = createContext<() => boolean>(() =>
  typeof document !== "undefined" ? document.hidden : false,
);

/** The crop per slot, as a short declared cycle: a dozen photographs fill up to
 *  twenty frames, so each shows a different part of itself. Per SLOT, so a card
 *  that recycles keeps its own framing rather than jumping. */
const CROPS = [
  "50% 42%",
  "38% 50%",
  "62% 48%",
  "50% 58%",
  "44% 38%",
  "58% 60%",
  "50% 50%",
] as const;

/** WHAT MOVES THE TRAIL: a hand, or the path on its own. */
export type Drive = "pointer" | "path";

export type TrailSource = {
  /** The paths the trail walks when no hand is on it. One ring each; the 404
   *  passes one, and a placement that wants two figures reading as one object
   *  passes two. */
  paths: readonly Path[];
  drive: Drive;
  /** The moment on the paths the resting composition is frozen at. */
  stillAt: number;
};

/* ── The layer: the pool, the still and the loop ─────────────────────────── */

export function TrailLayer({
  spec,
  source,
  shy,
  className,
}: {
  spec: TrailSpec;
  source: TrailSource;
  /** The window the words stand in (`shyWindow`), when there are words. */
  shy?: ReturnType<typeof shyWindow>;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const isPaused = useContext(TrailPause);
  const { paths, drive, stillAt: at } = source;

  const host = useRef<HTMLDivElement | null>(null);
  /** [pathIndex][slot] */
  const els = useRef<(HTMLDivElement | null)[][]>([]);
  const zNow = useRef<number[][]>([]);
  const hidden = useRef<boolean[][]>([]);

  /**
   * ★ THE RESTING COMPOSITION IS THE LOOP'S FIRST FRAME, and it is a replay.
   * Every node carries the transform and opacity it holds at `stillAt`, written
   * during render as custom properties the sheet paints, so a reduced-motion
   * reader and the loop's own first frame are ONE picture and motion begins
   * after the resting frame rather than instead of it.
   */
  const still = useMemo(() => replay(spec, paths, at), [spec, paths, at]);

  const sizes = `${spec.size}px`;

  useEffect(() => {
    // The fade is the trail ARRIVING, which is the one frame the measure costs
    // turned into the beat it should have been (trail.css).
    host.current?.setAttribute("data-trail-in", "");
  }, []);

  useEffect(() => {
    if (reduced) {
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
     * starting the path's clock at the same moment) is what makes "motion begins
     * after the resting frame" true here: a loop that began from an empty ring
     * would blank the composition and refill it over the next three seconds,
     * which reads as the page breaking.
     */
    const states: TrailState[] = replay(spec, paths, at);
    /** The paths' own clock, which only runs while a path is driving. */
    let pathClock = at;
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

    /* ── The loop, which is suspended rather than spun ───────────────────── */
    let raf = 0;
    let last = 0;
    const wake = () => {
      if (raf) return;
      // A woken clock restarts from zero elapsed, so a suspension never
      // teleports the trail forward by however long it slept.
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const sleep = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
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
        if (onScreen) wake();
        else sleep();
      },
      { threshold: 0 },
    );
    io.observe(node);

    const onVisibility = () => {
      if (document.hidden) sleep();
      else wake();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ── The pointer, passive and cheap ──────────────────────────────────── */
    // The layer itself is `pointer-events: none`, so the listener rides the
    // layer's PARENT: the whole stage is the surface a reader draws on, which is
    // what the effect is for.
    const surface = node.parentElement ?? node;
    const onMove = (e: PointerEvent) => {
      const r = rect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      hand = { x, y };
      handFresh = true;
      wake();
    };
    const onLeave = () => {
      hand = null;
      handFresh = false;
      wake();
    };
    const handDrives = drive === "pointer";
    if (handDrives) {
      surface.addEventListener("pointermove", onMove, { passive: true });
      surface.addEventListener("pointerleave", onLeave, { passive: true });
    }

    function tick(now: number) {
      raf = 0;
      const dt = last === 0 ? 0 : Math.min(now - last, 50);
      last = now;
      // A host that is merely paused (a lab option off screen) holds the CLOCK
      // and keeps asking for frames, because nothing tells us when it resumes.
      if (isPaused()) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!onScreen || document.hidden) return;

      const handDriving = handDrives && hand !== null;
      if (!handDriving) pathClock += dt;

      let settled = true;
      for (let i = 0; i < states.length; i++) {
        const to =
          handDriving && i === 0
            ? handFresh
              ? hand
              : states[i].source
            : paths[i](pathClock);
        states[i] = advance(states[i], spec, { to, dt });
        // Only a hand that has come to a stop can settle: a path never does,
        // which is exactly what `phone=walks` asked for.
        if (!handDriving || !atRest(states[i], spec)) settled = false;

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
      if (!settled) raf = requestAnimationFrame(tick);
    }

    wake();
    return () => {
      sleep();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", markStale, { capture: true });
      window.removeEventListener("resize", markStale);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerleave", onLeave);
    };
  }, [spec, paths, drive, at, reduced, isPaused]);

  return (
    // aria-hidden and nothing focusable: this is weather, not content.
    <div
      aria-hidden
      data-trail-shy={shy ? "" : undefined}
      className={cn("trl-layer", className)}
      ref={host}
      style={
        shy
          ? ({
              "--trl-shy-a": shy.alpha,
              "--trl-x0": `${shy.x0}px`,
              "--trl-x1": `${shy.x1}px`,
              "--trl-x2": `${shy.x2}px`,
              "--trl-x3": `${shy.x3}px`,
              "--trl-y0": `${shy.y0}px`,
              "--trl-y1": `${shy.y1}px`,
              "--trl-y2": `${shy.y2}px`,
              "--trl-y3": `${shy.y3}px`,
            } as CSSProperties)
          : undefined
      }
    >
      {paths.map((_, i) =>
        Array.from({ length: spec.pool }, (_, slot) => {
          const b = boxOf(spec, slot);
          const card = still[i]?.cards[slot] ?? null;
          const f = card ? frameOf(card, spec, at) : null;
          const rest = f
            ? `translate3d(${(f.x - b.w / 2).toFixed(2)}px, ${(f.y - b.h / 2).toFixed(2)}px, 0) rotate(${f.rot.toFixed(2)}deg) scale(${f.scale.toFixed(4)})`
            : "none";
          return (
            <div
              key={`${i}-${slot}`}
              ref={(el) => {
                (els.current[i] ??= [])[slot] = el;
              }}
              className="trl-card"
              style={
                {
                  width: b.w,
                  height: b.h,
                  zIndex: f?.z ?? 2,
                  "--trl-rest": rest,
                  "--trl-rest-o": f ? f.opacity.toFixed(3) : "0",
                } as CSSProperties
              }
            >
              <div className="trl-photo">
                <Image
                  src={trailFrame(card?.photo ?? i * spec.pool + slot).src}
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

/* ── The stage: the words, the photographs behind them, one measured box ─── */

type Geo = {
  box: Box;
  words?: { cx: number; cy: number; hx: number; hy: number };
  /** Where this visit opens on the walk: the best of a few random openings
   *  (`pickPhase`), fixed for the visit because the resting composition and the
   *  loop have to agree on one curve. It rides the measurement because it is
   *  decided at the same moment and read at the same moment. */
  phase: number;
};

const sameGeo = (a: Geo | null, b: Geo) =>
  !!a &&
  Math.abs(a.box.w - b.box.w) < 1 &&
  Math.abs(a.box.h - b.box.h) < 1 &&
  !!a.words === !!b.words &&
  (!a.words ||
    !b.words ||
    (Math.abs(a.words.cx - b.words.cx) < 1 &&
      Math.abs(a.words.cy - b.words.cy) < 1 &&
      Math.abs(a.words.hx - b.words.hx) < 1 &&
      Math.abs(a.words.hy - b.words.hy) < 1));

/**
 * A TRAIL AROUND SOMETHING TO READ: the stage is the area a reader draws on,
 * `children` stand in the middle of it, and the photographs run behind them.
 *
 * ★ THE BOX AND THE WORDS ARE BOTH MEASURED, which is the one thing the board
 * could not do and the reason this holds at any width. The board declared each
 * home's lockup as a pair of hand-measured rectangles, true at exactly 1440 and
 * 375; a real page is every width in between, its copy wraps differently at each
 * one, and the words are what the trail has to stay off. So the stage reads its
 * own box and the block's box once on mount, and again only when either
 * actually changes.
 *
 * ★ WHICH COSTS THE SERVER'S COPY OF THE COMPOSITION, and that is the trade. A
 * birth is a function of TRAVEL in px, so the resting composition cannot be
 * solved without the box, and the server does not have one: a reader with
 * scripting off gets the page, whole and navigable, with no photographs behind
 * it. Everything a reader with scripting ON sees — the still, reduced motion,
 * the loop's first frame — is still one picture, solved from the measured box.
 */
export function Trail({
  children,
  className,
  source,
}: {
  children?: ReactNode;
  className?: string;
  /** Forced only where both rules have to stand on one screen (the Library).
   *  Production asks the reader's own screen: a phone has no cursor to follow,
   *  and Will ruled it walks rather than waits for a finger. */
  source?: Drive;
}) {
  const stage = useRef<HTMLDivElement | null>(null);
  const words = useRef<HTMLDivElement | null>(null);
  const [geo, setGeo] = useState<Geo | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      // No layout yet (a hidden tab's first frame, or a test with no layout
      // engine): draw nothing rather than solve a composition in a zero box.
      if (r.width < 1 || r.height < 1) return;
      const w = words.current?.getBoundingClientRect();
      const box = { w: r.width, h: r.height };
      const block =
        w && w.width > 0 && w.height > 0
          ? {
              cx: w.left - r.left + w.width / 2,
              cy: w.top - r.top + w.height / 2,
              hx: w.width / 2,
              hy: w.height / 2,
            }
          : undefined;
      setGeo((prev) =>
        sameGeo(prev, { box, words: block, phase: 0 })
          ? prev
          : // The opening is chosen HERE and only here: re-measuring the same
            // box must not re-deal the composition under a reader.
            {
              box,
              words: block,
              phase: prev?.phase ?? pickPhase(trailSpec(box), box, block),
            },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (words.current) ro.observe(words.current);
    return () => ro.disconnect();
  }, []);

  const spec = useMemo(() => (geo ? trailSpec(geo.box) : null), [geo]);
  const shy = useMemo(
    () => (geo?.words ? shyWindow(geo.box, geo.words) : undefined),
    [geo],
  );
  const trail = useMemo<TrailSource | null>(() => {
    if (!geo || !spec) return null;
    return {
      paths: [trailWalk(geo.box, geo.phase)],
      // A phone has no cursor, and a drag on a page is a scroll: below the
      // breakpoint the walk is the only source (Will, `phone=walks`).
      drive: source ?? (geo.box.w < PHONE_BELOW ? "path" : "pointer"),
      stillAt: stillAt(spec),
    };
  }, [geo, spec, source]);

  return (
    <div ref={stage} className={cn("trl-stage", className)}>
      {spec && trail && <TrailLayer spec={spec} source={trail} shy={shy} />}
      <div ref={words} className="relative">
        {children}
      </div>
    </div>
  );
}
