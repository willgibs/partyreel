import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BLOG_LIBRARY_LINE,
  BLOG_TAG_IDS,
  BLOG_TAGS,
  audienceTags,
  getBlogTag,
  isBlogTagId,
} from "@/lib/content/blog-tags";

describe("the blog tag registry", () => {
  it("is exactly the six ruled tags, audiences then purposes", () => {
    expect(BLOG_TAG_IDS).toEqual([
      "weddings",
      "parties",
      "corporate",
      "how-to",
      "compared",
      "product",
    ]);
    expect(BLOG_TAGS.map((t) => t.kind)).toEqual([
      "audience",
      "audience",
      "audience",
      "purpose",
      "purpose",
      "purpose",
    ]);
  });

  it("has unique, lowercase-hyphen ids and unique labels", () => {
    const ids = BLOG_TAGS.map((t) => t.id);
    const labels = BLOG_TAGS.map((t) => t.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });

  it("keeps descriptions to one line (≤ 80 chars), em-dash free, and never 'night'", () => {
    for (const line of [...BLOG_TAGS.map((t) => t.description), BLOG_LIBRARY_LINE]) {
      expect(line.length, line).toBeLessThanOrEqual(80);
      expect(line, line).not.toContain("—");
      expect(line.toLowerCase(), line).not.toMatch(/\bnight\b/);
    }
  });

  it("resolves ids and rejects strangers", () => {
    expect(isBlogTagId("how-to")).toBe(true);
    expect(isBlogTagId("highlight-reel")).toBe(false);
    expect(getBlogTag("compared").label).toBe("Compared");
    expect(audienceTags(["how-to", "weddings"])).toEqual(["weddings"]);
    expect(audienceTags(["how-to", "product"])).toEqual([]);
  });

  it("★ imports nothing (it is reached by the client index island)", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/content/blog-tags.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/^import /m);
  });
});
