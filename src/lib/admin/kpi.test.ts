// @contract-for: src/lib/admin/kpi.ts
import { describe, expect, it } from "vitest";

import { buildAdminKpis, sparklinePath } from "@/lib/admin/kpi";
import type { ProfileMetricRow } from "@/lib/metrics/aggregate";

/**
 * THE HOME'S FOUR FIGURES (admin-wiring, 2026-09-20; `home=kpi`).
 *
 * What is pinned is what a number MEANS, because that is the only thing a
 * console can get wrong in a way nobody notices. The three rules:
 *
 *  - the operator is never a customer (the portal's own account skews nothing);
 *  - a fortnight is measured against the fortnight BEFORE it, not against all
 *    of history;
 *  - a figure with no history to compare against says so with `null`, and null
 *    is not zero. "No change" and "we cannot know" look identical on a card if
 *    one of them is allowed to be written as the other, and this console's
 *    whole premise is that a health signal must never invent an answer.
 */

const DAY = 86_400_000;
const NOW = new Date("2026-09-20T12:00:00Z");
const ago = (days: number) =>
  new Date(NOW.getTime() - days * DAY).toISOString();

function profile(over: Partial<ProfileMetricRow> = {}): ProfileMetricRow {
  return {
    tier: "free",
    created_at: ago(200),
    last_active_at: ago(200),
    storage_used_bytes: 0,
    stripe_subscription_id: null,
    is_admin: false,
    ...over,
  };
}

const nothing = { total: 0, recent: 0, previous: 0 };
const kpi = (rows: ProfileMetricRow[], uploads = nothing) =>
  Object.fromEntries(
    buildAdminKpis(rows, uploads, NOW).map((k) => [k.id, k]),
  );

describe("the four figures", () => {
  it("leaves the operator out of every one of them", () => {
    const k = kpi([profile({ is_admin: true, created_at: ago(1) })]);
    expect(k.accounts.value).toBe(0);
    expect(k.active.value).toBe(0);
  });

  it("counts a fortnight against the fortnight before it", () => {
    const k = kpi([
      profile({ created_at: ago(3) }),
      profile({ created_at: ago(10) }),
      profile({ created_at: ago(20) }),
      // Older than both windows: in the total, in neither delta.
      profile({ created_at: ago(90) }),
    ]);
    expect(k.accounts.value).toBe(4);
    expect(k.accounts.delta).toBe(2 - 1);
  });

  it("reads 'active' as last seen, and says so", () => {
    const k = kpi([
      profile({ last_active_at: ago(2) }),
      profile({ last_active_at: ago(20) }),
    ]);
    expect(k.active.value).toBe(1);
    expect(k.active.delta).toBe(0);
    expect(k.active.sub.toLowerCase()).toContain("last seen");
  });

  it("takes uploads whole and by fortnight from the counts it is handed", () => {
    const k = kpi([], { total: 400, recent: 30, previous: 45 });
    expect(k.uploads.value).toBe(400);
    expect(k.uploads.delta).toBe(-15);
  });

  it("gives paid subscribers NO delta, because nothing remembers last fortnight", () => {
    // The Stripe webhook is the sole writer of `tier` and writes no history
    // (billing-caps.md). A plausible arrow here would be a fabrication, which
    // is the exact failure a health console exists to remove.
    const k = kpi([
      profile({ stripe_subscription_id: "sub_1" }),
      profile(),
      profile(),
      profile(),
    ]);
    expect(k.paid.value).toBe(1);
    expect(k.paid.delta).toBeNull();
    expect(k.paid.sub).toContain("25%");
  });

  it("says something true about an empty platform rather than dividing by zero", () => {
    const k = kpi([]);
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
