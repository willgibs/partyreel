import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  GIGABYTE,
  MAX_EVENTS,
  TIER_NAMES,
  planById,
  plansForTier,
  uploadsPhrase,
} from "@/lib/constants/tiers";

import { PricingSheet, type PricingPlanFacts } from "./pricing-sheet";

/**
 * WHAT THE IN-APP PRICING SURFACE IS FOR, never how it looks (a contract
 * guards function; Will retunes the rest without asking a test).
 *
 * Five things have to hold or it stops being what `app-pricing` r1 ruled on
 * 2026-09-20 and the storage guard ruled on 2026-09-22:
 *
 *  1. IT OPENS ON THE REASON IT OPENED (`first=trigger`). Knowing the trigger
 *     is the only thing keeping pricing inside the app buys us: a static
 *     /pricing cannot name the control that refused you, cannot pick a plan
 *     that clears your bytes, and cannot tell a subscriber she subscribes.
 *     Each of the three is pinned by BEHAVIOUR, not by a sentence.
 *  2. IT OPENS ON THE SMALLEST SIZE THAT FITS WHAT THE HOST STORES, whatever
 *     door opened it (the storage guard): the sheet asks the server when it
 *     opens, so a door with no byte count still offers a plan the host fits,
 *     and says which smaller sizes it skipped.
 *  3. IT CARRIES TWO CARDS AND A PRICE, AND NOT THE MARKETING PAGE
 *     (`carry=cards`, which OVERRULED the board's `fitted`): no storage
 *     selector, no cadence toggle, no table, for a host choosing a first plan.
 *     A reintroduced selector turns this red, which is the point of pinning an
 *     absence. A Pro host's six prices are three size cards under ONE
 *     Monthly / Yearly toggle (host-storage r2, `prices=sizes`: his note asked
 *     for exactly that toggle), and never a selector either.
 *  4. EVERY NUMBER COMES FROM tiers.ts. The plan ids the buy buttons carry are
 *     the ids the Stripe webhook and the SQL enforcement read, so a card
 *     selling a plan Checkout does not know is a red test rather than a 400.
 *  5. THE SECOND LAYER LEAVES, AND SAYS SO (`learn=foot`): /pricing opens in a
 *     new tab so the host keeps their place, which is the whole reason the
 *     surface exists.
 *
 * Lines are found by what they are FOR (`data-note`), never by their words.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const FREE: PricingPlanFacts = { tier: "free", hasBilling: false };
const PRO: PricingPlanFacts = { tier: "pro", hasBilling: true };
const PASS: PricingPlanFacts = { tier: "event_pass", hasBilling: true };

const PRO_SIZES = plansForTier("pro");

/** What `/api/stripe/plan-facts` would answer; null = the read fails (the Library). */
let served: PlanFacts | null = null;
/** A held read: the answer waits for it (the two seconds the real route takes when it asks Stripe). */
let gate: Promise<void> | null = null;
beforeEach(() => {
  served = null;
  gate = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (gate) await gate;
      if (url !== "/api/stripe/plan-facts" || !served) {
        return { ok: false, json: async () => ({}) };
      }
      return { ok: true, json: async () => ({ ok: true, facts: served }) };
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function facts(over: Partial<PlanFacts>): PlanFacts {
  return {
    tier: "free",
    hasBilling: false,
    passExpiry: null,
    storedBytes: 0,
    deletedBytes: 0,
    capBytes: planById("free").storageBytes,
    monthUploadedBytes: 0,
    currentPlanId: null,
    changeBlocked: null,
    ...over,
  };
}

function openSheet(
  props: Partial<React.ComponentProps<typeof PricingSheet>> = {},
) {
  render(
    <PricingSheet
      open
      onOpenChange={() => {}}
      trigger={{ kind: "plan" }}
      plan={FREE}
      {...props}
    />,
  );
  return screen.getByRole("dialog");
}

/** The Pro list's Monthly / Yearly toggle, pressed by its billing. */
const cadence = (dialog: HTMLElement, billing: "month" | "year") =>
  dialog.querySelector(`[data-cadence="${billing}"]`) as HTMLElement;

/** The ink card is the one selling a Pro plan; found by its plan id, not its look. */
const proCard = (dialog: HTMLElement, planId = PRO_SIZES[0].id) =>
  dialog.querySelector(`[data-plan="${planId}"]`) as HTMLElement;

const row = (dialog: HTMLElement, planId: string) =>
  dialog.querySelector(`[data-price-row="${planId}"]`) as HTMLElement;

describe("it opens on the reason it opened", () => {
  it("names the locked control, on the control that refused you", () => {
    // Video since the free/pro shift: the password lock this pinned is on every plan now.
    const dialog = openSheet({
      trigger: { kind: "locked", feature: "video" },
    });
    // The lock's own vocabulary reaches the heading: a host who tapped the
    // video lock must not land on a generic plan catalogue.
    expect(dialog.getAttribute("data-pricing-sheet")).toBe("locked");
    expect(
      within(dialog).getByRole("heading", { name: /video/i }),
    ).toBeInTheDocument();
  });

  it("opens on the SMALLEST Pro plan that clears the bytes, never a bigger one", () => {
    // One byte over the smallest cap has to resolve up, and a byte under must
    // not: this is the only rule stopping the app upselling past fit.
    const justOver = PRO_SIZES[0].storageBytes + 1;
    const dialog = openSheet({ trigger: { kind: "room", needed: justOver } });
    expect(proCard(dialog, PRO_SIZES[1].id)).toBeTruthy();
    expect(proCard(dialog, PRO_SIZES[0].id)).toBeNull();
  });

  it("falls back to the smallest Pro when the refusal was events, not bytes", () => {
    const dialog = openSheet({ trigger: { kind: "room" } });
    expect(proCard(dialog, PRO_SIZES[0].id)).toBeTruthy();
  });

  it("tells a subscriber she subscribes, and never offers a second subscription", async () => {
    served = facts({
      tier: "pro",
      hasBilling: true,
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
    });
    const dialog = openSheet({ plan: PRO });
    expect(
      within(dialog).getByRole("heading", {
        name: new RegExp(TIER_NAMES.pro, "i"),
      }),
    ).toBeInTheDocument();
    // No checkout card: a second subscription double-bills one cap
    // (billing-caps.md). Her moves are the six prices, three sizes at a time
    // under the toggle, and the portal keeps the card, the invoices and
    // cancelling.
    expect(dialog.querySelector("[data-plan]")).toBeNull();
    expect(dialog.querySelectorAll("[data-price-row]")).toHaveLength(3);
    expect(
      within(dialog).getByRole("button", { name: /manage billing/i }),
    ).toBeInTheDocument();
    // Hers is marked, and is the one card with nothing to press.
    await waitFor(() =>
      expect(row(dialog, "pro_200").getAttribute("data-current")).toBe("true"),
    );
    expect(within(row(dialog, "pro_200")).queryByRole("button")).toBeNull();
    expect(within(row(dialog, "pro_1tb")).getByRole("button")).toBeTruthy();
    // The other three prices are one press away.
    await userEvent.click(cadence(dialog, "year"));
    expect(dialog.querySelectorAll("[data-price-row]")).toHaveLength(3);
    expect(row(dialog, "pro_200_yr")).toBeTruthy();
  });
});

describe("it opens on the smallest size that fits what the host stores", () => {
  it("skips a size the host has outgrown, whatever door opened it", async () => {
    // The create wizard's door knows nothing about bytes; the server does.
    served = facts({ tier: "event_pass", storedBytes: 70 * GIGABYTE });
    const dialog = openSheet({ plan: PASS, trigger: { kind: "room" } });
    await waitFor(() => expect(proCard(dialog, "pro_200")).toBeTruthy());
    expect(proCard(dialog, "pro_50")).toBeNull();
    // ...and says which size it skipped, by that size's own name.
    const note = dialog.querySelector('[data-note="fit"]');
    expect(note?.textContent).toContain(planById("pro_50").name);
  });

  it("keeps the smallest size, and says nothing, for a host it fits", async () => {
    served = facts({ storedBytes: 1 * GIGABYTE });
    const dialog = openSheet();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(proCard(dialog, "pro_50")).toBeTruthy();
    expect(dialog.querySelector('[data-note="fit"]')).toBeNull();
  });

  // ★ RESHAPED ON PURPOSE (trash-in-storage, 2026-10-03; scar kept: a move to a smaller cap is checked against
  // everything she keeps). This pinned a warning that a smaller cap shrank Deleted's room beside it; Deleted counts
  // in storage now, inside the figure every size is checked against, so a size that fits loses her nothing and the
  // sheet has nothing to warn.
  it("says nothing more on a move to a smaller size that holds what she stores, Deleted included", async () => {
    // Three stacked passes (75 GB) into Pro 50 GB, storing 50 GB with her Deleted.
    served = facts({
      tier: "event_pass",
      storedBytes: 50 * GIGABYTE,
      deletedBytes: 20 * GIGABYTE,
      capBytes: 75 * GIGABYTE,
    });
    const dialog = openSheet({ plan: PASS });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    await waitFor(() => expect(proCard(dialog, "pro_50")).toBeTruthy());
    expect(dialog.querySelector('[data-note="fit"]')).toBeNull();
    expect(dialog.querySelector('[data-note="deleted"]')).toBeNull();
  });

  it("counts her Deleted in the size it opens on", async () => {
    // 40 GB in her albums and 30 GB in Deleted: 70 GB stored, past Pro 50 GB.
    served = facts({
      tier: "event_pass",
      storedBytes: 70 * GIGABYTE,
      deletedBytes: 30 * GIGABYTE,
    });
    const dialog = openSheet({ plan: PASS, trigger: { kind: "room" } });
    await waitFor(() => expect(proCard(dialog, "pro_200")).toBeTruthy());
    expect(proCard(dialog, "pro_50")).toBeNull();
  });

  it("keeps the door's facts when the read fails (the Library, a dropped request)", async () => {
    const dialog = openSheet({ trigger: { kind: "room", needed: 1 } });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(proCard(dialog, "pro_50")).toBeTruthy();
  });
});

describe("a Pro host's six prices", () => {
  // Reshaped with host-storage r1 (`refusal=inline`): "Too small" was a label and is a press
  // now, which flips its row to the refusal in place. What held and still holds: no row of a size
  // too small offers a SWITCH.
  it("marks the sizes that cannot hold what she stores, and offers no switch to them", async () => {
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: 70 * GIGABYTE,
      capBytes: planById("pro_1tb").storageBytes,
      currentPlanId: "pro_1tb",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_50").getAttribute("data-fits")).toBe("false"),
    );
    const noSwitch = (id: string) =>
      expect(
        within(row(dialog, id)).queryByRole("button", { name: /switch/i }),
      ).toBeNull();
    const aSwitch = (id: string) =>
      expect(
        within(row(dialog, id)).getByRole("button", { name: /switch/i }),
      ).toBeTruthy();
    noSwitch("pro_50");
    aSwitch("pro_200");
    // Fit is drawn before a tap: the size too small is visibly over, by what she must free.
    expect(row(dialog, "pro_50").textContent).toContain("over by 20 GB");
    // The numbers sentence. No Deleted line: Deleted is inside what she stores (trash-in-storage), so a smaller size
    // that fits takes nothing from it.
    expect(dialog.querySelector('[data-note="fit"]')).toBeTruthy();
    expect(dialog.querySelector('[data-note="deleted"]')).toBeNull();

    await userEvent.click(cadence(dialog, "year"));
    noSwitch("pro_50_yr");
    aSwitch("pro_200_yr");
    // Her own size, yearly: the one switch that changes only how she pays, and says so.
    expect(
      within(row(dialog, "pro_1tb_yr")).getByRole("button", {
        name: "Switch to yearly",
      }),
    ).toBeTruthy();
  });

  it("flips a too-small price in place to the refusal, with the list's door and a way back", async () => {
    // Priya: Pro 200 GB monthly, 60.83 GB stored, taps Pro 50 GB.
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: Math.round(60.83 * GIGABYTE),
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_50").getAttribute("data-fits")).toBe("false"),
    );
    await userEvent.click(
      within(row(dialog, "pro_50")).getByRole("button", {
        name: /too small/i,
      }),
    );
    const flipped = row(dialog, "pro_50");
    expect(flipped.getAttribute("data-flipped")).toBe("true");
    // Her numbers, rounded one way (up), and the gap.
    expect(flipped.textContent).toContain("60.9 GB");
    expect(flipped.querySelector("[data-refusal-gap]")?.textContent).toBe(
      "10.9 GB",
    );
    expect(
      within(flipped).getByRole("button", { name: /what.s using space/i }),
    ).toBeTruthy();
    // The size that fits at the billing she tapped is hers: the way out is Keep, never a switch
    // to the plan she is on. Keep flips it back.
    await userEvent.click(
      within(flipped).getByRole("button", { name: /keep/i }),
    );
    expect(row(dialog, "pro_50").getAttribute("data-flipped")).toBeNull();
  });

  it("offers the yearly price of her size, a real switch, when she tapped a yearly size", async () => {
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: Math.round(60.83 * GIGABYTE),
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_200").getAttribute("data-current")).toBe("true"),
    );
    await userEvent.click(cadence(dialog, "year"));
    await waitFor(() =>
      expect(row(dialog, "pro_50_yr").getAttribute("data-fits")).toBe("false"),
    );
    await userEvent.click(
      within(row(dialog, "pro_50_yr")).getByRole("button", {
        name: /too small/i,
      }),
    );
    expect(
      within(row(dialog, "pro_50_yr")).getByRole("button", {
        name: /yearly instead/i,
      }),
    ).toBeTruthy();
  });

  it("says which price its fit line means, and never offers the plan she is on", async () => {
    // storage-r2's note: the line told a Pro 500 GB monthly host "or choose Pro 500 GB".
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: Math.round(60.83 * GIGABYTE),
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(dialog.querySelector('[data-note="fit"]')).toBeTruthy(),
    );
    const line = dialog.querySelector('[data-note="fit"]')?.textContent ?? "";
    expect(line).toContain(planById("pro_50").name);
    expect(line).not.toMatch(/choose/i);
  });

  it("opens the toggle on her billing, and tags the saving beside Yearly", async () => {
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: 10 * GIGABYTE,
      capBytes: planById("pro_200_yr").storageBytes,
      currentPlanId: "pro_200_yr",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(cadence(dialog, "year").getAttribute("aria-pressed")).toBe("true"),
    );
    expect(row(dialog, "pro_200_yr").getAttribute("data-current")).toBe("true");
    // Computed from the prices (ten months' price for twelve), never typed; beside Yearly, and
    // named by it to a screen reader.
    const tag = dialog.querySelector("[data-saving-tag]");
    expect(tag?.textContent).toBe("2 months free");
    expect(cadence(dialog, "year").getAttribute("aria-describedby")).toBe(
      tag?.id,
    );
  });

  it("leads with her plan, named with its billing", async () => {
    // storage-r2's note: "You are on Pro already" greeted a host who came to change her plan.
    served = facts({
      tier: "pro",
      hasBilling: true,
      capBytes: planById("pro_200_yr").storageBytes,
      currentPlanId: "pro_200_yr",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("heading", {
          name: /Pro 200 GB, yearly/,
        }),
      ).toBeInTheDocument(),
    );
  });

  it("offers no switch at all when the subscription cannot change, and says why", async () => {
    served = facts({
      tier: "pro",
      hasBilling: false,
      capBytes: planById("pro_50").storageBytes,
      changeBlocked: "no_subscription",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(dialog.querySelector('[data-note="blocked"]')).toBeTruthy(),
    );
    for (const el of dialog.querySelectorAll("[data-price-row]")) {
      expect(within(el as HTMLElement).queryByRole("button")).toBeNull();
    }
  });
});

/**
 * ★ A SIZE SAYS ITS UPLOADS, AND A SWITCH BELOW THIS MONTH'S SAYS WHAT THAT MEANS (red-team 52's LOW: "each size's
 * card names its storage and estimate but never its uploads a month ... a Pro 1 TB host who has uploaded, say,
 * 150 GB this month can switch to Pro 50 GB with no word"). Words only: the webhook allows the switch, so the
 * Switch stays pressable and the storage guard stays storage's alone.
 */
describe("a size's uploads, and a switch below this month's", () => {
  const PRO_1TB_HOST = (over: Partial<PlanFacts> = {}) =>
    facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: 10 * GIGABYTE,
      capBytes: planById("pro_1tb").storageBytes,
      currentPlanId: "pro_1tb",
      ...over,
    });
  const note = (dialog: HTMLElement, id: string) =>
    row(dialog, id).querySelector('[data-note="uploads-pause"]');

  it("★ names each size's uploads beside its room, at both billings", async () => {
    served = PRO_1TB_HOST();
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_1tb").getAttribute("data-current")).toBe("true"),
    );
    for (const plan of plansForTier("pro", "month")) {
      expect(
        row(dialog, plan.id).querySelector('[data-note="uploads"]')
          ?.textContent,
      ).toBe(uploadsPhrase(plan));
    }
    await userEvent.click(cadence(dialog, "year"));
    for (const plan of plansForTier("pro", "year")) {
      expect(
        row(dialog, plan.id).querySelector('[data-note="uploads"]')
          ?.textContent,
      ).toBe(uploadsPhrase(plan));
    }
    // Ladder A's three numbers, read from tiers.ts: 100, 200 and 500 GB a month.
    expect(row(dialog, "pro_50_yr").textContent).toContain(
      "100 GB of uploads a month",
    );
  });

  it("names the uploads on the Free host's cards too: Free's own month and the Pro size she is offered", () => {
    const dialog = openSheet();
    expect(
      dialog.querySelector('[data-plan="free"] [data-note="uploads"]')
        ?.textContent,
    ).toBe(uploadsPhrase(planById("free")));
    expect(
      dialog.querySelector(
        `[data-plan="${PRO_SIZES[0].id}"] [data-note="uploads"]`,
      )?.textContent,
    ).toBe(uploadsPhrase(PRO_SIZES[0]));
  });

  it("★ a size whose allowance this month's uploads have reached says what a switch means, and still offers it", async () => {
    served = PRO_1TB_HOST({ monthUploadedBytes: 150 * GIGABYTE });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() => expect(note(dialog, "pro_50")).toBeTruthy());
    expect(note(dialog, "pro_50")?.textContent).toContain("150 GB this month");
    expect(note(dialog, "pro_50")?.textContent).toContain("100 GB a month");
    expect(note(dialog, "pro_50")?.textContent).toMatch(
      /until [A-Z][a-z]+ 1\./,
    );
    // Never a block: the switch is there to press, and the others carry no sentence.
    expect(
      within(row(dialog, "pro_50")).getByRole("button", { name: /switch/i }),
    ).toBeEnabled();
    expect(note(dialog, "pro_200")).toBeNull();
    expect(note(dialog, "pro_1tb")).toBeNull();
    // The same at the yearly prices.
    await userEvent.click(cadence(dialog, "year"));
    expect(note(dialog, "pro_50_yr")).toBeTruthy();
    expect(note(dialog, "pro_200_yr")).toBeNull();
    expect(note(dialog, "pro_1tb_yr")).toBeNull();
  });

  it("says nothing on her own size at the other billing: that switch changes no allowance", async () => {
    // Pro 50 GB, 100 GB uploaded this month: the line is reached already, whatever she presses.
    served = facts({
      tier: "pro",
      hasBilling: true,
      storedBytes: 10 * GIGABYTE,
      capBytes: planById("pro_50").storageBytes,
      currentPlanId: "pro_50",
      monthUploadedBytes: planById("pro_50").uploadsBytes,
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_50").getAttribute("data-current")).toBe("true"),
    );
    await userEvent.click(cadence(dialog, "year"));
    expect(
      within(row(dialog, "pro_50_yr")).getByRole("button", {
        name: "Switch to yearly",
      }),
    ).toBeEnabled();
    expect(note(dialog, "pro_50_yr")).toBeNull();
  });

  it("★ names the month the figure was read in, never the month the page was loaded in", async () => {
    // The sheet stays mounted for as long as its page lives: loaded on September 30, opened on October 5.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(Date.UTC(2026, 8, 30, 12)));
      served = PRO_1TB_HOST({ monthUploadedBytes: 150 * GIGABYTE });
      const props = {
        onOpenChange: () => {},
        trigger: { kind: "plan" } as const,
        plan: PRO,
      };
      const { rerender } = render(<PricingSheet open={false} {...props} />);
      vi.setSystemTime(new Date(Date.UTC(2026, 9, 5, 12)));
      rerender(<PricingSheet open {...props} />);
      const dialog = await screen.findByRole("dialog");
      await waitFor(() => expect(note(dialog, "pro_50")).toBeTruthy());
      expect(note(dialog, "pro_50")?.textContent).toContain(
        "until November 1.",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("says nothing of uploads while this month's are not known, or inside every size", async () => {
    served = PRO_1TB_HOST({ monthUploadedBytes: null });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_1tb").getAttribute("data-current")).toBe("true"),
    );
    expect(dialog.querySelector('[data-note="uploads-pause"]')).toBeNull();
  });

  it("offers it only where a switch is offered: a size too small for what she stores has its own words", async () => {
    served = PRO_1TB_HOST({
      storedBytes: 70 * GIGABYTE,
      monthUploadedBytes: 150 * GIGABYTE,
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_50").getAttribute("data-fits")).toBe("false"),
    );
    expect(note(dialog, "pro_50")).toBeNull();
  });

  it("★ a pass holder moving to Pro reads it on the Pro card she is offered", async () => {
    served = facts({
      tier: "event_pass",
      hasBilling: true,
      capBytes: planById("event_pass").storageBytes,
      monthUploadedBytes: 120 * GIGABYTE,
    });
    const dialog = openSheet({ plan: PASS });
    await waitFor(() =>
      expect(
        proCard(dialog).querySelector('[data-note="uploads-pause"]'),
      ).toBeTruthy(),
    );
  });
});

/**
 * ★ HER PLAN IS READ BEFORE THE SHEET OFFERS A MOVE (red-team 52's NIT: "the sheet's first open, before
 * /api/stripe/plan-facts answers (2,066 ms here), is titled 'Your Pro plan' with 'Switch' on all three sizes, her
 * own Pro 1 TB included"). A quiet state until the facts land; a read that fails keeps the old list.
 */
describe("a Pro host's first open, before her plan is read", () => {
  const PRO_200_HOST = () =>
    facts({
      tier: "pro",
      hasBilling: true,
      capBytes: planById("pro_200").storageBytes,
      currentPlanId: "pro_200",
    });

  it("★ draws her three sizes quietly, with no move offered and none marked hers, until the read lands", async () => {
    let release!: () => void;
    gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    served = PRO_200_HOST();
    const dialog = openSheet({ plan: PRO });
    expect(dialog.querySelectorAll("[data-price-row]")).toHaveLength(3);
    expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(3);
    expect(dialog.querySelector("ul[aria-busy='true']")).not.toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: /switch/i }),
    ).toBeNull();
    expect(dialog.querySelector("[data-current]")).toBeNull();
    // The sizes themselves are there to read, uploads included.
    expect(row(dialog, "pro_200").textContent).toContain(
      uploadsPhrase(planById("pro_200")),
    );
    await act(async () => {
      release();
    });
    await waitFor(() =>
      expect(row(dialog, "pro_200").getAttribute("data-current")).toBe("true"),
    );
    expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(0);
    expect(dialog.querySelector("ul[aria-busy]")).toBeNull();
    expect(
      within(row(dialog, "pro_50")).getByRole("button", { name: /switch/i }),
    ).toBeTruthy();
    expect(within(row(dialog, "pro_200")).queryByRole("button")).toBeNull();
  });

  it("★ keeps the old list, every size with its Switch, when the read never comes (the change-plan route re-checks)", async () => {
    served = null;
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(dialog.querySelectorAll("[data-reading]")).toHaveLength(0),
    );
    expect(
      within(dialog).getAllByRole("button", { name: /switch/i }),
    ).toHaveLength(3);
  });

  it("a second open reuses what the first read, with no quiet state at all", async () => {
    served = PRO_200_HOST();
    const props = {
      onOpenChange: () => {},
      trigger: { kind: "plan" } as const,
      plan: PRO,
    };
    const { rerender } = render(<PricingSheet open {...props} />);
    const dialog = screen.getByRole("dialog");
    await waitFor(() =>
      expect(row(dialog, "pro_200").getAttribute("data-current")).toBe("true"),
    );
    rerender(<PricingSheet open={false} {...props} />);
    // The next read is held, as the real one is for two seconds.
    gate = new Promise<void>(() => {});
    rerender(<PricingSheet open {...props} />);
    const again = screen.getByRole("dialog");
    expect(again.querySelectorAll("[data-reading]")).toHaveLength(0);
    expect(row(again, "pro_200").getAttribute("data-current")).toBe("true");
  });
});

describe("it carries two cards and a price, and not the marketing page", () => {
  it("draws exactly Free and one Pro size", () => {
    const dialog = openSheet();
    const cards = dialog.querySelectorAll("[data-plan]");
    expect(cards).toHaveLength(2);
    expect(dialog.querySelector('[data-plan="free"]')).toBeTruthy();
  });

  // Reshaped with host-storage r2 (`prices=sizes`): this pinned "no cadence toggle" for every face.
  // His note put ONE Monthly / Yearly toggle on top of a Pro host's sizes; `carry` still holds for a
  // host choosing a first plan, and no face has a storage selector.
  it("offers no storage selector anywhere, and a cadence toggle only over a Pro host's sizes", () => {
    for (const plan of [FREE, PRO]) {
      const { unmount } = render(
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={plan}
        />,
      );
      const dialog = screen.getByRole("dialog");
      // A selector would be one control per Pro size (a slider, radios); the sizes are
      // cards with buttons, never a selector.
      expect(within(dialog).queryByRole("slider")).toBeNull();
      expect(within(dialog).queryByRole("switch")).toBeNull();
      expect(within(dialog).queryAllByRole("radio")).toHaveLength(0);
      const toggles = dialog.querySelectorAll("[data-cadence-toggle]");
      expect(toggles).toHaveLength(plan === PRO ? 1 : 0);
      unmount();
    }
  });

  it("says what its estimates assume, once, under the cards", async () => {
    for (const plan of [FREE, PRO]) {
      const { unmount } = render(
        <PricingSheet
          open
          onOpenChange={() => {}}
          trigger={{ kind: "plan" }}
          plan={plan}
        />,
      );
      const dialog = screen.getByRole("dialog");
      const notes = dialog.querySelectorAll('[data-note="basis"]');
      expect(notes).toHaveLength(1);
      expect(notes[0].textContent).toContain(
        "an iPhone's default camera settings",
      );
      unmount();
    }
  });

  it("carries three benefit lines on the Pro card, derived from tiers.ts", () => {
    const dialog = openSheet();
    const card = proCard(dialog);
    expect(within(card).getAllByRole("listitem")).toHaveLength(3);
    // The events promise is read from the single source, never typed.
    expect(card.textContent).toContain(
      MAX_EVENTS.pro === null ? "Unlimited events" : `${MAX_EVENTS.pro} events`,
    );
  });

  it("prices every card from tiers.ts", () => {
    const dialog = openSheet();
    expect(dialog.textContent).toContain(PRO_SIZES[0].priceLabel);
    expect(dialog.textContent).toContain(planById("free").priceLabel);
  });

  it("prices every one of a Pro host's rows from tiers.ts", async () => {
    const dialog = openSheet({ plan: PRO });
    for (const plan of plansForTier("pro", "month")) {
      expect(row(dialog, plan.id).textContent).toContain(plan.priceLabel);
    }
    await userEvent.click(cadence(dialog, "year"));
    for (const plan of plansForTier("pro", "year")) {
      expect(row(dialog, plan.id).textContent).toContain(plan.priceLabel);
    }
  });
});

describe("the Event Pass is one line and a button, at every tier that may buy one", () => {
  it("offers a first pass to a Free host", () => {
    const dialog = openSheet();
    expect(
      within(dialog).getByRole("button", { name: /buy a pass/i }),
    ).toBeInTheDocument();
  });

  it("offers a STACKING second pass to a holder, never a refusal", () => {
    // billing-caps.md: passes stack, each adding an event and its own year.
    const dialog = openSheet({ plan: PASS });
    expect(
      within(dialog).getByRole("button", { name: /add a pass/i }),
    ).toBeInTheDocument();
  });
});

describe("the second layer stays one click away, and leaves on purpose", () => {
  it("links /pricing in a new tab so the host keeps their place", () => {
    const dialog = openSheet();
    const link = within(dialog).getByRole("link", { name: /every plan/i });
    expect(link).toHaveAttribute("href", "/pricing");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});

describe("a door that is a button opens it itself", () => {
  it("opens from a trigger child without the caller owning any state", async () => {
    render(
      <PricingSheet trigger={{ kind: "plan" }} plan={FREE}>
        <button type="button">Upgrade</button>
      </PricingSheet>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("asks the server what the host stores only once it is open", async () => {
    render(
      <PricingSheet trigger={{ kind: "plan" }} plan={FREE}>
        <button type="button">Upgrade</button>
      </PricingSheet>,
    );
    // Many doors mount closed sheets on one page; none may cost a request.
    expect(globalThis.fetch).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/stripe/plan-facts",
        expect.anything(),
      ),
    );
  });
});
