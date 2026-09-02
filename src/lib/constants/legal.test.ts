import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getAllSlugs } from "@/lib/content/help";

import {
  LEGAL_DOCUMENTS,
  LEGAL_PARTY,
  LEGAL_PLACEHOLDER_RE,
  LEGAL_RELATED,
  legalHrefs,
  legalPlainText,
  legalStatusLine,
  type LegalDocId,
  type LegalSection,
} from "./legal";
import { PRIVACY_SECTIONS } from "./legal-privacy";
import { TERMS_SECTIONS } from "./legal-terms";
import { FOOTER_LEGAL } from "./marketing-nav";

/**
 * THE LEGAL CONTRACT (the legal round, 2026-09-01). Three things a rendered
 * page cannot tell you:
 *
 *  1. THE ANCHOR CONTRACT. Section ids are deep-link targets (the rail, help
 *     articles, external links). The pinned arrays below make a renamed or
 *     dropped id a deliberate, reviewed change rather than a silent 404 on a
 *     link nobody re-tested.
 *  2. THE LAUNCH SWITCH. `LEGAL_PARTY` ships bracketed. Flipping a document to
 *     `effective` with a placeholder still in its text fails here, so the
 *     launch pass cannot publish "[ENTITY NAME]" as a party to a contract.
 *  3. THE TWO REGISTERS. "In short" lines are the plain-language register and
 *     never carry a placeholder or an em-dash.
 */

const ROOT = process.cwd();
const DOCS: Record<LegalDocId, LegalSection[]> = {
  privacy: PRIVACY_SECTIONS,
  terms: TERMS_SECTIONS,
};

// The anchor contract. The R5 ids survive inside these (what-we-collect,
// where-media-lives, who-can-see-what, metadata, retention-and-deletion,
// your-choices, reports-and-safety, changes-and-contact; the-service,
// your-account, your-content, acceptable-use, plans-and-billing,
// storage-and-retention, the-reel, ending-things, changes-and-contact).
const PINNED_IDS: Record<LegalDocId, string[]> = {
  privacy: [
    "overview",
    "what-we-collect",
    "how-we-use",
    "metadata",
    "who-can-see-what",
    "sharing",
    "cookies",
    "where-media-lives",
    "retention-and-deletion",
    "your-choices",
    "your-rights",
    "children",
    "security",
    "reports-and-safety",
    "changes-and-contact",
  ],
  terms: [
    "agreement",
    "the-service",
    "your-account",
    "guests",
    "your-content",
    "host-responsibilities",
    "acceptable-use",
    "copyright",
    "plans-and-billing",
    "refunds-and-cancellation",
    "storage-and-retention",
    "the-reel",
    "profiles-and-social",
    "moderation-and-enforcement",
    "privacy",
    "ending-things",
    "disclaimers",
    "limitation-of-liability",
    "indemnity",
    "disputes",
    "general",
    "changes-and-contact",
  ],
};

// Internal targets that are not help articles. Anything else is a typo.
const KNOWN_HREFS = new Set([
  "/privacy",
  "/terms",
  "/contact",
  "/pricing",
  "/features/privacy",
  `mailto:${LEGAL_PARTY.privacyEmail}`,
]);

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("the legal single-source", () => {
  it("meta is well-formed and matches the footer's legal bar", () => {
    for (const meta of Object.values(LEGAL_DOCUMENTS)) {
      expect(meta.version).toMatch(/^\d+\.\d+$/);
      expect(meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(meta.lastUpdated))).toBe(false);
      expect(meta.ogKicker.length).toBeLessThanOrEqual(90);
      if (meta.status === "effective") {
        expect(meta.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      const footer = FOOTER_LEGAL.find((l) => l.href === meta.path);
      expect(footer, `${meta.path} missing from FOOTER_LEGAL`).toBeDefined();
      expect(footer?.label).toBe(meta.navLabel);
    }
  });

  it("status lines read as intended in both states", () => {
    expect(legalStatusLine(LEGAL_DOCUMENTS.privacy)).toBe(
      "Version 1.0 · Pending counsel review · Effective on launch",
    );
    expect(
      legalStatusLine({
        ...LEGAL_DOCUMENTS.privacy,
        status: "effective",
        effectiveDate: "2026-10-01",
      }),
    ).toBe("Version 1.0 · Effective October 1, 2026");
  });

  it("the sitemap reads the legal dates instead of build time", () => {
    const sitemap = readFileSync(join(ROOT, "src/app/sitemap.ts"), "utf8");
    expect(sitemap).toContain("LEGAL_DOCUMENTS.privacy.lastUpdated");
    expect(sitemap).toContain("LEGAL_DOCUMENTS.terms.lastUpdated");
  });
});

describe.each(Object.keys(DOCS) as LegalDocId[])("the %s document", (doc) => {
  const sections = DOCS[doc];
  const meta = LEGAL_DOCUMENTS[doc];

  it("keeps the pinned anchor ids, in order", () => {
    expect(sections.map((s) => s.id)).toEqual(PINNED_IDS[doc]);
  });

  it("has well-formed, unique ids for sections and sub-headings", () => {
    const ids = new Set<string>();
    for (const section of sections) {
      expect(section.id).toMatch(KEBAB);
      expect(section.id).not.toBe("article-body");
      expect(ids.has(section.id), `duplicate id ${section.id}`).toBe(false);
      ids.add(section.id);
      const subIds = new Set<string>();
      for (const block of section.blocks) {
        if (block.kind !== "sub") continue;
        expect(block.id).toMatch(KEBAB);
        expect(subIds.has(block.id), `duplicate sub ${block.id}`).toBe(false);
        subIds.add(block.id);
      }
    }
  });

  it("keeps the plain-language register clean", () => {
    for (const section of sections) {
      expect(section.summary.trim().length).toBeGreaterThan(20);
      expect(section.summary).not.toMatch(LEGAL_PLACEHOLDER_RE);
      expect(section.summary).not.toContain("—");
      expect(section.blocks.length).toBeGreaterThan(0);
      if (section.navLabel) expect(section.navLabel.length).toBeLessThan(28);
    }
  });

  it("tables are rectangular", () => {
    for (const section of sections) {
      for (const block of section.blocks) {
        if (block.kind !== "table") continue;
        for (const row of block.rows) {
          expect(row).toHaveLength(block.columns.length);
        }
      }
    }
  });

  it("links only to places that exist", () => {
    const slugs = getAllSlugs();
    const sectionIds = new Set(sections.map((s) => s.id));
    for (const href of legalHrefs(doc, sections)) {
      if (href.startsWith("/help/")) {
        expect(slugs, `dead help link ${href}`).toContain(
          href.slice("/help/".length),
        );
      } else if (href.startsWith("#")) {
        expect(sectionIds.has(href.slice(1)), `dead anchor ${href}`).toBe(true);
      } else {
        expect(KNOWN_HREFS.has(href), `unknown href ${href}`).toBe(true);
      }
    }
    for (const related of LEGAL_RELATED[doc]) {
      expect(related.href).not.toBe(meta.path);
    }
  });

  it("names the party while pending, and never a placeholder once effective", () => {
    const text = legalPlainText(sections);
    if (meta.status === "effective") {
      // THE LAUNCH SWITCH: fill LEGAL_PARTY before flipping the status.
      expect(text).not.toMatch(LEGAL_PLACEHOLDER_RE);
    } else {
      // The entity is a party to the contract; its token must be in the text
      // so the launch fill-in is visible, not silently absent.
      expect(text).toContain(LEGAL_PARTY.entityName);
      expect(text).toContain(LEGAL_PARTY.address);
    }
    expect(text).not.toContain("—");
  });
});
