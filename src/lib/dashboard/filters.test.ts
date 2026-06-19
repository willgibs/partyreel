import { describe, expect, it } from "vitest";

import { resolveInitialFilter } from "./filters";

describe("resolveInitialFilter", () => {
  it("defaults to 'all' when nothing is set", () => {
    expect(resolveInitialFilter(undefined, undefined)).toBe("all");
  });

  it("honors a valid new ?filter=", () => {
    expect(resolveInitialFilter(undefined, "uploads")).toBe("uploads");
    expect(resolveInitialFilter(undefined, "trash")).toBe("trash");
    expect(resolveInitialFilter(undefined, "all")).toBe("all");
  });

  it("translates a legacy ?tab= (deleted -> trash, rest 1:1)", () => {
    expect(resolveInitialFilter("deleted", undefined)).toBe("trash");
    expect(resolveInitialFilter("events", undefined)).toBe("events");
    expect(resolveInitialFilter("likes", undefined)).toBe("likes");
  });

  it("prefers the new ?filter= over a legacy ?tab=", () => {
    expect(resolveInitialFilter("deleted", "events")).toBe("events");
  });

  it("falls back to 'all' on invalid values", () => {
    expect(resolveInitialFilter("bogus", undefined)).toBe("all");
    expect(resolveInitialFilter(undefined, "bogus")).toBe("all");
    expect(resolveInitialFilter("", "")).toBe("all");
  });
});
