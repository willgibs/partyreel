import { describe, expect, it } from "vitest";

import { computeEntry, gateStepsForAccess } from "@/lib/guest/entry-steps";

describe("gateStepsForAccess", () => {
  it("maps access -> the current gate", () => {
    expect(gateStepsForAccess("none")).toEqual(["password"]);
    expect(gateStepsForAccess("teaser")).toEqual(["account"]);
    expect(gateStepsForAccess("full")).toEqual([]);
  });
});

describe("computeEntry", () => {
  const base = { isOwner: false, isDemo: false };

  it("public, first visit -> [welcome] + auto-open", () => {
    expect(
      computeEntry({ ...base, gateSteps: [], welcomeSeen: false }),
    ).toEqual({ steps: ["welcome"], autoOpen: true });
  });

  it("public, return visit -> [] closed", () => {
    expect(computeEntry({ ...base, gateSteps: [], welcomeSeen: true })).toEqual(
      { steps: [], autoOpen: false },
    );
  });

  it("account-required signed-out, first visit -> [welcome, account] + auto-open", () => {
    expect(
      computeEntry({ ...base, gateSteps: ["account"], welcomeSeen: false }),
    ).toEqual({ steps: ["welcome", "account"], autoOpen: true });
  });

  it("account-required signed-out, return visit -> [account], NOT auto-open (browse the teaser)", () => {
    expect(
      computeEntry({ ...base, gateSteps: ["account"], welcomeSeen: true }),
    ).toEqual({ steps: ["account"], autoOpen: false });
  });

  it("password, first visit -> [welcome, password] + auto-open", () => {
    expect(
      computeEntry({ ...base, gateSteps: ["password"], welcomeSeen: false }),
    ).toEqual({ steps: ["welcome", "password"], autoOpen: true });
  });

  it("password, return visit -> [password] + auto-open (it is the gated page)", () => {
    expect(
      computeEntry({ ...base, gateSteps: ["password"], welcomeSeen: true }),
    ).toEqual({ steps: ["password"], autoOpen: true });
  });

  it("owner -> [] even with a gate + unseen welcome", () => {
    expect(
      computeEntry({
        gateSteps: ["account"],
        welcomeSeen: false,
        isOwner: true,
        isDemo: false,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  it("demo -> []", () => {
    expect(
      computeEntry({
        gateSteps: [],
        welcomeSeen: false,
        isOwner: false,
        isDemo: true,
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });
});
