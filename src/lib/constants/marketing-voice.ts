/**
 * THE marketing voice single-source (Track B). Will's GOLDEN SET: eight lines he ratified
 * verbatim in the voice round (2026-07-08, round 2) that anchor all production copy. The ruled
 * voice around them: warm-host ease x big-event stakes, disciplined by concise clarity; "night"
 * is BANNED as identity language (event/party everywhere); collection value co-leads the reel.
 * A Vitest pin byte-matches these strings, so a rewrite is a deliberate act, never drift.
 *
 * SITE_THESIS is the one grouping-dependent slot: the H1/thesis line the whole site echoes.
 * It fills from Will's grouping pick (G1 Collection-led / G2 Arc-led / G3 Reel-led tempered,
 * the Sitting-0 boards). Until the pick lands it carries G1's line marked PROVISIONAL; the copy
 * FREEZE (not any merge) gates on the ruling.
 */

export const GOLDEN_LINES = {
  thesis: "The whole event, in one place, forever",
  album: "Every photo comes to you first",
  reel: "The whole event, cut down to the highlights",
  pricing: "Start free, upgrade when you host again",
  reelThesis: "Every event ends with a reel",
  liveDemo: "Watch your album fill up",
  arc: "From the first scan to the final cut",
  curation: "Every moment, and you decide what stays",
} as const;

/** "provisional" until Will's grouping pick (then flip to "ruled" + point at the picked line). */
export const SITE_THESIS_STATUS: "provisional" | "ruled" = "provisional";
export const SITE_THESIS: string = GOLDEN_LINES.thesis;

/** The recurring demo CTA line (DemoCtaLink renders it everywhere the demo is offered). */
export const DEMO_CTA_LABEL = "Try the live demo, no signup.";
