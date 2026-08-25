/**
 * THE RATIFIED HOME ORDER (Will, 2026-08-25: the IA's album section split into
 * album + curation, pricing moved after the reel). This module is deliberately
 * PURE (no component imports) so the Vitest pin can hold the sequence without
 * dragging the section tree's env-reading imports (lib/demo.ts) into the test
 * runner; index.ts derives HOME_SECTIONS from THIS array, so the pinned order
 * IS the rendered order and the Record type makes an id/component mismatch a
 * type error.
 */
export const HOME_SECTION_IDS = [
  "cinema-hero",
  "trust-strip",
  "decomposition",
  "film-strip",
  "live-demo",
  "album",
  "curation",
  "reel-teaser",
  "privacy",
  "events-teaser",
  "pricing-teaser",
  "faq",
  "cinema-close",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];
