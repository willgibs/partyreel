import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * BLOG COVER RESOLUTION — the one place a post's art is decided.
 *
 * CLIENT-SAFE ON PURPOSE (no `node:fs`, no `collection.ts`): the design-lab fixture and any client
 * island need the exact production resolver, and `blog.ts` cannot cross a "use client" boundary.
 *
 * ★ THE INVARIANT IS STABILITY, NOT JUST DETERMINISM. A cover must never change under an already
 * published article. That rules out the obvious "walk the post list and hand out unused images"
 * approach: `getAllPosts()` is date-sorted, so a NEW post claims a slot and silently re-skins an
 * older one. Everything here is therefore a pure function of the SLUG alone — no post list, no
 * index, no manifest order.
 *
 * The pool is pinned HERE rather than read off MARKETING_IMAGES because the manifest's own header
 * says Will's final media lands as a wholesale swap; if the pool were the manifest, that swap would
 * reshuffle every published cover. A test asserts every pinned id still resolves, so a swap fails
 * loudly instead of silently. Landscape only: `wedding-petals` is the manifest's lone portrait and
 * would crop badly in a fixed-aspect plate. It stays legal as an EXPLICIT `cover:`.
 */

export const BLOG_FALLBACK_COVER_IDS = [
  "wedding-golden",
  "party-balloons",
  "festival-crowd",
  "reception-table",
  "concert-confetti",
  "wedding-toast",
  "party-dj",
  "wedding-arch",
  "festival-lights",
  "reception-hall",
  "wedding-rings",
] as const;

/**
 * Crop ladder. The pool is 11 images but a blog outgrows that fast, so the SAME source is re-cropped
 * to read as a different plate: at a letterbox aspect a 25%-left slice and a 75%-right slice of one
 * photo share almost no content. 11 x 6 = 66 distinguishable plates for zero asset cost, which is
 * the actual answer to "we only have a dozen licensed images". Vertical stays near center so faces
 * survive the crop.
 */
const CROP_LADDER = [
  "22% 45%",
  "38% 50%",
  "50% 42%",
  "62% 50%",
  "78% 45%",
  "50% 55%",
] as const;

/** FNV-1a (32-bit). Small, dependency-free, and well spread over short ASCII slugs. */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export type BlogCover = {
  /** The manifest id the art came from (explicit frontmatter, or the derived fallback). */
  imageId: string;
  src: string;
  width: number;
  height: number;
  /** The manifest's honest content description; the alt text when the cover is not decorative. */
  subject: string;
  /** CSS object-position for the crop. Pair with object-cover. */
  objectPosition: string;
  /** Whether the post declared its own cover (art direction) or this is the derived fallback. */
  derived: boolean;
};

/**
 * Resolve a post's cover. `explicitId` is the frontmatter `cover` (already schema-validated against
 * the manifest, so an unknown id cannot reach here). The CROP is always derived, including for an
 * explicit cover, so every plate gets a considered position rather than a default center crop.
 */
export function coverFor(slug: string, explicitId?: string): BlogCover {
  const imageId =
    explicitId ??
    BLOG_FALLBACK_COVER_IDS[hash(slug) % BLOG_FALLBACK_COVER_IDS.length];
  const image = marketingImage(imageId);
  // A second, differently-seeded hash: reusing the first would lock crop to image, so every post
  // sharing a source would also share its slice, which is the repetition we are trying to break.
  const objectPosition =
    CROP_LADDER[hash(`${slug}:crop`) % CROP_LADDER.length];
  return {
    imageId,
    src: image.src,
    width: image.width,
    height: image.height,
    subject: image.subject,
    objectPosition,
    derived: explicitId === undefined,
  };
}
