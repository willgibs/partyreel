// Easing math for the canvas engine, PORTED from Remotion so per-frame values match the Remotion
// composition byte-for-byte (the source of truth: remotion/dist/cjs/bezier.js, itself the React Native
// bezier). The engine renders the SAME ReelProps the Remotion path renders, so any easing drift shows up
// as a visible parity break in the lab harness; easing.test.ts pins sampled values generated from the
// real remotion implementation. Pure module: no DOM, no remotion import (the whole point).

const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

const kSplineTableSize = 11;
const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

function a(aA1: number, aA2: number): number {
  return 1.0 - 3.0 * aA2 + 3.0 * aA1;
}

function b(aA1: number, aA2: number): number {
  return 3.0 * aA2 - 6.0 * aA1;
}

function c(aA1: number): number {
  return 3.0 * aA1;
}

function calcBezier(aT: number, aA1: number, aA2: number): number {
  return ((a(aA1, aA2) * aT + b(aA1, aA2)) * aT + c(aA1)) * aT;
}

function getSlope(aT: number, aA1: number, aA2: number): number {
  return 3.0 * a(aA1, aA2) * aT * aT + 2.0 * b(aA1, aA2) * aT + c(aA1);
}

function binarySubdivide(
  aX: number,
  _aA: number,
  _aB: number,
  mX1: number,
  mX2: number,
): number {
  let currentX: number;
  let currentT: number;
  let i = 0;
  let aA = _aA;
  let aB = _aB;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (
    Math.abs(currentX) > SUBDIVISION_PRECISION &&
    ++i < SUBDIVISION_MAX_ITERATIONS
  );
  return currentT;
}

function newtonRaphsonIterate(
  aX: number,
  _aGuessT: number,
  mX1: number,
  mX2: number,
): number {
  let aGuessT = _aGuessT;
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0.0) {
      return aGuessT;
    }
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}

/** The remotion/React-Native cubic-bezier solver (identical constants + iteration strategy). */
export function cubicBezier(
  mX1: number,
  mY1: number,
  mX2: number,
  mY2: number,
): (x: number) => number {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
    throw new Error("bezier x values must be in [0, 1] range");
  }

  const sampleValues = new Float32Array(kSplineTableSize);
  if (mX1 !== mY1 || mX2 !== mY2) {
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }
  }

  function getTForX(aX: number): number {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;

    for (
      ;
      currentSample !== lastSample && sampleValues[currentSample] <= aX;
      ++currentSample
    ) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist =
      (aX - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;

    const initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    }
    if (initialSlope === 0.0) {
      return guessForT;
    }
    return binarySubdivide(
      aX,
      intervalStart,
      intervalStart + kSampleStepSize,
      mX1,
      mX2,
    );
  }

  return function (x: number): number {
    const clampedX = Math.min(1, Math.max(0, x));
    if (mX1 === mY1 && mX2 === mY2) {
      return clampedX; // linear
    }
    if (clampedX === 0) {
      return 0;
    }
    if (clampedX === 1) {
      return 1;
    }
    return calcBezier(getTForX(clampedX), mY1, mY2);
  };
}

/** The mood engine's shared ease, matching Reel.tsx's `EASE = Easing.bezier(0.16, 1, 0.3, 1)`. */
export const EASE = cubicBezier(0.16, 1, 0.3, 1);

/**
 * The subset of remotion's interpolate() the moods actually use: one input segment, clamped at both
 * ends, optional easing on the normalized progress. (Reel.tsx uses extrapolateLeft "extend" in a few
 * spots, but every input there is a frame >= the range start, so clamp-both is value-identical.)
 */
export function interp(
  input: number,
  inputRange: readonly [number, number],
  outputRange: readonly [number, number],
  easing?: (p: number) => number,
): number {
  const [inA, inB] = inputRange;
  const [outA, outB] = outputRange;
  let p = inB === inA ? (input >= inB ? 1 : 0) : (input - inA) / (inB - inA);
  if (p < 0) p = 0;
  else if (p > 1) p = 1;
  if (easing) p = easing(p);
  return outA + p * (outB - outA);
}
