/**
 * THE PICK, AS REAL CSS (round six, the catalog, 2026-09-16; the machinery is
 * round two's `apply.ts`, cut to one block).
 *
 * A palette board hands the site a token block. This board's candidates are
 * PLACES TO GET PHOTOGRAPHS, so what it hands the site is the photographs: a
 * stylesheet that replaces every frame whose provenance we cannot state with a
 * frame from the picked catalogue, on the real pages, at the real sizes.
 *
 * ★ THE SELECTORS ARE THE PRODUCTION FILE NAMES, not a stage class. Every still
 * is `public/marketing/img/mkt-<id>-01.jpg`, and next/image keeps that name
 * inside its optimizer query (`?url=%2Fmarketing%2Fimg%2Fmkt-wedding-golden-01.jpg`),
 * so ONE substring selector catches the frame in both forms on every surface it
 * appears on: the blog card, the footer strip, the nav panel, a feature mock.
 *
 * ★ `content` ON AN <img> IS A CHROME AND SAFARI BEHAVIOUR. Replacing the
 * content of a replaced element is how a stylesheet can swap a photograph
 * without touching a component; Firefox ignores it and the page simply shows
 * today's frame, which is a harmless failure and worth knowing before a walk.
 * Will reviews in Chrome.
 *
 * ★ THE SWAP NEVER MOVES A CROP, AND NEITHER WILL THE REAL FIX. `content`
 * replaces the image and leaves `object-position` alone, and the blog derives
 * that position from the SLUG, so a frontmatter edit will not move it either: a
 * candidate lands at the post's own rung of the crop ladder both on this walk
 * and after the wiring.
 *
 * ★ AND THE FRAME IS THE SOURCE'S OWN URL, HOTLINKED. The browser fetches it
 * from the source's CDN exactly as the board's own plates do, so applying a
 * block still copies nothing paid into our tree or onto our infrastructure.
 *
 * Nothing here ships. A wiring round changes files and manifest entries, not
 * CSS.
 */

import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

import { sheetFor } from "./sources";
import { shownVerticalFor } from "./vertical-map";

/** Every marketing still, plus the two reel posters, by their real file names. */
const ALL_FRAMES = [
  'img[src*="mkt-"]',
  'img[src*="hero-candidate-0"]',
  'video[poster*="hero-candidate-0"]',
].join(",\n");

/**
 * THE EXPOSURE, which is what Apply offers while nothing is picked. Outline
 * every frame whose provenance we cannot state and drain the colour out of it.
 * Bible 1 says the media is the colour, so a site walked with this on is the
 * site with everything we cannot name taken out of it: the argument in one
 * glance rather than in a paragraph.
 */
export const EXPOSURE_CSS = `/* media-kit: every frame with no provenance, outlined and drained */
${ALL_FRAMES},
video[src*="/marketing/reels/"] {
  outline: 2px solid oklch(0.58 0.21 25);
  outline-offset: -2px;
  filter: grayscale(1) contrast(1.04);
}`;

/** One id's replacement, or null when the source cannot draw its kind of event. */
export function frameForId(sourceId: string, id: string): string | null {
  const vertical = shownVerticalFor(sourceId, id);
  if (!vertical) return null;
  const frames = sheetFor(sourceId, vertical)?.frames ?? [];
  if (frames.length === 0) return null;
  // Stable and distinct within a kind of event: the nth still of that kind
  // takes the nth frame, so two ids never land on one photograph and the same
  // pick always produces the same page.
  const peers = MARKETING_IMAGES.filter(
    (m) => shownVerticalFor(sourceId, m.id) === vertical,
  ).map((m) => m.id);
  const at = Math.max(0, peers.indexOf(id));
  return frames[at % frames.length]?.thumb ?? null;
}

/** The picked place, as the block that dresses every marketing surface. */
export function swapCss(sourceId: string): string {
  const rules = MARKETING_IMAGES.map((image) => {
    const url = frameForId(sourceId, image.id);
    return url
      ? `img[src*="mkt-${image.id}-01"] { content: url("${url}"); }`
      : null;
  }).filter((r): r is string => r !== null);
  if (rules.length === 0) return "";
  return `/* media-kit: every marketing still, from ${sourceId} */\n${rules.join("\n")}`;
}

/** How many of the stills a place can actually dress. */
export function swapCoverage(sourceId: string): number {
  return MARKETING_IMAGES.filter((m) => frameForId(sourceId, m.id) !== null)
    .length;
}
