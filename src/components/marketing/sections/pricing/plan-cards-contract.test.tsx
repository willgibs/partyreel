import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  annualPlanFor,
  friendlyCapacity,
  plansForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { PlanPair } from "./plan-cards";

/**
 * THE PAIR'S FUNCTION, never its look (a contract guards what a component is
 * FOR; Will retunes the rest without asking a test).
 *
 * Three things have to hold or the pair stops being what `pricing-page` r1
 * settled on:
 *
 *  1. THE SIZE IS A SLIDER, AND ITS STOPS ARE tiers.ts (`size=slider`). The
 *     one thing a slider can get wrong that a segmented control cannot is
 *     drifting from the plans: a hardcoded range would keep selling three
 *     sizes after a fourth shipped, or sell a size Checkout does not know.
 *     `plansForTier("pro")` is the single source the Stripe webhook and the
 *     SQL enforcement read, so the control is pinned to it by count and by
 *     value, never to a number typed here.
 *  2. THE PRICE, THE STATS AND THE BUTTON FOLLOW THE THUMB. A slider that
 *     moves and leaves the money behind is worse than the switch it replaced.
 *  3. THE CADENCE STAYS ABOVE THE SLIDER, which is his reason for picking it:
 *     "This keeps the monthly/yearly toggle above, which feels more
 *     intuitive/natural." Pinned as DOM ORDER, so any look may change.
 *
 * Copy is never pinned here: every control is found by role and by
 * a number that comes out of tiers.ts.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** The cards carry <Reveal> and <PricePop>, which observe themselves into
 *  view; jsdom has no IntersectionObserver and the shared setup polyfills only
 *  what its own pins need. Visible immediately is the honest stand-in: in a
 *  browser this block is the first thing on the page. */
beforeAll(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

const PRO = plansForTier("pro");

function slider(): HTMLInputElement {
  return screen.getByRole("slider", { name: /storage size/i });
}

describe("the Pro card's size control", () => {
  it("is one slider whose stops are exactly the Pro plans tiers.ts declares", () => {
    render(<PlanPair />);
    const range = slider();
    expect(range).toHaveProperty("type", "range");
    expect(range.min).toBe("0");
    expect(range.max).toBe(String(PRO.length - 1));
    expect(range.step).toBe("1");
    // The room, not "1 of 3": what a screen reader reads is the size itself.
    expect(range.getAttribute("aria-valuetext")).toBe(
      formatBytes(PRO[0].storageBytes),
    );
  });

  it("moves the price, the stats and the button with the thumb", () => {
    render(<PlanPair />);
    const range = slider();
    const top = PRO[PRO.length - 1];

    fireEvent.change(range, { target: { value: String(PRO.length - 1) } });

    expect(range.getAttribute("aria-valuetext")).toBe(
      formatBytes(top.storageBytes),
    );
    // The price renders through PricePop, which splits the label across
    // elements, so the card is asked for the numbers rather than a string.
    const card = range.closest("div.group") as HTMLElement;
    expect(within(card).getAllByText(formatBytes(top.storageBytes)).length)
      // The stat row and the slider's own stop label both name it.
      .toBeGreaterThan(0);
    expect(
      within(card).getByText(
        `≈ ${friendlyCapacity(top.storageBytes).photos.toLocaleString()}`,
      ),
    ).toBeTruthy();
    expect(
      within(card).getByRole("button", {
        name: new RegExp(top.priceLabel.replace(/[$/]/g, "\\$&")),
      }),
    ).toBeTruthy();
  });

  it("keeps the billing cadence above the slider, and swaps to the annual price", () => {
    render(<PlanPair />);
    const cadence = screen.getByRole("group", { name: /billing cadence/i });
    const range = slider();

    // DOM order, so the look is free to change and the reading order is not.
    expect(
      cadence.compareDocumentPosition(range) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const yearly = within(cadence).getAllByRole("button")[1];
    fireEvent.click(yearly);

    const annual = annualPlanFor(PRO[0].id);
    expect(annual, "Pro's monthly plans have an annual sibling").toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: new RegExp(annual!.priceLabel.replace(/[$/]/g, "\\$&")),
      }),
    ).toBeTruthy();
  });
});
