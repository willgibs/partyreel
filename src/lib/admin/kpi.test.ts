import { describe, expect, it } from "vitest";

import {
  buildAdminKpis,
  sparklinePath,
  type FortnightAccounts,
} from "@/lib/admin/kpi";

/**
 * THE HOME'S FOUR FIGURES (admin-wiring, 2026-09-20; `home=kpi`).
 *
 * What is pinned is what a number MEANS, because that is the only thing a
 * console can get wrong in a way nobody notices. The rules:
 *
 *  - a fortnight is measured against the fortnight BEFORE it, not against all
 *    of history;
 *  - a figure with no history to compare against says so with `null`, and null
 *    is not zero. "No change" and "we cannot know" look identical on a card if
 *    one of them is allowed to be written as the other, and this console's
 *    whole premise is that a health signal must never invent an answer;
 *  - the operator is never a customer: since the 1,000-row round (2026-09-23)
 *    the database counts the accounts, the operator left out, and that SQL is
 *    pinned in `db/queries/metrics.test.ts`; these figures take its counts as
 *    they come, past any row cap.
 */

function accounts(over: Partial<FortnightAccounts> = {}): FortnightAccounts {
  return {
    total: 0,
    newAccounts: 0,
    newAccountsBefore: 0,
    active: 0,
    activeBefore: 0,
    paid: 0,
    ...over,
  };
}

const nothing = { total: 0, recent: 0, previous: 0 };
const kpi = (counted: FortnightAccounts, uploads = nothing) =>
  Object.fromEntries(buildAdminKpis(counted, uploads).map((k) => [k.id, k]));

describe("the four figures", () => {
  it("counts a fortnight against the fortnight before it", () => {
    const k = kpi(accounts({ total: 4, newAccounts: 2, newAccountsBefore: 1 }));
    expect(k.accounts.value).toBe(4);
    expect(k.accounts.delta).toBe(2 - 1);
  });

  it("takes every account the database counted, past 1,000", () => {
    const k = kpi(accounts({ total: 2500, newAccounts: 1200 }));
    expect(k.accounts.value).toBe(2500);
    expect(k.accounts.delta).toBe(1200);
  });

  it("reads 'active' as last seen, and says so", () => {
    const k = kpi(accounts({ total: 2, active: 1, activeBefore: 1 }));
    expect(k.active.value).toBe(1);
    expect(k.active.delta).toBe(0);
    expect(k.active.sub.toLowerCase()).toContain("last seen");
  });

  it("takes uploads whole and by fortnight from the counts it is handed", () => {
    const k = kpi(accounts(), { total: 400, recent: 30, previous: 45 });
    expect(k.uploads.value).toBe(400);
    expect(k.uploads.delta).toBe(-15);
  });

  it("gives paid subscribers NO delta, because nothing remembers last fortnight", () => {
    // The Stripe webhook is the sole writer of `tier` and writes no history
    // (billing-caps.md). A plausible arrow here would be a fabrication, which
    // is the exact failure a health console exists to remove.
    const k = kpi(accounts({ total: 4, paid: 1 }));
    expect(k.paid.value).toBe(1);
    expect(k.paid.delta).toBeNull();
    expect(k.paid.sub).toContain("25%");
  });

  it("says something true about an empty platform rather than dividing by zero", () => {
    const k = kpi(accounts());
    expect(k.paid.value).toBe(0);
    expect(k.paid.sub).toBe("No accounts yet");
  });
});

describe("the sparkline", () => {
  it("draws one point per day, in order", () => {
    const d = sparklinePath([0, 1, 2], 100, 10);
    expect(d.startsWith("M 0 ")).toBe(true);
    expect(d.match(/[ML]/g)).toHaveLength(3);
    expect(d).toContain("L 100 ");
  });

  it("puts the highest count at the top of the box and the lowest at the bottom", () => {
    // y grows downward in SVG, so the tallest day is the smallest y.
    const [, , low, , , high] = sparklinePath([0, 4], 100, 40).split(/\s+/);
    expect(Number(low)).toBe(40);
    expect(Number(high)).toBe(0);
  });

  it("draws a flat fortnight flat instead of dividing by zero", () => {
    // Every count equal is the common case (usually all zero): max === min, and
    // the naive scale is 0/0, which paints nothing at all.
    const d = sparklinePath([0, 0, 0], 60, 20);
    expect(d).not.toContain("NaN");
    expect(d).toBe("M 0 20 L 30 20 L 60 20");
  });

  it("draws nothing for no days at all", () => {
    expect(sparklinePath([], 100, 10)).toBe("");
  });
});
