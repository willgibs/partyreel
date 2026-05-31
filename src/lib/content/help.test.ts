import { describe, expect, it } from "vitest";

import {
  extractHeadings,
  getAllArticles,
  HELP_CATEGORIES,
  helpFrontmatterSchema,
  slugify,
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
      expect(article.frontmatter.description.length).toBeLessThanOrEqual(160);
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
