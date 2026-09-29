import { describe, expect, it } from "vitest";

import { evaluateSlugInput, slugify, suggestSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases, hyphenates spaces, drops apostrophes", () => {
    expect(slugify("Sarah's Wedding")).toBe("sarahs-wedding");
  });

  it("strips diacritics + emoji, collapses runs, trims edge hyphens", () => {
    expect(slugify("  Café   Soirée 🎉!! ")).toBe("cafe-soiree");
  });

  it("caps at maxLen (default 60, overridable)", () => {
    expect(slugify("a".repeat(80)).length).toBe(60);
    expect(slugify("a".repeat(80), 50).length).toBe(50);
  });

  it("returns empty for an all-symbol input", () => {
    expect(slugify("🎉🎉🎉")).toBe("");
  });
});

describe("suggestSlug", () => {
  it("derives a valid slug from an event name", () => {
    expect(suggestSlug("Maya & Sam's Wedding")).toBe("maya-sams-wedding");
  });

  it("truncates to <=50 chars with no trailing hyphen", () => {
    const s = suggestSlug("word ".repeat(40));
    expect(s).not.toBeNull();
    if (s) {
      expect(s.length).toBeLessThanOrEqual(50);
      expect(s.endsWith("-")).toBe(false);
    }
  });

  it("returns null when too short or all-symbol", () => {
    expect(suggestSlug("Hi")).toBeNull();
    expect(suggestSlug("🎉")).toBeNull();
  });

  it("returns null for a reserved word", () => {
    expect(suggestSlug("Admin")).toBeNull();
  });

  it("returns null for a name in the brand's family, so it never suggests a refusal", () => {
    expect(suggestSlug("Our Party Reel")).toBeNull();
    expect(suggestSlug("Partyreel launch night")).toBeNull();
    expect(suggestSlug("Sam's party")).toBe("sams-party");
  });
});

describe("evaluateSlugInput", () => {
  it("idle on empty / whitespace", () => {
    expect(evaluateSlugInput("", null).kind).toBe("idle");
    expect(evaluateSlugInput("   ", null).kind).toBe("idle");
  });

  it("invalid (with a message) on bad format / reserved", () => {
    const tooShort = evaluateSlugInput("ab", null);
    expect(tooShort.kind).toBe("invalid");
    if (tooShort.kind === "invalid") {
      expect(tooShort.message.length).toBeGreaterThan(0);
    }
    expect(evaluateSlugInput("my slug", null).kind).toBe("invalid");
    expect(evaluateSlugInput("admin", null).kind).toBe("invalid");
  });

  it("current when equal to the saved slug (normalized, case-insensitive)", () => {
    expect(evaluateSlugInput("Summer-Bash", "summer-bash").kind).toBe(
      "current",
    );
  });

  // ★ A link held before the family grew (the demo's own `partyreel-demo`) still resolves, and
  // Change opens the field on it: it reads as current, never as a refusal of the link they have.
  it("current for a held slug the rules now refuse, and the rules for any other value", () => {
    expect(evaluateSlugInput(" Partyreel-Demo ", "partyreel-demo")).toEqual({
      kind: "current",
      normalized: "partyreel-demo",
    });
    expect(evaluateSlugInput("partyreel-demo-2", "partyreel-demo").kind).toBe(
      "invalid",
    );
    expect(evaluateSlugInput("partyreel-demo", null).kind).toBe("invalid");
  });

  it("check (with the normalized value) for a valid, changed slug", () => {
    const r = evaluateSlugInput("Summer-Gala", "summer-bash");
    expect(r.kind).toBe("check");
    if (r.kind === "check") expect(r.normalized).toBe("summer-gala");
  });
});
