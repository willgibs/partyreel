import { describe, expect, it } from "vitest";

import { eventSlugSchema } from "@/lib/validation/event";

function parse(slug: string) {
  return eventSlugSchema.safeParse({ slug });
}

describe("eventSlugSchema", () => {
  it("accepts a simple lowercase slug", () => {
    const result = parse("sarahs-wedding");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("sarahs-wedding");
  });

  it("trims and lowercases before validating", () => {
    const result = parse("  Sarahs-Wedding  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe("sarahs-wedding");
  });

  it("allows internal hyphens and digits", () => {
    expect(parse("party-2026").success).toBe(true);
  });

  it("rejects slugs shorter than 3 characters", () => {
    expect(parse("ab").success).toBe(false);
  });

  it("rejects slugs longer than 50 characters", () => {
    expect(parse("a".repeat(51)).success).toBe(false);
  });

  it("rejects spaces, underscores, and non-ASCII", () => {
    expect(parse("sarah wedding").success).toBe(false);
    expect(parse("sarah_wedding").success).toBe(false);
    expect(parse("café-night").success).toBe(false);
  });

  it("rejects leading and trailing hyphens", () => {
    expect(parse("-wedding").success).toBe(false);
    expect(parse("wedding-").success).toBe(false);
  });

  it("rejects a 32-hex string (it could be mistaken for a qr_token)", () => {
    expect(parse("0123456789abcdef0123456789abcdef").success).toBe(false);
  });

  it("rejects reserved words", () => {
    expect(parse("admin").success).toBe(false);
    expect(parse("pricing").success).toBe(false);
    expect(parse("dashboard").success).toBe(false);
  });
});
