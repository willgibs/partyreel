/**
 * THE REEL'S ADDRESS: `?reel` is the view, `?reel=screen` its screen posture, and every other
 * parameter on the album's link survives the reel being opened and closed.
 */
import { describe, expect, it } from "vitest";

import { readReelParam, withReelParam } from "./reel-url";

describe("readReelParam", () => {
  it("reads the view, the screen posture, and no view", () => {
    expect(readReelParam("?reel")).toBe("hand");
    expect(readReelParam("?reel=")).toBe("hand");
    expect(readReelParam("?reel=screen")).toBe("screen");
    expect(readReelParam("?reel=anything")).toBe("hand");
    expect(readReelParam("")).toBeNull();
    expect(readReelParam("?photo=abc")).toBeNull();
  });
});

describe("withReelParam", () => {
  const base = "https://partyreel.com/e/tok";

  it("writes the bare form for the view and the named one for a screen", () => {
    expect(withReelParam(base, "hand")).toBe("/e/tok?reel");
    expect(withReelParam(base, "screen")).toBe("/e/tok?reel=screen");
  });

  it("keeps every other parameter, and removes only its own", () => {
    expect(withReelParam(`${base}?pair=p1&photo=m1`, "hand")).toBe(
      "/e/tok?pair=p1&photo=m1&reel",
    );
    expect(withReelParam(`${base}?pair=p1&reel=screen#x`, null)).toBe(
      "/e/tok?pair=p1#x",
    );
    expect(withReelParam(`${base}?reel`, null)).toBe("/e/tok");
  });

  it("keeps the others as written, never re-serialised, and moves between postures", () => {
    // URLSearchParams would hand back `utm=a+b`: the address is every lane's, so only the reel
    // segment changes.
    expect(withReelParam(`${base}?utm=a%20b&photo=m1`, "hand")).toBe(
      "/e/tok?utm=a%20b&photo=m1&reel",
    );
    expect(withReelParam(`${base}?reel&utm=a%20b`, "screen")).toBe(
      "/e/tok?utm=a%20b&reel=screen",
    );
    expect(withReelParam(`${base}?reel=screen&utm=a%20b`, null)).toBe(
      "/e/tok?utm=a%20b",
    );
  });
});
