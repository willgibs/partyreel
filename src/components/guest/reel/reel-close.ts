/**
 * THE REEL'S CLOSE, WHEREVER IT STANDS: the view's own (`live-reel-view.tsx`) and the page's curtain's, which stands
 * the reel's first photograph before the view has arrived (`event-experience-curtain.tsx`, guest-moments r1's
 * `opening=still`). The two are one object on one spot, so the view landing over the curtain moves nothing: the round
 * glass key, top right under the safe area. Plain class strings in their own module, so the page's shell can draw the
 * curtain's without importing the view (the lazy chunk carries the whole canvas engine).
 */

/** Where Close stands over the reel: top right, under the safe area. */
export const REEL_CLOSE_SPOT =
  "absolute top-[calc(0.75rem+env(safe-area-inset-top))] right-3 z-30";

/** The reel's round key (Close and every control of the dock): white on the glass, the halo, a press. */
export const REEL_KEY =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-white outline-none transition-[transform,background-color] duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100 focus-halo";

/** A key's hover, only where a pointer can hover. */
export const REEL_KEY_HOVER =
  "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/12";

/** The top edge's legibility under Close: a whisper of dark over the picture. */
export const REEL_TOP_WHISPER =
  "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent";
