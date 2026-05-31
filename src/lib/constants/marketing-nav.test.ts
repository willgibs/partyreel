import { describe, expect, it } from "vitest";

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
});
