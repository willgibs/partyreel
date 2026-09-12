import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BLOG_TAGS,
  audienceTags,
  getBlogTag,
  isBlogTagId,
} from "@/lib/content/blog-tags";

// The tag set itself and the description lengths were pinned here until the
// "less is more" reset (2026-09-12): the registry is its own list, and copy
// is not a test.
describe("the blog tag registry", () => {
  it("has unique, lowercase-hyphen ids and unique labels", () => {
    const ids = BLOG_TAGS.map((t) => t.id);
    const labels = BLOG_TAGS.map((t) => t.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
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
