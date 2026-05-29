import { describe, expect, it } from "vitest";

import {
  INACTIVE_DAYS,
  WARN_BEFORE_DAYS,
  inactivityAction,
} from "@/lib/lifecycle/inactivity";

const DAY = 86_400_000;
const now = Date.UTC(2026, 0, 1);
const ageDays = (d: number) => now - d * DAY;

describe("inactivityAction", () => {
  it("'none' while recently active", () => {
    expect(inactivityAction(now, now)).toBe("none");
    expect(inactivityAction(ageDays(10), now)).toBe("none");
    expect(
      inactivityAction(ageDays(INACTIVE_DAYS - WARN_BEFORE_DAYS - 1), now),
    ).toBe("none");
  });

  it("'warn' inside the warning window before the deadline", () => {
    expect(
      inactivityAction(ageDays(INACTIVE_DAYS - WARN_BEFORE_DAYS), now),
    ).toBe("warn");
    expect(inactivityAction(ageDays(INACTIVE_DAYS - 1), now)).toBe("warn");
  });

  it("'remove' at/after the 6-month threshold", () => {
    expect(inactivityAction(ageDays(INACTIVE_DAYS), now)).toBe("remove");
    expect(inactivityAction(ageDays(INACTIVE_DAYS + 60), now)).toBe("remove");
  });
});
