import { describe, expect, it } from "vitest";

import { RESERVED_SLUGS } from "@/lib/constants/reserved-slugs";

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
});
