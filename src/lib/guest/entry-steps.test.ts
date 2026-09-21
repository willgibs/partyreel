import { describe, expect, it } from "vitest";

import { computeEntry, gateStepsForAccess } from "@/lib/guest/entry-steps";

describe("gateStepsForAccess", () => {
  it("maps access -> the current gate", () => {
    expect(gateStepsForAccess("none")).toEqual(["password"]);
    expect(gateStepsForAccess("teaser")).toEqual(["account"]);
    expect(gateStepsForAccess("full")).toEqual([]);
  });

  /**
   * ★ THE HOST'S FLAG REACHES THIS MACHINE ONLY THROUGH `teaser` (the identity
   * reshape, 2026-09-21). Require verified emails ON puts an unconfirmed viewer
   * at `teaser`, which is the ONE access level that produces the account gate;
   * OFF resolves every viewer to `full`, so there is no gate at all and the door
   * a guest meets is the imperative NAME step instead. If a future change ever
   * makes a names-mode event produce an `account` step, this fails.
   */
  it("a names-mode event (full for everyone) produces NO gate, so the name step is the only door", () => {
    expect(gateStepsForAccess("full")).toEqual([]);
    expect(gateStepsForAccess("teaser")).toEqual(["account"]);
    expect(gateStepsForAccess("full")).not.toContain("account");
  });
});

describe("computeEntry", () => {
  const base = { isOwner: false };

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
      }),
    ).toEqual({ steps: [], autoOpen: false });
  });

  // The demo carries no `isDemo` flag here at all (`arrival=role`, the sixth
  // batch, 2026-09-20): it always resolves `full` access, so `gateSteps` is
  // already `[]` from `gateStepsForAccess`, and it falls through the SAME
  // welcome-then-nothing path as any public event with no gate. The copy
  // swap (a role, not an invitation) is entry-modal.tsx's own `isDemo` read.
  it("demo (full access, so no gateSteps), first visit -> [welcome] + auto-open", () => {
    expect(computeEntry({ ...base, gateSteps: [], welcomeSeen: false })).toEqual(
      { steps: ["welcome"], autoOpen: true },
    );
  });

  it("demo, return visit -> [] closed (the role screen stays seen, like a welcome)", () => {
    expect(computeEntry({ ...base, gateSteps: [], welcomeSeen: true })).toEqual(
      { steps: [], autoOpen: false },
    );
  });
});
