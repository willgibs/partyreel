import { describe, expect, it } from "vitest";

import {
  getUseCase,
  USE_CASE_SLUGS,
  USE_CASES,
} from "@/lib/constants/use-cases";

describe("use-cases constants", () => {
  it("has unique slugs and complete text fields", () => {
    expect(new Set(USE_CASE_SLUGS).size).toBe(USE_CASE_SLUGS.length);
    expect(USE_CASES.length).toBeGreaterThan(0);
    for (const useCase of USE_CASES) {
      for (const field of [
        useCase.slug,
        useCase.navLabel,
        useCase.teaser,
        useCase.headline,
        useCase.subhead,
        useCase.intro,
        useCase.ctaTitle,
        useCase.ogTitle,
      ]) {
        expect(field.trim()).not.toBe("");
      }
      expect(useCase.nestedThemes.length).toBeGreaterThan(0);
      expect(useCase.howItHelps.length).toBeGreaterThan(0);
      for (const help of useCase.howItHelps) {
        expect(help.title.trim()).not.toBe("");
        expect(help.body.trim()).not.toBe("");
      }
      expect(useCase.faq.length).toBeGreaterThan(0);
      for (const item of useCase.faq) {
        expect(item.q.trim()).not.toBe("");
        expect(item.a.trim()).not.toBe("");
      }
    }
  });

  it("getUseCase resolves known slugs and rejects unknown", () => {
    for (const slug of USE_CASE_SLUGS) {
      expect(getUseCase(slug)?.slug).toBe(slug);
    }
    expect(getUseCase("not-a-use-case")).toBeUndefined();
  });
});
