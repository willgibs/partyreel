import { describe, expect, it } from "vitest";

import { contactSchema } from "@/lib/validation/contact";

const valid = {
  topic: "hosting",
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hi — I have a question about hosting a wedding album.",
};

describe("contactSchema", () => {
  it("accepts a valid submission", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(
      false,
    );
  });

  it("rejects a blank name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
  });

  it("rejects a too-short message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(
      false,
    );
  });

  it("allows an optional subject and the (empty) honeypot field", () => {
    expect(
      contactSchema.safeParse({ ...valid, subject: "Billing", website: "" })
        .success,
    ).toBe(true);
  });

  it("rejects a missing topic (the picker is required)", () => {
    const { topic: _topic, ...rest } = valid;
    expect(contactSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an unknown topic (the enum mirrors the DB CHECK)", () => {
    expect(contactSchema.safeParse({ ...valid, topic: "spam" }).success).toBe(
      false,
    );
  });

  it("rejects an over-length name with a friendly message", () => {
    const result = contactSchema.safeParse({ ...valid, name: "A".repeat(101) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Name is too long (100 characters max).",
      );
    }
  });
});
