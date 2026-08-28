import { describe, expect, it } from "vitest";

import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import {
  FOOTER_LEGAL,
  FOOTER_NAV,
  isNavGroup,
  PRIMARY_NAV,
  type NavItem,
  type NavLink,
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

// The flat (non-group) entries of a footer column, narrowed. `filter(x => !g(x))`
// does not narrow on its own, so the predicate is spelled out.
const flatLinks = (items: NavItem[]): NavLink[] =>
  items.filter((item): item is NavLink => !isNavGroup(item));

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

  it("footer: titled columns, non-empty internal links, no dupes within a column", () => {
    for (const column of FOOTER_NAV) {
      expect(column.title.trim()).not.toBe("");
      expect(column.links.length).toBeGreaterThan(0);
      // A column entry is a flat link OR a collapsed group, so the href set is
      // the FLATTENED one (hub + children included) — a nested off-site link or
      // a dupe hiding inside a group must fail exactly like a top-level one.
      const hrefs = hrefsOf(column.links);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      for (const href of hrefs) expect(isInternal(href)).toBe(true);
      for (const item of column.links) {
        expect(item.label.trim()).not.toBe("");
        if (isNavGroup(item)) {
          expect(item.children.length).toBeGreaterThan(0);
          for (const child of item.children) {
            expect(child.label.trim()).not.toBe("");
          }
        }
      }
    }
  });

  it("footer has no duplicate hrefs across columns or the legal bar", () => {
    const hrefs = [
      ...FOOTER_NAV.flatMap((column) => hrefsOf(column.links)),
      ...FOOTER_LEGAL.map((link) => link.href),
    ];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("the Events nav mirrors EVENT_TYPE_SLUGS (no drift)", () => {
    const expected = EVENT_TYPE_SLUGS.map((slug) => `/events/${slug}`);
    const group = PRIMARY_NAV.find(
      (item) => isNavGroup(item) && item.label === "Events",
    );
    expect(group && isNavGroup(group)).toBe(true);
    if (group && isNavGroup(group)) {
      expect(group.children.map((child) => child.href)).toEqual(expected);
    }
    // The footer no longer has an Events COLUMN: the four type pages are the
    // collapsed long-tail group inside Product (the ink-slab IA). The mirror
    // invariant survives the move.
    const footerEvents = FOOTER_NAV.find(
      (col) => col.title === "Product",
    )?.links.find((item) => isNavGroup(item) && item.label === "Events");
    expect(footerEvents && isNavGroup(footerEvents)).toBe(true);
    if (footerEvents && isNavGroup(footerEvents)) {
      expect(footerEvents.href).toBe("/events");
      expect(footerEvents.children.map((child) => child.href)).toEqual(
        expected,
      );
    }
  });

  it("the expansion IA: Features panel leads with the six pages + the nested reel", () => {
    // The 2026-08-26 expansion ruling (supersedes the T2.5 Call-1 nav spec):
    // Features · Events · Pricing · Resources, with the reel NESTED inside the
    // Features panel (top-level Reel retired) and /reel's URL unchanged.
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
      "Pricing",
      "Resources",
    ]);
  });

  it("the footer Product column keeps conversion routes FLAT and the long tail collapsed", () => {
    // Will's ruling for the ink slab: only long-tail pages may sit behind a
    // disclosure. Anything a first-time visitor needs to convert or to trust
    // stays one glance away. This pin is that ruling made mechanical — moving
    // any of these four into a group is what it exists to catch.
    const product = FOOTER_NAV.find((col) => col.title === "Product");
    expect(flatLinks(product?.links ?? []).map((link) => link.href)).toEqual([
      "/how-it-works",
      "/reel",
      "/pricing",
      "/#faq",
    ]);

    const groups = (product?.links ?? []).filter(isNavGroup);
    expect(groups.map((group) => group.label)).toEqual(["Features", "Events"]);

    // The Features group mirrors the registry. Note it does NOT nest /reel the
    // way the header panel does: Reel already sits flat above it.
    const features = groups[0];
    expect(features.href).toBe("/features");
    expect(features.children.map((child) => child.href)).toEqual(
      FEATURE_PAGES.map((page) => `/features/${page.slug}`),
    );
    for (const page of FEATURE_PAGES) {
      const child = features.children.find(
        (c) => c.href === `/features/${page.slug}`,
      );
      expect(child?.label).toBe(page.navLabel);
    }
  });

  it("the ONLY collapsed groups are the two long-tail registries", () => {
    const grouped = FOOTER_NAV.flatMap((col) => col.links.filter(isNavGroup));
    expect(grouped.map((group) => group.label)).toEqual(["Features", "Events"]);
  });

  it("footer Company column carries the R5 shape (About leads; no Contact)", () => {
    const company = FOOTER_NAV.find((col) => col.title === "Company");
    // About is footer-only by ruling (no header-nav row), so this pin is the
    // one guard keeping the route reachable — do not drop it casually.
    // Privacy/Terms left for FOOTER_LEGAL in the ink-slab rebuild (see the
    // R4-A19 supersession note in marketing-nav.ts). About + Careers remain,
    // and About still LEADS.
    expect(hrefsOf(company?.links ?? [])).toEqual(["/about", "/careers"]);
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
    // FOOTER_LEGAL sits outside the column validation loop, so without this it
    // would carry no shape guard at all.
    const columnHrefs = FOOTER_NAV.flatMap((col) => hrefsOf(col.links));
    for (const link of FOOTER_LEGAL) {
      expect(columnHrefs).not.toContain(link.href);
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
