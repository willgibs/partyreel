import { describe, expect, it } from "vitest";

import { liveFunction } from "@/lib/db/testing/migrations";
import { MAX_BURST_FILES } from "@/lib/upload/burst";

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

  it("★ the 2,000-guest wedding joins on one venue Wi-Fi in one quarter-hour, with half again to spare (upload-meter)", () => {
    // PRICING.md's largest archetype, every guest arriving on the venue's one address inside the same quarter-hour
    // (a speech's "scan the code now"), plus a second phone, a re-join, an ask or a remove each for half of them: the
    // join, the ask and the remove ride this one count, and every guest's own-uploads read there checks it.
    const WEDDING = 2_000;
    for (const hits of [0, WEDDING, WEDDING * 1.5 - 1]) {
      expect(abuseRateDecision("join", 1, hits).allowed, `${hits}`).toBe(true);
    }
    // Still a backstop: one address minting a single album's tickets without end is stopped inside the quarter-hour.
    expect(abuseRateDecision("join", 1, WEDDING * 1.5).allowed).toBe(false);
    expect(ABUSE_LIMITS.join.scopeWindowMin).toBe(15);
    // Breadth is still the scraper's guard, unchanged.
    expect(ABUSE_LIMITS.join.breadthMax).toBe(25);
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

  it("reel_clip_add: a daily per-guest-session budget, breadth disabled", () => {
    // The case this limiter exists to NOT break: a real guest adding a handful of clips over a
    // night, whatever else is happening on their venue's shared WiFi.
    expect(abuseRateDecision("reel_clip_add", 1, 5).allowed).toBe(true);
    // The per-(IP,session) daily ceiling still exists for one session hammering the route.
    expect(
      abuseRateDecision("reel_clip_add", 1, ABUSE_LIMITS.reel_clip_add.scopeMax)
        .allowed,
    ).toBe(false);
    // Breadth (distinct SESSIONS per IP) is deliberately disabled: a big party legitimately has
    // many distinct guest sessions behind one venue NAT, so it is never the scraper signal here.
    expect(ABUSE_LIMITS.reel_clip_add.breadthMax).toBe(Infinity);
    expect(
      abuseRateDecision(
        "reel_clip_add",
        9999,
        ABUSE_LIMITS.reel_clip_add.scopeMax - 1,
      ).allowed,
    ).toBe(true);
  });

  it("★ presign: a guest's own hour of files, its line at the edge, breadth disabled", () => {
    // A week's trip roll sent at once is a few hundred: it never meets the line.
    expect(abuseRateDecision("presign", 1, 500).allowed).toBe(true);
    // The edge: under the line a burst goes (counted whole as it asks); at it, the next is refused, the hour quoted.
    expect(abuseRateDecision("presign", 1, 999).allowed).toBe(true);
    expect(abuseRateDecision("presign", 1, 1_000)).toEqual({
      allowed: false,
      retryAfterSec: 3600,
    });
    expect(ABUSE_LIMITS.presign.scopeWindowMin).toBe(60);
    // One ticket is one album, and a venue's guests share one address: breadth is never the signal here.
    expect(ABUSE_LIMITS.presign.breadthMax).toBe(Infinity);
    expect(abuseRateDecision("presign", 9999, 0).allowed).toBe(true);
  });

  it("★ presign: its line is at most a twentieth of the host's hourly breaker, so spending it takes twenty tickets", () => {
    // The breaker this kind exists for, read from its one home: the winning `meter_upload`, an account's uploads a
    // clock hour across every album of the host's. Lower it, or raise the line, and one ticket spends a bigger share
    // of every other guest's hour: this fails and says so.
    const breaker = Number(
      liveFunction("meter_upload").code.match(
        /c_uploads_an_hour constant integer := (\d+);/,
      )?.[1],
    );
    expect(breaker).toBeGreaterThan(0);
    expect(ABUSE_LIMITS.presign.scopeMax * 20).toBeLessThanOrEqual(breaker);
    // A burst counted whole at the line takes one ticket at most a burst past it, still nowhere near the breaker.
    expect(ABUSE_LIMITS.presign.scopeMax + MAX_BURST_FILES - 1).toBeLessThan(
      breaker / 10,
    );
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

  it("email_change: per account, six an hour for requests and code attempts together, breadth disabled", () => {
    // An account is not venue-shaped: there is nothing to be broad across.
    expect(ABUSE_LIMITS.email_change.breadthMax).toBe(Infinity);
    expect(abuseRateDecision("email_change", 9999, 0).allowed).toBe(true);

    // An honest change is three calls (the request and two codes); a full redo is three more.
    for (let spent = 0; spent < 6; spent++) {
      expect(abuseRateDecision("email_change", 0, spent).allowed).toBe(true);
    }
    // The seventh in an hour is refused, the hour quoted back.
    expect(abuseRateDecision("email_change", 0, 6)).toEqual({
      allowed: false,
      retryAfterSec: 3600,
    });
  });
});
