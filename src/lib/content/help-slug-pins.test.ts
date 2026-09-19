import { describe, expect, it } from "vitest";

import { getAllSlugs } from "./help";

/**
 * Slugs referenced as PLAIN LITERALS outside this module (client components
 * that must never import the node-only loader, marketing constants, the legal
 * drafts) get pinned here so a help-article rename can't silently strand
 * them. The help-catalog round (2026-09-01) extended the list to EVERY
 * literal referrer, not just the six it started with; the referrer of each
 * slug is named so the sweep is mechanical when one has to move.
 */
const PINNED: Record<string, string> = {
  // `two-doors=one` (Will, 2026-09-19): the Resources mega-panel card now
  // points at /how-it-works, so the chrome links this article from NOWHERE and
  // chrome/mega-panel.tsx leaves this list. features/page.tsx left it earlier
  // and was never swept; the walkthrough's own foot link is the last literal.
  "how-partyreel-works": "how-it-works/spine.tsx",
  "customize-and-share-your-qr": "features/qr/page.tsx",
  "how-guests-join-and-upload": "features/album/page.tsx, constants/contact.ts",
  "storage-plans-and-limits": "features/album/page.tsx",
  "profiles-guest-lists-and-following": "features/guests/page.tsx",
  "your-data-and-deleting-your-account":
    "(paper)/privacy/page.tsx, (paper)/terms/page.tsx",
  "moderate-and-curate-your-album": "features/curation/curation-faq.tsx",
  "how-long-media-is-kept":
    "curation/reversibility.tsx, privacy/report-review.tsx, constants/about.ts",
  "who-can-see-your-event": "privacy/report-review.tsx",
  "download-photos-videos-and-albums":
    "sharing/sharing-faq.tsx, constants/about.ts",
  "reporting-and-safety": "constants/about.ts",
};

describe("help slugs referenced by literal", () => {
  const slugs = new Set(getAllSlugs());
  for (const [slug, referrer] of Object.entries(PINNED)) {
    it(`${slug} exists (linked from ${referrer})`, () => {
      expect(slugs.has(slug)).toBe(true);
    });
  }
});
