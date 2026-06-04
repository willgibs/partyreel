import { describe, expect, it } from "vitest";

import {
  clientIp,
  UNLOCK_EVENT_WINDOW_MIN,
  UNLOCK_IP_WINDOW_MIN,
  UNLOCK_MAX_FAILS_PER_EVENT,
  UNLOCK_MAX_FAILS_PER_IP,
  unlockRateDecision,
} from "@/lib/security/unlock-rate-limit";

describe("unlockRateDecision", () => {
  it("allows when both failure counts are under their thresholds", () => {
    expect(unlockRateDecision(0, 0)).toEqual({
      allowed: true,
      retryAfterSec: 0,
    });
    expect(
      unlockRateDecision(
        UNLOCK_MAX_FAILS_PER_IP - 1,
        UNLOCK_MAX_FAILS_PER_EVENT - 1,
      ),
    ).toEqual({ allowed: true, retryAfterSec: 0 });
  });

  it("blocks at/over the per-IP cap (primary guard) with the IP-window Retry-After", () => {
    expect(unlockRateDecision(UNLOCK_MAX_FAILS_PER_IP, 0)).toEqual({
      allowed: false,
      retryAfterSec: UNLOCK_IP_WINDOW_MIN * 60,
    });
    expect(unlockRateDecision(UNLOCK_MAX_FAILS_PER_IP + 5, 0).allowed).toBe(
      false,
    );
  });

  it("blocks at/over the per-event cap (distributed backstop) even when per-IP is fine", () => {
    expect(unlockRateDecision(0, UNLOCK_MAX_FAILS_PER_EVENT)).toEqual({
      allowed: false,
      retryAfterSec: UNLOCK_EVENT_WINDOW_MIN * 60,
    });
  });

  it("per-IP takes precedence over per-event in the Retry-After when both are over", () => {
    expect(
      unlockRateDecision(UNLOCK_MAX_FAILS_PER_IP, UNLOCK_MAX_FAILS_PER_EVENT)
        .retryAfterSec,
    ).toBe(UNLOCK_IP_WINDOW_MIN * 60);
  });

  it("constants tripwire — changing these is a deliberate security decision", () => {
    expect(UNLOCK_IP_WINDOW_MIN).toBe(15);
    expect(UNLOCK_EVENT_WINDOW_MIN).toBe(60);
    expect(UNLOCK_MAX_FAILS_PER_IP).toBe(20);
    expect(UNLOCK_MAX_FAILS_PER_EVENT).toBe(300);
  });
});

describe("clientIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    expect(
      clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
    ).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
