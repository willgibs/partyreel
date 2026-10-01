import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getAllArticles, HELP_CATEGORIES } from "@/lib/content/help";

/**
 * THE READING ORDER IS THE MAP (content/help/AUTHORING.md: "Follow the map; it is the prev/next
 * reading order"). The articles' `order` fields are what the shelf, the prev/next cards and the llms
 * file's first four read, and the map is what an author reads, so a bump to one without the other
 * leaves the next author sorting by a lie. This holds the two together, shelf by shelf, and the one
 * adjacency the order exists for: a photo first sits beside an email first, the door's two steps.
 */
const AUTHORING = readFileSync(
  join(process.cwd(), "content/help/AUTHORING.md"),
  "utf8",
);

/** The map's shelves, in its order: each `### NN Title` and the slugs numbered under it. */
function mapShelves(): string[][] {
  const map = AUTHORING.split("## The library map")[1]?.split(/\n## /)[0] ?? "";
  return map
    .split(/\n### /)
    .slice(1)
    .map((shelf) =>
      [...shelf.matchAll(/^\d+\. ([a-z0-9-]+)$/gm)].map((m) => m[1]),
    );
}

const articles = getAllArticles();
const shelfOf = (category: string) =>
  articles
    .filter((article) => article.frontmatter.category === category)
    .map((article) => article.slug);

describe("the help library map", () => {
  it("lists every shelf, in the registry's lifecycle order", () => {
    expect(mapShelves()).toHaveLength(HELP_CATEGORIES.length);
  });

  it("names every article of a shelf in the order its `order` fields give", () => {
    const shelves = mapShelves();
    HELP_CATEGORIES.forEach((category, i) => {
      expect(shelves[i], category.slug).toEqual(shelfOf(category.slug));
    });
  });

  it("a photo first sits beside an email first, the door's two steps", () => {
    const privacy = shelfOf("privacy-and-safety");
    expect(privacy.indexOf("require-an-upload-to-view-explained")).toBe(
      privacy.indexOf("require-verified-emails-explained") + 1,
    );
  });
});
