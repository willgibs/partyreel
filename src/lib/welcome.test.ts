import { describe, expect, it } from "vitest";

import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { shouldShowWelcome } from "@/lib/welcome";

describe("first-time welcome", () => {
  it("shows the welcome until welcomed_at is set", () => {
    expect(shouldShowWelcome(null)).toBe(true);
    expect(shouldShowWelcome(undefined)).toBe(true);
    expect(shouldShowWelcome("")).toBe(true);
    expect(shouldShowWelcome("2026-05-30T00:00:00Z")).toBe(false);
  });

  it("the how-it-works story is three single-sourced steps", () => {
    expect(HOW_IT_WORKS).toHaveLength(3);
    for (const step of HOW_IT_WORKS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
      expect(step.icon).toBeTruthy(); // a lucide icon component
    }
  });
});
