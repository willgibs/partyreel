import { describe, expect, it } from "vitest";

import {
  GIGABYTE,
  TERABYTE,
  capWithWriteHeadroom,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import {
  checkPlanChange,
  fittingProPlans,
  formatBytesUp,
  parseStorageRefusal,
  refusalSentence,
  replacesCap,
} from "./storage-guard";

/**
 * THE STORAGE GUARD'S RULE, pinned by behaviour (Will, 2026-09-22: no plan change
 * leaves a host storing more than the new cap). Nobody holds 100 GB of test media,
 * so these cases ARE the proof the refusal exists; the routes' own tests pin that
 * each door calls this and answers with what it returns.
 *
 * Copy is never pinned (bible 10): the sentence's NUMBERS and the size it names are
 * facts derived from tiers.ts, so those are what the cases read.
 */

const pro100 = planById("pro_100");
const pro500 = planById("pro_500");
const pro2tb = planById("pro_2tb");
const pass = planById("event_pass");

function refused(stored: number, planId: Parameters<typeof planById>[0]) {
  const result = checkPlanChange(stored, planById(planId));
  if (result.ok) throw new Error(`expected ${planId} to be refused`);
  return result.refusal;
}

describe("which purchases the rule reaches", () => {
  it("reaches every Pro plan (both cadences) and never the Event Pass", () => {
    for (const plan of [
      ...plansForTier("pro", "month"),
      ...plansForTier("pro", "year"),
    ]) {
      expect(replacesCap(plan), plan.id).toBe(true);
    }
    expect(replacesCap(pass)).toBe(false);
  });

  it("never refuses a pass, however much the host stores (passes stack)", () => {
    // A pass only ever ADDS room, so even a host far past every cap may buy one.
    for (const stored of [0, 74 * GIGABYTE, 500 * GIGABYTE, 3 * TERABYTE]) {
      expect(checkPlanChange(stored, pass)).toEqual({ ok: true });
    }
  });
});

describe("a Pro plan is refused over its cap, with the numbers", () => {
  it("refuses 140 GB into Pro 100 GB and names what to remove and what fits", () => {
    const refusal = refused(140 * GIGABYTE, "pro_100");
    expect(refusal).toMatchObject({
      code: "over_new_cap",
      planId: "pro_100",
      storedBytes: 140 * GIGABYTE,
      capBytes: pro100.storageBytes,
      gapBytes: 40 * GIGABYTE,
      fits: ["pro_500", "pro_2tb"],
    });
    // The sentence carries the same facts: stored, the cap, the gap, the SMALLEST fit.
    for (const fact of ["140 GB", formatBytes(pro100.storageBytes), "40 GB"]) {
      expect(refusal.message).toContain(fact);
    }
    expect(refusal.message).toContain(pro500.name);
    expect(refusal.message).not.toContain(pro2tb.name);
  });

  it("offers the fitting sizes at the cadence the host chose", () => {
    const refusal = refused(140 * GIGABYTE, "pro_100_yr");
    expect(refusal.fits).toEqual(["pro_500_yr", "pro_2tb_yr"]);
  });

  it("names no plan when nothing fits, only what to remove", () => {
    const refusal = refused(2 * TERABYTE + 300 * GIGABYTE, "pro_2tb");
    expect(refusal.fits).toEqual([]);
    expect(refusal.message).toContain("300 GB");
    expect(refusal.message).not.toMatch(/choose/i);
  });

  it("lets a host at exactly the cap through, and refuses one byte over", () => {
    expect(checkPlanChange(pro100.storageBytes, pro100)).toEqual({ ok: true });
    expect(checkPlanChange(pro100.storageBytes + 1, pro100).ok).toBe(false);
  });
});

describe("the plain cap, never the write headroom", () => {
  it("refuses bytes that sit inside the 10% upload headroom", () => {
    // create_media would still ACCEPT an upload here (cap + 10%), but that slack
    // is a courtesy at write time, not room a host may buy into.
    const insideHeadroom = pro100.storageBytes + 5 * GIGABYTE;
    expect(insideHeadroom).toBeLessThan(
      capWithWriteHeadroom(pro100.storageBytes),
    );
    expect(checkPlanChange(insideHeadroom, pro100).ok).toBe(false);
  });
});

describe("the rule is tier-blind", () => {
  it("meets a Free host in the over-cap grace exactly as it meets anyone", () => {
    // A lapsed Pro left holding 140 GB on Free: the check never reads a tier,
    // only what is stored against the plan being bought.
    const graceStored = 140 * GIGABYTE;
    expect(checkPlanChange(graceStored, pro100).ok).toBe(false);
    expect(checkPlanChange(graceStored, pro500)).toEqual({ ok: true });
  });
});

describe("the fitting sizes", () => {
  it("lists every size for an empty account and only the big ones for a big one", () => {
    expect(fittingProPlans(0).map((p) => p.id)).toEqual([
      "pro_100",
      "pro_500",
      "pro_2tb",
    ]);
    expect(fittingProPlans(600 * GIGABYTE).map((p) => p.id)).toEqual([
      "pro_2tb",
    ]);
    expect(fittingProPlans(3 * TERABYTE)).toEqual([]);
  });
});

describe("the numbers are sufficient instructions", () => {
  it("rounds the stored figure and the gap UP, never down", () => {
    // 40.04 GB over must never read "remove 40 GB": doing exactly that is refused.
    expect(formatBytesUp(40.04 * GIGABYTE)).toBe("40.1 GB");
    expect(formatBytesUp(100 * GIGABYTE + 20 * 1024 ** 2)).toBe("100.1 GB");
  });

  it("prints an exact value exactly", () => {
    expect(formatBytesUp(140 * GIGABYTE)).toBe("140 GB");
    expect(formatBytesUp(2 * TERABYTE)).toBe("2 TB");
    expect(formatBytesUp(0)).toBe("0 B");
  });

  it("builds the sentence from the plan's own name and cap", () => {
    const sentence = refusalSentence(140 * GIGABYTE, pro100, pro500);
    expect(sentence).toContain(pro100.name);
    expect(sentence).toContain(pro500.name);
  });
});

describe("a refusal read back on the client", () => {
  it("round-trips the route's payload", () => {
    const refusal = refused(140 * GIGABYTE, "pro_100");
    expect(parseStorageRefusal({ ok: false, ...refusal })).toEqual(refusal);
  });

  it("refuses to render a payload whose numbers are missing", () => {
    expect(parseStorageRefusal({ code: "over_new_cap", message: "x" })).toBe(
      null,
    );
    expect(parseStorageRefusal({ code: "already_subscribed" })).toBe(null);
    expect(parseStorageRefusal("<html>")).toBe(null);
    expect(parseStorageRefusal(null)).toBe(null);
  });
});
