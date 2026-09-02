/**
 * THE HEADING CONTRACT, as an import-free leaf. Every anchor the scroll-spy can target (body h2/h3
 * from the MDX map, the blog's Questions appendix) shares one scroll margin, and the ToC island is
 * "use client": this module has NO imports so a client component can reach these constants without
 * dragging mdx-components.tsx (which reaches node:fs through the help loader) into a bundle.
 */

/** Clears the fixed marketing header on anchor jumps; keyed to the header's own height variable so a
 *  header retune never desyncs it (the old hardcoded scroll-mt-24 silently coupled to h-16). */
export const HEADING_SCROLL_MT =
  "scroll-mt-[calc(var(--mkt-header-h,4rem)+1rem)]";

/** The blog's FAQ appendix anchor; the article page appends it to the ToC when a post carries `faq`. */
export const ARTICLE_FAQ_ID = "questions";
export const ARTICLE_FAQ_HEADING = "Questions";
