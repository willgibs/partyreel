import { describe, expect, it } from "vitest";

import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import {
  FOOTER_NAV,
  isNavGroup,
  PRIMARY_NAV,
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

  it("footer: titled columns, non-empty internal links, no dupes within a column", () => {
    for (const column of FOOTER_NAV) {
      expect(column.title.trim()).not.toBe("");
      expect(column.links.length).toBeGreaterThan(0);
      const hrefs = column.links.map((link) => link.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
      for (const link of column.links) {
        expect(link.label.trim()).not.toBe("");
        expect(isInternal(link.href)).toBe(true);
      }
    }
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
    const column = FOOTER_NAV.find((col) => col.title === "Events");
    expect(column?.links.map((link) => link.href)).toEqual(expected);
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

  it("the footer Product + Features columns carry the ruled expansion shape", () => {
    const product = FOOTER_NAV.find((col) => col.title === "Product");
    expect(product?.links.map((link) => link.href)).toEqual([
      "/how-it-works",
      "/reel",
      "/pricing",
      "/#faq",
    ]);
    const featuresCol = FOOTER_NAV.find((col) => col.title === "Features");
    expect(featuresCol?.links.map((link) => link.href)).toEqual([
      "/features",
      ...FEATURE_PAGES.map((page) => `/features/${page.slug}`),
    ]);
  });

  it("footer Company column carries the R5 shape (About leads; no Contact)", () => {
    const company = FOOTER_NAV.find((col) => col.title === "Company");
    // About is footer-only by ruling (no header-nav row), so this pin is the
    // one guard keeping the route reachable — do not drop it casually.
    expect(company?.links.map((link) => link.href)).toEqual([
      "/about",
      "/careers",
      "/privacy",
      "/terms",
    ]);
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
