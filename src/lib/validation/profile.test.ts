import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX_LENGTH,
  displayNameSchema,
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
