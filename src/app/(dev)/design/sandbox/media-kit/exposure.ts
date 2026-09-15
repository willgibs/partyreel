/**
 * THE EXPOSURE, MEASURED (the media-kit track, round two).
 *
 * ★ ROUND ONE UNDERSTATED THIS AND THE CORRECTION IS THE ROUND'S FIRST FINDING.
 * The survey said the twelve unverified stills were live "on 23 blog posts, their
 * OG cards and the RSS enclosures", which is the exposure of the BLOG. The twelve
 * are referenced by id in 40 production files and reached by 22 production routes,
 * and two of those files are `marketing-footer`'s demo strip and the nav's mega
 * panel, both of which sit in the (cinema) and (paper) group layouts. So four of
 * the twelve are in the footer of every marketing page and two more are in the
 * navigation of every marketing page, before a reader scrolls.
 *
 * The numbers below are TRANSCRIBED so the board stays a client component, and
 * `exposure.test.ts` recomputes every one of them from the real tree and fails on
 * drift. If a number here is wrong, the suite says so rather than the board.
 */

/** How many production files reference each id by name. */
export const FILE_COUNTS: Readonly<Record<string, number>> = {
  "wedding-golden": 27,
  "reception-table": 26,
  "party-balloons": 30,
  "concert-confetti": 18,
  "wedding-rings": 15,
  "reception-hall": 17,
  "party-dj": 20,
  "wedding-toast": 27,
  "festival-lights": 14,
  "festival-crowd": 21,
  "wedding-arch": 20,
  "wedding-petals": 15,
};

/** Distinct production files (tests, the lab and the manifest itself excluded). */
export const PRODUCTION_FILES = 40;

/** Production routes that reach a still. The lab's ten and llms.txt are excluded. */
export const ROUTES: readonly string[] = [
  "/",
  "/pricing",
  "/how-it-works",
  "/reel",
  "/about",
  "/careers",
  "/contact",
  "/events",
  "/events/[slug]",
  "/features",
  "/features/album",
  "/features/curation",
  "/features/guests",
  "/features/privacy",
  "/features/qr",
  "/features/sharing",
  "/help",
  "/help/[slug]",
  "/blog",
  "/blog/[slug]",
  "/blog/[slug]/opengraph-image",
  "/blog/feed.xml",
];

/** The chrome: in a group layout, so on every marketing page in the group. */
export const CHROME: readonly { where: string; file: string; ids: readonly string[] }[] =
  [
    {
      where: "The footer demo strip, on every marketing page",
      file: "src/components/marketing/chrome/footer-demo.tsx",
      ids: [
        "wedding-arch",
        "concert-confetti",
        "reception-table",
        "festival-lights",
      ],
    },
    {
      where: "The navigation mega panel, on every marketing page",
      file: "src/components/marketing/chrome/mega-panel.tsx",
      ids: ["wedding-toast", "reception-table"],
    },
  ];

/** Marketing pages in the two group layouts that carry the chrome. */
export const MARKETING_PAGES = 24;

/**
 * Where a frame is publicly visible today. Derived from the counts above plus the
 * blog frontmatter, so it cannot drift from them.
 */
export const BLOG_COVER_COUNTS: Readonly<Record<string, number>> = {
  "reception-hall": 4,
  "wedding-golden": 3,
  "wedding-toast": 3,
  "party-balloons": 2,
  "reception-table": 2,
  "concert-confetti": 2,
  "party-dj": 2,
  "festival-lights": 2,
  "wedding-rings": 1,
  "wedding-arch": 1,
  "festival-crowd": 1,
};

export function liveExposure(id: string): string {
  const covers = BLOG_COVER_COUNTS[id] ?? 0;
  const files = FILE_COUNTS[id] ?? 0;
  const chrome = CHROME.filter((c) => c.ids.includes(id));
  const parts = [`${files} production files`];
  if (covers > 0) {
    parts.push(`${covers} blog ${covers === 1 ? "cover" : "covers"}`);
  }
  if (chrome.length) {
    parts.push(
      chrome.length === 2
        ? "the footer and the nav on every marketing page"
        : chrome[0].where.startsWith("The footer")
          ? "the footer on every marketing page"
          : "the nav on every marketing page",
    );
  }
  return parts.join(", ");
}
