/**
 * THE GERMAN RUNTIME IS ONE SIMULATION (crumbs-49): the numbers and the dates were two helpers, one in
 * `utils.test.ts` and one here, and the dates' could not be `new`ed. Every test that proves a pinned formatter reads
 * the same in another runtime stands on this, so what it promises is pinned here: German wherever a call names no
 * locale, the call's own locale where it does, either spelling of a formatter, and the real runtime back after
 * `vi.restoreAllMocks()`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  runAsGermanNumberRuntime,
  runAsGermanRuntime,
} from "@/lib/test-utils/german-runtime";

afterEach(() => {
  vi.restoreAllMocks();
});

// Noon UTC on the first of June, read in UTC so the process's zone says nothing.
const DAY = new Date(Date.UTC(2026, 5, 1, 12, 0, 0));
const LONG = {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
} as const;
const UTC = { timeZone: "UTC" } as const;

describe("runAsGermanRuntime", () => {
  it("prints a number in German wherever no locale is named", () => {
    runAsGermanRuntime();
    expect((21_943).toLocaleString()).toBe("21.943");
    expect((1234.5).toLocaleString(undefined)).toBe("1.234,5");
    expect(new Intl.NumberFormat().format(21_943)).toBe("21.943");
    expect(Intl.NumberFormat().format(21_943)).toBe("21.943");
  });

  it("prints a date in German wherever no locale is named", () => {
    runAsGermanRuntime();
    expect(DAY.toLocaleDateString(undefined, LONG)).toBe("1. Juni 2026");
    expect(DAY.toLocaleDateString(undefined, UTC)).toBe("1.6.2026");
    expect(DAY.toLocaleTimeString(undefined, UTC)).toBe("12:00:00");
    expect(DAY.toLocaleString(undefined, UTC)).toBe("1.6.2026, 12:00:00");
    expect(new Intl.DateTimeFormat(undefined, LONG).format(DAY)).toBe(
      "1. Juni 2026",
    );
    expect(Intl.DateTimeFormat(undefined, LONG).format(DAY)).toBe(
      "1. Juni 2026",
    );
  });

  it("keeps the locale a call names, for a number and for a date", () => {
    runAsGermanRuntime();
    expect((21_943).toLocaleString("en-US")).toBe("21,943");
    expect(new Intl.NumberFormat("en-US").format(21_943)).toBe("21,943");
    expect(DAY.toLocaleDateString("en-US", LONG)).toBe("June 1, 2026");
    expect(DAY.toLocaleString("en-US", UTC)).toBe("6/1/2026, 12:00:00 PM");
    expect(new Intl.DateTimeFormat("en-US", LONG).format(DAY)).toBe(
      "June 1, 2026",
    );
  });

  it("hands its options through, German or named", () => {
    runAsGermanRuntime();
    expect(
      (0.5).toLocaleString(undefined, { style: "percent" }).replace(/\s/g, ""),
    ).toBe("50%");
    expect(DAY.toLocaleDateString(undefined, { ...UTC, weekday: "long" })).toBe(
      "Montag",
    );
  });

  it("gives this runtime's own locale back once the mocks are restored", () => {
    const own = {
      number: (21_943).toLocaleString(),
      format: new Intl.NumberFormat().format(21_943),
      date: DAY.toLocaleDateString(undefined, LONG),
      formatted: new Intl.DateTimeFormat(undefined, LONG).format(DAY),
    };
    runAsGermanRuntime();
    expect((21_943).toLocaleString()).toBe("21.943");
    vi.restoreAllMocks();
    expect((21_943).toLocaleString()).toBe(own.number);
    expect(new Intl.NumberFormat().format(21_943)).toBe(own.format);
    expect(DAY.toLocaleDateString(undefined, LONG)).toBe(own.date);
    expect(new Intl.DateTimeFormat(undefined, LONG).format(DAY)).toBe(
      own.formatted,
    );
  });
});

describe("runAsGermanNumberRuntime", () => {
  it("moves the numbers and leaves the dates in this runtime's own locale", () => {
    const own = {
      date: DAY.toLocaleDateString(undefined, LONG),
      formatted: new Intl.DateTimeFormat(undefined, LONG).format(DAY),
    };
    runAsGermanNumberRuntime();
    expect((21_943).toLocaleString()).toBe("21.943");
    expect(new Intl.NumberFormat().format(21_943)).toBe("21.943");
    expect(DAY.toLocaleDateString(undefined, LONG)).toBe(own.date);
    expect(new Intl.DateTimeFormat(undefined, LONG).format(DAY)).toBe(
      own.formatted,
    );
  });
});
