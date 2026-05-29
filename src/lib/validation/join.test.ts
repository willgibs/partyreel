import { describe, expect, it } from "vitest";

import { buildJoinSchema } from "@/lib/validation/join";

describe("buildJoinSchema", () => {
  it("requires a display name when the event does", () => {
    const schema = buildJoinSchema(true, false);
    expect(schema.safeParse({ display_name: "", email: "" }).success).toBe(
      false,
    );
    expect(schema.safeParse({ display_name: "Alex", email: "" }).success).toBe(
      true,
    );
  });

  it("requires an email when the event does", () => {
    const schema = buildJoinSchema(false, true);
    expect(schema.safeParse({ display_name: "", email: "" }).success).toBe(
      false,
    );
    expect(
      schema.safeParse({ display_name: "", email: "a@b.com" }).success,
    ).toBe(true);
  });

  it("rejects a malformed email even when optional", () => {
    const schema = buildJoinSchema(false, false);
    expect(schema.safeParse({ display_name: "", email: "nope" }).success).toBe(
      false,
    );
  });

  it("accepts everything empty when nothing is required", () => {
    const schema = buildJoinSchema(false, false);
    expect(schema.safeParse({ display_name: "", email: "" }).success).toBe(
      true,
    );
  });
});
