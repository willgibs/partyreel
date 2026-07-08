// The per-browser export-path decision (Plan A Phase C): client WebCodecs encode vs the Lambda
// fallback. PURE (no mediabunny / DOM) so the gating logic is unit-testable; the composer feeds it
// the async probeEngineSupport() result. Two conditions, both required:
//   - the device can WebCodecs-encode h264 at the reel dimensions (support.canEncode), and
//   - the canvas engine has this style ported (engineSupports; all 14 today, but the seam protects
//     a future style that lands Remotion-first).
// ctx.filter support is deliberately NOT gated on: a Safari without canvas filters still encodes a
// valid reel (grades skip + report), which beats shipping those hosts to the slower Lambda path.

import { engineSupports } from "./registry";

export function shouldClientEncode(
  support: { canEncode: boolean } | null | undefined,
  styleId: string | null | undefined,
): boolean {
  return Boolean(support?.canEncode) && engineSupports(styleId);
}
