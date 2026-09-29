import { describe, expect, it } from "vitest";

import {
  BRAND_STEM,
  isBrandSlug,
  isReservedSlug,
  RESERVED_SLUGS,
} from "@/lib/constants/reserved-slugs";

describe("RESERVED_SLUGS", () => {
  it("reserves key product and route words", () => {
    for (const word of ["admin", "api", "e", "pricing", "dashboard", "www"]) {
      expect(RESERVED_SLUGS.has(word)).toBe(true);
    }
  });

  it("is entirely lowercase (slugs are normalized to lowercase before the check)", () => {
    for (const word of RESERVED_SLUGS) {
      expect(word).toBe(word.toLowerCase());
    }
  });

  it("leaves the brand to its family, which refuses the bare word too", () => {
    expect(RESERVED_SLUGS.has(BRAND_STEM)).toBe(false);
    expect(isReservedSlug(BRAND_STEM)).toBe(true);
  });
});

/**
 * ★ THE BRAND IS REFUSED AS A PART (crumbs-11). The whole-word list let any account hold
 * `/e/partyreel-support`; these pin what the family takes and, as deliberately, what it leaves.
 */
describe("the brand's family", () => {
  it("refuses the name anywhere in a slug", () => {
    for (const slug of [
      "partyreel",
      "partyreel-support",
      "official-partyreel",
      "partyreel-demo",
      "sams-partyreel-2026",
      "partyreels",
    ]) {
      expect(isBrandSlug(slug), slug).toBe(true);
    }
  });

  it("reads through a hyphen anywhere, the only separator a slug has", () => {
    for (const slug of [
      "party-reel",
      "my-party-reel",
      "party-reels-2026",
      "p-a-r-t-y-r-e-e-l",
      "partyr-eel-help",
    ]) {
      expect(isBrandSlug(slug), slug).toBe(true);
    }
  });

  it("reads each look-alike digit as its letter: 4 a, 3 e, 1 l, 7 t", () => {
    for (const slug of [
      "p4rtyreel",
      "partyr33l",
      "partyree1",
      "par7yreel",
      "p4r7y-r331-support",
    ]) {
      expect(isBrandSlug(slug), slug).toBe(true);
    }
  });

  it("reads any case, the way the setter lowercases first", () => {
    expect(isBrandSlug("PartyReel-Demo")).toBe(true);
    expect(isReservedSlug("Party-Reel")).toBe(true);
  });

  it("leaves a typo, a near word and the halves apart alone", () => {
    for (const slug of [
      // A dropped or doubled letter is a typo, not a disguise, and folding it would refuse these:
      "partyrel-night",
      "partyreeel",
      "party-relay",
      "party-release",
      "partyreal-2026",
      // The halves on their own, reversed, or apart:
      "sams-party",
      "reel-time",
      "reel-party-2026",
      "party-at-the-reel",
      // A digit the stem has no letter for stays a digit:
      "party-2-reel",
    ]) {
      expect(isBrandSlug(slug), slug).toBe(false);
    }
  });

  it("isReservedSlug is either refusal", () => {
    expect(isReservedSlug("support")).toBe(true); // a whole word
    expect(isReservedSlug("partyreel-support")).toBe(true); // the family
    expect(isReservedSlug("support-group")).toBe(false); // a whole word is refused only whole
    expect(isReservedSlug("sarahs-wedding")).toBe(false);
  });
});
