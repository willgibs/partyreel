// @contract-for: src/components/app/pricing/pricing-sheet.tsx
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  GIGABYTE,
  MAX_EVENTS,
  TIER_NAMES,
  planById,
  plansForTier,
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
 *     selector, no cadence toggle, no table. A reintroduced selector turns
 *     this red, which is the point of pinning an absence. A Pro host's six
 *     prices are a list of buttons, never a selector either.
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
beforeEach(() => {
  served = null;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
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
    activeBytes: 0,
    standbyBytes: 0,
    capBytes: planById("free").storageBytes,
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

/** The ink card is the one selling a Pro plan; found by its plan id, not its look. */
const proCard = (dialog: HTMLElement, planId = PRO_SIZES[0].id) =>
  dialog.querySelector(`[data-plan="${planId}"]`) as HTMLElement;

const row = (dialog: HTMLElement, planId: string) =>
  dialog.querySelector(`[data-price-row="${planId}"]`) as HTMLElement;

describe("it opens on the reason it opened", () => {
  it("names the locked control, on the control that refused you", () => {
    const dialog = openSheet({
      trigger: { kind: "locked", feature: "password" },
    });
    // The lock's own vocabulary reaches the heading: a host who tapped a
    // password lock must not land on a generic plan catalogue.
    expect(dialog.getAttribute("data-pricing-sheet")).toBe("locked");
    expect(
      within(dialog).getByRole("heading", { name: /password/i }),
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
      capBytes: planById("pro_500").storageBytes,
      currentPlanId: "pro_500",
    });
    const dialog = openSheet({ plan: PRO });
    expect(
      within(dialog).getByRole("heading", {
        name: new RegExp(TIER_NAMES.pro, "i"),
      }),
    ).toBeInTheDocument();
    // No checkout card: a second subscription double-bills one cap
    // (billing-caps.md). Her moves are the six prices, and the portal keeps
    // the card, the invoices and cancelling.
    expect(dialog.querySelector("[data-plan]")).toBeNull();
    expect(dialog.querySelectorAll("[data-price-row]")).toHaveLength(6);
    expect(
      within(dialog).getByRole("button", { name: /billing/i }),
    ).toBeInTheDocument();
    // Hers is marked, and is the one row with nothing to press.
    await waitFor(() =>
      expect(row(dialog, "pro_500").getAttribute("data-current")).toBe("true"),
    );
    expect(within(row(dialog, "pro_500")).queryByRole("button")).toBeNull();
    expect(within(row(dialog, "pro_2tb")).getByRole("button")).toBeTruthy();
  });
});

describe("it opens on the smallest size that fits what the host stores", () => {
  it("skips a size the host has outgrown, whatever door opened it", async () => {
    // The create wizard's door knows nothing about bytes; the server does.
    served = facts({ tier: "event_pass", activeBytes: 140 * GIGABYTE });
    const dialog = openSheet({ plan: PASS, trigger: { kind: "room" } });
    await waitFor(() => expect(proCard(dialog, "pro_500")).toBeTruthy());
    expect(proCard(dialog, "pro_100")).toBeNull();
    // ...and says which size it skipped, by that size's own name.
    const note = dialog.querySelector('[data-note="fit"]');
    expect(note?.textContent).toContain(planById("pro_100").name);
  });

  it("keeps the smallest size, and says nothing, for a host it fits", async () => {
    served = facts({ activeBytes: 1 * GIGABYTE });
    const dialog = openSheet();
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(proCard(dialog, "pro_100")).toBeTruthy();
    expect(dialog.querySelector('[data-note="fit"]')).toBeNull();
  });

  it("warns before a move that shrinks Deleted, and only then", async () => {
    // Stacked passes (225 GB) into Pro 100 GB: the cap, and so Deleted, shrinks.
    served = facts({
      tier: "event_pass",
      activeBytes: 50 * GIGABYTE,
      capBytes: 225 * GIGABYTE,
    });
    const dialog = openSheet({ plan: PASS });
    await waitFor(() =>
      expect(dialog.querySelector('[data-note="deleted"]')).toBeTruthy(),
    );
  });

  it("keeps the door's facts when the read fails (the Library, a dropped request)", async () => {
    const dialog = openSheet({ trigger: { kind: "room", needed: 1 } });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(proCard(dialog, "pro_100")).toBeTruthy();
  });
});

describe("a Pro host's six prices", () => {
  it("marks the sizes that cannot hold what she stores, and offers no switch to them", async () => {
    served = facts({
      tier: "pro",
      hasBilling: true,
      activeBytes: 140 * GIGABYTE,
      capBytes: planById("pro_2tb").storageBytes,
      currentPlanId: "pro_2tb",
    });
    const dialog = openSheet({ plan: PRO });
    await waitFor(() =>
      expect(row(dialog, "pro_100").getAttribute("data-fits")).toBe("false"),
    );
    for (const id of ["pro_100", "pro_100_yr"]) {
      expect(within(row(dialog, id)).queryByRole("button")).toBeNull();
    }
    for (const id of ["pro_500", "pro_500_yr", "pro_2tb_yr"]) {
      expect(within(row(dialog, id)).getByRole("button")).toBeTruthy();
    }
    // The numbers sentence, and the Deleted line (500 GB fits and is smaller).
    expect(dialog.querySelector('[data-note="fit"]')).toBeTruthy();
    expect(dialog.querySelector('[data-note="deleted"]')).toBeTruthy();
  });

  it("offers no switch at all when the subscription cannot change, and says why", async () => {
    served = facts({
      tier: "pro",
      hasBilling: false,
      capBytes: planById("pro_100").storageBytes,
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

describe("it carries two cards and a price, and not the marketing page", () => {
  it("draws exactly Free and one Pro size", () => {
    const dialog = openSheet();
    const cards = dialog.querySelectorAll("[data-plan]");
    expect(cards).toHaveLength(2);
    expect(dialog.querySelector('[data-plan="free"]')).toBeTruthy();
  });

  it("offers no storage selector and no cadence toggle (his `carry` overrule)", () => {
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
      // A selector would be one control per Pro size; a cadence toggle would be a
      // switch or a pair of radios. Neither may come back without re-ruling, and a
      // Pro host's six prices are buttons, not a selector.
      expect(within(dialog).queryByRole("slider")).toBeNull();
      expect(within(dialog).queryByRole("switch")).toBeNull();
      expect(within(dialog).queryAllByRole("radio")).toHaveLength(0);
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

  it("prices every one of a Pro host's rows from tiers.ts", () => {
    const dialog = openSheet({ plan: PRO });
    for (const plan of [
      ...plansForTier("pro", "month"),
      ...plansForTier("pro", "year"),
    ]) {
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
