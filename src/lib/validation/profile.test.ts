import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX_LENGTH,
  displayNameSchema,
  PROFILE_SLUG_MAX_LENGTH,
  PROFILE_SLUG_MIN_LENGTH,
  profileSlugSchema,
} from "@/lib/validation/profile";

describe("displayNameSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(displayNameSchema.parse("  Will Gibson  ")).toBe("Will Gibson");
  });

  it("requires a name (empty / whitespace-only is rejected now)", () => {
    expect(displayNameSchema.safeParse("").success).toBe(false);
    expect(displayNameSchema.safeParse("   ").success).toBe(false);
  });

  it("accepts short real names (1-2 chars: AJ, MJ, Bo)", () => {
    expect(displayNameSchema.parse("AJ")).toBe("AJ");
    expect(displayNameSchema.parse("Bo")).toBe("Bo");
    expect(displayNameSchema.parse("J")).toBe("J");
  });

  it("accepts a name at the max length", () => {
    const name = "a".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(displayNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over the max length", () => {
    const tooLong = "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1);
    expect(displayNameSchema.safeParse(tooLong).success).toBe(false);
  });

  it("rejects reserved / impersonation names (case-insensitive)", () => {
    expect(displayNameSchema.safeParse("admin").success).toBe(false);
    expect(displayNameSchema.safeParse("Partyreel").success).toBe(false);
    expect(displayNameSchema.safeParse("SUPPORT").success).toBe(false);
    expect(displayNameSchema.safeParse("Official").success).toBe(false);
  });

  it("allows a normal name that merely contains a reserved token", () => {
    expect(displayNameSchema.parse("Adminah")).toBe("Adminah");
    expect(displayNameSchema.parse("Hosta")).toBe("Hosta");
  });
});

describe("profileSlugSchema", () => {
  it("normalizes: trims and lowercases before validating", () => {
    expect(profileSlugSchema.parse("  Will-Gibson  ")).toBe("will-gibson");
  });

  it("accepts plain lowercase handles with digits and inner hyphens", () => {
    expect(profileSlugSchema.parse("will")).toBe("will");
    expect(profileSlugSchema.parse("dj-max-2026")).toBe("dj-max-2026");
    expect(profileSlugSchema.parse("abc")).toBe("abc");
  });

  it("enforces the length bounds (mirrors the DB CHECK: 3..30)", () => {
    expect(profileSlugSchema.safeParse("ab").success).toBe(false);
    expect(
      profileSlugSchema.parse("a".repeat(PROFILE_SLUG_MAX_LENGTH)),
    ).toHaveLength(PROFILE_SLUG_MAX_LENGTH);
    expect(
      profileSlugSchema.safeParse("a".repeat(PROFILE_SLUG_MAX_LENGTH + 1))
        .success,
    ).toBe(false);
    expect(PROFILE_SLUG_MIN_LENGTH).toBe(3);
  });

  it("rejects edge hyphens, spaces, and non [a-z0-9-] characters", () => {
    expect(profileSlugSchema.safeParse("-will").success).toBe(false);
    expect(profileSlugSchema.safeParse("will-").success).toBe(false);
    expect(profileSlugSchema.safeParse("will gibson").success).toBe(false);
    expect(profileSlugSchema.safeParse("will_gibson").success).toBe(false);
    expect(profileSlugSchema.safeParse("wíll").success).toBe(false);
    expect(profileSlugSchema.safeParse("will.gibson").success).toBe(false);
  });

  it("a 32-hex qr_token shape can never pass (length bound covers it)", () => {
    // No dedicated refine (unlike eventSlugSchema, max 50): 32 > PROFILE_SLUG_MAX_LENGTH.
    expect(32).toBeGreaterThan(PROFILE_SLUG_MAX_LENGTH);
    expect(profileSlugSchema.safeParse("a".repeat(32)).success).toBe(false);
  });

  it("rejects both reserved lists: route/brand slugs AND impersonation names", () => {
    expect(profileSlugSchema.safeParse("admin").success).toBe(false); // both lists
    expect(profileSlugSchema.safeParse("api").success).toBe(false); // RESERVED_SLUGS
    expect(profileSlugSchema.safeParse("support").success).toBe(false); // RESERVED_NAMES
    expect(profileSlugSchema.safeParse("Partyreel").success).toBe(false); // lowercased first
  });

  it("allows a handle that merely contains a reserved token", () => {
    expect(profileSlugSchema.parse("adminah")).toBe("adminah");
    expect(profileSlugSchema.parse("api-fans")).toBe("api-fans");
  });
});
