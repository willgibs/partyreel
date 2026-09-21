// @contract-for: src/components/guest/upload/upload-terms.ts
import { describe, expect, it } from "vitest";

import { uploadTermsLine } from "@/components/guest/upload/upload-terms";
import { MAX_UPLOAD_BYTES } from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

/**
 * THE ONE LINE THE UPLOAD ACT SAYS BEFORE ANYTHING FLIES (`warning=both`, Will
 * 2026-09-21: "Terms either need a better design or to be scrapped").
 *
 * FUNCTION ONLY. The WORDS are Will's and are not pinned — bible 21 keeps copy
 * open and he retunes a sentence without asking a test. What is held is the two
 * things that make the sentence TRUE, both of which fail silently: a number
 * typed here instead of read from `limits.ts` would go stale the day the ceiling
 * moves, and raw bytes would put "10737418240" in front of a guest at a party.
 *
 * ★ AND THE ONE RULE THAT IS NOT ABOUT TRUTH: nothing about rights, ownership or
 * licenses may appear in it. The house does not ask an uploader to assert
 * provenance (no-image-rights-tracking), the license a guest grants is stated in
 * the Terms themselves, and a claim about rights on an invitation to add a
 * photograph is a warning wearing a sentence's clothes.
 */
describe("the terms line states the product's limits, from the one source", () => {
  it("names both kinds, so a guest knows video is welcome", () => {
    const line = uploadTermsLine().toLowerCase();
    expect(line).toContain("photos");
    expect(line).toContain("videos");
  });

  it("reads the ceiling off limits.ts, formatted for a person", () => {
    const line = uploadTermsLine();
    expect(line).toContain(formatBytes(MAX_UPLOAD_BYTES));
    expect(line).not.toContain(String(MAX_UPLOAD_BYTES));
  });
});

describe("the seam for the host's own cap", () => {
  it("states the HOST's number when one is given, formatted the same way", () => {
    const cap = 500 * 1024 ** 2;
    const line = uploadTermsLine(cap);
    expect(line).toContain(formatBytes(cap));
    expect(line).not.toContain(formatBytes(MAX_UPLOAD_BYTES));
  });

  it("falls back to the universal ceiling when the event has no cap", () => {
    // `events.max_upload_bytes` is nullable and the guest RPC does not return
    // it at all yet: both arrive here as nothing, and nothing must never
    // promise a guest a bigger allowance than the product has.
    expect(uploadTermsLine(null)).toBe(uploadTermsLine());
    expect(uploadTermsLine(undefined)).toBe(uploadTermsLine());
  });
});
