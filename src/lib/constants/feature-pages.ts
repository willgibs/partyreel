/**
 * THE FEATURE-PAGES REGISTRY (expansion round, 2026-08-26): the shared identity
 * single-source for the six dedicated feature pages — consumed by the nav panel,
 * the mobile sheet, the /features hub directory, the footer Features column, the
 * sitemap, and each page's own hero. DEEP page content stays in each page's own
 * module (bespoke by design; this file carries only the shared identity layer).
 *
 * Every copy string here is PROVISIONAL (the SECTION_HEADERS pattern): ships as
 * working copy, awaits Will's ruling pass. navDescription is the mega-panel
 * one-liner and must stay short (~45 chars). H1s deliberately do NOT repeat the
 * pages' home-section headers (home teases; the page owns the depth register).
 * No em-dashes (policy); the registry test pins shape + copy hygiene.
 */
export type FeaturePage = {
  slug: string;
  /** Nav panel + footer + hub label. */
  navLabel: string;
  /** The mega-panel one-liner under the label. */
  navDescription: string;
  /** The route H1 (PROVISIONAL). */
  h1: string;
  /** The hero subline (PROVISIONAL). */
  heroSub: string;
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "album",
    navLabel: "The live album",
    navDescription: "Every photo and video, full quality, live.",
    h1: "One album, filling itself.",
    heroSub:
      "Every phone in the room feeds one album, at full quality, while the event is still going.",
  },
  {
    slug: "qr",
    navLabel: "The QR code",
    navDescription: "One scan and everyone's in.",
    h1: "One scan and they're in.",
    heroSub:
      "Style a code that matches the event, put it where people look, and the uploads start.",
  },
  {
    slug: "curation",
    navLabel: "Curation",
    navDescription: "Approve, hide, and shape the album.",
    h1: "Your guests only see the good part.",
    heroSub:
      "Review uploads before they appear, or clean up afterward in one pass. Either way, the album stays yours.",
  },
  {
    slug: "sharing",
    navLabel: "Sharing & downloads",
    navDescription: "One link out, originals for everyone.",
    h1: "Everyone leaves with everything.",
    heroSub:
      "The album is one link, and every photo and video comes back out at the quality it went in.",
  },
  {
    slug: "guests",
    navLabel: "Guests & profiles",
    navDescription: "Names on every photo, profiles to follow.",
    h1: "Made of everyone who was there.",
    heroSub:
      "Every shot is credited, you can see who is in the room, and profiles connect one event to the next.",
  },
  {
    slug: "privacy",
    navLabel: "Privacy & trust",
    navDescription: "Private by default, yours to open up.",
    h1: "Yours, and only as public as you make it.",
    heroSub:
      "Three visibility levels, location data stripped before upload, and storage built to not lose things.",
  },
];

export const FEATURE_PAGE_SLUGS = FEATURE_PAGES.map((page) => page.slug);

/** Lookup that throws on a bad slug so a typo fails at build, never at render
 *  (the marketingImage/requireReel convention). */
export function featurePage(slug: string): FeaturePage {
  const page = FEATURE_PAGES.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown feature page slug: ${slug}`);
  return page;
}
