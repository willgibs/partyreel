import { describe, expect, it } from "vitest";

import type { BlogListItem } from "./blog";
import { BLOG_TAGS, type BlogTagId } from "./blog-tags";
import {
  normalizeTag,
  pageNumbers,
  paginate,
  POSTS_PER_PAGE,
  splitLibrary,
  tagCounts,
} from "./blog-index";

function post(slug: string, tags: BlogTagId[]): BlogListItem {
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

// The real shape that motivated the hero rule: the NEWEST post owns tags nobody else has
// (`product` + `compared` here), so lifting it out of the filtered set would render those rows
// empty. `parties` is deliberately absent: a registered tag with no posts must not reach the rail.
const POSTS = [
  post("highlight-reel-renders-on-your-phone", ["product", "compared"]),
  post("qr-code-for-wedding-photos", ["weddings", "how-to"]),
  post("group-trip-photo-sharing", ["how-to"]),
  post("conference-photo-sharing-no-app", ["corporate"]),
];

describe("blog index derivations", () => {
  it("counts tags across the full set, in registry order, carrying the registry copy", () => {
    const counts = tagCounts(POSTS);
    expect(counts.map((c) => c.id)).toEqual([
      "weddings",
      "corporate",
      "how-to",
      "compared",
      "product",
    ]);
    expect(counts.find((c) => c.id === "how-to")).toMatchObject({
      id: "how-to",
      label: "How-to",
      kind: "purpose",
      count: 2,
    });
    expect(counts.find((c) => c.id === "how-to")?.description).toBeTruthy();
    // A registered tag with no posts is not offered.
    expect(counts.map((c) => c.id)).not.toContain("parties");
  });

  it("stages a lead only in the unfiltered view", () => {
    const all = splitLibrary(POSTS, null);
    expect(all.lead?.slug).toBe("highlight-reel-renders-on-your-phone");
    expect(all.library).toHaveLength(3);

    const filtered = splitLibrary(POSTS, "how-to");
    expect(filtered.lead).toBeNull();
    expect(filtered.library).toHaveLength(2);
  });

  it("★ every tag the rail offers yields rows, count-exact", () => {
    // The invariant. Under a "hoist the hero out of the filtered set" design, `product` and
    // `compared` would each render an empty library while their article sat in the hero.
    const offered = tagCounts(POSTS);
    for (const { id, count } of offered) {
      const { lead, library } = splitLibrary(POSTS, id);
      expect(lead, id).toBeNull();
      expect(library.length, id).toBe(count);
      expect(library.length, id).toBeGreaterThan(0);
    }
    // And the converse, over the REGISTRY: a tag the rail does not offer has no rows, so the
    // only way a registered tag could ever show an empty grid is through the URL, which
    // normalizeTag closes below.
    for (const tag of BLOG_TAGS) {
      const rows = splitLibrary(POSTS, tag.id).library.length;
      expect(offered.some((c) => c.id === tag.id), tag.id).toBe(rows > 0);
    }
  });

  it("returns the ex-lead to the library when its own tag is picked", () => {
    const { library } = splitLibrary(POSTS, "product");
    expect(library.map((p) => p.slug)).toEqual([
      "highlight-reel-renders-on-your-phone",
    ]);
  });

  it("normalizes an unknown, empty, or absent ?tag= back to the unfiltered view", () => {
    expect(normalizeTag("how-to", POSTS)).toBe("how-to");
    expect(normalizeTag("no-such-tag", POSTS)).toBeNull();
    // Registered but with zero posts in this set: also the unfiltered view, never an empty grid.
    expect(normalizeTag("parties", POSTS)).toBeNull();
    expect(normalizeTag(null, POSTS)).toBeNull();
    expect(normalizeTag("", POSTS)).toBeNull();
  });

  it("survives an empty collection", () => {
    expect(tagCounts([])).toEqual([]);
    expect(splitLibrary([], null)).toEqual({ lead: null, library: [] });
  });
});

describe("pagination", () => {
  const items = Array.from({ length: 37 }, (_, i) => i + 1);

  it("is invisible below the threshold", () => {
    // A short filtered set (or the four-post blog this shipped on) must render no control.
    const p = paginate([1, 2, 3], 1);
    expect(p.pageCount).toBe(1);
    expect(pageNumbers(p.page, p.pageCount)).toEqual([]);
    expect(p.items).toHaveLength(3);
  });

  it("slices and reports a display range", () => {
    const p = paginate(items, 2);
    expect(p.items[0]).toBe(POSTS_PER_PAGE + 1);
    expect(p.items).toHaveLength(POSTS_PER_PAGE);
    expect([p.from, p.to, p.total]).toEqual([13, 24, 37]);
    expect(p.pageCount).toBe(4);
  });

  it("★ clamps a page that is out of range, fractional, or not a number", () => {
    // ?page= is reader-supplied, and a filter change can shrink the set under the reader's feet.
    // Every one of these must land on a real page rather than an empty grid.
    expect(paginate(items, 99).page).toBe(4);
    expect(paginate(items, 0).page).toBe(1);
    expect(paginate(items, -3).page).toBe(1);
    expect(paginate(items, 2.7).page).toBe(2);
    expect(paginate(items, NaN).page).toBe(1);
    expect(paginate(items, 99).items).not.toHaveLength(0);
  });

  it("survives an empty set", () => {
    const p = paginate([], 1);
    expect([p.page, p.pageCount, p.from, p.to, p.total]).toEqual([1, 1, 0, 0, 0]);
    expect(p.items).toEqual([]);
  });

  it("the last page holds the remainder, and every item appears exactly once", () => {
    const seen = [];
    for (let i = 1; i <= 4; i++) seen.push(...paginate(items, i).items);
    expect(seen).toEqual(items);
    expect(paginate(items, 4).items).toHaveLength(1);
  });

  it("elides long runs but keeps a stable shape", () => {
    expect(pageNumbers(1, 3)).toEqual([1, 2, 3]);
    expect(pageNumbers(1, 9)).toEqual([1, 2, null, 9]);
    expect(pageNumbers(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pageNumbers(9, 9)).toEqual([1, null, 8, 9]);
    // Never a lone gap marker standing in for a single page.
    expect(pageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});
