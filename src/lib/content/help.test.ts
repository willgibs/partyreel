import { describe, expect, it } from "vitest";

import { HELP_REDIRECTS } from "@/lib/content/help-redirects";
import {
  audienceLabel,
  defaultAudience,
  extractHeadings,
  getAllArticles,
  getAllSlugs,
  getHelpFacts,
  getRelatedArticles,
  getSearchIndex,
  getStartHereArticles,
  HELP_AUDIENCES,
  HELP_CATEGORIES,
  type HelpCategorySlug,
  HELP_DESCRIPTION_MAX,
  HELP_QUICK_LINKS,
  helpFrontmatterSchema,
  resolveAudience,
  scoreRelated,
  slugify,
  START_HERE_SLUGS,
} from "@/lib/content/help";

const articles = getAllArticles();
const categorySlugs = HELP_CATEGORIES.map((category) => category.slug);

describe("help content integrity", () => {
  it("loads articles", () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it("every article has valid, complete frontmatter", () => {
    for (const article of articles) {
      // getAllArticles() already .parse()s (a bad article fails the build); we
      // re-assert here to document the contract + catch length/format regressions.
      expect(helpFrontmatterSchema.safeParse(article.frontmatter).success).toBe(
        true,
      );
      expect(article.frontmatter.title.trim()).not.toBe("");
      expect(article.frontmatter.description.trim()).not.toBe("");
      expect(article.frontmatter.description.length).toBeLessThanOrEqual(
        HELP_DESCRIPTION_MAX,
      );
      expect(categorySlugs).toContain(article.frontmatter.category);
      expect(Number.isInteger(article.frontmatter.order)).toBe(true);
      expect(article.frontmatter.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("has unique slugs", () => {
    const slugs = articles.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every category has at least one article", () => {
    for (const slug of categorySlugs) {
      expect(
        articles.some((article) => article.frontmatter.category === slug),
      ).toBe(true);
    }
  });

  // ── The help-catalog round (2026-09-01): the catalog's own contracts ──────
  it("audience derives from the category unless set; plans and action default", () => {
    for (const article of articles) {
      expect(["host", "guest", "both"]).toContain(resolveAudience(article));
      expect(Array.isArray(article.frontmatter.plans)).toBe(true);
      if (article.frontmatter.action) {
        expect(article.frontmatter.action.href.startsWith("/")).toBe(true);
      }
    }
    const guestLane = articles.find(
      (a) =>
        a.frontmatter.category === "guest-experience" &&
        !a.frontmatter.audience,
    );
    if (guestLane) expect(resolveAudience(guestLane)).toBe("guest");
  });

  // ★ THE AUDIENCE IS SET ON PURPOSE (help-words): `defaultAudience` said host for the account and the highlight reel
  // while most of their articles overrode it to both, so the default contradicted its own shelf and a new article
  // there came out host-only by accident. A shelf's default is now what most of its articles are, and an article
  // names an audience only where it differs, so every `audience:` in a frontmatter is a choice somebody made.
  it("★ a category's default is what most of its articles help, and an article never restates it", () => {
    for (const category of HELP_CATEGORIES) {
      const shelf = articles.filter(
        (a) => a.frontmatter.category === category.slug,
      );
      const count = (audience: string) =>
        shelf.filter((a) => resolveAudience(a) === audience).length;
      const most = Math.max(...HELP_AUDIENCES.map(count));
      expect(
        count(defaultAudience(category.slug)),
        `${category.slug}: its default is not what most of its articles are`,
      ).toBe(most);
    }
    for (const article of articles) {
      expect(
        article.frontmatter.audience,
        `${article.slug} sets the audience its category already gives it`,
      ).not.toBe(defaultAudience(article.frontmatter.category));
    }
  });

  it("the tag names only what the shelf does not already say", () => {
    const on = (
      category: HelpCategorySlug,
      audience?: "host" | "guest" | "both",
    ) => audienceLabel({ frontmatter: { category, audience } });
    expect(on("account-and-profile")).toBeNull();
    expect(on("account-and-profile", "host")).toBe("For hosts");
    expect(on("event-album")).toBeNull();
    expect(on("event-album", "both")).toBe("Hosts & guests");
    expect(on("guest-experience", "both")).toBe("Hosts & guests");
  });

  it("## headings are plain text and never sit inside a Callout", () => {
    for (const article of articles) {
      let inCallout = false;
      for (const line of article.body.split("\n")) {
        if (/^\s*<Callout/.test(line)) inCallout = true;
        if (/^\s*<\/Callout>/.test(line)) inCallout = false;
        const heading = /^##\s+(.+?)\s*$/.exec(line);
        if (!heading) continue;
        expect(
          inCallout,
          `${article.slug}: "## ${heading[1]}" is inside a Callout`,
        ).toBe(false);
        expect(
          /[*_`<\[]/.test(heading[1]),
          `${article.slug}: "## ${heading[1]}" carries formatting`,
        ).toBe(false);
      }
    }
  });

  it("every internal help link resolves (slug, section anchor, or category)", () => {
    const bySlug = new Map(articles.map((a) => [a.slug, a]));
    const categories = new Set<string>(categorySlugs);
    let checked = 0;
    for (const article of articles) {
      for (const match of article.body.matchAll(
        /\]\(\/help(?:\/([a-z0-9-]+))?(?:#([a-z0-9-]+))?\)/g,
      )) {
        checked += 1;
        const [, slug, anchor] = match;
        if (slug) {
          const target = bySlug.get(slug);
          expect(target, `${article.slug} links /help/${slug}`).toBeDefined();
          if (anchor && target) {
            expect(
              extractHeadings(target.body).some((h) => h.id === anchor),
              `${article.slug} links /help/${slug}#${anchor}`,
            ).toBe(true);
          }
        } else if (anchor) {
          expect(
            categories.has(anchor),
            `${article.slug} links /help#${anchor}`,
          ).toBe(true);
        }
      }
    }
    // Pinned for non-emptiness: a regex that matches nothing proves nothing.
    expect(checked).toBeGreaterThan(20);
  });

  it("every article has at least one related article (no dead ends)", () => {
    // A stricter scorer once emptied the section on ten articles; the
    // pagination cards are not a substitute, so the fallback is pinned.
    for (const article of articles) {
      const siblings = articles.filter(
        (a) => a.frontmatter.category === article.frontmatter.category,
      );
      const at = siblings.findIndex((a) => a.slug === article.slug);
      const neighbors = [siblings[at - 1]?.slug, siblings[at + 1]?.slug].filter(
        (s): s is string => Boolean(s),
      );
      expect(
        getRelatedArticles(article, 3, neighbors).length,
        `${article.slug} has no related articles`,
      ).toBeGreaterThan(0);
    }
  });

  it("no article carries a JS-expression placeholder (blockJS would strip it)", () => {
    for (const article of articles) {
      expect(
        /\{[a-zA-Z]+\}/.test(article.body),
        `${article.slug} has a {placeholder}`,
      ).toBe(false);
    }
  });
});

describe("curated index surfaces (R6)", () => {
  // The old page-local POPULAR_SLUGS array silently dropped a card when a slug
  // was renamed; these pins make a dead curated slug a test failure instead.
  it("every Start-here slug resolves, in curated order", () => {
    const resolved = getStartHereArticles();
    expect(resolved.map((article) => article.slug)).toEqual([
      ...START_HERE_SLUGS,
    ]);
  });

  it("every quick-link and numbers-strip href resolves to a real article", () => {
    const slugs = new Set(getAllSlugs());
    const hrefs = [
      ...HELP_QUICK_LINKS.map((link) => link.href),
      ...getHelpFacts().map((fact) => fact.href),
    ];
    for (const href of hrefs) {
      expect(href.startsWith("/help/")).toBe(true);
      expect(slugs.has(href.slice("/help/".length))).toBe(true);
    }
  });

  it("numbers-strip values render from the real constants (never empty)", () => {
    for (const fact of getHelpFacts()) {
      expect(fact.label.trim()).not.toBe("");
      expect(fact.value.trim()).not.toBe("");
    }
  });

  it("the search index carries heading anchors for the palette", () => {
    const index = getSearchIndex();
    const howItWorks = index.find((i) => i.slug === "how-partyreel-works");
    expect(howItWorks).toBeDefined();
    expect(howItWorks!.headings.length).toBeGreaterThanOrEqual(2);
    for (const heading of howItWorks!.headings) {
      expect(heading.id).toMatch(/^[a-z0-9-]+$/);
      expect(heading.text.trim()).not.toBe("");
    }
  });
});

describe("scoreRelated", () => {
  it("shared keywords outweigh mere same-category membership", () => {
    const self = { category: "a", keywords: ["zip", "download"] };
    const sibling = { category: "a", keywords: ["cover"] };
    const crossMatch = { category: "b", keywords: ["zip"] };
    expect(scoreRelated(self, crossMatch)).toBeGreaterThan(
      scoreRelated(self, sibling),
    );
  });

  it("is case-insensitive on keywords and 0 for the unrelated", () => {
    expect(
      scoreRelated(
        { category: "a", keywords: ["Zip"] },
        { category: "b", keywords: ["zip"] },
      ),
    ).toBe(2);
    expect(
      scoreRelated(
        { category: "a", keywords: [] },
        { category: "b", keywords: ["zip"] },
      ),
    ).toBe(0);
  });
});

describe("slugify / extractHeadings", () => {
  it("slugifies headings to stable anchor ids", () => {
    expect(slugify("Pro — for people who host often")).toBe(
      "pro-for-people-who-host-often",
    );
    expect(slugify("What's an Event Pass?")).toBe("whats-an-event-pass");
  });

  it("extracts h2 headings (not h3) with matching ids", () => {
    const headings = extractHeadings(
      "## The short version\n\ntext\n\n### A subsection\n\n## Where to next\n",
    );
    expect(headings).toEqual([
      { id: "the-short-version", text: "The short version" },
      { id: "where-to-next", text: "Where to next" },
    ]);
  });

  it("ignores ## inside fenced code", () => {
    const headings = extractHeadings("## Real\n\n```\n## not a heading\n```\n");
    expect(headings.map((heading) => heading.text)).toEqual(["Real"]);
  });
});

describe("retired slugs", () => {
  it("every redirect lands on a live article, and no retired slug is still live", () => {
    const live = new Set(getAllSlugs());
    for (const { from, to } of HELP_REDIRECTS) {
      expect(
        live.has(to),
        `${from} -> ${to} (target is not a live article)`,
      ).toBe(true);
      expect(live.has(from), `${from} is still a live article`).toBe(false);
    }
  });
});

describe("troubleshooting's own rung (help-center r1 `dead-end=rung`)", () => {
  // A fix article ends on the calm, working version of the same act, where every other category
  // ends on its marketing rung: so every fix carries one, nothing else does, and each lands on a
  // published article (and heading) that is not itself a fix.
  const bySlug = new Map(articles.map((article) => [article.slug, article]));

  it("every troubleshooting article carries one, and no other article does", () => {
    for (const article of articles) {
      const fix = article.frontmatter.category === "troubleshooting";
      expect(
        Boolean(article.frontmatter.rung),
        `${article.slug}: ${fix ? "a fix with no rung" : "a rung outside troubleshooting"}`,
      ).toBe(fix);
    }
  });

  it("lands on a published article outside troubleshooting, at a heading that exists", () => {
    for (const article of articles) {
      const rung = article.frontmatter.rung;
      if (!rung) continue;
      const [path, anchor] = rung.href.split("#");
      expect(path.startsWith("/help/"), `${article.slug}: ${rung.href}`).toBe(
        true,
      );
      const target = bySlug.get(path.slice("/help/".length));
      expect(
        target,
        `${article.slug}: ${rung.href} is not an article`,
      ).toBeDefined();
      expect(target!.slug).not.toBe(article.slug);
      expect(
        target!.frontmatter.category,
        `${article.slug}: the calm version is never another fix`,
      ).not.toBe("troubleshooting");
      if (anchor) {
        expect(
          extractHeadings(target!.body).map((h) => h.id),
          `${article.slug}: ${rung.href} names no heading`,
        ).toContain(anchor);
      }
    }
  });

  it("speaks in the pointer's voice: an invitation, never a count", () => {
    for (const article of articles) {
      const rung = article.frontmatter.rung;
      if (!rung) continue;
      expect(rung.label, article.slug).toMatch(/^See /);
      expect(rung.label, article.slug).not.toMatch(/\d/);
    }
  });
});
