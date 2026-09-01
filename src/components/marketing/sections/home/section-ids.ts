/**
 * THE RATIFIED HOME ORDER (Will, 2026-08-25: the IA's album section split into
 * album + curation, pricing moved after the reel; 2026-08-26 chapter ruling:
 * privacy moves up beside curation so the paper chapter is contiguous;
 * 2026-09-01 chapter-pacing ruling: two quieter guest-side sections land above
 * the live demo so chapter 1 winds down before its anchor instead of
 * escalating into the paper cut). This
 * module is deliberately PURE (no component imports) so the Vitest pin can
 * hold the sequence without dragging the section tree's env-reading imports
 * (lib/demo.ts) into the test runner; index.ts derives its component pairing
 * from THIS array, so the pinned order IS the rendered order and the Record
 * type makes an id/component mismatch a type error.
 */
export const HOME_SECTION_IDS = [
  "cinema-hero",
  "trust-strip",
  "decomposition",
  "film-strip",
  "no-app",
  "full-quality",
  "live-demo",
  "album",
  "curation",
  "privacy",
  "reel-teaser",
  "events-teaser",
  "pricing-teaser",
  "faq",
  "cinema-close",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

/**
 * THE CHAPTER MAP (the 2026-08-26 mixed-theme ruling): each section's surface
 * register. Cinema = the event (dark, media pops); paper = the morning after /
 * the host's desk (light: the album that arrived, deciding, trust). The page
 * renders CONSECUTIVE paper ids inside one <PaperChapter> — the theme switch
 * is a chapter CUT introducing a concept group, never stripe alternation, so
 * the shape here is 7 dark, 3 paper, 5 dark. cinema-hero and cinema-close are
 * bookends by doctrine (the page opens and closes in the cinema; the test
 * pins it).
 */
export type HomeSurface = "cinema" | "paper";

export const HOME_SECTION_SURFACE: Record<HomeSectionId, HomeSurface> = {
  "cinema-hero": "cinema",
  "trust-strip": "cinema",
  decomposition: "cinema",
  "film-strip": "cinema",
  "no-app": "cinema",
  "full-quality": "cinema",
  "live-demo": "cinema",
  album: "paper",
  curation: "paper",
  privacy: "paper",
  "reel-teaser": "cinema",
  "events-teaser": "cinema",
  "pricing-teaser": "cinema",
  faq: "cinema",
  "cinema-close": "cinema",
};

/** The pinned order grouped into consecutive same-surface runs (pure; the
 *  page maps this, and the test proves it flattens back to the pinned order
 *  byte-for-byte). */
export function homeSurfaceChunks(): {
  surface: HomeSurface;
  ids: HomeSectionId[];
}[] {
  const chunks: { surface: HomeSurface; ids: HomeSectionId[] }[] = [];
  for (const id of HOME_SECTION_IDS) {
    const surface = HOME_SECTION_SURFACE[id];
    const last = chunks[chunks.length - 1];
    if (last && last.surface === surface) last.ids.push(id);
    else chunks.push({ surface, ids: [id] });
  }
  return chunks;
}
