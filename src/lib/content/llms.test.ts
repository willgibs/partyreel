/**
 * The /llms.txt builders: spec shape (H1 then blockquote), link integrity
 * (every emitted path is a real public route), the marketed numbers present,
 * the fenced numbers absent, and both files inside sane size budgets. The
 * claims fence itself runs in content-policy.test.ts (llms.ts is a CLAIM_FILE).
 */
import { describe, expect, it } from "vitest";

import { EVENT_TYPE_SLUGS } from "@/lib/constants/events";
import { FEATURE_PAGE_SLUGS } from "@/lib/constants/feature-pages";
import { getPostListItems } from "@/lib/content/blog";
import { getAllArticles } from "@/lib/content/help";

import { buildLlmsFullTxt, buildLlmsTxt } from "./llms";

// Fixture site (the RSS-test pattern): site.ts imports env, so tests supply
// the identity instead of importing it.
const SITE = {
  url: "https://partyreel.com",
  name: "Partyreel",
  supportEmail: "help@partyreel.com",
};
const SITE_URL = SITE.url;

const KNOWN_PATHS = new Set<string>([
  "/",
  "/pricing",
  "/how-it-works",
  "/reel",
  "/features",
  "/events",
  "/help",
  "/blog",
  "/about",
  "/press",
  "/privacy",
  "/terms",
  "/careers",
  "/contact",
  "/llms-full.txt",
  ...FEATURE_PAGE_SLUGS.map((s) => `/features/${s}`),
  ...EVENT_TYPE_SLUGS.map((s) => `/events/${s}`),
  ...getAllArticles().map((a) => `/help/${a.slug}`),
  ...getPostListItems().map((p) => `/blog/${p.slug}`),
]);

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt(SITE);

  it("opens with the spec shape: H1 first, blockquote second", () => {
    const lines = txt.split("\n").filter((l) => l.trim().length > 0);
    expect(lines[0]).toMatch(/^# Partyreel$/);
    expect(lines[1].startsWith("> ")).toBe(true);
  });

  it("every emitted link resolves to a real public route", () => {
    const links = [...txt.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThan(20);
    for (const link of links) {
      expect(link.startsWith(SITE_URL), `${link} is absolute`).toBe(true);
      const path = link.slice(SITE_URL.length);
      expect(KNOWN_PATHS.has(path), `${path} is a known route`).toBe(true);
    }
  });

  it("carries the marketed numbers and never the fenced ones", () => {
    for (const marketed of [
      "$0",
      "$24",
      "$15",
      "$9/mo",
      "$39/mo",
      "$90/yr",
      "$390/yr",
      "2 GB",
      "75 GB",
      "10 GB",
    ]) {
      expect(txt, `mentions ${marketed}`).toContain(marketed);
    }
    // The unmarketed backstop numbers (also enforced by content-policy over
    // this module's source; this asserts the generated OUTPUT too).
    expect(txt).not.toMatch(/\bingress\b/i);
    expect(txt).not.toMatch(/\b(?:225|300) ?GB\b|\b(?:1\.5|6) ?TB\b/);
  });

  it("includes the honest-limits section (the trust anchor)", () => {
    expect(txt).toContain("## When it is not");
  });

  it("stays lean", () => {
    expect(txt.length).toBeLessThan(16_000);
  });
});

describe("buildLlmsFullTxt", () => {
  const full = buildLlmsFullTxt(SITE);

  it("extends the index with the FAQ, plan table, and fact sheet", () => {
    expect(full).toContain(buildLlmsTxt(SITE).slice(0, 400));
    expect(full).toContain("## Frequently asked questions");
    expect(full).toContain("## The full plan table");
    expect(full).toContain("## The fact sheet");
  });

  it("inlines every FAQ question", () => {
    const questions = [...full.matchAll(/^### /gm)];
    expect(questions.length).toBeGreaterThanOrEqual(16);
  });

  it("stays within the ingestion budget", () => {
    expect(full.length).toBeLessThan(60_000);
  });
});
