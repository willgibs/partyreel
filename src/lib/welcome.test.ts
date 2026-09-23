import { describe, expect, it } from "vitest";

import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import {
  isGuestFirstVisit,
  needsDisplayName,
  resolveDashboardEntry,
  shouldShowWelcome,
} from "@/lib/welcome";

describe("first-time welcome", () => {
  it("shows the welcome until welcomed_at is set", () => {
    expect(shouldShowWelcome(null)).toBe(true);
    expect(shouldShowWelcome(undefined)).toBe(true);
    expect(shouldShowWelcome("")).toBe(true);
    expect(shouldShowWelcome("2026-05-30T00:00:00Z")).toBe(false);
  });

  it("needsDisplayName is true until a non-blank name is set", () => {
    expect(needsDisplayName(null)).toBe(true);
    expect(needsDisplayName(undefined)).toBe(true);
    expect(needsDisplayName("")).toBe(true);
    expect(needsDisplayName("   ")).toBe(true);
    expect(needsDisplayName("AJ")).toBe(false);
    expect(needsDisplayName("Will Gibson")).toBe(false);
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

describe("a guest-made account's first visit (the capture's promise: the event arrives as a Guest card)", () => {
  const guest = {
    displayName: "Maya",
    welcomedAt: null,
    hostedEvents: 0,
    guestCards: 1,
  };

  it("★ leads with the dashboard, not the host tour, when the account hosts nothing and holds a Guest card", () => {
    expect(resolveDashboardEntry(guest)).toBe("guest-first-visit");
    expect(isGuestFirstVisit(guest)).toBe(true);
  });

  it("★ a nameless account still names itself at /welcome first, Guest card or not", () => {
    expect(resolveDashboardEntry({ ...guest, displayName: null })).toBe(
      "welcome",
    );
    expect(resolveDashboardEntry({ ...guest, displayName: "  " })).toBe(
      "welcome",
    );
  });

  it("an account with nothing at all takes the host tour", () => {
    expect(resolveDashboardEntry({ ...guest, guestCards: 0 })).toBe("welcome");
    expect(isGuestFirstVisit({ ...guest, guestCards: 0 })).toBe(false);
  });

  it("an account hosting an event is a host: the tour, Guest cards or not", () => {
    expect(resolveDashboardEntry({ ...guest, hostedEvents: 1 })).toBe(
      "welcome",
    );
    expect(isGuestFirstVisit({ ...guest, hostedEvents: 1 })).toBe(false);
  });

  it("a welcomed account simply lands, whatever it holds", () => {
    for (const facts of [
      { ...guest, welcomedAt: "2026-09-23T10:00:00Z" },
      {
        ...guest,
        welcomedAt: "2026-09-23T10:00:00Z",
        guestCards: 0,
        hostedEvents: 3,
      },
    ]) {
      expect(resolveDashboardEntry(facts)).toBe("dashboard");
      expect(isGuestFirstVisit(facts)).toBe(false);
    }
  });
});
