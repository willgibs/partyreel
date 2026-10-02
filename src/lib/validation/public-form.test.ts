import { describe, expect, it } from "vitest";

import { careerSchema } from "@/lib/validation/careers";
import { contactSchema } from "@/lib/validation/contact";
import {
  HONEYPOT_FIELD,
  isHoneypotFilled,
  publicFormFields,
} from "@/lib/validation/public-form";

/**
 * THE PUBLIC FORMS' ONE CONTRACT, ITS FIELDS HALF (mkt-polish): /contact and a job application were two
 * parallel copies of one schema, honeypot included, and the honeypot was named `website`, a field an
 * autofill fills for a real person (whose note then vanished behind a success screen).
 */

/**
 * The words an autofill reads a field's name by: the HTML autofill tokens, and the heuristic words
 * browsers and password managers match on beside them.
 */
const AUTOFILL_WORDS = [
  // WHATWG autofill field names (the autocomplete attribute's tokens).
  "name",
  "nickname",
  "username",
  "password",
  "one-time-code",
  "organization",
  "street-address",
  "address",
  "country",
  "postal-code",
  "cc-",
  "language",
  "bday",
  "sex",
  "url",
  "photo",
  "tel",
  "email",
  "impp",
  // The heuristic words beside them.
  "website",
  "homepage",
  "company",
  "phone",
  "mobile",
  "fax",
  "city",
  "state",
  "zip",
  "title",
  "subject",
  "message",
];

describe("the public forms' honeypot", () => {
  it("is named for nothing an autofill fills", () => {
    const field = HONEYPOT_FIELD.toLowerCase();
    for (const word of AUTOFILL_WORDS) {
      expect(field.includes(word), `the honeypot's name holds "${word}"`).toBe(
        false,
      );
    }
  });

  it("is the same hidden field on both forms, and the old name is gone from both", () => {
    for (const schema of [contactSchema, careerSchema]) {
      expect(Object.keys(schema.shape)).toContain(HONEYPOT_FIELD);
      expect(Object.keys(schema.shape)).not.toContain("website");
    }
  });

  it("counts a fill only when something was typed", () => {
    expect(isHoneypotFilled({})).toBe(false);
    expect(isHoneypotFilled({ [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(isHoneypotFilled({ [HONEYPOT_FIELD]: "   " })).toBe(false);
    expect(isHoneypotFilled({ [HONEYPOT_FIELD]: "https://spam.example" })).toBe(
      true,
    );
  });
});

describe("the fields both forms ask", () => {
  it("are the one shared definition on each form", () => {
    for (const schema of [contactSchema, careerSchema]) {
      expect(schema.shape.name).toBe(publicFormFields.name);
      expect(schema.shape.email).toBe(publicFormFields.email);
    }
  });

  it("refuse a note under a line, and over 5,000 characters, the same way on both", () => {
    const person = { name: "Ada Lovelace", email: "ada@example.com" };
    for (const [schema, extra] of [
      [contactSchema, { topic: "hosting" }],
      [careerSchema, {}],
    ] as const) {
      expect(
        schema.safeParse({ ...person, ...extra, message: "short" }).success,
      ).toBe(false);
      expect(
        schema.safeParse({ ...person, ...extra, message: "x".repeat(5001) })
          .success,
      ).toBe(false);
      expect(
        schema.safeParse({
          ...person,
          ...extra,
          message: "A whole line about the thing.",
        }).success,
      ).toBe(true);
    }
  });
});
