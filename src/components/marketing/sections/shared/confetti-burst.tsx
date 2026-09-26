"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * THE CELEBRATORY BEAT (the achromatic reshape): confetti with real
 * physics, ported from the transitions-pro exploration, and now COLORED — the
 * reshape moved the identity from
 * monochromatic to ACHROMATIC-plus-tasteful-accents, and confetti is the
 * canonical accent moment. Colors come ONLY from the sanctioned
 * `--mkt-confetti-*` tokens in marketing.css (no brand hue; a festive set at
 * restrained chroma); flakes keep randomized alpha so the burst reads scattered
 * paper, not vector sprites.
 *
 * Physics (verbatim from the lab port): flakes spawn across the top over a
 * 500ms window, fall under gravity with sway + tumble/squish, collide with the
 * TARGET card's pill-shaped top (slide off the steep end caps, bounce twice at
 * most, then rest) and with the stage floor, hold, then fade. The rAF loop
 * substeps against wall-clock (a throttled tab cannot slingshot) and exits
 * fully once faded — a one-shot beat, never an ambient loop, so it sits
 * OUTSIDE the loop-pause contract by construction. Reduced motion: no-op.
 *
 * Mount it absolutely over a `relative` stage; it is pointer-transparent.
 * `fire` bursts on every change to a value > 0 (pass a run counter).
 */

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
  color: string;
  bounces: number;
  resting: boolean;
  dead: boolean;
};

function readNum(root: HTMLElement, name: string, fallback: number): number {
  const raw = getComputedStyle(root).getPropertyValue(name);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}

const COLOR_TOKENS = [
  "--mkt-confetti-1",
  "--mkt-confetti-2",
  "--mkt-confetti-3",
  "--mkt-confetti-4",
  "--mkt-confetti-5",
];

export function ConfettiBurst({
  fire,
  targetRef,
}: {
  /** Bursts on every CHANGE to a value > 0 (e.g. `reelLanded ? runId + 1 : 0`). */
  fire: number;
  /** The card flakes land on; null-safe (floor-only physics without it). */
  targetRef: RefObject<HTMLElement | null>;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstRef = useRef<() => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Flake[] = [];
    let running = true;
    let active = false;
    let lastT = 0;
    let burstEnd = 0;
    let fadeStart: number | null = null;
    let stageW = 0;
    let stageH = 0;

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
      const card = targetRef.current;
      if (!card) return null;
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
      const styles = getComputedStyle(stage);
      // The sanctioned accent set; a missing token falls back to the ink so a
      // token rename degrades to the old mono burst, never to invisible.
      const palette = COLOR_TOKENS.map(
        (t) => styles.getPropertyValue(t).trim() || styles.color,
      );
      const now = performance.now();
      const count = Math.round(readNum(stage, "--mkt-confetti-count", 120));
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
          alpha: 0.45 + Math.random() * 0.55,
          color: palette[i % palette.length],
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
        if (b && p.vy > 0) {
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
      for (const p of particles) {
        if (p.dead || now < p.start) continue;
        ctx.save();
        ctx.globalAlpha = alpha * p.alpha;
        ctx.fillStyle = p.color;
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
      // Substep so the sim tracks wall-clock on throttled rAF; capped so a
      // suspended tab cannot slingshot the flakes.
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
        fadeStart = now + readNum(stage, "--mkt-confetti-hold", 1600);
      }
      let alpha = 1;
      if (fadeStart !== null && now >= fadeStart) {
        const fade = Math.max(readNum(stage, "--mkt-confetti-fade", 700), 1);
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
    return () => {
      running = false;
      active = false;
      burstRef.current = () => {};
      window.removeEventListener("resize", onResize);
    };
  }, [targetRef]);

  useEffect(() => {
    if (fire > 0) burstRef.current();
  }, [fire]);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
