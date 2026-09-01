import { describe, expect, it } from "vitest";

import {
  matchDestinations,
  rankHelpSearch,
  segmentMatches,
  tokenizeQuery,
} from "@/lib/content/help-search-rank";
import type { HelpSearchItem } from "@/lib/content/help";

function item(overrides: Partial<HelpSearchItem>): HelpSearchItem {
  return {
    slug: "an-article",
    title: "An article",
    description: "A description.",
    category: "getting-started",
    categoryTitle: "Getting started",
    audience: "host",
    keywords: [],
    headings: [],
    ...overrides,
  };
}

describe("rankHelpSearch", () => {
  const items: HelpSearchItem[] = [
    item({
      slug: "download-photos",
      title: "Download your photos and videos",
      keywords: ["zip"],
      headings: [{ id: "the-whole-album", text: "The whole album at once" }],
    }),
    item({
      slug: "storage-plans",
      title: "Storage, plans, and your limit",
      description: "What counts toward storage, and how downloads work.",
    }),
    item({
      slug: "password-events",
      title: "Who can see your event",
      keywords: ["password", "private"],
      headings: [{ id: "password-events", text: "Password events" }],
    }),
  ];

  it("AND semantics: an item missing any term is dropped", () => {
    const results = rankHelpSearch(items, "download zip");
    expect(results.map((r) => r.item.slug)).toEqual(["download-photos"]);
  });

  it("title prefix outranks a description hit", () => {
    const results = rankHelpSearch(items, "download");
    expect(results[0]?.item.slug).toBe("download-photos");
    expect(results[1]?.item.slug).toBe("storage-plans");
  });

  it("no anchor when the title already matches", () => {
    const results = rankHelpSearch(items, "download");
    expect(results[0]?.anchor).toBeNull();
  });

  it("anchors when a heading is the sole reason for the match", () => {
    const results = rankHelpSearch(items, "whole album");
    expect(results).toHaveLength(1);
    expect(results[0]?.item.slug).toBe("download-photos");
    expect(results[0]?.anchor).toEqual({
      id: "the-whole-album",
      text: "The whole album at once",
    });
  });

  it("keyword hit suppresses the heading anchor (top of article suffices)", () => {
    const results = rankHelpSearch(items, "password");
    expect(results[0]?.item.slug).toBe("password-events");
    expect(results[0]?.anchor).toBeNull();
  });

  it("empty query ranks nothing", () => {
    expect(rankHelpSearch(items, "   ")).toEqual([]);
    expect(tokenizeQuery("  ")).toEqual([]);
  });
});

describe("segmentMatches", () => {
  it("marks every occurrence, preserving original casing", () => {
    expect(segmentMatches("Download the download", "download")).toEqual([
      { text: "Download", match: true },
      { text: " the ", match: false },
      { text: "download", match: true },
    ]);
  });

  it("merges overlapping term ranges", () => {
    expect(segmentMatches("storage plans", "storage age plan")).toEqual([
      { text: "storage", match: true },
      { text: " ", match: false },
      { text: "plan", match: true },
      { text: "s", match: false },
    ]);
  });

  it("returns one unmatched segment when nothing hits", () => {
    expect(segmentMatches("Hello", "zzz")).toEqual([
      { text: "Hello", match: false },
    ]);
  });
});

describe("matchDestinations", () => {
  it("surfaces the pricing page for price-ish terms", () => {
    expect(matchDestinations("price")).toEqual([
      { label: "Pricing", href: "/pricing" },
    ]);
  });

  it("returns nothing for unrelated queries", () => {
    expect(matchDestinations("confetti")).toEqual([]);
  });
});
