// The COMPOSITION-LEVEL signatures, PORTED from Reel.tsx (its frame-level math verbatim; that file
// is the source of truth for every constant here). These wrap the whole clip stack, outside the
// per-clip draws and inside the overlays: gate weave (a seeded translate wander), the rhythmic
// scale-pulse (Pulse), the boundary whip-blur (Kinetic), and the cut strobe flash (Pulse). Pure
// math over the plan's clip starts + gaps; the draw applies the transform/blur/flash on canvas.

import type { PlannedGap } from "./layout";
import type { ReelSignature } from "./reel-types";

export type SignatureFrameState = {
  /** Gate-weave translate offsets in px (0 when the theme has no weave). */
  weaveX: number;
  weaveY: number;
  /** The global scale-pulse factor (1 when the theme has no pulse). */
  pulseScale: number;
  /** Whip-blur radius in px, peaking mid-gap at every clip boundary (0 without whipBlur). */
  whip: number;
  /** Cut-flash intensity 0..1 (the white strobe draws at flash * 0.5 alpha). */
  flash: number;
};

/** Reel.tsx's composition-signature block for one output frame. `starts` = clipStartFrames(plan). */
export function signatureFrameState(
  sig: ReelSignature,
  frame: number,
  seed: number,
  starts: readonly number[],
  gaps: readonly PlannedGap[],
): SignatureFrameState {
  const weaveX = sig.weave ? Math.sin(frame * 0.55 + seed) * sig.weave : 0;
  const weaveY = sig.weave
    ? Math.cos(frame * 0.43 + seed * 1.3) * sig.weave
    : 0;
  const pulseScale = sig.pulse ? 1 + Math.sin(frame * 0.6) * sig.pulse : 1;

  let whip = 0;
  if (sig.whipBlur) {
    for (let i = 1; i < starts.length; i++) {
      const g = gaps[i - 1]?.durationInFrames ?? 0;
      if (g <= 0) continue;
      const d = frame - starts[i];
      if (d >= 0 && d <= g)
        whip = Math.max(whip, 9 * (1 - Math.abs(d - g / 2) / (g / 2)));
    }
  }

  let flash = 0;
  if (sig.flashOnCut) {
    const FL = 3;
    for (let i = 1; i < starts.length; i++) {
      const d = frame - starts[i];
      if (d >= -1 && d <= FL) flash = Math.max(flash, 1 - Math.abs(d) / FL);
    }
  }

  return { weaveX, weaveY, pulseScale, whip, flash };
}
