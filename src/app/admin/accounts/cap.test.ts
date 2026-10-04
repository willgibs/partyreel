import { describe, expect, it } from "vitest";

import { GIGABYTE, MEGABYTE, planById } from "@/lib/constants/tiers";

import { accountCap, capLabel } from "./cap";

/**
 * ★ THE OPERATOR'S CAP COLUMN SAYS EACH ACCOUNT'S REAL CAP (red-team 52's LOW: "reads a null storage_cap_bytes as
 * 'Unlimited' for every account, Free included"). Only a Pro with no cap on record is unmetered.
 */
describe("the cap an account is held to", () => {
  it("★ a Free profile's null column is the Free cap, never Unlimited", () => {
    expect(accountCap("free", null)).toBe(planById("free").storageBytes);
    expect(capLabel(accountCap("free", null))).toBe("100 MB");
  });

  it("a pass holder's null is one pass's room, and her stacked column is its own", () => {
    expect(accountCap("event_pass", null)).toBe(
      planById("event_pass").storageBytes,
    );
    expect(accountCap("event_pass", 75 * GIGABYTE)).toBe(75 * GIGABYTE);
    expect(capLabel(accountCap("event_pass", null))).toBe("25 GB");
  });

  it("a Pro's written cap is the cap, and a Pro with none on record is the one Unlimited", () => {
    expect(accountCap("pro", planById("pro_200").storageBytes)).toBe(
      200 * GIGABYTE,
    );
    expect(accountCap("pro", null)).toBeNull();
    expect(capLabel(null)).toBe("Unlimited");
  });

  it("reads the retired `max` as Pro and anything unknown as Free, as every other surface does", () => {
    expect(accountCap("max", null)).toBeNull();
    expect(accountCap("something-new", null)).toBe(100 * MEGABYTE);
  });

  it("an explicit column wins over the tier's default, whatever the tier", () => {
    expect(accountCap("free", 250 * MEGABYTE)).toBe(250 * MEGABYTE);
  });
});
