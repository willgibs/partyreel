// Deterministic seeded PRNG (mulberry32). Same seed → same reel, so the @remotion/player preview and
// the Lambda render match, AND a "shuffle" (a new seed) yields a genuinely different-but-stable take.

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable 0..1 value for (seed, index, salt). Different SALTS give independent streams per shot, so a
 *  clip's pan / zoom / hold / transition all vary independently yet deterministically. */
export function seeded(seed: number, index: number, salt = 0): number {
  return mulberry32((seed * 2654435761 + index * 40503 + salt * 97 + 1) >>> 0)();
}

/** Stable seeded value in [min, max). */
export function seededRange(
  seed: number,
  index: number,
  salt: number,
  min: number,
  max: number,
): number {
  return min + seeded(seed, index, salt) * (max - min);
}

/** Stable seeded pick from a non-empty array. */
export function seededPick<T>(
  seed: number,
  index: number,
  salt: number,
  arr: readonly T[],
): T {
  return arr[Math.floor(seeded(seed, index, salt) * arr.length) % arr.length];
}
