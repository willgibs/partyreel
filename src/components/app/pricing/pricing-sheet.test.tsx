// @contract-for: src/components/app/pricing/pricing-sheet.tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
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
 * Four things have to hold or it stops being what `app-pricing` r1 ruled on
 * 2026-09-20:
 *
 *  1. IT OPENS ON THE REASON IT OPENED (`first=trigger`). Knowing the trigger
 *     is the only thing keeping pricing inside the app buys us: a static
 *     /pricing cannot name the control that refused you, cannot pick a plan
 *     that clears your bytes, and cannot tell a subscriber she subscribes.
 *     Each of the three is pinned by BEHAVIOUR, not by a sentence.
 *  2. IT CARRIES TWO CARDS AND A PRICE, AND NOT THE MARKETING PAGE
 *     (`carry=cards`, which OVERRULED the board's `fitted`): no storage
 *     selector, no cadence toggle, no table. A reintroduced selector turns
 *     this red, which is the point of pinning an absence.
 *  3. EVERY NUMBER COMES FROM tiers.ts. The plan ids the buy buttons carry are
 *     the ids the Stripe webhook and the SQL enforcement read, so a card
 *     selling a plan Checkout does not know is a red test rather than a 400.
 *  4. THE SECOND LAYER LEAVES, AND SAYS SO (`learn=foot`): /pricing opens in a
 *     new tab so the host keeps their place, which is the whole reason the
 *     surface exists.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const FREE: PricingPlanFacts = { tier: "free", hasBilling: false };
const PRO: PricingPlanFacts = { tier: "pro", hasBilling: true };
const PASS: PricingPlanFacts = { tier: "event_pass", hasBilling: true };

const PRO_SIZES = plansForTier("pro");

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

  it("tells a subscriber she subscribes, and sells her nothing", () => {
    const dialog = openSheet({ plan: PRO });
    expect(
      within(dialog).getByRole("heading", {
        name: new RegExp(TIER_NAMES.pro, "i"),
      }),
    ).toBeInTheDocument();
    // The portal owns every move from here (billing-caps.md: checkout refuses a
    // second subscription for an active Pro), so no card may offer one.
    expect(dialog.querySelector("[data-plan]")).toBeNull();
    expect(
      within(dialog).getByRole("button", { name: /billing/i }),
    ).toBeInTheDocument();
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
    const dialog = openSheet();
    // A selector would be one control per Pro size; a cadence toggle would be a
    // switch or a pair of radios. Neither may come back without re-ruling.
    expect(within(dialog).queryByRole("slider")).toBeNull();
    expect(within(dialog).queryByRole("switch")).toBeNull();
    expect(within(dialog).queryAllByRole("radio")).toHaveLength(0);
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
});
