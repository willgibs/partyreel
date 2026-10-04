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
  planWithBilling,
  proFitLine,
  refusalSentence,
  replacesCap,
} from "./storage-guard";

/**
 * THE STORAGE GUARD'S RULE, pinned by behaviour (Will, 2026-09-22: no plan change
 * leaves a host storing more than the new cap). Nobody holds 50 GB of test media,
 * so these cases ARE the proof the refusal exists; the routes' own tests pin that
 * each door calls this and answers with what it returns.
 *
 * Copy is never pinned: the sentence's NUMBERS and the size it names are
 * facts derived from tiers.ts, so those are what the cases read.
 */

const pro50 = planById("pro_50");
const pro200 = planById("pro_200");
const pro1tb = planById("pro_1tb");
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
  it("refuses 70 GB into Pro 50 GB and names what to remove and what fits", () => {
    const refusal = refused(70 * GIGABYTE, "pro_50");
    expect(refusal).toMatchObject({
      code: "over_new_cap",
      planId: "pro_50",
      storedBytes: 70 * GIGABYTE,
      capBytes: pro50.storageBytes,
      gapBytes: 20 * GIGABYTE,
      fits: ["pro_200", "pro_1tb"],
    });
    // The sentence carries the same facts: stored, the cap, the gap, the SMALLEST fit.
    for (const fact of ["70 GB", formatBytes(pro50.storageBytes), "20 GB"]) {
      expect(refusal.message).toContain(fact);
    }
    expect(refusal.message).toContain(pro200.name);
    expect(refusal.message).not.toContain(pro1tb.name);
  });

  it("offers the fitting sizes at the cadence the host chose", () => {
    const refusal = refused(70 * GIGABYTE, "pro_50_yr");
    expect(refusal.fits).toEqual(["pro_200_yr", "pro_1tb_yr"]);
  });

  it("names no plan when nothing fits, only what to remove", () => {
    const refusal = refused(TERABYTE + 300 * GIGABYTE, "pro_1tb");
    expect(refusal.fits).toEqual([]);
    expect(refusal.message).toContain("300 GB");
    expect(refusal.message).not.toMatch(/choose/i);
  });

  it("lets a host at exactly the cap through, and refuses one byte over", () => {
    expect(checkPlanChange(pro50.storageBytes, pro50)).toEqual({ ok: true });
    expect(checkPlanChange(pro50.storageBytes + 1, pro50).ok).toBe(false);
  });
});

describe("the plain cap, never the write headroom", () => {
  it("refuses bytes that sit inside the 10% upload headroom", () => {
    // create_media would still ACCEPT an upload here (cap + 10%), but that slack
    // is a courtesy at write time, not room a host may buy into.
    const insideHeadroom = pro50.storageBytes + 2 * GIGABYTE;
    expect(insideHeadroom).toBeLessThan(
      capWithWriteHeadroom(pro50.storageBytes),
    );
    expect(checkPlanChange(insideHeadroom, pro50).ok).toBe(false);
  });
});

describe("the rule is tier-blind", () => {
  it("meets a Free host in the over-cap grace exactly as it meets anyone", () => {
    // A lapsed Pro left holding 70 GB on Free: the check never reads a tier,
    // only what is stored against the plan being bought.
    const graceStored = 70 * GIGABYTE;
    expect(checkPlanChange(graceStored, pro50).ok).toBe(false);
    expect(checkPlanChange(graceStored, pro200)).toEqual({ ok: true });
  });
});

describe("the fitting sizes", () => {
  it("lists every size for an empty account and only the big ones for a big one", () => {
    expect(fittingProPlans(0).map((p) => p.id)).toEqual([
      "pro_50",
      "pro_200",
      "pro_1tb",
    ]);
    expect(fittingProPlans(600 * GIGABYTE).map((p) => p.id)).toEqual([
      "pro_1tb",
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
    const sentence = refusalSentence(70 * GIGABYTE, pro50, pro200);
    expect(sentence).toContain(pro50.name);
    expect(sentence).toContain(pro200.name);
  });

  it("names which price it offers, since a size has two", () => {
    // storage-r2's note: "or choose Pro 500 GB" sent a host already on Pro 500 GB
    // monthly to what she had, when it meant the yearly price.
    const yearly = planById("pro_200_yr");
    expect(refusalSentence(70 * GIGABYTE, pro50, yearly)).toContain(
      planWithBilling(yearly),
    );
    expect(planWithBilling(yearly)).not.toBe(planWithBilling(pro200));
    // A plan with no cadence is its name.
    expect(planWithBilling(pass)).toBe(pass.name);
  });
});

describe("the Pro price list's fit line", () => {
  // Priya's account on the host-storage board: 110.83 GB across four events.
  const stored = 110.83 * GIGABYTE;

  it("offers nothing when the size that fits is her own plan", () => {
    // On Pro 200 GB monthly, the line names what to remove for Pro 50 GB and
    // never sends her to the plan she is on.
    const line = proFitLine(stored, pro200);
    expect(line).toContain(pro50.name);
    expect(line).toContain("60.9 GB");
    expect(line).not.toMatch(/choose/i);
  });

  it("reads at her billing, and names the billing of what it offers", () => {
    const line = proFitLine(stored, planById("pro_1tb_yr"));
    expect(line).toContain(planWithBilling(planById("pro_200_yr")));
    expect(line).not.toContain(planWithBilling(pro200));
  });

  it("says nothing when every size holds what she stores", () => {
    expect(proFitLine(40 * GIGABYTE, pro200)).toBeNull();
  });

  it("reads at the billing the list shows, so a yearly view offers a yearly price", () => {
    // host-storage r2 (`prices=sizes` under one Monthly / Yearly toggle): on Pro 200 GB
    // monthly, the yearly view's way out is her own size, yearly, a real switch.
    const line = proFitLine(stored, pro200, "year");
    expect(line).toContain(planWithBilling(planById("pro_200_yr")));
    expect(line).not.toContain(planWithBilling(pro200));
  });
});

describe("one number, one rounding", () => {
  it("prints what she stores one way, in the refusal as everywhere else", () => {
    // 110.83 GB read 110.8 GB on the meter (nearest) and 110.9 GB in the refusal
    // (up). The meter, the Plan card, the refusal and the list's All print what
    // she stores through formatBytesUp now, and the refusal carries that figure.
    const stored = 110.83 * GIGABYTE;
    expect(formatBytesUp(stored)).toBe("110.9 GB");
    expect(refusalSentence(stored, pro50, null)).toContain("110.9 GB");
  });
});

describe("a refusal read back on the client", () => {
  it("round-trips the route's payload", () => {
    const refusal = refused(70 * GIGABYTE, "pro_50");
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
