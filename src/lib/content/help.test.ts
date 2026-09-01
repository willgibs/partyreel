import { describe, expect, it } from "vitest";

import {
  extractHeadings,
  getAllArticles,
  getAllSlugs,
  getHelpFacts,
  getSearchIndex,
  getStartHereArticles,
  HELP_CATEGORIES,
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
      (a) => a.frontmatter.category === "guest-experience" && !a.frontmatter.audience,
    );
    if (guestLane) expect(resolveAudience(guestLane)).toBe("guest");
  });

  it("## headings are plain text and never sit inside a Callout", () => {
    for (const article of articles) {
      let inCallout = false;
      for (const line of article.body.split("\n")) {
        if (/^\s*<Callout/.test(line)) inCallout = true;
        if (/^\s*<\/Callout>/.test(line)) inCallout = false;
        const heading = /^##\s+(.+?)\s*$/.exec(line);
        if (!heading) continue;
        expect(inCallout, `${article.slug}: "## ${heading[1]}" is inside a Callout`).toBe(false);
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
      for (const match of article.body.matchAll(/\]\(\/help(?:\/([a-z0-9-]+))?(?:#([a-z0-9-]+))?\)/g)) {
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
          expect(categories.has(anchor), `${article.slug} links /help#${anchor}`).toBe(true);
        }
      }
    }
    // Pinned for non-emptiness: a regex that matches nothing proves nothing.
    expect(checked).toBeGreaterThan(20);
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
