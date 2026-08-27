import { describe, expect, it } from "vitest";

import { pickActiveHeading } from "@/lib/shared/pick-active-heading";

describe("pickActiveHeading", () => {
  const headings = [
    { id: "one", top: -400 },
    { id: "two", top: 40 },
    { id: "three", top: 900 },
  ];

  it("picks the last heading at/above the offset line", () => {
    expect(pickActiveHeading(headings, 80)).toBe("two");
  });

  it("falls back to the first heading before any is reached", () => {
    expect(
      pickActiveHeading(
        [
          { id: "one", top: 500 },
          { id: "two", top: 900 },
        ],
        80,
      ),
    ).toBe("one");
  });

  it("picks the final heading once everything is above the line", () => {
    expect(pickActiveHeading(headings, 1000)).toBe("three");
  });

  it("returns null with no headings", () => {
    expect(pickActiveHeading([], 80)).toBeNull();
  });
});
