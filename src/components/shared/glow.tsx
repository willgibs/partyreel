"use client";

/**
 * SPILL: the light primitive (promoted to production, round 0, 2026-09-01).
 *
 * The engine's CSS lives in globals.css; this owns the JS-side invariants BY
 * CONSTRUCTION, so a consumer cannot forget them. Three of those are non
 * obvious enough that they are the reason this component exists at all:
 *
 * 1. THE PAUSE CONTRACT IS PER SHAPE, not uniform. Looping shapes take
 *    useAmbientPause (offscreen / hidden tab / reduced motion -> data-paused).
 *    `bloom` must NOT: useAmbientPause starts paused and stays paused while
 *    offscreen, so a one-shot wired to it either never fires or fires while
 *    nobody is looking. It takes useInViewOnce, which is the hook for
 *    "has this arrived yet".
 * 2. BASE AND BAND ALWAYS SHIP TOGETHER. A swept layer rests fully off-layer,
 *    so a band-only glow is invisible whenever it is paused, which is its
 *    DEFAULT state below the fold and its reduced-motion state. The base is
 *    how a reduced-motion arrival still arrives.
 * 3. NO className. Tailwind's filter and mask utilities live in the utilities
 *    layer, which outranks everything the engine declares; one `blur-sm` from
 *    a caller would replace `filter: url(#glw-warp) blur(...)` wholesale and
 *    the turbulence warp would vanish with no error and no failing test. The
 *    element is absolutely positioned to inset 0, so the CALLER's own wrapper
 *    is what positions it, and tuning happens through `vars`.
 *
 * The filter host is deliberately NOT rendered here, and as of round 1 it is
 * not rendered by any consumer either: <GlowFilter> lives in glow-filter.tsx
 * and is mounted ONCE in the root layout. One page gets exactly one turbulence
 * field, because duplicate SVG ids resolve by document order and that is
 * unstable under portals and reconciliation. Add a lamp anywhere; the host is
 * already there.
 */

import { useEffect, type CSSProperties } from "react";

import { useAmbientPause } from "@/lib/shared/use-ambient-pause";
import { useInViewOnce } from "@/lib/shared/use-in-view-once";

export type GlowShape = "seam" | "throw" | "sweep" | "bloom" | "halo";
export type GlowDrive = "mask" | "transform" | "scalar";

/** The tunable engine knobs. Typed so a typo is a compile error, not a no-op. */
export type GlowVars = Partial<
  Record<
    | "--glw-base"
    | "--glw-strength"
    | "--glw-dur"
    | "--glw-blur"
    | "--glw-scale"
    | "--glw-h"
    | "--glw-core"
    | "--glw-core-blur"
    | "--glw-from-x"
    | "--glw-from-y"
    | "--glw-reach"
    | "--glw-radius"
    | "--glw-t",
    string
  >
>;

type GlowProps = {
  shape: GlowShape;
  /**
   * Which mechanic moves the light. "mask" is the shipped footer mechanic (a
   * static colour field windowed by a travelling mask, faithful but repainting
   * every frame); "transform" moves the comet itself on the compositor;
   * "scalar" has no clock at all and reads `--glw-t` as a target JS sets.
   */
  drive?: GlowDrive;
  /** The phase-locked edge beam (the half of organic-shimmer we never adopted). */
  edge?: boolean;
  /**
   * Law 3. Five colours sampled from the media this lamp is lighting. Omit on
   * surfaces with no media and the engine falls back to the house lamp set
   * (--lamp-1..5, globals.css). Lands inline, so it outranks both the engine's
   * defaults and any ancestor that retuned --lamp-* for its subtree.
   *
   * ★ SAMPLING DOES NOT WORK ON REAL USER MEDIA YET. useSampledPalette sets no
   * crossOrigin, so an R2-presigned photo taints the canvas, getImageData
   * throws, and the catch silently hands back the fallback: no error, no
   * failing test, just generic-looking light. Fix that before wiring this to
   * guest media (see sampled-palette.ts's header for the two options).
   */
  colors?: readonly string[];
  vars?: GlowVars;
  /** Replay key for `bloom`: change it and the one-shot runs again. */
  runId?: number;
};

function colorVars(colors?: readonly string[]): CSSProperties {
  if (!colors?.length) return {};
  const out: Record<string, string> = {};
  colors.slice(0, 5).forEach((c, i) => {
    out[`--glw-c${i + 1}`] = c;
  });
  return out as CSSProperties;
}

export function Glow({
  shape,
  drive = "mask",
  edge = false,
  colors,
  vars,
  runId = 0,
}: GlowProps) {
  const oneShot = shape === "bloom";
  // Both hooks are called unconditionally (rules of hooks); only the one this
  // shape's contract calls for is read. The unused observer is cheap and it
  // keeps the branch out of the render tree.
  const ambient = useAmbientPause<HTMLDivElement>();
  const arrival = useInViewOnce<HTMLDivElement>(0.35);

  const ref = oneShot ? arrival.ref : ambient.ref;
  const paused = oneShot ? false : ambient.paused;
  // A one-shot is ARMED by arrival, never GATED by it. Gating the band's
  // existence on inView (what this did first) breaks invariant 2 at runtime
  // while the source still mentions both layers, and it also makes a
  // user-triggered replay depend on an observer that may never have fired.
  // The attribute holds the animation instead, so the light is present and
  // resting from first paint and a runId change always replays it.
  const armed = !oneShot || arrival.inView || runId > 0;

  // ★ THE MISSING-HOST TRIPWIRE, and the measurement that justifies its shape
  // (round 1, 2026-09-01). Measured in Chrome: when `filter: url(#glw-warp)`
  // points at a filter that is NOT in the document, the element still paints --
  // but the WHOLE chain is dropped, blur() included, so the five ellipses land
  // as hard-edged colour blobs. Verified twice, by renaming the id and by
  // removing the host node; identical either way. So a missing host is not a
  // blank element, it is a visibly WRONG one, and nothing is logged.
  //
  // Which makes this a quality tripwire rather than a crash guard, and dev-only
  // is the right scope: in production the page still renders, just badly, and a
  // console error would not help the visitor.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (document.getElementById("glw-warp")) return;
    console.error(
      "[Glow] #glw-warp is not in the document. The lamp will render with NO " +
        "warp and NO blur (Chrome drops the whole filter chain), i.e. hard-" +
        "edged colour blobs. GlowFilter is mounted in the root layout; check " +
        "it was not removed.",
    );
  }, []);
  const style = { ...colorVars(colors), ...(vars as CSSProperties) };

  return (
    <div
      ref={ref}
      data-glw
      data-glw-shape={shape}
      data-glw-drive={drive}
      data-paused={paused ? "true" : "false"}
      data-glw-armed={oneShot ? (armed ? "true" : "false") : undefined}
      style={style}
      aria-hidden
    >
      {/* Base is always lit; the band is the moving part. Never one without
          the other (invariant 2 above). The one-shot is keyed on runId so a
          replay is a remount, which is how this codebase fires one-shots
          everywhere else (no animationend listeners). */}
      <div data-glw-field key={oneShot ? runId : undefined}>
        <div data-glw-base />
        <div data-glw-band />
      </div>
      {edge && (
        <>
          {/* Our deviation from the recipe: a faint always-on ring under the
              travelling comet, so the edge survives the paused and
              reduced-motion states the recipe leaves dark. */}
          <div data-glw-edge-rest />
          <div data-glw-edge key={oneShot ? runId : undefined}>
            <div data-glw-edge-bloom />
            <div data-glw-edge-inner />
            <div data-glw-edge-ring />
          </div>
        </>
      )}
    </div>
  );
}
