import { describe, expect, it } from "vitest";

import { MARKETING_CTA } from "./marketing-nav";
import {
  DECOMPOSITION_FACTS,
  DEMO_CTA_LABEL,
  GOLDEN_LINES,
  SECTION_HEADERS,
  SITE_SUBHEAD,
  SITE_THESIS,
  SITE_THESIS_STATUS,
} from "./marketing-voice";

/**
 * Byte-match pins over Will's ratified copy (the golden set, 2026-07-08; the in-chat section
 * ruling, 2026-08-25): a rewrite is a deliberate act (edit pin AND source, with a ruling),
 * never drift inside some section build.
 */

describe("the marketing voice single-source", () => {
  it("byte-matches the eight golden lines", () => {
    expect(GOLDEN_LINES).toEqual({
      thesis: "The whole event, in one place, forever",
      album: "Every photo comes to you first",
      reel: "The whole event, cut down to the highlights",
      pricing: "Start free, upgrade when you host again",
      reelThesis: "Every event ends with a reel",
      liveDemo: "Watch your album fill up",
      arc: "From the first scan to the final cut",
      curation: "Every moment, and you decide what stays",
    });
  });

  it("byte-matches the 2026-08-25 ruled lines", () => {
    expect(SITE_THESIS).toBe("The whole event, in one album.");
    expect(SITE_THESIS_STATUS).toBe("ruled");
    expect(SITE_SUBHEAD).toBe(
      "Partyreel collects the photos and videos from your guests with one QR code. No more chasing group chats the morning after.",
    );
    expect(SECTION_HEADERS.howItWorks).toEqual({
      line: "Scan, upload, done. No app to install.",
      status: "ruled",
    });
    expect(SECTION_HEADERS.pricing).toEqual({
      line: "Start free, upgrade for more events.",
      status: "ruled",
    });
    expect(DECOMPOSITION_FACTS).toEqual([
      "Built from 214 photos.",
      "Shot by 23 guests.",
      "Created for you.",
    ]);
  });

  it("every section header has a non-empty line, and provisional ones carry Will's note", () => {
    for (const [key, entry] of Object.entries(SECTION_HEADERS)) {
      expect(entry.line.trim().length, key).toBeGreaterThan(0);
      if (entry.status === "provisional") {
        expect(entry.note?.trim().length, `${key} needs its note`).toBeGreaterThan(0);
      }
    }
  });

  it('the primary CTA is "Start free" and stays internal', () => {
    expect(MARKETING_CTA.label).toBe("Start free");
    expect(MARKETING_CTA.href.startsWith("/")).toBe(true);
  });

  it("no ruled copy uses banned identity language", () => {
    const all = [
      ...Object.values(GOLDEN_LINES),
      SITE_THESIS,
      SITE_SUBHEAD,
      ...Object.values(SECTION_HEADERS).map((h) => h.line),
      ...DECOMPOSITION_FACTS,
      DEMO_CTA_LABEL,
    ];
    for (const line of all) {
      expect(/\bnight\b/i.test(line), line).toBe(false);
    }
  });
});
