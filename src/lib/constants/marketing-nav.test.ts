import { describe, expect, it } from "vitest";

import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import {
  FOOTER_LEGAL,
  FOOTER_NAV,
  isNavGroup,
  isNavItemCurrent,
  PRIMARY_NAV,
  type FooterColumn,
  type NavItem,
} from "@/lib/constants/marketing-nav";

// Every href a nav surface exposes (flat links + group parents + children).
function hrefsOf(items: NavItem[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    if (isNavGroup(item)) {
      if (item.href) out.push(item.href);
      out.push(...item.children.map((child) => child.href));
    } else {
      out.push(item.href);
    }
  }
  return out;
}

// Internal app routes or in-page anchors — never an external/protocol URL (the
// marketing nav should never point off-site). Guards against a stray "https://…".
const isInternal = (href: string) => href.startsWith("/");

describe("marketing nav config", () => {
  it("primary nav: non-empty labels, internal hrefs, non-empty groups", () => {
    for (const item of PRIMARY_NAV) {
      expect(item.label.trim()).not.toBe("");
      if (isNavGroup(item)) {
        if (item.href) expect(isInternal(item.href)).toBe(true);
        expect(item.children.length).toBeGreaterThan(0);
        for (const child of item.children) {
          expect(child.label.trim()).not.toBe("");
          expect(isInternal(child.href)).toBe(true);
        }
      } else {
        expect(isInternal(item.href)).toBe(true);
      }
    }
  });

  it("primary nav has no duplicate hrefs", () => {
    const hrefs = hrefsOf(PRIMARY_NAV);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("the header Events panel mirrors EVENT_TYPE_SLUGS (no drift)", () => {
    const expected = EVENT_TYPE_SLUGS.map((slug) => `/events/${slug}`);
    const group = PRIMARY_NAV.find(
      (item) => isNavGroup(item) && item.label === "Events",
    );
    expect(group && isNavGroup(group)).toBe(true);
    if (group && isNavGroup(group)) {
      expect(group.children.map((child) => child.href)).toEqual(expected);
    }
  });

  it("the expansion IA: Features panel leads with the six pages + the nested reel", () => {
    // The 2026-08-26 expansion ruling (supersedes the T2.5 Call-1 nav spec)
    // as re-ordered 2026-08-28: Features · Events · Resources · Pricing, with
    // the reel NESTED inside the Features panel (top-level Reel retired) and
    // /reel's URL unchanged. The three PANEL groups must stay CONTIGUOUS —
    // Radix derives its cross-slide from the index delta between adjacent
    // items, so a flat link between two panels kills one pair's sweep.
    const expected = [
      ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
      "/reel",
    ];
    const features = PRIMARY_NAV[0];
    expect(isNavGroup(features) && features.label).toBe("Features");
    if (isNavGroup(features)) {
      expect(features.href).toBe("/features");
      expect(features.children.map((child) => child.href)).toEqual(expected);
      // Panel labels + one-liners mirror the registry (no copy drift).
      for (const page of FEATURE_PAGES) {
        const child = features.children.find(
          (c) => c.href === `/features/${page.slug}`,
        );
        expect(child?.label).toBe(page.navLabel);
        expect(child?.description).toBe(page.navDescription);
      }
      // Every panel row carries a description (the mega-panel contract).
      for (const child of features.children) {
        expect(child.description?.trim()).not.toBe("");
      }
    }
    expect(PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Features",
      "Events",
      "Resources",
      "Pricing",
    ]);
    // The contiguity invariant itself, not just the literal order: every
    // panel group precedes every flat link.
    // "g" sorts before "l", so a sorted copy IS "all groups, then all links".
    const kinds = PRIMARY_NAV.map((item) => (isNavGroup(item) ? "g" : "l"));
    expect(kinds.join("")).toBe([...kinds].sort().join(""));
  });

  it("isNavItemCurrent: hubs, children, and the hub-less Resources group", () => {
    const byLabel = (label: string) =>
      PRIMARY_NAV.find((item) => item.label === label)!;
    const features = byLabel("Features");
    const resources = byLabel("Resources");
    const pricing = byLabel("Pricing");

    expect(isNavItemCurrent(features, "/features")).toBe(true);
    expect(isNavItemCurrent(features, "/features/album")).toBe(true);
    // The reel lives INSIDE the Features panel, so /reel inks Features.
    expect(isNavItemCurrent(features, "/reel")).toBe(true);
    expect(isNavItemCurrent(features, "/pricing")).toBe(false);

    // Resources has no hub of its own — only its children can light it.
    expect(isNavItemCurrent(resources, "/help")).toBe(true);
    expect(isNavItemCurrent(resources, "/blog/some-post")).toBe(true);
    expect(isNavItemCurrent(resources, "/about")).toBe(false);

    expect(isNavItemCurrent(pricing, "/pricing")).toBe(true);
    expect(isNavItemCurrent(pricing, "/")).toBe(false);
    // Segment-aware, not a raw prefix: /pressure must never ink /press.
    expect(isNavItemCurrent(resources, "/pressure")).toBe(false);
  });

  // ── the footer (the ink-slab IA) ──────────────────────────────────────────

  // Every href a footer column exposes: the title link, the rows, the tail.
  const columnHrefs = (column: FooterColumn): string[] => [
    ...(column.href ? [column.href] : []),
    ...column.links.map((link) => link.href),
    ...(column.tail ?? []).map((link) => link.href),
  ];

  it("footer: titled columns, non-empty internal links, no dupes within a column", () => {
    for (const column of FOOTER_NAV) {
      expect(column.title.trim()).not.toBe("");
      expect(column.links.length).toBeGreaterThan(0);
      const hrefs = columnHrefs(column);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      for (const href of hrefs) expect(isInternal(href)).toBe(true);
      for (const link of [...column.links, ...(column.tail ?? [])]) {
        expect(link.label.trim()).not.toBe("");
      }
    }
  });

  it("footer has no duplicate hrefs across columns or the legal bar", () => {
    const hrefs = [
      ...FOOTER_NAV.flatMap(columnHrefs),
      ...FOOTER_LEGAL.map((link) => link.href),
    ];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("NOTHING in the footer is collapsed: the whole sitemap is one glance", () => {
    // The first ink-slab pass folded Features + Events into disclosures at the
    // bottom of Product, which buried the two most core marketing page families
    // behind a chevron (Will's review). The sitemap is small enough to show
    // whole, so this pin exists to stop an accordion creeping back in.
    for (const column of FOOTER_NAV) {
      for (const link of column.links) {
        expect(isNavGroup(link as NavItem), `${column.title} has a group`).toBe(
          false,
        );
      }
    }
  });

  it("Features is a full column mirroring FEATURE_PAGES, hub on the title", () => {
    const features = FOOTER_NAV.find((col) => col.title === "Features");
    // The hub rides the column TITLE rather than an "All features" row, so the
    // directory sits where the eye already lands and costs no extra row.
    expect(features?.href).toBe("/features");
    expect(features?.links.map((link) => link.href)).toEqual(
      FEATURE_PAGES.map((page) => `/features/${page.slug}`),
    );
    // Labels mirror the registry (no copy drift), same contract the header panel
    // carries. Note the footer does NOT nest /reel the way the header does.
    for (const page of FEATURE_PAGES) {
      const link = features?.links.find(
        (l) => l.href === `/features/${page.slug}`,
      );
      expect(link?.label).toBe(page.navLabel);
    }
  });

  it("Events is a full column mirroring EVENT_TYPE_SLUGS, hub on the title", () => {
    const events = FOOTER_NAV.find((col) => col.title === "Events");
    expect(events?.href).toBe("/events");
    expect(events?.links.map((link) => link.href)).toEqual(
      EVENT_TYPE_SLUGS.map((slug) => `/events/${slug}`),
    );
  });

  it("a column title href is internal, and only the hub columns have one", () => {
    for (const column of FOOTER_NAV) {
      if (column.href) expect(isInternal(column.href)).toBe(true);
    }
    expect(
      FOOTER_NAV.filter((col) => col.href).map((col) => col.title),
    ).toEqual(["Features", "Events"]);
  });

  it("the Product column carries the cross-cutting conversion routes", () => {
    const product = FOOTER_NAV.find((col) => col.title === "Product");
    expect(product?.links.map((link) => link.href)).toEqual([
      "/how-it-works",
      "/pricing",
      "/reel",
      "/#faq",
    ]);
  });

  it("Resources keeps the R5 shape and carries About + Careers as its tail", () => {
    const resources = FOOTER_NAV.find((col) => col.title === "Resources");
    expect(resources?.links.map((link) => link.href)).toEqual([
      "/help",
      "/blog",
      "/press",
      "/contact",
    ]);
    // About is footer-only by ruling (no header-nav row), so this pin is the one
    // guard keeping the route reachable — do not drop it casually. It moved from
    // a Company COLUMN to this tail, and it still leads.
    expect(resources?.tail?.map((link) => link.href)).toEqual([
      "/about",
      "/careers",
    ]);
  });

  it("the legal bar owns Privacy + Terms, and nothing duplicates them", () => {
    expect(FOOTER_LEGAL.map((link) => link.href)).toEqual([
      "/privacy",
      "/terms",
    ]);
    for (const link of FOOTER_LEGAL) {
      expect(link.label.trim()).not.toBe("");
      expect(isInternal(link.href)).toBe(true);
    }
    // FOOTER_LEGAL sits outside the column loop, so without this it would carry
    // no shape guard at all.
    const inColumns = FOOTER_NAV.flatMap(columnHrefs);
    for (const link of FOOTER_LEGAL) {
      expect(inColumns).not.toContain(link.href);
    }
  });

  it("Resources surfaces Help + Blog + Press + Contact in both the header group and footer column", () => {
    // Press joined at R5 (the media-kit page; ruled into Resources).
    const expected = ["/help", "/blog", "/press", "/contact"];
    const group = PRIMARY_NAV.find(
      (item) => isNavGroup(item) && item.label === "Resources",
    );
    expect(group && isNavGroup(group)).toBe(true);
    if (group && isNavGroup(group)) {
      expect(group.children.map((child) => child.href)).toEqual(expected);
    }
    const column = FOOTER_NAV.find((col) => col.title === "Resources");
    expect(column?.links.map((link) => link.href)).toEqual(expected);
  });
});
