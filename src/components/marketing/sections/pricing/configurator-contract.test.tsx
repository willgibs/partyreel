import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { GIGABYTE, planById } from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

import { Configurator, printsAt, STOP_GB } from "./configurator";
import { recommendPlan } from "./recommend";

/**
 * THE CONFIGURATOR'S FUNCTION, never its look (`pricing-page` r2, `fit=split`).
 * Four things have to hold or the block stops being the one
 * that was chosen:
 *
 *  1. THE LADDER CARRIES THE REAL WALLS. The slider's stops are a curated
 *     ladder rather than a byte range, and the product's two walls have to BE
 *     stops: the Free cap and a single pass's room. If either falls off, the
 *     block can never say the thing it exists to say ("Free covers it", "one
 *     pass fits") for the exact size where it becomes true, and nothing else
 *     in the tree notices.
 *  2. THE CARD IS THE BRAIN'S ANSWER, NOT A SECOND OPINION. `recommendPlan` is
 *     pure and unit-tested next door; this pins that the rendered half agrees
 *     with it, for the fork that actually matters (one event vs hosting
 *     again), so a card rewrite cannot quietly start recommending by eye.
 *  3. THE DOOR MATCHES THE PLAN. Free opens /login; anything paid opens
 *     Checkout. A Free recommendation wired to Checkout would take a visitor
 *     to Stripe for a plan that costs nothing.
 *  4. THE DECK NEVER OVERDRAWS. The fan is derived from the stop, so an
 *     off-by-one would either hide the whole deck or index past it.
 *
 * Copy is never pinned: every control is found by role, and every
 * number comes back out of tiers.ts. The price is not asserted as a string at
 * all, because `PricePop` splits it across elements per digit.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

/** `Reveal` and `PricePop` observe themselves into view; jsdom has no
 *  IntersectionObserver. Visible immediately is the honest stand-in, exactly
 *  as the pair's own contract does it. */
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

const slider = () =>
  screen.getByRole("slider", { name: /how much storage/i }) as HTMLInputElement;

const dragTo = (gb: number) => {
  const i = STOP_GB.indexOf(gb);
  expect(i, `${gb} GB is a stop on the ladder`).toBeGreaterThan(-1);
  fireEvent.change(slider(), { target: { value: String(i) } });
  return i;
};

describe("the storage ladder", () => {
  it("rises, and stops exactly on the Free cap and a single pass's room", () => {
    for (let i = 1; i < STOP_GB.length; i++) {
      expect(STOP_GB[i], "the ladder only climbs").toBeGreaterThan(
        STOP_GB[i - 1],
      );
    }
    for (const plan of [planById("free"), planById("event_pass")]) {
      expect(
        STOP_GB.includes(plan.storageBytes / GIGABYTE),
        `${plan.name}'s cap is a stop a visitor can land on`,
      ).toBe(true);
    }
  });

  it("wires the control to the ladder and announces the room, not the index", () => {
    render(<Configurator />);
    const range = slider();
    expect(range.type).toBe("range");
    expect(range.min).toBe("0");
    expect(range.max).toBe(String(STOP_GB.length - 1));
    expect(range.step).toBe("1");

    dragTo(75);
    expect(range.getAttribute("aria-valuetext")).toBe(
      formatBytes(75 * GIGABYTE),
    );
  });
});

describe("the result card", () => {
  it("names the plan recommendPlan names, on both sides of the hosting fork", () => {
    render(<Configurator />);
    const at75 = (hostingAgain: boolean) =>
      recommendPlan({ bytes: 75 * GIGABYTE, video: true, hostingAgain });

    // One event at a single pass's room: the pass is the honest answer.
    dragTo(75);
    expect(
      screen.getByRole("heading", { name: at75(false).plan.name }),
    ).toBeTruthy();

    // The same size, hosting again: the fork moves it onto Pro storage.
    fireEvent.click(screen.getByRole("button", { name: /hosting again/i }));
    expect(
      at75(true).plan.name,
      "the fork is a real fork at this size",
    ).not.toBe(at75(false).plan.name);
    expect(
      screen.getByRole("heading", { name: at75(true).plan.name }),
    ).toBeTruthy();
    expect(
      screen.getAllByText(formatBytes(at75(true).plan.storageBytes)).length,
    ).toBeGreaterThan(0);
  });

  it("opens /login for Free and Checkout for anything paid", () => {
    render(<Configurator />);

    // Photos only, inside the Free cap: the door is a link, never Checkout.
    fireEvent.click(screen.getByRole("switch"));
    dragTo(1);
    expect(
      recommendPlan({ bytes: GIGABYTE, video: false, hostingAgain: false })
        .planId,
      "the brain agrees this is the Free case",
    ).toBe("free");
    expect(screen.getByRole("link").getAttribute("href")).toBe("/login");

    // Past the Free cap, the door becomes a real checkout trigger.
    dragTo(250);
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen
        .getAllByRole("button")
        .some((b) => b.getAttribute("data-track") === "checkout_start"),
    ).toBe(true);
  });
});

describe("the fanned deck", () => {
  it("lays at least one print and never more than the deck holds", () => {
    const counts = STOP_GB.map((_, i) => printsAt(i));
    expect(Math.min(...counts)).toBeGreaterThanOrEqual(1);
    // The deck's own length: read off the widest fan, never typed here.
    const deck = Math.max(...counts);
    expect(deck).toBeGreaterThan(1);
    expect(printsAt(STOP_GB.length - 1)).toBe(deck);
    for (let i = 1; i < counts.length; i++) {
      expect(
        counts[i],
        "the fan never shrinks as the room grows",
      ).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });
});
