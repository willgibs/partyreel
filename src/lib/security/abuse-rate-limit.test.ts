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

  it("reel_guest_download: venue-generous scope, breadth as the harvester guard", () => {
    // The case this limiter exists to NOT break: thirty guests behind one venue NAT all tapping
    // Download on the SAME reel at the end of the night.
    expect(abuseRateDecision("reel_guest_download", 1, 30).allowed).toBe(true);
    // Runaway ceiling on that one (IP, event) still exists.
    expect(
      abuseRateDecision(
        "reel_guest_download",
        1,
        ABUSE_LIMITS.reel_guest_download.scopeMax,
      ).allowed,
    ).toBe(false);
    // One IP harvesting reels across many DISTINCT events is the real abuse shape.
    expect(
      abuseRateDecision(
        "reel_guest_download",
        ABUSE_LIMITS.reel_guest_download.breadthMax,
        0,
      ).allowed,
    ).toBe(false);
    // A venue is ONE event, so breadth can never trip on legitimate party traffic.
    expect(ABUSE_LIMITS.reel_guest_download.breadthMax).toBeGreaterThan(1);
  });

  it("contact + careers: per-IP only, and tight enough to protect the email quota", () => {
    // These two have no capability token behind them, so the limiter IS the gate (QA #14). They are
    // not event-shaped either, so breadth must be disabled: there is nothing to be broad across.
    expect(ABUSE_LIMITS.contact.breadthMax).toBe(Infinity);
    expect(ABUSE_LIMITS.careers.breadthMax).toBe(Infinity);
    expect(abuseRateDecision("contact", 9999, 1).allowed).toBe(true);

    // An honest sender, including a couple of retries on a flaky submit, is never touched.
    expect(abuseRateDecision("contact", 0, 3).allowed).toBe(true);
    expect(abuseRateDecision("careers", 0, 2).allowed).toBe(true);

    // The quota-drain shape is refused, with the window quoted back.
    const contact = abuseRateDecision(
      "contact",
      0,
      ABUSE_LIMITS.contact.scopeMax,
    );
    expect(contact.allowed).toBe(false);
    expect(contact.retryAfterSec).toBe(
      ABUSE_LIMITS.contact.scopeWindowMin * 60,
    );
    expect(
      abuseRateDecision("careers", 0, ABUSE_LIMITS.careers.scopeMax).allowed,
    ).toBe(false);

    // Applications are rarer than messages, so the careers ceiling sits below contact's.
    expect(ABUSE_LIMITS.careers.scopeMax).toBeLessThan(
      ABUSE_LIMITS.contact.scopeMax,
    );
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
