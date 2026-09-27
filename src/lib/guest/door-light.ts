"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * THE DOOR'S LIGHT, AND WHERE ITS COLOUR COMES FROM (`identity-door` r2, Will's `look=lit`: "the
 * album's own colour lights the sheet's edge").
 *
 * Every lamp the door wears (the held sheet's free edge, her menu's card, the change and confirm
 * sheets) is one light, so it is one colour: the album's newest previews, within a bounded lookback
 * past any that turn out colourless (`album-light.tsx`'s `LOOKBACK`), sampled through
 * `useSampledPalette` (the sampler the site's lamps use, CORS-clean on presigned previews), kept as
 * HUES alone, so the register (paper in light, the atmosphere register in dark) stays the
 * stylesheet's to pick (`door/lit.css`).
 *
 * ★ A MODULE STORE, BECAUSE THE LAMPS LIVE ON THREE ISLANDS. The album that knows the photographs
 * sits under the page's live provider; the header's name menu is a sibling island of the page, and
 * the confirm door opens from the album's grid three modules deep. None can hand another a prop, so
 * this is the same module-singleton shape `name-door.ts` and `album-return.ts` use for the same
 * reason.
 *
 * ★ THE HOUSE FIVE UNTIL THE SAMPLE LANDS, AND WHEREVER NOTHING CAN BE SAMPLED (law 3's no-media
 * branch): a password event before its unlock shows no photograph to sample, so its lamp is the
 * house's own light rather than none.
 *
 * ★ THE SAMPLE IS PAID FOR ONLY WHILE A LAMP IS LIT. Each lamp registers while it is mounted; the
 * album samples only while one is, so a guest scrolling a busy album all night never re-fetches
 * three previews per arrival for a light nobody is looking at.
 */

/** The house five (coral, amber, green, blue, violet): the lamp set's own hues. */
export const HOUSE_HUES: readonly number[] = [25, 85, 155, 255, 305];

let sampled: readonly number[] | null = null;
let lit = 0;
const hueListeners = new Set<() => void>();
const litListeners = new Set<() => void>();

function emit(set: Set<() => void>) {
  for (const listener of set) listener();
}

/** The album's sampled hues, or null to fall back to the house five. A sample never goes stale to
 *  nothing: a null only clears what an earlier sample set (a test's reset, a different album). */
export function publishDoorHues(hues: readonly number[] | null) {
  if (hues === sampled) return;
  if (hues && sampled && hues.join() === sampled.join()) return;
  sampled = hues && hues.length > 0 ? hues : null;
  emit(hueListeners);
}

/** The hue of an `oklch(L C H)` string (the sampler's own output), or null for anything else. */
export function hueOfOklch(color: string): number | null {
  const m = /^oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s*\)$/.exec(color.trim());
  return m ? Number(m[1]) : null;
}

function subscribeHues(cb: () => void) {
  hueListeners.add(cb);
  return () => {
    hueListeners.delete(cb);
  };
}

/** The lamp's hues, live: the album's sample once it lands, the house five until then. Server
 *  snapshot: the house five, so the first paint and the hydration agree. */
export function useDoorHues(): { hues: readonly number[]; sampled: boolean } {
  const hues = useSyncExternalStore(
    subscribeHues,
    () => sampled,
    () => null,
  );
  return { hues: hues ?? HOUSE_HUES, sampled: hues !== null };
}

/** A lamp is mounted: register it for as long as it is (the sample's demand). */
export function useLampLit() {
  useEffect(() => {
    lit += 1;
    emit(litListeners);
    return () => {
      // Never below none (a reset between two mounts must not leave the next lamp unlit).
      lit = Math.max(0, lit - 1);
      emit(litListeners);
    };
  }, []);
}

function subscribeLit(cb: () => void) {
  litListeners.add(cb);
  return () => {
    litListeners.delete(cb);
  };
}

/** Whether any lamp is lit right now (the album samples only then). */
export function useAnyLampLit(): boolean {
  return useSyncExternalStore(
    subscribeLit,
    () => lit > 0,
    () => false,
  );
}

/** Test seam: forget the sample (a module store outlives one test's render). */
export function resetDoorLightForTests() {
  sampled = null;
  lit = 0;
  emit(hueListeners);
  emit(litListeners);
}
