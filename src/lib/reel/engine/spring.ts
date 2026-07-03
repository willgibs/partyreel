// Remotion's spring timing, PORTED for the canvas engine (source of truth:
// remotion/dist/cjs/spring/spring-utils.js + measure-spring.js + spring/index.js, and
// @remotion/transitions springTiming which wraps them). The mood themes use
// springTiming({ durationInFrames, config: { damping: 200 } }) for their soft-settle transitions
// (Reel.tsx timingFor), so the engine must produce the SAME progress value at every frame or fades
// visibly drift from the Remotion player. spring.test.ts pins arrays sampled from the real remotion
// implementation.
//
// Two deliberate ports of Remotion quirks, kept for parity (do NOT "fix" them):
// - zeta >= 1 (damping 200 => zeta 10) uses Remotion's "critically damped" closed form even though the
//   spring is overdamped; that IS the curve Remotion renders.
// - springCalculation steps whole frames then one fractional rest step, with each step's deltaTime
//   clamped to 64ms; the stretched durationInFrames evaluation lands on fractional frames, so the
//   stepping strategy changes the value.

type SpringConfig = { damping: number; mass: number; stiffness: number };

const DEFAULT_CONFIG: SpringConfig = { damping: 10, mass: 1, stiffness: 100 };
const REST_THRESHOLD = 0.005;

type SpringState = { current: number; velocity: number; lastTimestamp: number };

function advance(
  state: SpringState,
  now: number,
  config: SpringConfig,
): SpringState {
  const toValue = 1;
  const deltaTime = Math.min(now - state.lastTimestamp, 64);
  const c = config.damping;
  const m = config.mass;
  const k = config.stiffness;

  const v0 = -state.velocity;
  const x0 = toValue - state.current;

  const zeta = c / (2 * Math.sqrt(k * m));
  const omega0 = Math.sqrt(k / m);
  const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);

  const t = deltaTime / 1000;
  const sin1 = Math.sin(omega1 * t);
  const cos1 = Math.cos(omega1 * t);

  // Under damped (omega1 is NaN when zeta >= 1; Remotion computes it anyway and discards it).
  const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
  const underDampedFrag1 =
    underDampedEnvelope *
    (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
  const underDampedPosition = toValue - underDampedFrag1;
  const underDampedVelocity =
    zeta * omega0 * underDampedFrag1 -
    underDampedEnvelope *
      (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);

  // Critically damped (Remotion's branch for zeta >= 1).
  const criticallyDampedEnvelope = Math.exp(-omega0 * t);
  const criticallyDampedPosition =
    toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);
  const criticallyDampedVelocity =
    criticallyDampedEnvelope *
    (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);

  return {
    current: zeta < 1 ? underDampedPosition : criticallyDampedPosition,
    velocity: zeta < 1 ? underDampedVelocity : criticallyDampedVelocity,
    lastTimestamp: now,
  };
}

/** spring value (from 0 to 1) at a possibly-fractional frame, Remotion's exact stepping. */
function springCalculation(
  frame: number,
  fps: number,
  config: SpringConfig,
): number {
  let state: SpringState = { current: 0, velocity: 0, lastTimestamp: 0 };
  const frameClamped = Math.max(0, frame);
  const unevenRest = frameClamped % 1;
  for (let f = 0; f <= Math.floor(frameClamped); f++) {
    if (f === Math.floor(frameClamped)) {
      f += unevenRest;
    }
    const time = (f / fps) * 1000;
    state = advance(state, time, config);
  }
  return state.current;
}

const naturalDurationCache = new Map<string, number>();

/** How many frames the spring takes to settle within 0.005 of 1 (Remotion's measureSpring). */
export function measureSpringFrames(fps: number, config: SpringConfig): number {
  const key = `${fps}-${config.damping}-${config.mass}-${config.stiffness}`;
  const cached = naturalDurationCache.get(key);
  if (cached !== undefined) return cached;

  let frame = 0;
  let finishedFrame = 0;
  let difference = Math.abs(springCalculation(frame, fps, config) - 1);
  while (difference >= REST_THRESHOLD) {
    frame++;
    difference = Math.abs(springCalculation(frame, fps, config) - 1);
  }
  // The spring can bounce back out of the threshold; require 20 settled frames (Remotion's rule).
  finishedFrame = frame;
  for (let i = 0; i < 20; i++) {
    frame++;
    difference = Math.abs(springCalculation(frame, fps, config) - 1);
    if (difference >= REST_THRESHOLD) {
      i = 0;
      finishedFrame = frame + 1;
    }
  }
  naturalDurationCache.set(key, finishedFrame);
  return finishedFrame;
}

/**
 * springTiming({ durationInFrames, config: { damping } }).getProgress({ frame, fps }): the natural
 * spring curve stretched to fit durationInFrames. This is the transition-progress curve the themes'
 * "spring"-timed gaps use.
 */
export function springTimingProgress(
  frame: number,
  durationInFrames: number,
  fps: number,
  damping = 200,
): number {
  const config: SpringConfig = { ...DEFAULT_CONFIG, damping };
  if (frame > durationInFrames) return 1;
  const natural = measureSpringFrames(fps, config);
  const stretched = frame / (durationInFrames / natural);
  return springCalculation(stretched, fps, config);
}
