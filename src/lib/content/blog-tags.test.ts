import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import {
  BLOG_TAGS,
  type BlogTagId,
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

  it("★ has an audience for every event type, in the nav's order, and no other", () => {
    // The audiences ARE the event types (Conferences files as `corporate`). Trips had none, so a
    // group-trip guide carried a purpose alone and the reunion guide was filed under Parties while
    // /events/trips says reunions are trips. A fifth event type fails here until its audience exists.
    const AUDIENCE_OF: Record<string, BlogTagId> = {
      weddings: "weddings",
      parties: "parties",
      conferences: "corporate",
      trips: "trips",
    };
    expect(Object.keys(AUDIENCE_OF).sort()).toEqual(
      [...EVENT_TYPE_SLUGS].sort(),
    );
    expect(
      BLOG_TAGS.filter((t) => t.kind === "audience").map((t) => t.id),
    ).toEqual(EVENT_TYPE_SLUGS.map((slug) => AUDIENCE_OF[slug]));
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
