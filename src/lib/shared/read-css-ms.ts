"use client";

// Parse a CSS <time> string to a millisecond number, robust to the unit it serializes with. This
// matters because the build minifier (Lightning CSS, via Tailwind v4) CANONICALIZES <time> literals
// to their shortest form — `2500ms` in source becomes `2.5s` in the shipped CSS, `500ms` becomes
// `.5s`. A naive parseInt("2.5s") returns 2 (it stops at the dot), which silently collapsed the
// all-caught-up beat to ~2ms. parseFloat + an explicit unit check fixes it for `s`, `ms`, and a
// bare number (treated as ms). Pure (no DOM) so it's unit-tested; readCssMs feeds it the live value.
export function parseCssMs(raw: string, fallbackMs: number): number {
  const value = raw.trim().toLowerCase();
  if (!value) return fallbackMs;
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallbackMs;
  if (value.endsWith("ms")) return n;
  if (value.endsWith("s")) return n * 1000;
  return n; // bare number → already milliseconds
}

// Read a CSS custom property as a millisecond number. Used by the JS-timed motion (the review beat
// + the FLIP) so the JS waits match the CSS exactly, even when the tuner overrides the var live.
export function readCssMs(varName: string, fallbackMs: number): number {
  if (typeof window === "undefined") return fallbackMs;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    varName,
  );
  return parseCssMs(raw, fallbackMs);
}
