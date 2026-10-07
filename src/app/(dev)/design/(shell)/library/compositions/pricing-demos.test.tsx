import type { ReactNode } from "react";

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipProvider } from "@/components/ui/tooltip";
import { parsePlanFacts } from "@/lib/billing/plan-facts";
import { planById } from "@/lib/constants/tiers";

import {
  LockChipDemo,
  PRICING_FIXTURES,
  PricingSheetDemo,
  WelcomeToProDemo,
  type PricingState,
} from "./pricing-demos";

/**
 * THE PLANS' SURFACE IS DRAWN WITH STRIPE NOWHERE IN REACH (`pricing-demos.tsx`): the real sheet, chip and receipt over the
 * doors the surface names (`pricing-doors.tsx`), in the states a fixture gives them.
 *
 * Pinned: every host's facts are ones the sheet's own parser accepts (a fixture it would refuse draws as a failed read, a
 * state that cannot happen); each state opens on what its host is (the lock's own words, a skipped size, a pass's expiry, a
 * Pro host's three sizes with one too small); a press that would leave for Stripe works for a round trip and then says the
 * Library stops there, and not one request is made; and the receipt says only the payment until its first re-read has
 * the plan. The frame is the lab's (its own test's), the toast is sonner's, the store behind the size list is inert.
 */

vi.mock("@/components/lab", () => ({
  Frame: (props: { id: string; children: ReactNode }) =>
    props.id.endsWith("-desk") ? (
      <figure data-testid={props.id}>{props.children}</figure>
    ) : null,
  Measured: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// The inert storage lives with the compositions' other demos, whose imports reach the server (`server-only`); the size list
// is not what is drawn here, so the provider stands as a passthrough.
vi.mock("./composition-demos", () => ({
  InertStorage: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const toast = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast }));

const router = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn(async () => {
  throw new Error("the Library reached the network");
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  toast.mockClear();
  fetchMock.mockClear();
  Object.values(router).forEach((fn) => fn.mockClear());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.inert = false;
});

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

const sheet = () =>
  document.querySelector<HTMLElement>("[data-pricing-sheet]") as HTMLElement;

describe("every host is one the sheet's own reader accepts", () => {
  it.each(Object.keys(PRICING_FIXTURES) as PricingState[])(
    "★ %s: the fixture is what `parsePlanFacts` hands back, unchanged",
    (state) => {
      const facts = PRICING_FIXTURES[state];
      expect(parsePlanFacts({ ok: true, facts })).toEqual(facts);
    },
  );
});

describe("the sheet opens on what its host is", () => {
  it("★ a locked control: the lock's own words, Free beside one Pro card, the pass on one line", async () => {
    render(<PricingSheetDemo state="locked" />);
    await advance(1300);
    expect(sheet().getAttribute("data-pricing-sheet")).toBe("locked");
    expect(
      within(sheet()).getByRole("heading", {
        name: /video is on every paid plan/i,
      }),
    ).toBeInTheDocument();
    expect(sheet().querySelector('[data-plan="free"]')).toBeTruthy();
    expect(sheet().querySelectorAll("[data-plan]")).toHaveLength(2);
  });

  it("★ out of room, a pass holder: the read moves the card up a size and says which it skipped", async () => {
    render(<PricingSheetDemo state="room" />);
    // Before the read lands it is the smallest size; once it has, the one that holds what she stores.
    expect(sheet().querySelector('[data-plan="pro_50"]')).toBeTruthy();
    await advance(1300);
    expect(sheet().querySelector('[data-plan="pro_50"]')).toBeNull();
    expect(sheet().querySelector('[data-plan="pro_200"]')).toBeTruthy();
    expect(sheet().querySelector('[data-note="fit"]')).toHaveTextContent(
      planById("pro_50").name,
    );
  });

  it("★ a pass holder looking: the pass's expiry leads, and Free is not drawn", async () => {
    render(<PricingSheetDemo state="pass" />);
    await advance(1300);
    expect(
      within(sheet()).getByRole("heading", { name: /runs to nov 14, 2026/i }),
    ).toBeInTheDocument();
    expect(sheet().querySelector('[data-plan="free"]')).toBeNull();
  });

  it("★ a Pro host: her three sizes, hers held, the 50 GB one too small, the 1 TB one a switch", async () => {
    render(<PricingSheetDemo state="pro" />);
    await advance(1300);
    expect(sheet().querySelectorAll("[data-price-row]")).toHaveLength(3);
    const row = (id: string) =>
      sheet().querySelector(`[data-price-row="${id}"]`) as HTMLElement;
    expect(row("pro_200").getAttribute("data-current")).toBe("true");
    expect(row("pro_50").getAttribute("data-fits")).toBe("false");
    expect(within(row("pro_50")).getByText(/too small/i)).toBeInTheDocument();
    expect(
      within(row("pro_1tb")).getByRole("button", { name: /switch/i }),
    ).toBeInTheDocument();
    expect(
      within(sheet()).getByRole("button", { name: /manage billing/i }),
    ).toBeInTheDocument();
  });
});

describe("a press that would leave for Stripe never does", () => {
  it("★ Get Pro works for a route's wait, then says the Library stops here, with no request made", async () => {
    render(<PricingSheetDemo state="locked" />);
    await advance(1300);
    const get = within(sheet()).getByRole("button", { name: /^get pro/i });
    await act(async () => {
      get.click();
    });
    expect(
      within(sheet()).getByRole("button", { name: /opening billing/i }),
    ).toHaveAttribute("aria-busy", "true");
    expect(toast).not.toHaveBeenCalled();
    await advance(1000);
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/library stops here/i),
    );
    // And it is a button again, for another press.
    expect(
      within(sheet()).getByRole("button", { name: /^get pro/i }),
    ).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("★ Manage billing and a size's Switch end the same way, through the real buttons' own flow", async () => {
    render(<PricingSheetDemo state="pro" />);
    await advance(1300);
    await act(async () => {
      within(sheet())
        .getByRole("button", { name: /manage billing/i })
        .click();
    });
    expect(
      within(sheet()).getByRole("button", { name: /opening/i }),
    ).toBeDisabled();
    await advance(1000);
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/library stops here/i),
    );
    toast.mockClear();

    const row = sheet().querySelector(
      '[data-price-row="pro_1tb"]',
    ) as HTMLElement;
    await act(async () => {
      within(row)
        .getByRole("button", { name: /switch/i })
        .click();
    });
    await advance(1000);
    // The real ChangePlanButton takes the address its route answered through the doors' way out, which is where
    // the Library says it stops (pricing-doors: the switch used to answer a refusal to get the same toast).
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/library stops here/i),
    );
    expect(router.push).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the lock chip", () => {
  it("★ three chips, each opening the sheet led by its own feature, over the inert doors", async () => {
    vi.useRealTimers();
    // The chip's tooltip rides the root provider in production, which a test supplies as the chip's own test does.
    render(
      <TooltipProvider>
        <LockChipDemo />
      </TooltipProvider>,
    );
    const chips = document.querySelectorAll("[data-lock-chip]");
    expect([...chips].map((c) => c.getAttribute("data-lock-chip"))).toEqual([
      "video",
      "password",
      "custom_slug",
    ]);
    await userEvent.click(chips[1]);
    expect(sheet().getAttribute("data-pricing-sheet")).toBe("locked");
    expect(
      await screen.findByRole("heading", {
        name: /password locks are on every paid plan/i,
      }),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the receipt", () => {
  const receipt = () =>
    document.querySelector<HTMLElement>("[data-welcome-to-pro]") as HTMLElement;

  it("★ the plan is on: Welcome to Pro, its facts, and closing goes nowhere", async () => {
    vi.useRealTimers();
    render(<WelcomeToProDemo state="applied" />);
    expect(receipt().getAttribute("data-welcome-to-pro")).toBe("applied");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    await userEvent.click(
      screen.getByRole("button", { name: /go to your dashboard/i }),
    );
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("★ the webhook is late: the payment first, then, after its first re-read, the plan, never before", async () => {
    render(<WelcomeToProDemo state="race" />);
    expect(receipt().getAttribute("data-welcome-to-pro")).toBe("pending");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    await advance(2100);
    expect(receipt().getAttribute("data-welcome-to-pro")).toBe("applied");
    // The real router was never asked: the specimen's own re-reads the page.
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
