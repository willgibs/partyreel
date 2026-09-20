/**
 * THE ARRIVAL GLOW'S LIFE, in one place (Will, `live=land`, 2026-09-20).
 *
 * Two things have to agree about it and neither can see the other: the sheet
 * that fades the light (`components/guest/live-gallery.css`) and the state that
 * holds the id while it fades (`live-gallery.tsx`). Held too long, a tile keeps
 * a `data-arrived` attribute with nothing painting under it, so the NEXT thing
 * that re-renders the tile replays the animation on a photograph that landed
 * minutes ago; held too short, the light is cut mid-fade.
 *
 * So the number lives HERE, in a pure module, and the sheet reads it: the album
 * box writes it out as `--arrival-glow-ms` and the keyframe's duration is
 * `var(--arrival-glow-ms)`. One edit moves both, and there is no second copy to
 * drift.
 *
 * Two seconds: long enough for a guest whose eye is somewhere else on a busy
 * album to catch it, short enough that a lively party is not a page of blinking
 * rims. It sits deliberately outside bible 12's ~300ms interaction ceiling,
 * which governs a control answering a tap; this is an ambient mark on content
 * that arrived by itself, the same class of beat as the ~2.5s landed check.
 */
export const ARRIVAL_GLOW_MS = 2000;
