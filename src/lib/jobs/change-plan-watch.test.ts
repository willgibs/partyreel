/**
 * The change-plan configuration's record, read back strictly, and its words (billing-orphans): what the run keeps in
 * `job_runs.counts.change_plan` comes back as written or not at all, so the card never draws a guess.
 */
import { describe, expect, it } from "vitest";

import {
  changePlanMailKey,
  changePlanNeedsALook,
  changePlanNote,
  parseStoredChangePlan,
  storedChangePlan,
} from "@/lib/jobs/change-plan-watch";

const MISSING = {
  state: "missing" as const,
  configuration_id: "bpc_x",
  sold: 6,
  missing: [
    {
      plan_id: "pro_200_yr",
      label: "Pro 200 GB, $X/yr",
      price_id: "price_b",
    },
    {
      plan_id: "pro_50",
      label: "Pro 50 GB, $Y/mo",
      price_id: "price_a",
    },
  ],
};

describe("the record", () => {
  it("keeps each state as the check answered it, and reads it back the same", () => {
    const records = [
      storedChangePlan({ state: "whole", configurationId: "bpc_x", sold: 6 }),
      storedChangePlan({
        state: "missing",
        configurationId: "bpc_x",
        sold: 6,
        missing: [
          {
            planId: "pro_50",
            label: "Pro 50 GB, $Y/mo",
            priceId: "price_a",
          },
        ],
      }),
      storedChangePlan({ state: "no_configuration" }),
      storedChangePlan({ state: "unread", message: "x".repeat(400) }),
    ];
    expect(records[3]).toEqual({ state: "unread", message: "x".repeat(200) });
    for (const record of records) {
      expect(parseStoredChangePlan(JSON.parse(JSON.stringify(record)))).toEqual(
        record,
      );
    }
  });

  it("reads anything it never wrote as nothing", () => {
    for (const value of [
      null,
      "missing",
      [],
      { state: "whole" },
      { state: "missing", configuration_id: "bpc_x", sold: 6, missing: [] },
      { ...MISSING, missing: [{ plan_id: "p", label: "", price_id: "x" }] },
      { state: "unread" },
      { state: "something" },
    ]) {
      expect(parseStoredChangePlan(value)).toBeNull();
    }
  });
});

describe("the words", () => {
  it("say nothing when whole, name each price missing, and the tag missing", () => {
    expect(
      changePlanNote({ state: "whole", configuration_id: "bpc_x", sold: 6 }),
    ).toBeNull();
    expect(changePlanNote(MISSING)).toBe(
      "Change plan in Stripe: the tagged configuration (bpc_x) lacks Pro 200 GB, $X/yr (price_b), Pro 50 GB, $Y/mo (price_a), so Stripe refuses a switch to each.",
    );
    expect(changePlanNote({ state: "no_configuration" })).toMatch(
      /partyreel_purpose=change_plan/,
    );
  });

  it("waits on a person only when a switch is refused today", () => {
    expect(changePlanNeedsALook(MISSING)).toBe(true);
    expect(changePlanNeedsALook({ state: "no_configuration" })).toBe(true);
    expect(changePlanNeedsALook({ state: "unread", message: "x" })).toBe(false);
    expect(
      changePlanNeedsALook({ state: "whole", configuration_id: "b", sold: 6 }),
    ).toBe(false);
  });

  it("mails a broken set once a day: the same prices in any order are one key", () => {
    const now = new Date("2026-10-06T05:00:00Z");
    const reversed = { ...MISSING, missing: [...MISSING.missing].reverse() };
    expect(changePlanMailKey(MISSING, now)).toBe(
      "change_plan:price_a+price_b:2026-10-06",
    );
    expect(changePlanMailKey(reversed, now)).toBe(
      changePlanMailKey(MISSING, now),
    );
    expect(
      changePlanMailKey(MISSING, new Date("2026-10-07T05:00:00Z")),
    ).not.toBe(changePlanMailKey(MISSING, now));
  });
});
