import { describe, expect, it } from "vitest";

import { ABUSE_LIMITS, abuseRateDecision } from "./abuse-rate-limit";

describe("abuseRateDecision", () => {
  it("allows normal activity under every threshold", () => {
    expect(abuseRateDecision("join", 1, 5)).toEqual({
      allowed: true,
      retryAfterSec: 0,
    });
    expect(abuseRateDecision("report", 1, 1).allowed).toBe(true);
    expect(abuseRateDecision("capture", 0, 3).allowed).toBe(true);
  });

  it("a venue (ONE event, high volume) is NEVER blocked by breadth", () => {
    // distinctScopes = 1 (one event), even at the high end of the per-event backstop window.
    expect(
      abuseRateDecision("join", 1, ABUSE_LIMITS.join.scopeMax - 1).allowed,
    ).toBe(true);
  });

  it("blocks a scraper joining many DISTINCT events from one IP (breadth)", () => {
    const r = abuseRateDecision("join", ABUSE_LIMITS.join.breadthMax, 0);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBe(ABUSE_LIMITS.join.breadthWindowMin * 60);
  });

  it("blocks a single-event flood via the per-(IP,event) backstop", () => {
    const r = abuseRateDecision("join", 1, ABUSE_LIMITS.join.scopeMax);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterSec).toBe(ABUSE_LIMITS.join.scopeWindowMin * 60);
  });

  it("report: tighter per-event cap + cross-event report-bomb guard", () => {
    expect(
      abuseRateDecision("report", 1, ABUSE_LIMITS.report.scopeMax).allowed,
    ).toBe(false);
    expect(
      abuseRateDecision("report", ABUSE_LIMITS.report.breadthMax, 0).allowed,
    ).toBe(false);
  });

  it("capture: breadth disabled (per-IP only); per-IP cap still enforced", () => {
    expect(ABUSE_LIMITS.capture.breadthMax).toBe(Infinity);
    // A huge distinct count never trips capture (breadth disabled).
    expect(
      abuseRateDecision("capture", 9999, ABUSE_LIMITS.capture.scopeMax - 1)
        .allowed,
    ).toBe(true);
    expect(
      abuseRateDecision("capture", 0, ABUSE_LIMITS.capture.scopeMax).allowed,
    ).toBe(false);
  });

  it("reel_render: tight per-(IP,event) cap + cross-event breadth guard", () => {
    // Normal: a host rendering their own reel a few times is fine.
    expect(abuseRateDecision("reel_render", 1, 3).allowed).toBe(true);
    // A shuffle→render abuse loop on one event trips the backstop.
    expect(
      abuseRateDecision("reel_render", 1, ABUSE_LIMITS.reel_render.scopeMax)
        .allowed,
    ).toBe(false);
    // One IP forcing renders across many DISTINCT events trips breadth.
    expect(
      abuseRateDecision("reel_render", ABUSE_LIMITS.reel_render.breadthMax, 0)
        .allowed,
    ).toBe(false);
  });

  it("backstop takes precedence over breadth when both trip", () => {
    const r = abuseRateDecision(
      "join",
      ABUSE_LIMITS.join.breadthMax,
      ABUSE_LIMITS.join.scopeMax,
    );
    expect(r.allowed).toBe(false);
    // The per-scope window is reported (backstop is checked first).
    expect(r.retryAfterSec).toBe(ABUSE_LIMITS.join.scopeWindowMin * 60);
  });
});
