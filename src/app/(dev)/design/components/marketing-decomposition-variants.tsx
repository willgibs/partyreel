"use client";

import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";
import { usePrefersReducedMotion } from "@/lib/shared/use-prefers-reduced-motion";
import { ReelFrame } from "@/components/marketing/frames";

import { DesktopFrame } from "./marketing-lab-shared";
import { Variant } from "./variant-frame";

/**
 * Touchpoint: MARKETING DECOMPOSITION (Track B F5 round 1, 2026-08-25).
 *
 * The home's SIGNATURE section (IA section 3, the made-from spine's anchor
 * beat): the hero's reel comes APART into its source tiles while three
 * counters land as facts. Two candidate mechanics, felt side by side:
 *
 *   V1 ONE-SHOT PLAY: the burst fires once on scroll-into-view (the
 *      [data-mkt-fly] vocabulary INVERTED as [data-mkt-burst]; CSS-owned,
 *      Replay remounts via runId). The safe, self-timed telling.
 *   V2 SCROLL-DRIVEN: the same decomposition scrubbed by scroll progress
 *      through a tall section (the plan's ONE sanctioned scroll-linked JS
 *      candidate: a single rAF loop runs only while the section intersects,
 *      transform-only writes, counters track progress). The visitor drives
 *      the story and can play it backwards.
 *
 * Reduced motion, both: the tile field is simply SETTLED and the three facts
 * fade in over it (no burst, no scrub; the CSS + the applyScrub(1) jump own
 * that). Media comes from the marketing manifest by id (visually diverse
 * subjects on purpose; the swap to final media is a manifest edit).
 *
 * The same session carries the plan's TACTILE candidates + one proposal as
 * clearly-labeled extras (transitions-pro recipes, colors re-tokened):
 * the drag-drop-physics photo pile, the card-stack hover fan, and a
 * MONOCHROME confetti-burst behind a default-OFF toggle, proposed as an
 * additive beat for the live demo's "Reel ready" payoff.
 */

/* ---------------------------------------------------------------------------
 * The shared tile field: 12 manifest tiles seated around a centered reel card.
 * x/y are the seat's offset from the reel-card center in px (the same numbers
 * drive layout AND the gather/burst math); r is the settled tilt; w the tile
 * width (height follows the image's native aspect).
 * ------------------------------------------------------------------------- */

type BurstTile = { id: string; x: number; y: number; r: number; w: number };

const TILES: BurstTile[] = [
  { id: "wedding-golden", x: -370, y: -140, r: -7, w: 120 },
  { id: "reception-table", x: -250, y: 45, r: 4, w: 104 },
  { id: "party-balloons", x: -345, y: 130, r: 6, w: 112 },
  { id: "concert-confetti", x: -140, y: -160, r: -4, w: 96 },
  { id: "wedding-rings", x: -115, y: 160, r: 5, w: 88 },
  { id: "reception-hall", x: 130, y: -158, r: 6, w: 104 },
  { id: "party-dj", x: 275, y: -115, r: -6, w: 128 },
  { id: "wedding-toast", x: 150, y: 158, r: -5, w: 110 },
  { id: "festival-lights", x: 390, y: 15, r: 5, w: 120 },
  { id: "festival-crowd", x: 300, y: 145, r: 8, w: 104 },
  { id: "wedding-arch", x: -425, y: -25, r: -5, w: 96 },
  { id: "wedding-petals", x: 408, y: -140, r: 7, w: 78 },
];

const FACT_PHOTOS = 214;
const FACT_GUESTS = 23;
const CLOSING_LINE =
  "Partyreel turns everyone's camera roll into the film of the night.";

function TilePhoto({ id, w }: { id: string; w: number }) {
  const m = marketingImage(id);
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${m.width} / ${m.height}` }}
    >
      <Image src={m.src} alt="" fill sizes={`${w}px`} className="object-cover" />
    </div>
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeOutCubic = (n: number) => 1 - Math.pow(1 - n, 3);
const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/* ---------------------------------------------------------------------------
 * V1: one-shot play
 * ------------------------------------------------------------------------- */

/** JS count-up for one fact number (reduced motion jumps to the target). */
function CountUp({
  to,
  on,
  reduced,
  delayMs,
  durMs = 1250,
}: {
  to: number;
  on: boolean;
  reduced: boolean;
  delayMs: number;
  durMs?: number;
}) {
  const [n, setN] = useState(0);
  // Everything (the reduced jump included) is timeout-scheduled so setState
  // stays out of the effect body (the live-direction lint lesson).
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let start: number | null = null;
    const delay = setTimeout(
      () => {
        if (reduced) {
          setN(to);
          return;
        }
        const tick = (t: number) => {
          if (start === null) start = t;
          const p = Math.min((t - start) / durMs, 1);
          setN(Math.round(to * easeOutCubic(p)));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      reduced ? 0 : delayMs,
    );
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [on, reduced, to, delayMs, durMs]);
  return <span className="font-mono tabular-nums">{n}</span>;
}

function OneShotStage({ onReplay }: { onReplay: () => void }) {
  const reduced = usePrefersReducedMotion();
  // 0.3: the burst fires once roughly a third of the section has scrolled in.
  const { ref, inView } = useInViewOnce<HTMLElement>(0.3);

  return (
    <section
      ref={ref}
      data-inview={inView ? "true" : undefined}
      className="relative border-t border-white/10 py-12"
    >
      {/* The field: tiles seated around the reel card, gathered behind it
          until the burst releases them outward. */}
      <div className="relative mx-auto h-[470px] w-full max-w-[940px] overflow-hidden">
        {TILES.map((t, i) => (
          <div
            key={t.id}
            data-mkt-burst
            data-on={inView ? "true" : undefined}
            className="absolute"
            style={
              {
                left: `calc(50% + ${t.x}px)`,
                top: `calc(50% + ${t.y}px)`,
                width: t.w,
                translate: "-50% -50%",
                "--burst-x": `${t.x}px`,
                "--burst-y": `${t.y}px`,
                "--burst-r": `${t.r}deg`,
                "--i": i,
              } as React.CSSProperties
            }
          >
            <TilePhoto id={t.id} w={t.w} />
          </div>
        ))}
        <div className="absolute top-1/2 left-1/2 z-10 w-[340px] -translate-x-1/2 -translate-y-1/2">
          <ReelFrame />
        </div>
      </div>

      {/* The three facts land while the tiles fly; counts tick in Geist Mono
          tabular. Sequential stagger so each fact gets its beat. */}
      <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-baseline justify-center gap-x-10 gap-y-2 px-6 text-center">
        <p
          data-mkt-reveal
          data-dir-display
          className="text-[24px] leading-tight text-white/90"
          style={{ "--i": 0, "--mkt-stagger-ms": "260ms" } as React.CSSProperties}
        >
          Built from <CountUp to={FACT_PHOTOS} on={inView} reduced={reduced} delayMs={350} /> photos.
        </p>
        <p
          data-mkt-reveal
          data-dir-display
          className="text-[24px] leading-tight text-white/90"
          style={{ "--i": 1, "--mkt-stagger-ms": "260ms" } as React.CSSProperties}
        >
          Shot by <CountUp to={FACT_GUESTS} on={inView} reduced={reduced} delayMs={610} /> guests.
        </p>
        <p
          data-mkt-reveal
          data-dir-display
          className="text-[24px] leading-tight text-white/90"
          style={{ "--i": 2, "--mkt-stagger-ms": "260ms" } as React.CSSProperties}
        >
          Created for you.
        </p>
      </div>
      <p
        data-mkt-reveal
        className="mx-auto mt-4 max-w-md px-6 text-center text-[15px] leading-relaxed text-white/65"
        style={{ "--i": 4, "--mkt-stagger-ms": "260ms" } as React.CSSProperties}
      >
        {CLOSING_LINE}
      </p>

      <button
        type="button"
        data-dir-press
        onClick={onReplay}
        className="absolute top-6 right-6 flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-white/15 bg-white/[0.06] px-3 text-xs font-medium text-white/70"
      >
        <RotateCcw className="size-3.5" />
        Replay
      </button>
    </section>
  );
}

/** A short lead-in above the section so the burst is EARNED by a scroll (the
 *  production section sits under the hero; this stands in for it). */
function LeadIn() {
  return (
    <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-10 text-center">
      <p className="font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">
        The made-from arc · section 3 of 12
      </p>
      <p data-dir-display className="text-[34px] leading-[1.02] text-white/90">
        The hero&apos;s reel plays above this beat.
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-white/55">
        Scroll. The reel the visitor just watched comes apart into everything
        that made it.
      </p>
    </div>
  );
}

function DecompositionOneShot() {
  const [runId, setRunId] = useState(0);
  return (
    <div className="mono" data-mode="dark">
      <DesktopFrame>
        <div className="bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)]">
          <LeadIn />
          <OneShotStage
            key={runId}
            onReplay={() => setRunId((n) => n + 1)}
          />
          <div className="h-24" aria-hidden />
        </div>
      </DesktopFrame>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * V2: scroll-driven
 * ------------------------------------------------------------------------- */

/** The scrub compresses tile Y so the field fits the sticky stage. */
const SCRUB_Y = 0.78;
/** The tall wrapper: the story spans ~2 viewports of scroll runway. */
const SCRUB_WRAP_H = 1720;
const SCRUB_STAGE_H = 560;

function DecompositionScrub() {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const factRefs = useRef<(HTMLElement | null)[]>([]);
  const photosRef = useRef<HTMLSpanElement | null>(null);
  const guestsRef = useRef<HTMLSpanElement | null>(null);
  const closingRef = useRef<HTMLParagraphElement | null>(null);
  const hintRef = useRef<HTMLParagraphElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    // One writer for every scrub state: tiles are transform-only (plus
    // composited opacity), facts and counters ride the same progress, so
    // scrolling backwards rewinds the whole story.
    const apply = (p: number) => {
      TILES.forEach((t, i) => {
        const el = tileRefs.current[i];
        if (!el) return;
        const e = easeOutCubic(clamp01(p * 1.18 - i * 0.015));
        el.style.transform = `translate(${-t.x * (1 - e)}px, ${
          -t.y * SCRUB_Y * (1 - e)
        }px) scale(${0.32 + 0.68 * e}) rotate(${t.r * e}deg)`;
        el.style.opacity = String(Math.min(1, e * 1.7));
      });
      const factAt = (i: number, from: number, to: number) => {
        const el = factRefs.current[i];
        if (!el) return;
        const v = ramp(p, from, to);
        el.style.opacity = String(v);
        el.style.transform = `translateY(${(1 - v) * 14}px)`;
      };
      factAt(0, 0.46, 0.6);
      factAt(1, 0.52, 0.66);
      factAt(2, 0.58, 0.72);
      if (photosRef.current)
        photosRef.current.textContent = String(
          Math.round(FACT_PHOTOS * ramp(p, 0.46, 0.84)),
        );
      if (guestsRef.current)
        guestsRef.current.textContent = String(
          Math.round(FACT_GUESTS * ramp(p, 0.52, 0.88)),
        );
      if (closingRef.current) {
        const v = ramp(p, 0.7, 0.86);
        closingRef.current.style.opacity = String(v);
        closingRef.current.style.transform = `translateY(${(1 - v) * 14}px)`;
      }
      if (hintRef.current)
        hintRef.current.style.opacity = String(1 - ramp(p, 0.04, 0.18));
      if (readoutRef.current)
        readoutRef.current.textContent = `${Math.round(p * 100)}%`;
    };

    if (reduced) {
      // No scrub: the settled field, facts shown, one write.
      apply(1);
      return;
    }

    // The rAF loop runs ONLY while the tall section intersects (the plan's
    // rAF-light mandate); progress derives from the sticky stage's travel
    // through the wrapper, which stays correct inside any scroll container.
    let raf = 0;
    let running = false;
    const tick = () => {
      if (!running) return;
      const wrapRect = wrap.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const travel = wrapRect.height - stageRect.height;
      apply(travel > 0 ? clamp01((stageRect.top - wrapRect.top) / travel) : 1);
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting);
      if (on && !running) {
        running = true;
        raf = requestAnimationFrame(tick);
      } else if (!on && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(wrap);
    return () => {
      io.disconnect();
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div className="mono" data-mode="dark">
      <DesktopFrame>
        <div className="bg-[oklch(0.11_0_0)] text-[oklch(0.97_0_0)]">
          <LeadIn />
          <div
            ref={wrapRef}
            className="relative border-t border-white/10"
            style={{ height: reduced ? "auto" : SCRUB_WRAP_H }}
          >
            <div
              ref={stageRef}
              className="sticky top-0 overflow-hidden"
              style={{ height: SCRUB_STAGE_H }}
            >
              <div className="flex items-center justify-between px-8 pt-5">
                <p
                  ref={hintRef}
                  className="font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase"
                >
                  Scroll to pull the reel apart
                </p>
                <span
                  ref={readoutRef}
                  className="font-mono text-[11px] text-white/35 tabular-nums"
                >
                  0%
                </span>
              </div>

              <div className="relative mx-auto h-[370px] w-full max-w-[940px]">
                {TILES.map((t, i) => (
                  <div
                    key={t.id}
                    ref={(el) => {
                      tileRefs.current[i] = el;
                    }}
                    className="absolute will-change-transform"
                    style={
                      {
                        left: `calc(50% + ${t.x}px)`,
                        top: `calc(50% + ${t.y * SCRUB_Y}px)`,
                        width: t.w,
                        translate: "-50% -50%",
                        transform: `translate(${-t.x}px, ${
                          -t.y * SCRUB_Y
                        }px) scale(0.32)`,
                        opacity: 0,
                      } as React.CSSProperties
                    }
                  >
                    <TilePhoto id={t.id} w={t.w} />
                  </div>
                ))}
                <div className="absolute top-1/2 left-1/2 z-10 w-[320px] -translate-x-1/2 -translate-y-1/2">
                  <ReelFrame />
                </div>
              </div>

              <div className="mx-auto flex max-w-3xl flex-wrap items-baseline justify-center gap-x-10 gap-y-1 px-6 text-center">
                <p
                  ref={(el) => {
                    factRefs.current[0] = el;
                  }}
                  data-dir-display
                  className="text-[22px] leading-tight text-white/90"
                  style={{ opacity: 0 }}
                >
                  Built from{" "}
                  <span ref={photosRef} className="font-mono tabular-nums">
                    0
                  </span>{" "}
                  photos.
                </p>
                <p
                  ref={(el) => {
                    factRefs.current[1] = el;
                  }}
                  data-dir-display
                  className="text-[22px] leading-tight text-white/90"
                  style={{ opacity: 0 }}
                >
                  Shot by{" "}
                  <span ref={guestsRef} className="font-mono tabular-nums">
                    0
                  </span>{" "}
                  guests.
                </p>
                <p
                  ref={(el) => {
                    factRefs.current[2] = el;
                  }}
                  data-dir-display
                  className="text-[22px] leading-tight text-white/90"
                  style={{ opacity: 0 }}
                >
                  Created for you.
                </p>
              </div>
              <p
                ref={closingRef}
                className="mx-auto mt-3 max-w-md px-6 text-center text-[15px] leading-relaxed text-white/65"
                style={{ opacity: 0 }}
              >
                {CLOSING_LINE}
              </p>
            </div>
          </div>
          <div className="h-24" aria-hidden />
        </div>
      </DesktopFrame>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Extra A: the photo-pile drag (transitions-pro drag-drop-physics, adapted to
 * a multi-chip pile against one album zone). The pointer handlers bind
 * imperatively per the recipe: the drag writes --dx/--dy straight to the chip
 * style on every pointermove (a re-render per frame would break 1:1 tracking).
 * ------------------------------------------------------------------------- */

function readNum(root: HTMLElement, name: string, fallback: number): number {
  const raw = getComputedStyle(root).getPropertyValue(name).trim();
  if (!raw) return fallback;
  if (raw.endsWith("ms")) return parseFloat(raw);
  if (raw.endsWith("s")) return parseFloat(raw) * 1000;
  const n = parseFloat(raw);
  return Number.isNaN(n) ? fallback : n;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const PILE_SMOKE_ID = "mkt-pile-smoke";

function createPileDrag({
  root,
  chip,
  zone,
  puffs,
  onDrop,
}: {
  root: HTMLElement;
  chip: HTMLElement;
  zone: HTMLElement;
  puffs: SVGGElement;
  onDrop: () => void;
}) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let dragging = false;
  let settling = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  // The JS mirror of --dx/--dy; MUST reset together with the CSS vars, or the
  // next pointerdown solves its origin against a stale offset and the chip
  // teleports on the first move (the recipe's number-one footgun).
  let dx = 0;
  let dy = 0;
  let lastX = 0;
  let lastT = 0;
  let revertTimer = 0;

  const timers = new Set<number>();
  const after = (ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  const setVars = (
    x: number,
    y: number,
    tilt: number | null,
    lift: number | null,
  ) => {
    chip.style.setProperty("--dx", `${x.toFixed(1)}px`);
    chip.style.setProperty("--dy", `${y.toFixed(1)}px`);
    if (tilt !== null) chip.style.setProperty("--tilt", `${tilt.toFixed(2)}deg`);
    if (lift !== null) chip.style.setProperty("--lift", String(lift));
  };

  // Hit test: the chip's CENTER inside the zone's box.
  const overZone = () => {
    const c = chip.getBoundingClientRect();
    const z = zone.getBoundingClientRect();
    const cx = c.left + c.width / 2;
    const cy = c.top + c.height / 2;
    return cx >= z.left && cx <= z.right && cy >= z.top && cy <= z.bottom;
  };

  // The turbulence lives in SVG attributes, so the smoke knobs are mirrored
  // onto the filter primitives before each burst.
  const applySmokeKnobs = () => {
    const filter = document.getElementById(PILE_SMOKE_ID);
    if (!filter) return;
    const freq = readNum(root, "--mkt-drop-smoke-freq", 0.046);
    filter
      .querySelector("feTurbulence")
      ?.setAttribute("baseFrequency", `${freq} ${freq}`);
    filter
      .querySelector("feDisplacementMap")
      ?.setAttribute("scale", String(readNum(root, "--mkt-drop-smoke-warp", 30)));
    filter
      .querySelector("feGaussianBlur")
      ?.setAttribute(
        "stdDeviation",
        String(readNum(root, "--mkt-drop-smoke-blur", 5)),
      );
  };

  // Concentric ring shells hugging the image outline on staggered clocks; the
  // group's turbulence filter bends them into one undulating smoke front.
  const buildPuffs = () => {
    applySmokeKnobs();
    const dist = readNum(root, "--mkt-drop-puff-dist", 30);
    const dur = readNum(root, "--mkt-drop-puff-dur", 1500);
    const count = Math.max(1, Math.round(readNum(root, "--mkt-drop-wave-count", 2)));
    const baseW = readNum(root, "--mkt-drop-wave-width", 50);
    const falloff = readNum(root, "--mkt-drop-wave-falloff", 20);
    const stagger = readNum(root, "--mkt-drop-wave-stagger", 150);
    const grow = readNum(root, "--mkt-drop-wave-grow", 0.28);
    const travel = 1 + (dist * 2) / zone.offsetWidth;
    puffs.replaceChildren();
    for (let w = 0; w < count; w++) {
      const wave = document.createElementNS(SVG_NS, "rect");
      const sw = Math.max(2, baseW - w * falloff);
      const hw = sw / 2;
      wave.setAttribute("data-mkt-pilewave", "");
      // An SVG stroke straddles its path (a CSS border draws inward): inset
      // each rect by half its stroke so the ring's OUTER edge lands exactly on
      // the image box (52..152 in the 204-unit viewBox).
      wave.setAttribute("x", String(52 + hw));
      wave.setAttribute("y", String(52 + hw));
      wave.setAttribute("width", String(Math.max(1, 100 - sw)));
      wave.setAttribute("height", String(Math.max(1, 100 - sw)));
      wave.setAttribute("rx", String(Math.max(2, 14 - hw)));
      wave.setAttribute("stroke-width", String(sw));
      wave.style.setProperty("--wdur", `${Math.round(dur * (0.85 + w * grow))}ms`);
      wave.style.setProperty("--wdelay", `${Math.round(w * stagger)}ms`);
      wave.style.setProperty("--wscale", (travel + w * 0.07).toFixed(3));
      puffs.appendChild(wave);
    }
  };

  const land = () => {
    zone.setAttribute("data-filled", "");
    zone.setAttribute("data-landing", "");
    if (!reduced.matches) {
      buildPuffs();
      // Fire at the squash point: the surface compresses, smoke escapes.
      after(readNum(root, "--mkt-drop-down-dur", 250), () =>
        zone.setAttribute("data-bursting", ""),
      );
    }
    onDrop();

    // Demo revert: hold the landed photo, blur it away, respawn the chip.
    window.clearTimeout(revertTimer);
    revertTimer = after(readNum(root, "--mkt-drop-hold", 1600), () => {
      zone.setAttribute("data-emptying", "");
      after(readNum(root, "--mkt-drop-out-dur", 400) + 50, () => {
        zone.removeAttribute("data-filled");
        zone.removeAttribute("data-emptying");
        zone.removeAttribute("data-bursting");
        zone.removeAttribute("data-landing");
        dx = 0;
        dy = 0;
        setVars(0, 0, 0, 1);
        void chip.offsetWidth; // reflow so the respawn animation restarts
        chip.removeAttribute("data-fading");
        chip.setAttribute("data-respawning", "");
        after(readNum(root, "--mkt-drop-respawn-dur", 250) + 50, () => {
          chip.removeAttribute("data-respawning");
          settling = false;
        });
      });
    });
  };

  const onPointerDown = (e: PointerEvent) => {
    if (dragging || settling) return;
    dragging = true;
    pointerId = e.pointerId;
    try {
      chip.setPointerCapture(pointerId);
    } catch {
      // Capture is best-effort; the drag still works while the pointer stays over the chip.
    }
    startX = e.clientX - dx;
    startY = e.clientY - dy;
    lastX = e.clientX;
    lastT = performance.now();
    chip.removeAttribute("data-returning");
    chip.removeAttribute("data-respawning");
    chip.setAttribute("data-dragging", "");
    chip.style.setProperty(
      "--lift",
      String(readNum(root, "--mkt-drop-lift-scale", 1.05)),
    );
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    const vx = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;
    // Tilt from HORIZONTAL velocity only (~28deg per px/ms, clamped): a flick
    // leans into the travel, a slow drag stays level.
    const tiltMax = readNum(root, "--mkt-drop-tilt-max", 10);
    const tilt = Math.max(-tiltMax, Math.min(tiltMax, vx * 28));
    setVars(dx, dy, tilt, null);
    const over = !zone.hasAttribute("data-filled") && overZone();
    if (over) zone.setAttribute("data-over", "");
    else zone.removeAttribute("data-over");
  };

  const release = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    chip.removeAttribute("data-dragging");
    const dropIn = zone.hasAttribute("data-over");
    zone.removeAttribute("data-over");
    if (dropIn) {
      settling = true;
      // No flight, no resize: the chip dissolves where it was released while
      // the zone morphs into the photo.
      setVars(dx, dy, 0, null);
      chip.setAttribute("data-fading", "");
      land();
    } else {
      settling = true;
      chip.setAttribute("data-returning", "");
      dx = 0;
      dy = 0;
      setVars(0, 0, 0, 1);
      after(readNum(root, "--mkt-drop-return-dur", 500) + 50, () => {
        chip.removeAttribute("data-returning");
        settling = false;
      });
    }
  };

  chip.addEventListener("pointerdown", onPointerDown);
  chip.addEventListener("pointermove", onPointerMove);
  chip.addEventListener("pointerup", release);
  chip.addEventListener("pointercancel", release);

  return {
    destroy() {
      timers.forEach(window.clearTimeout);
      timers.clear();
      chip.removeEventListener("pointerdown", onPointerDown);
      chip.removeEventListener("pointermove", onPointerMove);
      chip.removeEventListener("pointerup", release);
      chip.removeEventListener("pointercancel", release);
    },
  };
}

const PILE_IDS = [
  "wedding-golden",
  "party-dj",
  "festival-crowd",
  "wedding-toast",
  "party-balloons",
];

/** Resting poses for the fanned pile (left/top px inside the demo + tilt). */
const PILE_POSES = [
  { left: 14, top: 46, r: -8 },
  { left: 44, top: 26, r: 5 },
  { left: 76, top: 50, r: -3 },
  { left: 26, top: 78, r: 9 },
  { left: 56, top: 68, r: 0 },
];

function PhotoPileDemo() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const puffsRef = useRef<SVGGElement | null>(null);
  const chipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [droppedSrc, setDroppedSrc] = useState(marketingImage(PILE_IDS[0]).src);

  useEffect(() => {
    const root = rootRef.current;
    const zone = zoneRef.current;
    const puffs = puffsRef.current;
    if (!root || !zone || !puffs) return;
    const ctrls = chipRefs.current.flatMap((chip, i) =>
      chip
        ? [
            createPileDrag({
              root,
              chip,
              zone,
              puffs,
              onDrop: () => setDroppedSrc(marketingImage(PILE_IDS[i]).src),
            }),
          ]
        : [],
    );
    return () => ctrls.forEach((c) => c.destroy());
  }, []);

  return (
    <div ref={rootRef} data-mkt-piledemo className="relative h-[230px] w-full">
      {/* One filter per demo; the driver mirrors the smoke knobs onto it. The
          filter applies to SVG CONTENT (WebKit renders feDisplacementMap on
          HTML content as an unfiltered slab). */}
      <svg
        width={0}
        height={0}
        style={{ position: "absolute" }}
        aria-hidden
        focusable="false"
      >
        <filter id={PILE_SMOKE_ID} x="-150%" y="-150%" width="400%" height="400%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.046 0.046"
            numOctaves={2}
            seed={4}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={30}
            xChannelSelector="R"
            yChannelSelector="G"
            result="warped"
          />
          <feGaussianBlur in="warped" stdDeviation={5} />
        </filter>
      </svg>

      {PILE_IDS.map((id, i) => {
        const m = marketingImage(id);
        const pose = PILE_POSES[i];
        return (
          <div
            key={id}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            data-mkt-pilechip
            className="size-[84px]"
            style={
              {
                left: pose.left,
                top: pose.top,
                zIndex: i + 1,
                "--pose-r": `${pose.r}deg`,
              } as React.CSSProperties
            }
          >
            <Image
              src={m.src}
              alt=""
              fill
              sizes="84px"
              className="pointer-events-none object-cover"
              draggable={false}
            />
          </div>
        );
      })}

      <div
        ref={zoneRef}
        data-mkt-pilezone
        className="top-1/2 right-6 size-[120px] -translate-y-1/2"
      >
        <span
          data-mkt-pilelabel
          className="absolute inset-x-2 top-1/2 -translate-y-1/2 text-center text-[11px] leading-[15px] text-muted-foreground"
        >
          Drop it into
          <br />
          the album
        </span>
        <div data-mkt-piledrop>
          <Image
            src={droppedSrc}
            alt=""
            fill
            sizes="124px"
            className="object-cover"
          />
        </div>
        <svg
          data-mkt-pilepuffs
          viewBox="0 0 204 204"
          aria-hidden
          focusable="false"
        >
          <g ref={puffsRef} filter={`url(#${PILE_SMOKE_ID})`} />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Extra B: the card-stack hover fan (transitions-pro card-stack-hover).
 * Purely structural; all motion lives in design.css (hover-guarded).
 * ------------------------------------------------------------------------- */

const STACK_IDS = [
  "wedding-arch",
  "concert-confetti",
  "reception-table",
  "festival-lights",
  "wedding-petals",
];

const STACK_SLOTS = [
  { cx: "34px", cy: "18px", rot: "5deg", dx: "4px", dy: "-34px", drot: "8deg" },
  { cx: "14px", cy: "22px", rot: "-7deg", dx: "-8px", dy: "-14px", drot: "-8deg" },
  { cx: "28px", cy: "26px", rot: "2deg", dx: "6px", dy: "4px", drot: "3deg" },
  { cx: "12px", cy: "30px", rot: "-3deg", dx: "-6px", dy: "22px", drot: "-5deg" },
  { cx: "24px", cy: "32px", rot: "0deg", dx: "4px", dy: "38px", drot: "5deg" },
];

function CardStackDemo() {
  return (
    <div className="flex h-[230px] items-center justify-center">
      <div data-mkt-stack className="size-[150px]">
        {STACK_SLOTS.map((s, i) => {
          const m = marketingImage(STACK_IDS[i]);
          return (
            <button
              key={STACK_IDS[i]}
              type="button"
              data-mkt-stackcard
              aria-label={`Photo ${i + 1} of ${STACK_SLOTS.length}`}
              className="size-[92px]"
              style={
                {
                  "--cx": s.cx,
                  "--cy": s.cy,
                  "--rot": s.rot,
                  "--dx": s.dx,
                  "--dy": s.dy,
                  "--drot": s.drot,
                  zIndex: i,
                } as React.CSSProperties
              }
            >
              <Image
                src={m.src}
                alt=""
                fill
                sizes="92px"
                className="pointer-events-none object-cover"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Extra C: the mono confetti-burst proposal (transitions-pro confetti-burst).
 * Flakes fall with real physics and collide with the "Reel ready" card (the
 * beat this proposes to garnish). MONOCHROME by construction: every flake is
 * the stage's currentColor at a randomized alpha. Skipped under reduced
 * motion; the whole demo sits behind a default-OFF toggle.
 * ------------------------------------------------------------------------- */

type Flake = {
  start: number;
  x: number;
  y: number;
  py: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  maxFall: number;
  rot: number;
  vr: number;
  tumble: number;
  tumbleSpeed: number;
  squish: number;
  phase: number;
  swayFreq: number;
  swayScale: number;
  alpha: number;
  bounces: number;
  resting: boolean;
  dead: boolean;
};

function ConfettiStage() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const burstRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!stage || !canvas || !card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Flake[] = [];
    let running = true; // flips false on unmount; the rAF loop checks it
    let active = false;
    let lastT = 0;
    let burstEnd = 0;
    let fadeStart: number | null = null;
    let stageW = 0;
    let stageH = 0;
    let ink = "";

    const sizeCanvas = () => {
      const r = stage.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      stageW = r.width;
      stageH = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const cardRect = () => {
      const s = stage.getBoundingClientRect();
      const b = card.getBoundingClientRect();
      return {
        left: b.left - s.left,
        top: b.top - s.top,
        right: b.right - s.left,
        bottom: b.bottom - s.top,
      };
    };

    // Top surface of the card modeled as a pill: flat between the end-cap
    // centers, circular caps at the ends (flakes slide off the steep caps).
    const surface = (
      x: number,
      b: { left: number; top: number; right: number; bottom: number },
    ) => {
      if (x < b.left || x > b.right) return null;
      const r = Math.min((b.bottom - b.top) / 2, 14);
      const lc = b.left + r;
      const rc = b.right - r;
      if (x >= lc && x <= rc) return { y: b.top, slope: 0 };
      const cx = x < lc ? lc : rc;
      const dxs = x - cx;
      const root = Math.sqrt(Math.max(r * r - dxs * dxs, 0));
      return { y: b.top + (r - root), slope: dxs / Math.max(root, 0.001) };
    };

    const burst = () => {
      sizeCanvas();
      // Monochrome by construction: the stage's currentColor, varied alpha.
      ink = getComputedStyle(stage).color;
      const now = performance.now();
      const count = Math.round(readNum(stage, "--mkt-confetti-count", 110));
      const size = readNum(stage, "--mkt-confetti-size", 7);
      const spawnWindow = 500;
      particles = [];
      fadeStart = null;
      for (let i = 0; i < count; i++) {
        particles.push({
          start: now + Math.random() * spawnWindow,
          x: Math.random() * stageW,
          y: -12 - Math.random() * 30,
          py: -12,
          vx: (Math.random() - 0.5) * 60,
          vy: 40 + Math.random() * 120,
          w: size * (0.7 + Math.random() * 0.6),
          h: size * (0.5 + Math.random() * 0.5),
          maxFall: 420 + Math.random() * 280,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 7,
          tumble: Math.random() * Math.PI * 2,
          tumbleSpeed: 4 + Math.random() * 8,
          squish: 1,
          phase: Math.random() * Math.PI * 2,
          swayFreq: 2 + Math.random() * 3,
          swayScale: 0.5 + Math.random(),
          alpha: 0.3 + Math.random() * 0.65,
          bounces: 0,
          resting: false,
          dead: false,
        });
      }
      burstEnd = now + spawnWindow + 100;
      if (!active) {
        active = true;
        lastT = now;
        requestAnimationFrame(frame);
      }
    };

    const step = (dt: number, now: number) => {
      const g = readNum(stage, "--mkt-confetti-gravity", 1300);
      const sway = readNum(stage, "--mkt-confetti-sway", 16);
      const restitution = readNum(stage, "--mkt-confetti-bounce", 0.3);
      const b = cardRect();
      for (const p of particles) {
        if (p.resting || p.dead || now < p.start) continue;
        p.py = p.y;
        p.vy += g * dt;
        if (p.vy > p.maxFall) p.vy = p.maxFall;
        p.phase += p.swayFreq * dt;
        p.x += (p.vx + Math.cos(p.phase) * sway * p.swayScale) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.tumble += p.tumbleSpeed * dt;
        p.squish = 0.25 + 0.75 * Math.abs(Math.cos(p.tumble));
        const half = p.h / 2;
        if (p.vy > 0) {
          const s = surface(p.x, b);
          if (s && p.y + half >= s.y && p.py + half <= s.y + 2) {
            if (Math.abs(s.slope) > 0.85) {
              const dir = p.x < (b.left + b.right) / 2 ? -1 : 1;
              p.vx = dir * Math.max(Math.abs(p.vx), 50 + Math.random() * 50);
              p.vy *= 0.35;
              p.y = s.y - half;
            } else if (p.vy > 150 && p.bounces < 2) {
              p.bounces++;
              p.vy = -p.vy * restitution * (0.6 + Math.random() * 0.5);
              p.vx = p.vx * 0.7 + s.slope * 40 + (Math.random() - 0.5) * 40;
              p.y = s.y - half;
            } else {
              p.resting = true;
              p.y = s.y - half - 0.5;
              p.vx = 0;
              p.vy = 0;
            }
          }
        }
        if (!p.resting && p.y + half >= stageH - 1) {
          if (p.vy > 170 && p.bounces < 2) {
            p.bounces++;
            p.vy = -p.vy * restitution * (0.5 + Math.random() * 0.4);
            p.vx *= 0.7;
            p.y = stageH - 1 - half;
          } else {
            p.resting = true;
            p.y = stageH - 1 - half;
            p.vx = 0;
            p.vy = 0;
          }
        }
        if (p.x < -30 || p.x > stageW + 30 || p.y > stageH + 30) p.dead = true;
      }
    };

    const draw = (alpha: number) => {
      ctx.clearRect(0, 0, stageW, stageH);
      const now = performance.now();
      ctx.fillStyle = ink;
      for (const p of particles) {
        if (p.dead || now < p.start) continue;
        ctx.save();
        ctx.globalAlpha = alpha * p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, p.squish);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      if (!running || !active) return;
      // Substep so the sim tracks wall-clock time on throttled rAF; capped so
      // a suspended tab doesn't burst.
      let remaining = Math.min((now - lastT) / 1000, 0.25);
      lastT = now;
      while (remaining > 0) {
        const dt = Math.min(remaining, 1 / 60);
        step(dt, now);
        remaining -= dt;
      }
      const settled =
        now > burstEnd && particles.every((p) => p.resting || p.dead);
      if (settled && fadeStart === null) {
        fadeStart = now + readNum(stage, "--mkt-confetti-hold", 1400);
      }
      let alpha = 1;
      if (fadeStart !== null && now >= fadeStart) {
        const fade = Math.max(readNum(stage, "--mkt-confetti-fade", 600), 1);
        alpha = 1 - (now - fadeStart) / fade;
        if (alpha <= 0) {
          active = false;
          particles = [];
          ctx.clearRect(0, 0, stageW, stageH);
          return;
        }
      }
      draw(alpha);
      requestAnimationFrame(frame);
    };

    burstRef.current = burst;
    const onResize = () => {
      if (active) sizeCanvas();
    };
    window.addEventListener("resize", onResize);
    // One burst on mount: the toggle-on IS the trigger.
    burst();
    return () => {
      running = false;
      active = false;
      burstRef.current = () => {};
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const cover = marketingImage("wedding-golden");

  return (
    <div
      ref={stageRef}
      data-mkt-confetti
      className="h-[230px] w-full rounded-[var(--radius)] border border-border bg-background text-foreground"
    >
      <canvas ref={canvasRef} aria-hidden />
      <button
        type="button"
        data-dir-press
        onClick={() => burstRef.current()}
        className="absolute top-3 right-3 z-[1] flex h-8 items-center gap-1.5 rounded-[var(--radius-action-sm)] border border-border bg-background px-3 text-xs font-medium text-muted-foreground"
      >
        <RotateCcw className="size-3.5" />
        Replay the beat
      </button>
      {/* The "Reel ready" payoff card from the live demo: the moment this
          proposal garnishes. Flakes land on and slide off this card. */}
      <div
        ref={cardRef}
        className="absolute bottom-8 left-1/2 z-[1] flex -translate-x-1/2 items-center gap-3 rounded-[var(--radius)] border border-border bg-card p-3 pr-5"
      >
        <div className="relative size-12 overflow-hidden rounded-[var(--radius-tile)]">
          <Image
            src={cover.src}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-medium">Reel ready</p>
          <p className="text-xs text-muted-foreground">
            0:47 · Built from tonight
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfettiDemo() {
  const [on, setOn] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Additive proposal for the live demo&apos;s Reel ready payoff, default
          off. Monochrome flakes only.
        </p>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setOn((v) => !v)}
          className={`h-8 shrink-0 rounded-[var(--radius-action-sm)] border px-3 text-xs font-medium transition-colors ${
            on
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground"
          }`}
        >
          {on ? "Proposal on" : "Show proposal"}
        </button>
      </div>
      {on ? (
        <ConfettiStage />
      ) : (
        <div className="flex h-[230px] w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-border">
          <p className="max-w-[240px] text-center text-xs leading-relaxed text-muted-foreground">
            Off by default. Toggle it on to see the burst land on the Reel
            ready card. Reduced motion skips it entirely.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The page
 * ------------------------------------------------------------------------- */

export function MarketingDecompositionVariants() {
  return (
    <div className="flex flex-col gap-14 py-4">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        The home&apos;s signature move, two ways. Both tell the same story (the
        hero&apos;s reel comes apart into its source tiles while three facts
        land) and share one tile field off the marketing manifest; they differ
        in WHO drives it. Scroll inside each frame. Under reduced motion both
        settle to a still field with the facts fading in.
      </p>

      <Variant
        n={1}
        name="One-shot play"
        rationale="The section tells its own story: scroll it into view and the burst plays once, counters ticking as the tiles land. Self-timed and dependable; Replay re-runs it. The fallback if the scrub feels off."
        framed={false}
      >
        <DecompositionOneShot />
      </Variant>

      <Variant
        n={2}
        name="Scroll-driven"
        rationale="The visitor drives the decomposition: a tall section scrubs the burst by scroll progress, counters tracking it, backwards included. The one sanctioned scroll-linked JS candidate (single rAF loop, only while intersecting, transform-only writes)."
        framed={false}
      >
        <DecompositionScrub />
      </Variant>

      <div className="flex flex-col gap-8">
        <div>
          <p className="text-sm font-semibold">Same-session extras</p>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            The plan&apos;s tactile candidates plus one proposal, small on
            purpose: transitions-pro recipes re-tokened to the house sheet.
            Where each would live is the loud/quiet map&apos;s call, not
            this page&apos;s.
          </p>
        </div>
        <div className="grid gap-10 lg:grid-cols-2">
          <Variant
            n={3}
            name="Photo-pile drag (extra)"
            rationale="drag-drop-physics: grab a photo (1:1 follow, lift, velocity tilt) and drop it into the album zone; the zone morphs into it with a squash, a spring, and a smoke ring. Candidate for the album moment."
            framed={false}
          >
            <div className="mono rounded-xl border border-white/10 bg-[oklch(0.13_0_0)] p-4" data-mode="dark">
              <PhotoPileDemo />
            </div>
          </Variant>
          <Variant
            n={4}
            name="Card-stack hover (extra)"
            rationale="card-stack-hover: a pile of five event photos fans out on hover with a springy overshoot and closes softly. Candidate for style covers or the events cards."
            framed={false}
          >
            <div className="mono rounded-xl border border-white/10 bg-[oklch(0.13_0_0)] p-4" data-mode="dark">
              <CardStackDemo />
            </div>
          </Variant>
          <Variant
            n={5}
            name="Confetti proposal (extra)"
            rationale="confetti-burst, MONOCHROME: flakes fall with physics and land on the Reel ready card. Proposed as an additive garnish for the live demo's payoff beat; ships only if ruled in, stays off by default here."
            framed={false}
          >
            <div className="mono rounded-xl border border-white/10 bg-[oklch(0.13_0_0)] p-4" data-mode="dark">
              <ConfettiDemo />
            </div>
          </Variant>
        </div>
      </div>
    </div>
  );
}
