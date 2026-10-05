/**
 * ONE BACK FROM STRIPE RETURNS TO THE PAGE, FROM THE PHONE'S PLAN SHEET (pricing-doors; the ROADMAP's "leaving the plan sheet
 * for Stripe by `window.location.href` leaves the sheet's same-URL entry behind, so Back from Stripe takes two presses").
 *
 * On a phone the sheet is the whole screen and holds one same-URL history entry so the phone's Back closes it
 * (`ui/popup-back.ts`). Leaving by a plain `href` pushed Stripe's page on top of that entry: Back from Stripe landed on the
 * page with the sheet's entry still beneath it, so the first press showed the page and the second showed the same page
 * again before a third left it. This walks the real sheet, the real popup and the real buttons over the history stand-in
 * that is Next's own patch (`test-utils/next-history.ts`), with the window's navigation modelled on the entries it makes:
 * `assign` pushes one, `replace` rewrites the one it stands on. What is asserted is what the phone's thumb meets: after
 * ONE Back the window is on the page's own entry (no sheet's marker), and the next Back goes to the page before it.
 *
 * Pressed three ways (Get Pro, Manage billing, a Switch: the surface's three roads out), at a phone, at a phone after a router
 * refresh stripped the sheet's marker, and at a desk, where the sheet holds no entry and the plain push was already right.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { POPUP_HISTORY_MARKER } from "@/components/ui/popup-back";
import type { PlanFacts } from "@/lib/billing/plan-facts";
import { GIGABYTE, planById } from "@/lib/constants/tiers";
import {
  installNextHistory,
  NextRouterStandIn,
  type NextHistory,
} from "@/lib/test-utils/next-history";

import { setViewportWidth } from "../../../../vitest.setup";

const router = { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const STRIPE = "https://checkout.stripe.com/c/pay/cs_test_x";
/** Where the window is once it has left: the history entries are what is under test, never the address. */
const STRIPE_PATH = "/stripe-checkout";

const nativePush = History.prototype.pushState;
const nativeReplace = History.prototype.replaceState;
const realLocation = window.location;
let navigations: string[] = [];

/** The window's navigation, modelled on the entries it makes: a push adds Stripe's page, a replace rewrites the current one. */
function modelNavigation() {
  navigations = [];
  const push = (url: string) => {
    navigations.push(`assign ${url}`);
    nativePush.call(window.history, null, "", STRIPE_PATH);
  };
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      get href() {
        return realLocation.href;
      },
      get pathname() {
        return realLocation.pathname;
      },
      set href(url: string) {
        push(url);
      },
      assign: push,
      replace: (url: string) => {
        navigations.push(`replace ${url}`);
        nativeReplace.call(window.history, null, "", STRIPE_PATH);
      },
      reload: () => navigations.push("reload"),
    },
  });
}

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

const PRO_FACTS = facts({
  tier: "pro",
  hasBilling: true,
  capBytes: planById("pro_200").storageBytes,
  storedBytes: 20 * GIGABYTE,
  currentPlanId: "pro_200",
});

/** What each route answers: the facts the sheet reads when it opens, and Stripe's address for each press. */
let served: PlanFacts | null = null;
const fetchMock = vi.fn(async (url: string) => {
  if (url === "/api/stripe/plan-facts" && served) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, facts: served }),
    };
  }
  if (
    url === "/api/stripe/checkout" ||
    url === "/api/stripe/portal" ||
    url === "/api/stripe/change-plan"
  ) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, url: STRIPE }),
    };
  }
  return { ok: false, status: 500, json: async () => ({}) };
});

let next: NextHistory;

beforeEach(() => {
  served = null;
  vi.stubGlobal("fetch", fetchMock);
  Object.values(router).forEach((fn) => fn.mockClear());
  // The page before this one, then the page itself: Next's own entry at /dashboard.
  window.history.replaceState(null, "", "/");
  nativePush.call(window.history, { __NA: true }, "", "/dashboard");
  next = installNextHistory();
  next.land("/dashboard");
  modelNavigation();
  Object.defineProperty(window, "visualViewport", {
    value: Object.assign(new EventTarget(), {
      height: 667,
      offsetTop: 0,
      width: 375,
    }),
    configurable: true,
  });
});

afterEach(() => {
  next.uninstall();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockClear();
  setViewportWidth(1024);
  Object.defineProperty(window, "location", {
    configurable: true,
    value: realLocation,
  });
  window.history.replaceState(null, "", "/");
});

/** Past the one tick the popup waits before it settles its entry, and a traversal's own. */
const tick = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

const marker = () =>
  (window.history.state as Record<string, unknown> | null)?.[
    POPUP_HISTORY_MARKER
  ];

/** One press of the phone's Back, landed. */
async function back() {
  act(() => window.history.back());
  await tick();
}

function Host({
  plan,
}: {
  plan: { tier: "free" | "pro"; hasBilling: boolean };
}) {
  const [open, setOpen] = useState(true);
  return (
    <NextRouterStandIn>
      <PricingSheet
        open={open}
        onOpenChange={setOpen}
        trigger={{ kind: "plan" }}
        plan={plan}
        returnTo="/dashboard"
      />
    </NextRouterStandIn>
  );
}

/** The three roads out of the sheet: each ends in the doors' way out. */
const ROADS = [
  {
    name: "Get Pro",
    plan: { tier: "free" as const, hasBilling: false },
    facts: null,
    press: async () =>
      userEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: /^get pro/i,
        }),
      ),
  },
  {
    name: "Manage billing",
    plan: { tier: "pro" as const, hasBilling: true },
    facts: PRO_FACTS,
    press: async () =>
      userEvent.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: /manage billing/i,
        }),
      ),
  },
  {
    name: "a Switch",
    plan: { tier: "pro" as const, hasBilling: true },
    facts: PRO_FACTS,
    press: async () => {
      const dialog = screen.getByRole("dialog");
      const row = await waitFor(() => {
        const el = dialog.querySelector('[data-price-row="pro_1tb"]');
        expect(el).toBeTruthy();
        expect(within(el as HTMLElement).queryByRole("button")).toBeTruthy();
        return el as HTMLElement;
      });
      await userEvent.click(
        within(row).getByRole("button", { name: /switch/i }),
      );
    },
  },
];

describe.each(ROADS)("on a phone, leaving by $name", (road) => {
  beforeEach(() => {
    setViewportWidth(375);
    served = road.facts;
  });

  it("★ takes the sheet's own entry with it: one Back returns to the page, and the next leaves it", async () => {
    render(<Host plan={road.plan} />);
    await tick();
    // The premise: the sheet holds an entry of its own over the page's.
    expect(marker()).toBeTruthy();

    await road.press();
    await waitFor(() => expect(navigations).toEqual([`replace ${STRIPE}`]));

    // Stripe's page is where the window is; the phone's Back, once.
    expect(window.location.pathname).toBe(STRIPE_PATH);
    await back();
    expect(window.location.pathname).toBe("/dashboard");
    expect(marker()).toBeUndefined();
    // And the page is the entry just above the one before it: no dead entry of the sheet's in between.
    await back();
    expect(window.location.pathname).toBe("/");
  });

  it("★ does the same after a router refresh stripped the sheet's marker while it was open", async () => {
    render(<Host plan={road.plan} />);
    await tick();
    expect(marker()).toBeTruthy();
    // A list stacked over the sheet refreshes as each deletion lands: Next writes the entry again without our field.
    act(() => next.refresh());
    expect(marker()).toBeUndefined();

    await road.press();
    await waitFor(() => expect(navigations).toEqual([`replace ${STRIPE}`]));

    await back();
    expect(window.location.pathname).toBe("/dashboard");
    await back();
    expect(window.location.pathname).toBe("/");
  });
});

describe("at a desk, where the sheet is a dialog that holds no entry", () => {
  it("pushes Stripe's page on top, and one Back returns to the page: nothing of the sheet's to take", async () => {
    setViewportWidth(1024);
    render(<Host plan={{ tier: "free", hasBilling: false }} />);
    await tick();
    expect(marker()).toBeUndefined();

    await ROADS[0].press();
    await waitFor(() => expect(navigations).toEqual([`assign ${STRIPE}`]));

    await back();
    expect(window.location.pathname).toBe("/dashboard");
    await back();
    expect(window.location.pathname).toBe("/");
  });
});
