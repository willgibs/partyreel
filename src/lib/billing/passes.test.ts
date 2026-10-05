/**
 * The Event Pass ledger math (billing-caps.md): live windows, renewal chaining, the prorated Pro credit and the
 * checkout's naming of the passes it credits are pure window derivations; these fixtures pin every boundary the
 * checkout and the webhook rely on. (The profile the windows derive is SQL's now, `recompute_pass_entitlement`,
 * proved in its migration's rolled-back check; its derivation tests left with it: two passes a slot each, a consumed
 * one none, an unopened renewal no slot but the chain's end.)
 */
import { describe, expect, it } from "vitest";

import {
  activeNowPasses,
  creditedPassIds,
  livePasses,
  MAX_CREDITED_PASSES,
  passCreditMetadata,
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
    expect(activeNowPasses(passes, new Date(T0))).toHaveLength(2);
  });

  it("a consumed pass grants nothing", () => {
    const passes = [
      pass(T0 - 30 * DAY, T0 + 335 * DAY, 2400, iso(T0 - 1 * DAY)),
    ];
    expect(livePasses(passes)).toHaveLength(0);
    expect(activeNowPasses(passes, new Date(T0))).toHaveLength(0);
  });

  it("the exact expiry instant is spent (start <= now < end)", () => {
    const passes = [pass(T0 - 365 * DAY, T0)];
    expect(activeNowPasses(passes, new Date(T0))).toHaveLength(0);
    expect(activeNowPasses(passes, new Date(T0 - 1))).toHaveLength(1);
  });

  it("a future renewal window is not a slot yet", () => {
    const passes = [
      pass(T0 - 300 * DAY, T0 + 65 * DAY), // active
      pass(T0 + 65 * DAY, T0 + 430 * DAY, 1500), // its renewal, window not open
    ];
    expect(activeNowPasses(passes, new Date(T0))).toHaveLength(1);
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

/** A pass with a real id: the naming is held to ids a checkout could have written. */
function realPass(
  n: number,
  startMs: number,
  endMs: number,
  priceCents = 2400,
): PassRow {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    start_at: iso(startMs),
    expires_at: iso(endMs),
    price_cents: priceCents,
    consumed_at: null,
  };
}

/**
 * ★ THE CREDIT NAMES EVERY PASS IT COUNTED (billing-integrity): the webhook converts exactly the passes the session
 * names, so a pass bought after the checkout (a pass tab opened before going Pro, paid after) is never consumed by a
 * replay; and the naming is whole, where it was cut at ten ids, which left a credited pass past the tenth live behind
 * Pro to come back as a pass when Pro ended.
 */
describe("the credit's names", () => {
  it("stamps the credit with every pass it counted, an expired one too (it converts at 0), and their count", () => {
    const live = realPass(1, T0 - 100 * DAY, T0 + 100 * DAY);
    const renewal = realPass(2, T0 + 100 * DAY, T0 + 465 * DAY, 1500);
    const expired = realPass(3, T0 - 400 * DAY, T0 - 35 * DAY);
    const metadata = passCreditMetadata([expired, live, renewal], new Date(T0));
    expect(metadata).toEqual({
      pass_credit_cents: String(1200 + 1500),
      credited_pass_count: "3",
      // The latest-ending first, so a cap (never met) would keep the passes worth the most.
      credited_pass_ids: [renewal.id, live.id, expired.id].join(","),
    });
    expect(creditedPassIds(metadata)).toEqual([
      renewal.id,
      live.id,
      expired.id,
    ]);
  });

  it("stamps nothing when there is no credit to give", () => {
    expect(passCreditMetadata([], new Date(T0))).toEqual({});
    expect(
      passCreditMetadata(
        [realPass(1, T0 - 400 * DAY, T0 - 35 * DAY)],
        new Date(T0),
      ),
    ).toEqual({});
  });

  it("★ names a stack past one key whole, every value within Stripe's 500 characters, and reads every id back", () => {
    const stack = Array.from({ length: 30 }, (_, n) =>
      realPass(n + 1, T0 - DAY, T0 + (100 + n) * DAY),
    );
    const metadata = passCreditMetadata(stack, new Date(T0));
    expect(Object.keys(metadata).sort()).toEqual([
      "credited_pass_count",
      "credited_pass_ids",
      "credited_pass_ids_2",
      "credited_pass_ids_3",
      "pass_credit_cents",
    ]);
    for (const value of Object.values(metadata)) {
      expect(value.length).toBeLessThanOrEqual(500);
    }
    expect(metadata.credited_pass_count).toBe("30");
    expect(new Set(creditedPassIds(metadata))).toEqual(
      new Set(stack.map((p) => p.id)),
    );
    expect(Number(metadata.pass_credit_cents)).toBe(
      passProCreditCents(stack, new Date(T0)),
    );
  });

  it("credits exactly the passes it names: past the cap the rest are neither credited nor named", () => {
    const stack = Array.from({ length: MAX_CREDITED_PASSES + 2 }, (_, n) =>
      realPass(n + 1, T0 - DAY, T0 + (10 + n) * DAY),
    );
    const metadata = passCreditMetadata(stack, new Date(T0));
    const named = creditedPassIds(metadata)!;
    expect(named).toHaveLength(MAX_CREDITED_PASSES);
    // The two ending soonest (the least credit) are the ones left out.
    expect(named).not.toContain(stack[0]!.id);
    expect(named).not.toContain(stack[1]!.id);
    expect(Number(metadata.pass_credit_cents)).toBe(
      passProCreditCents(
        stack.filter((p) => named.includes(p.id)),
        new Date(T0),
      ),
    );
    expect(Object.keys(metadata).length).toBeLessThanOrEqual(42);
  });

  it("reads an older checkout's one key of up to ten ids, which carried no count", () => {
    const ids = [1, 2, 3].map((n) => realPass(n, T0, T0 + DAY).id);
    expect(
      creditedPassIds({
        pass_credit_cents: "900",
        credited_pass_ids: ids.join(","),
      }),
    ).toEqual(ids);
  });

  it("★ names nothing it cannot be held to: no key, an id that is not one, a lost key the count gives away", () => {
    const a = realPass(1, T0, T0 + DAY).id;
    const b = realPass(2, T0, T0 + DAY).id;
    expect(creditedPassIds(undefined)).toBeNull();
    expect(creditedPassIds({ pass_credit_cents: "900" })).toBeNull();
    expect(creditedPassIds({ credited_pass_ids: "" })).toBeNull();
    expect(creditedPassIds({ credited_pass_ids: `${a},pass-2` })).toBeNull();
    expect(
      creditedPassIds({ credited_pass_ids: a, credited_pass_count: "2" }),
    ).toBeNull();
    // A second key past a missing one is a lost key, never read.
    expect(
      creditedPassIds({
        credited_pass_ids: a,
        credited_pass_ids_3: b,
        credited_pass_count: "2",
      }),
    ).toBeNull();
    // Each pass once, however often a key lists it.
    expect(
      creditedPassIds({ credited_pass_ids: `${a},${a.toUpperCase()}` }),
    ).toEqual([a]);
  });
});
