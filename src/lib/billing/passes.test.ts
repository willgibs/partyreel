/**
 * The Event Pass ledger math (ADR-0025): stacking slots, renewal chaining, and the
 * prorated Pro credit are all pure window derivations — these fixtures pin every
 * boundary the webhook and sweeps rely on.
 */
import { describe, expect, it } from "vitest";

import {
  activeNowPasses,
  derivePassEntitlement,
  livePasses,
  PASS_STORAGE_BYTES,
  passChainExpiry,
  passProCreditCents,
  passWindowForPurchase,
  type PassRow,
} from "./passes";

const DAY = 86_400_000;
const T0 = Date.parse("2026-08-27T00:00:00.000Z");

function iso(msValue: number): string {
  return new Date(msValue).toISOString();
}

let seq = 0;
function pass(
  startMs: number,
  endMs: number,
  priceCents = 2400,
  consumedAt: string | null = null,
): PassRow {
  seq += 1;
  return {
    id: `pass-${seq}`,
    start_at: iso(startMs),
    expires_at: iso(endMs),
    price_cents: priceCents,
    consumed_at: consumedAt,
  };
}

describe("active windows + stacking", () => {
  it("counts each concurrent live window as a slot", () => {
    const passes = [
      pass(T0 - 30 * DAY, T0 + 335 * DAY),
      pass(T0 - 1 * DAY, T0 + 364 * DAY),
    ];
    const ent = derivePassEntitlement(passes, new Date(T0));
    expect(ent.activeCount).toBe(2);
    expect(ent.tier).toBe("event_pass");
    expect(ent.storageCapBytes).toBe(2 * PASS_STORAGE_BYTES);
    expect(ent.eventSlots).toBe(2);
  });

  it("a consumed pass grants nothing", () => {
    const passes = [
      pass(T0 - 30 * DAY, T0 + 335 * DAY, 2400, iso(T0 - 1 * DAY)),
    ];
    expect(livePasses(passes)).toHaveLength(0);
    const ent = derivePassEntitlement(passes, new Date(T0));
    expect(ent).toEqual({
      activeCount: 0,
      tier: "free",
      storageCapBytes: null,
      eventSlots: null,
      tierExpiresAt: null,
    });
  });

  it("the exact expiry instant is spent (start <= now < end)", () => {
    const passes = [pass(T0 - 365 * DAY, T0)];
    expect(activeNowPasses(passes, new Date(T0))).toHaveLength(0);
    expect(activeNowPasses(passes, new Date(T0 - 1))).toHaveLength(1);
  });

  it("a future renewal window is not a slot yet, but keeps the chain expiry", () => {
    const passes = [
      pass(T0 - 300 * DAY, T0 + 65 * DAY), // active
      pass(T0 + 65 * DAY, T0 + 430 * DAY, 1500), // its renewal, window not open
    ];
    const ent = derivePassEntitlement(passes, new Date(T0));
    expect(ent.activeCount).toBe(1);
    expect(ent.storageCapBytes).toBe(PASS_STORAGE_BYTES);
    expect(ent.tierExpiresAt).toBe(iso(T0 + 430 * DAY));
  });

  it("chain expiry ignores windows already fully behind now", () => {
    const passes = [pass(T0 - 400 * DAY, T0 - 35 * DAY)];
    expect(passChainExpiry(passes, new Date(T0))).toBeNull();
  });
});

describe("purchase windows", () => {
  it("an initial purchase opens a fresh term at the purchase time", () => {
    const w = passWindowForPurchase("initial", [], T0, 365);
    expect(w.startAt).toBe(iso(T0));
    expect(w.expiresAt).toBe(iso(T0 + 365 * DAY));
  });

  it("a renewal continues the soonest-expiring ACTIVE pass, never resetting", () => {
    const passes = [
      pass(T0 - 300 * DAY, T0 + 65 * DAY),
      pass(T0 - 100 * DAY, T0 + 265 * DAY),
    ];
    const w = passWindowForPurchase("renewal", passes, T0, 365);
    expect(w.startAt).toBe(iso(T0 + 65 * DAY));
    expect(w.expiresAt).toBe(iso(T0 + 65 * DAY + 365 * DAY));
  });

  it("a renewal with nothing active degrades to a fresh term (never fail a paid purchase)", () => {
    const passes = [pass(T0 - 400 * DAY, T0 - 35 * DAY)];
    const w = passWindowForPurchase("renewal", passes, T0, 365);
    expect(w.startAt).toBe(iso(T0));
    expect(w.expiresAt).toBe(iso(T0 + 365 * DAY));
  });
});

describe("prorated Pro credit", () => {
  it("credits the unused fraction of one pass at its own paid price", () => {
    // Half the window remains -> half of $24 = $12.00.
    const passes = [pass(T0 - 100 * DAY, T0 + 100 * DAY)];
    expect(passProCreditCents(passes, new Date(T0))).toBe(1200);
  });

  it("sums per-pass credits across a stack, flooring each pass separately", () => {
    const passes = [
      pass(T0 - 100 * DAY, T0 + 100 * DAY), // 1200
      pass(T0 - 292 * DAY, T0 + 73 * DAY), // 73/365 x 2400 = 480
    ];
    expect(passProCreditCents(passes, new Date(T0))).toBe(1200 + 480);
  });

  it("a not-yet-open renewal window credits its FULL price", () => {
    const passes = [
      pass(T0 - 300 * DAY, T0 + 65 * DAY),
      pass(T0 + 65 * DAY, T0 + 430 * DAY, 1500),
    ];
    // 65/365 x 2400 = 427 (floored) + full 1500.
    expect(passProCreditCents(passes, new Date(T0))).toBe(427 + 1500);
  });

  it("prorates off the price ACTUALLY paid (promo-code purchase)", () => {
    const passes = [pass(T0 - 100 * DAY, T0 + 100 * DAY, 1200)];
    expect(passProCreditCents(passes, new Date(T0))).toBe(600);
  });

  it("expired and consumed passes credit zero", () => {
    const passes = [
      pass(T0 - 400 * DAY, T0 - 35 * DAY),
      pass(T0 - 100 * DAY, T0 + 100 * DAY, 2400, iso(T0 - DAY)),
      pass(T0 - 365 * DAY, T0),
    ];
    expect(passProCreditCents(passes, new Date(T0))).toBe(0);
  });

  it("day zero credits the full price, never more", () => {
    const passes = [pass(T0, T0 + 365 * DAY)];
    expect(passProCreditCents(passes, new Date(T0))).toBe(2400);
  });
});
