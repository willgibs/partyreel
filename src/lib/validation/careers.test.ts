import { describe, expect, it } from "vitest";

import { careerSchema } from "@/lib/validation/careers";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I'd love to own the reel rendering pipeline.",
};

describe("careerSchema", () => {
  it("accepts a valid application (links optional)", () => {
    expect(careerSchema.safeParse(valid).success).toBe(true);
    expect(
      careerSchema.safeParse({ ...valid, links: "github.com/ada" }).success,
    ).toBe(true);
  });

  it("rejects a bad email", () => {
    expect(careerSchema.safeParse({ ...valid, email: "nope" }).success).toBe(
      false,
    );
  });

  it("rejects a too-short message", () => {
    expect(careerSchema.safeParse({ ...valid, message: "hi" }).success).toBe(
      false,
    );
  });
});
