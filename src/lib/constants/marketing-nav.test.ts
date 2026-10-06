import { describe, expect, it } from "vitest";

import { ABOUT_PRESS_HREF } from "@/lib/constants/about";
import { EVENT_TYPE_SLUGS, getEventType } from "@/lib/constants/events";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import {
  FAQ_HREF,
  faqHrefFrom,
  FOOTER_LEGAL,
  FOOTER_NAV,
  isNavGroup,
  isNavItemCurrent,
  OWN_FAQ_ROUTES,
  PRIMARY_NAV,
  type FooterColumn,
  type NavItem,
} from "@/lib/constants/marketing-nav";
import { filesUnder, read } from "@/testing/source-tree";

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
      // The row's name and its one line are the type's own (`navLabel`, `teaser`): the panel wrote a
      // second description beside the teaser until it was held to it, and two lines about one page
      // drift. The panel row wraps under `text-pretty`, so a teaser at the registry's length fits.
      for (const child of group.children) {
        const type = getEventType(child.href.replace("/events/", ""))!;
        expect(child.label, child.href).toBe(type.navLabel);
        expect(child.description, child.href).toBe(type.teaser);
      }
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
    // Segment-aware, not a raw prefix: /blogger must never ink /blog.
    expect(isNavItemCurrent(resources, "/blogger")).toBe(false);
    // The Press row points at an anchor on About (above: /about does not ink Resources), and a
    // pathname never carries a fragment, so the row is never current and the redirecting /press
    // is no segment of any row either.
    expect(isNavItemCurrent(resources, "/press")).toBe(false);
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
      ABOUT_PRESS_HREF,
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
    // Press joined at R5 (the media-kit page; ruled into Resources) and moved with the kit when
    // /press folded into /about (about-press r1): its row goes straight to the band. This module
    // imports nothing, so the literal is pinned here to the one home of that address.
    const expected = ["/help", "/blog", ABOUT_PRESS_HREF, "/contact"];
    expect(ABOUT_PRESS_HREF).toBe("/about#press");
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

describe("the footer's FAQ link follows the reader's page", () => {
  it("is the home's FAQ by default, and the Product column carries that default", () => {
    expect(FAQ_HREF).toBe("/#faq");
    const product = FOOTER_NAV.find((col) => col.title === "Product");
    expect(product?.links.find((link) => link.label === "FAQ")?.href).toBe(
      FAQ_HREF,
    );
  });

  // Reshaped on purpose (mkt-polish): an event page and a feature page used to send the reader to the
  // home's FAQ, because only /pricing's band carried the anchor. Every page with a band of its own now
  // keeps its readers; a page with none (and a 404 under a page family) still leaves for the home's.
  it("stays on every page with its own FAQ, and leaves for the home's from every other", () => {
    for (const path of [
      "/pricing",
      "/events",
      "/events/weddings",
      "/features/album",
      "/features/privacy",
    ]) {
      expect(faqHrefFrom(path), path).toBe("#faq");
    }
    for (const path of [
      "/",
      "/about",
      "/help",
      "/features",
      "/reel",
      "/blog/a-post",
      "/no-such-page",
      // A 404 under a page family has no FAQ to stay on: the routes are exact, never a prefix.
      "/events/nope",
      "/features/album/nope",
    ]) {
      expect(faqHrefFrom(path), path).toBe(FAQ_HREF);
    }
    // A render with no router context (a test, a not-found shell) takes the default.
    expect(faqHrefFrom(null)).toBe(FAQ_HREF);
  });

  const CINEMA = "src/app/(marketing)/(cinema)";
  /** A page draws an FAQ band of its own when it mounts the shared accordion or the feature band. */
  const drawsFaq = (source: string) =>
    /<(FaqAccordion|FeatureFaq)\b/.test(source);

  it("every route it stays on really carries its FAQ as #faq, and so does the home", () => {
    // The home's FAQ is the default target.
    expect(read("src/components/marketing/sections/home/faq.tsx")).toContain(
      'id="faq"',
    );
    // The feature pages' band carries the anchor once, for all six.
    expect(
      read("src/components/marketing/sections/features/shared/feature-faq.tsx"),
    ).toContain('id="faq"');
    // A route listed here has a page whose FAQ section is #faq; a route whose
    // page lost its anchor would send the footer's link nowhere.
    for (const route of OWN_FAQ_ROUTES) {
      const slug = /^\/events\/([^/]+)$/.exec(route)?.[1];
      if (slug) {
        // One template draws every type, its band from the type's own answers.
        expect(EVENT_TYPE_SLUGS, `${route} is no event type`).toContain(slug);
        expect(getEventType(slug)?.faq.length, route).toBeGreaterThan(0);
        expect(read(`${CINEMA}/events/[slug]/page.tsx`), route).toContain(
          'id="faq"',
        );
        continue;
      }
      const page = read(`${CINEMA}${route}/page.tsx`);
      expect(
        page.includes('id="faq"') || /<FeatureFaq\b/.test(page),
        `${route} has no id="faq" section`,
      ).toBe(true);
    }
  });

  it("every page that draws an FAQ band of its own is a route it stays on", () => {
    const pages = (dir: string): string[] =>
      filesUnder(dir).filter((file) => file.endsWith("/page.tsx"));
    const drawing = pages(CINEMA).filter((file) => drawsFaq(read(file)));
    // Pinned for non-emptiness: a sweep that finds no band is a broken sweep.
    expect(drawing.length).toBeGreaterThan(5);
    for (const file of drawing) {
      const route = file.slice(CINEMA.length, -"/page.tsx".length) || "/";
      if (route === "/events/[slug]") {
        for (const slug of EVENT_TYPE_SLUGS)
          expect(OWN_FAQ_ROUTES, file).toContain(`/events/${slug}`);
        continue;
      }
      // Another dynamic page with a band would need its slugs expanded here.
      expect(route, `${file} draws an FAQ under a dynamic route`).not.toMatch(
        /\[/,
      );
      expect(OWN_FAQ_ROUTES, file).toContain(route);
    }
  });
});
