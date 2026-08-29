import { describe, expect, it } from "vitest";

import type { BlogListItem } from "./blog";
import { normalizeTag, splitLibrary, tagCounts } from "./blog-index";

function post(slug: string, tags: string[]): BlogListItem {
  return {
    slug,
    title: slug,
    description: "",
    date: "2026-05-01",
    dateLabel: "May 1, 2026",
    authorName: "Partyreel Team",
    authorRole: "Partyreel",
    readingTime: "1 min read",
    tags,
    cover: {
      imageId: "wedding-golden",
      src: "/marketing/img/x.jpg",
      width: 900,
      height: 600,
      subject: "x",
      objectPosition: "50% 50%",
      derived: true,
    },
  };
}

// The real shape that motivated the hero rule: the NEWEST post owns two tags nobody else has.
const POSTS = [
  post("introducing-the-highlight-reel", ["product", "highlight-reel"]),
  post("stop-losing-group-photos", ["parties", "how-to"]),
  post("wedding-photo-qr", ["weddings", "how-to"]),
  post("best-photos-elsewhere", ["story", "behind-the-scenes"]),
];

describe("blog index derivations", () => {
  it("counts tags across the full set, most-used first", () => {
    const counts = tagCounts(POSTS);
    expect(counts[0]).toEqual({ label: "how-to", count: 2 });
    expect(counts.map((c) => c.label)).toContain("product");
  });

  it("stages a lead only in the unfiltered view", () => {
    const all = splitLibrary(POSTS, null);
    expect(all.lead?.slug).toBe("introducing-the-highlight-reel");
    expect(all.library).toHaveLength(3);

    const filtered = splitLibrary(POSTS, "how-to");
    expect(filtered.lead).toBeNull();
    expect(filtered.library).toHaveLength(2);
  });

  it("★ every tag the rail offers yields rows, count-exact", () => {
    // The invariant. Under a "hoist the hero out of the filtered set" design, `product` and
    // `highlight-reel` would each render an empty library while their article sat in the hero.
    for (const { label, count } of tagCounts(POSTS)) {
      const { lead, library } = splitLibrary(POSTS, label);
      expect(lead, label).toBeNull();
      expect(library.length, label).toBe(count);
      expect(library.length, label).toBeGreaterThan(0);
    }
  });

  it("returns the ex-lead to the library when its own tag is picked", () => {
    const { library } = splitLibrary(POSTS, "product");
    expect(library.map((p) => p.slug)).toEqual([
      "introducing-the-highlight-reel",
    ]);
  });

  it("normalizes an unknown or absent ?tag= back to the unfiltered view", () => {
    expect(normalizeTag("how-to", POSTS)).toBe("how-to");
    expect(normalizeTag("no-such-tag", POSTS)).toBeNull();
    expect(normalizeTag(null, POSTS)).toBeNull();
    expect(normalizeTag("", POSTS)).toBeNull();
  });

  it("survives an empty collection", () => {
    expect(tagCounts([])).toEqual([]);
    expect(splitLibrary([], null)).toEqual({ lead: null, library: [] });
  });
});
