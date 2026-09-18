"use client";

import { useEffect, useRef, useState } from "react";

import {
  getTunerServerSnapshot,
  getTunerSnapshot,
  subscribeTuner,
} from "@/components/dev/tuner-store";

/**
 * EVERY NUMBER A BOARD PRINTS IS THE NUMBER THE STAGE IS RENDERING.
 *
 * This is the kit's single most load-bearing rule and the reason these two
 * hooks exist rather than a literal in a caption. A board argues about values;
 * the moment a caption is a hand-typed string it can disagree with the specimen
 * above it, and a reviewer has no way to tell which one is lying. So a board
 * measures.
 *
 * ★ IT READS THE COMPUTED CASCADE, NOT THE TUNER STORE, AND THE DIFFERENCE IS
 * THE WHOLE POINT. Tapping a knob writes an override into the store, but a lab
 * page mounts CandidateStyle and NOT the tuner panel, so nothing on a board
 * wears that override: the stage below keeps whatever the sheet declares. A
 * caption driven by the store would print 24s over a field still running at
 * 33s, the same class of lie the literal was. `getComputedStyle` on the element
 * the stages inherit from cannot drift from them by construction, and it picks
 * up an APPLIED CANDIDATE, which is the one thing on a lab page that can really
 * move a token.
 *
 * ★ THE PROBE MUST BE A REAL ELEMENT. A token like `--radius-xl` is empty at
 * runtime because `@theme inline` substitutes each derived step into its utility
 * at build time, so reading the variable returns "". The honest read is a hidden
 * span wearing the utility, measured with `getComputedStyle`. `useComputedTokens`
 * takes the probe's ref for exactly that reason.
 *
 * It rides the tuner store's subscription rather than an effect, so the snapshot
 * is a plain value React can compare, and re-checks after the commit that
 * renders an applied block's <style>.
 */
export function useComputedTokens(
  /** The element the stages inherit from; defaults to <html>. */
  names: readonly string[],
  host?: React.RefObject<HTMLElement | null>,
): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  const overrides = useSyncTuner();

  useEffect(() => {
    const read = () => {
      const el = host?.current ?? document.documentElement;
      const cs = getComputedStyle(el);
      const next: Record<string, string> = {};
      for (const n of names) next[n] = cs.getPropertyValue(n).trim();
      setValues(next);
    };
    read();
    // The tuner writes its inline values on <html> from its own effect, and an
    // applied block renders a <style> in the same commit; one frame later is
    // after both in every ordering reachable from here.
    const id = requestAnimationFrame(read);
    return () => cancelAnimationFrame(id);
    // `names` is a literal array at every call site; joining it keeps the effect
    // from re-running on every render without asking callers to memoise.
  }, [names.join("|"), host, overrides]); // eslint-disable-line react-hooks/exhaustive-deps

  return values;
}

function useSyncTuner() {
  const [, force] = useState(0);
  useEffect(
    () => subscribeTuner(() => force((n) => n + 1)),
    [],
  );
  // Touch the snapshots so a server render and a client render agree on shape.
  return typeof window === "undefined"
    ? getTunerServerSnapshot()
    : getTunerSnapshot();
}

/**
 * HOW MANY LINES A BLOCK OF COPY ACTUALLY TOOK, measured off the rendered text
 * rather than counted off the string.
 *
 * A candidate that reads as one line at 1440 and wraps to three at 375 is a
 * different candidate, and "three lines on the phone" is the kind of claim a
 * board makes constantly and almost never checks. The measurement is the box's
 * height over its line-height, because a Range-based count is defeated by any
 * inline element inside the paragraph, and copy on a board always has one.
 *
 * ★ THE WEBFONT LANDS AFTER THE FIRST LAYOUT AND TAKES EVERY WRAP WITH IT, so
 * the count is re-read on `document.fonts.ready` or it is the fallback face's
 * count, which is usually one line short.
 */
export function useLineCount(): [
  React.RefObject<HTMLElement | null>,
  number | null,
] {
  const ref = useRef<HTMLElement | null>(null);
  const [lines, setLines] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const cs = getComputedStyle(el);
      const lh = Number.parseFloat(cs.lineHeight);
      if (!Number.isFinite(lh) || lh <= 0) return setLines(null);
      setLines(Math.max(1, Math.round(el.getBoundingClientRect().height / lh)));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    document.fonts?.ready.then(sync).catch(() => {});
    return () => ro.disconnect();
  }, []);
  return [ref, lines];
}
