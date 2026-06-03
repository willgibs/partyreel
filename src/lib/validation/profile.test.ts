import { describe, expect, it } from "vitest";

import {
  DISPLAY_NAME_MAX_LENGTH,
  displayNameSchema,
} from "@/lib/validation/profile";

describe("displayNameSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(displayNameSchema.parse("  Will Gibson  ")).toBe("Will Gibson");
  });

  it("allows empty (the clear-the-name case)", () => {
    expect(displayNameSchema.parse("")).toBe("");
    expect(displayNameSchema.parse("   ")).toBe(""); // trims to empty
  });

  it("accepts a name at the max length", () => {
    const name = "a".repeat(DISPLAY_NAME_MAX_LENGTH);
    expect(displayNameSchema.parse(name)).toBe(name);
  });

  it("rejects a name over the max length", () => {
    const tooLong = "a".repeat(DISPLAY_NAME_MAX_LENGTH + 1);
    expect(displayNameSchema.safeParse(tooLong).success).toBe(false);
  });
});
