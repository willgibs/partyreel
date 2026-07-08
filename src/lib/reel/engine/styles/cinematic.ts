// CINEMATIC (styleId "classic"), the first canvas-ported style. The actual renderer is the generic
// mood draw in ./mood.ts (it reads everything from props.theme); this file is the thin binding the
// extraction note in the original slice promised once a second mood landed.
//
// What Cinematic exercises: freezeGo cover Ken-Burns, spring fades, cover-vs-fit with the theme
// backdrop + framed drop-shadow, letterbox + vignette, the grade via ctx.filter (probed; skipped +
// reported where unsupported, e.g. Safari, until the WebGL grade slice).
//
// Conscious parity deltas (visible only under a magnifier, accepted for v1):
// - the framed fit photo's drop-shadow uses ctx.shadow* (device-space blur/offset) instead of CSS
//   drop-shadow (transform-space); at the damped fit scales (~1.0x) the difference is subpixel.
// - the blur backdrop's brightness(0.55) falls back to a 45% black overlay when ctx.filter is
//   unavailable (multiplicative vs composited darkening; close, and only on non-filter browsers).

import type { ReelStyle } from "../contract";
import { moodStyle } from "./mood";

export const CINEMATIC: ReelStyle = moodStyle("classic");
