/*
 * Vendored from border-beam v1.4.0 (MIT) — https://github.com/Jakubantalik/Libraries
 *
 * MIT License. Copyright (c) 2026 Jakub Antalik. Full text in ./LICENSE.
 * The notice is retained here because MIT requires it in copies of the source;
 * user-facing credit belongs on the attributions page, not in the UI.
 *
 * ── WHY THIS IS VENDORED RATHER THAN REIMPLEMENTED ──
 * Three hand-ports of this effect were attempted and all three missed, in the
 * same direction each time: inferring the effect from computed styles and
 * screenshots, substituting our low-chroma five for its saturated palette, then
 * compensating with saturate() until it read as neon. The motion alone is
 * seventeen desynced oscillators plus a hue revolution (eighteen drivers in
 * all). This is a UI package with no runtime dependencies; copying it exactly
 * is both cheaper and more honest than approximating it.
 *
 * ★ DO NOT RESTYLE THESE FILES. Every deviation from upstream is marked
 * `PARTYREEL:`. There are TWO deviations in intent, across SEVEN in-body marked
 * sites plus this header in each file (11 marks in all, pinned exactly by
 * border-beam-vendor.test.ts):
 *   1. a "use client" directive, which Next 16 needs;
 *   2. one extra colorPalettes entry, so our own hues can be A/B'd against
 *      theirs from a single prop. That entry is what forces the other four
 *      marked sites: adding a fifth member to the colour union means the four
 *      `*Base`-rename-and-respread edits in styles.ts (340/486/550/649) are
 *      LOAD-BEARING under strict TS, since indexing a 4-key map with a 5-member
 *      union is TS7053. Do not "simplify" them back; the build fails.
 * A future upstream bump re-applies exactly those. Nothing else here is ours.
 */
import type { PulseDriverConfig } from './styles';

/**
 * Shared breathing driver for the Pulse effects.
 *
 * The pulse breathing (size / drift / per-quadrant opacity / height) and the
 * slow hue drift used to run as ~15 per-instance CSS `@property` keyframe
 * animations at the display refresh rate (60–120 Hz). Because each value feeds
 * the painted gradients/filters, that repainted the breathing layers 60–120×/s.
 *
 * The motion is very slow (1.6–6.4 s periods), so instead every registered
 * instance is driven from a SINGLE shared requestAnimationFrame loop throttled
 * to ~30 fps. This halves the paint frequency on 60 Hz displays and quarters it
 * on 120 Hz, with no perceptible change to the breathing.
 *
 * Each oscillator ping-pongs a CSS custom property between `a` and `b` with an
 * ease-in-out (cosine) curve over `period` seconds, offset by `delay` seconds so
 * otherwise-identical oscillators desync (matching the former CSS keyframes +
 * animation-delay).
 */

interface PulseInstance {
  el: HTMLElement;
  config: PulseDriverConfig;
}

const instances = new Set<PulseInstance>();
let rafId: number | null = null;
let lastFrame = 0;

// ~30 fps. Subtract a small slack so a frame that lands a hair early still runs.
const FRAME_INTERVAL = 1000 / 30 - 2;

const TWO_PI = Math.PI * 2;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Cosine ease-in-out factor in [0, 1]: 0 at phase 0/1, 1 at phase 0.5. */
function pingPong(phase: number): number {
  return (1 - Math.cos(TWO_PI * phase)) / 2;
}

function frame(ts: number): void {
  rafId = requestAnimationFrame(frame);

  if (ts - lastFrame < FRAME_INTERVAL) return;
  lastFrame = ts;

  const tSec = ts / 1000;

  instances.forEach(({ el, config }) => {
    for (const osc of config.oscillators) {
      // Match CSS animation-delay semantics: a positive delay starts later.
      const phase = (tSec - osc.delay) / osc.period;
      const value = osc.a + (osc.b - osc.a) * pingPong(phase);
      el.style.setProperty(
        osc.prop,
        osc.unit === 'px' ? `${value.toFixed(2)}px` : value.toFixed(4)
      );
    }

    if (config.hue) {
      const { prop, range, period, continuous } = config.hue;
      // `continuous` rotates a full circle (0→range, looping) so every color
      // sweeps through every edge; otherwise drift between -range and +range.
      const value = continuous
        ? ((tSec / period) % 1) * range
        : -range + 2 * range * pingPong(tSec / period);
      el.style.setProperty(prop, `${value.toFixed(2)}deg`);
    }
  });
}

function startLoop(): void {
  if (rafId == null) {
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }
}

function stopLoopIfIdle(): void {
  if (instances.size === 0 && rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

/**
 * Register an element to be driven by the shared pulse loop.
 *
 * @returns a cleanup function that unregisters the instance (and stops the
 *          shared loop once no instances remain).
 */
export function registerPulseInstance(
  el: HTMLElement,
  config: PulseDriverConfig
): () => void {
  const instance: PulseInstance = { el, config };
  instances.add(instance);
  startLoop();

  return () => {
    instances.delete(instance);
    stopLoopIfIdle();
  };
}
