/**
 * THE BUY BUTTON'S TWO STORAGE-GUARD DUTIES (billing-caps.md).
 *
 *  1. A refusal shows its NUMBERS: to the surface that prints them in place
 *     (`onRefused`, the plan sheet), or in a toast that carries them, never a
 *     bare "couldn't start checkout".
 *  2. A Pro host choosing a Pro plan is a CHANGE: the checkout route's
 *     `already_subscribed` sends the same plan to /api/stripe/change-plan, and
 *     the general billing portal is never opened for it (its switcher cannot
 *     know what a host stores). A Pro host's pass click keeps checkout's words.
 *  3. A switch below this month's uploads says so BEFORE it leaves (crumbs-70): the route
 *     answers the sentence beside the url, and the hop (a tier-blind page with no card of
 *     its own to carry the words) shows it and holds one reading before Stripe's page,
 *     with a way to stay (the wait is hers to stop).
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";

import { CheckoutButton } from "@/components/app/checkout-button";
import { HOLD_FLOOR_MS } from "@/components/app/pricing/leave";
import { PricingDoorsProvider } from "@/components/app/pricing/pricing-doors";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

type Reply = { status: number; body: unknown };
let replies: Record<string, Reply> = {};
const calls: { url: string; body: unknown }[] = [];

const REFUSAL = {
  ok: false,
  code: "over_new_cap",
  planId: "pro_50",
  storedBytes: 140 * GIGABYTE,
  capBytes: 100 * GIGABYTE,
  gapBytes: 40 * GIGABYTE,
  fits: ["pro_200", "pro_1tb"],
  message:
    "You're storing 70 GB. Pro 50 GB holds 50 GB, so remove 20 GB first, or choose Pro 200 GB.",
};

let assigned: string | null = null;
// The page the button is pressed on: a sign-in fallback carries it back (crumbs-20).
let pathname = "/";
beforeEach(() => {
  replies = {};
  calls.length = 0;
  assigned = null;
  pathname = "/";
  vi.mocked(toast).mockClear();
  vi.mocked(toast.error).mockClear();
  push.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      const reply = replies[url] ?? { status: 500, body: {} };
      return {
        ok: reply.status >= 200 && reply.status < 300,
        status: reply.status,
        json: async () => reply.body,
      };
    }),
  );
  // Leaving for Stripe is a navigation; record where it would go instead.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...window.location,
      get pathname() {
        return pathname;
      },
      set href(url: string) {
        assigned = url;
      },
    },
  });
});
/** The page coming back from the browser's back/forward cache, as the browser tells it. */
function pageshow(persisted: boolean) {
  window.dispatchEvent(Object.assign(new Event("pageshow"), { persisted }));
}
afterEach(() => {
  vi.unstubAllGlobals();
  // A press that left holds every door until the page comes back (`leave.ts`): this page always does, for the next test.
  pageshow(true);
});

async function press(
  props: Partial<React.ComponentProps<typeof CheckoutButton>> = {},
) {
  render(
    <CheckoutButton planId="pro_50" {...props}>
      Get Pro
    </CheckoutButton>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Get Pro" }));
}

describe("a storage refusal shows its numbers", () => {
  it("hands the refusal to a surface that prints it in place", async () => {
    replies["/api/stripe/checkout"] = { status: 409, body: REFUSAL };
    const onRefused = vi.fn();
    await press({ onRefused });
    await waitFor(() => expect(onRefused).toHaveBeenCalledTimes(1));
    expect(onRefused.mock.calls[0][0]).toMatchObject({
      storedBytes: 140 * GIGABYTE,
      capBytes: 100 * GIGABYTE,
      gapBytes: 40 * GIGABYTE,
      fits: ["pro_200", "pro_1tb"],
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("otherwise puts the numbers in the toast, never a bare failure", async () => {
    replies["/api/stripe/checkout"] = { status: 409, body: REFUSAL };
    await press();
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const options = vi.mocked(toast.error).mock.calls[0][1] as {
      description?: string;
    };
    expect(options.description).toBe(REFUSAL.message);
  });
});

describe("a Pro host choosing a Pro plan", () => {
  it("is sent to change-plan with the same plan, never to the general portal", async () => {
    replies["/api/stripe/checkout"] = {
      status: 409,
      body: { ok: false, code: "already_subscribed", message: "On Pro." },
    };
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: "https://billing.stripe.com/p/session/x" },
    };
    await press({ planId: "pro_1tb_yr", next: "/account" });
    await waitFor(() =>
      expect(assigned).toBe("https://billing.stripe.com/p/session/x"),
    );
    expect(calls.map((c) => c.url)).toEqual([
      "/api/stripe/checkout",
      "/api/stripe/change-plan",
    ]);
    expect(calls[1].body).toEqual({ planId: "pro_1tb_yr", next: "/account" });
    expect(calls.some((c) => c.url === "/api/stripe/portal")).toBe(false);
  });

  it("shows change-plan's storage refusal with its numbers", async () => {
    replies["/api/stripe/checkout"] = {
      status: 409,
      body: { ok: false, code: "already_subscribed", message: "On Pro." },
    };
    replies["/api/stripe/change-plan"] = { status: 409, body: REFUSAL };
    const onRefused = vi.fn();
    await press({ onRefused });
    await waitFor(() => expect(onRefused).toHaveBeenCalledTimes(1));
    expect(assigned).toBe(null);
  });

  it("says so plainly, never as an error, when the host picks the plan they are on", async () => {
    replies["/api/stripe/checkout"] = {
      status: 409,
      body: { ok: false, code: "already_subscribed", message: "On Pro." },
    };
    replies["/api/stripe/change-plan"] = {
      status: 409,
      body: { ok: false, code: "already_on_plan", message: "That's yours." },
    };
    await press();
    await waitFor(() => expect(toast).toHaveBeenCalledWith("That's yours."));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("keeps checkout's own words for a Pro host's pass click", async () => {
    replies["/api/stripe/checkout"] = {
      status: 409,
      body: {
        ok: false,
        code: "already_subscribed",
        message: "Pro includes it.",
      },
    };
    render(<CheckoutButton planId="event_pass">Buy a pass</CheckoutButton>);
    await userEvent.click(screen.getByRole("button", { name: "Buy a pass" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(calls.map((c) => c.url)).toEqual(["/api/stripe/checkout"]);
  });
});

describe("a switch below this month's uploads says so before it leaves", () => {
  const NOTICE =
    "You've uploaded 150 GB this month. At 100 GB a month, new uploads, yours and your guests', would pause until November 1.";
  const URL = "https://billing.stripe.com/p/session/x";
  const subscribed = {
    status: 409,
    body: { ok: false, code: "already_subscribed", message: "On Pro." },
  };

  // Real time moves the clock too (userEvent and waitFor lean on timers); the hold itself is stepped.
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("shows the route's sentence, then holds one reading before it goes to Stripe", async () => {
    replies["/api/stripe/checkout"] = subscribed;
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: URL, notice: NOTICE },
    };
    await press();
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(NOTICE, expect.anything()),
    );
    // Still here, and saying it is working: she has not had a moment to read it yet.
    expect(assigned).toBe(null);
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => expect(assigned).toBe(URL));
    // Words, never an error: the webhook allows the switch.
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("★ stays on the page when she says so during the hold: the wait is hers to stop", async () => {
    replies["/api/stripe/checkout"] = subscribed;
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: URL, notice: NOTICE },
    };
    await press();
    await waitFor(() => expect(toast).toHaveBeenCalledTimes(1));
    const options = vi.mocked(toast).mock.calls[0][1] as {
      action: { label: string; onClick: () => void };
    };
    expect(options.action.label).toBe("Stay here");
    act(() => options.action.onClick());
    await vi.advanceTimersByTimeAsync(10_000);
    // The button is hers again, and nothing left the page.
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    expect(assigned).toBe(null);
  });

  it("★ does not take her to Stripe from another page once she has left this one during the hold", async () => {
    replies["/api/stripe/checkout"] = subscribed;
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: URL, notice: NOTICE },
    };
    vi.mocked(toast).mockReturnValueOnce("held-sentence");
    const { unmount } = render(
      <CheckoutButton planId="pro_50">Get Pro</CheckoutButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Get Pro" }));
    await waitFor(() => expect(toast).toHaveBeenCalledTimes(1));
    unmount();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(assigned).toBe(null);
    // And its sentence goes with the page, rather than lingering beside a Stay here that now stays nothing.
    expect(toast.dismiss).toHaveBeenCalledWith("held-sentence");
  });

  it("★ never holds the app's own navigation: another transition commits while the sentence is held", async () => {
    // React entangles every transition with an async one still pending, the router's included: a hold awaited inside
    // the press's transition left every link in the app dead until Stripe's page had already taken over (measured in
    // a browser). The probe is a transition of its own, which is what a Link press is.
    function Probe() {
      const [n, setN] = useState(0);
      const [, startTransition] = useTransition();
      return (
        <button onClick={() => startTransition(() => setN((c) => c + 1))}>
          probe {n}
        </button>
      );
    }
    replies["/api/stripe/checkout"] = subscribed;
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: URL, notice: NOTICE },
    };
    render(
      <>
        <CheckoutButton planId="pro_50">Get Pro</CheckoutButton>
        <Probe />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Get Pro" }));
    await waitFor(() => expect(toast).toHaveBeenCalledTimes(1));
    expect(assigned).toBe(null);
    await userEvent.click(screen.getByRole("button", { name: /probe/ }));
    // Well inside the hold (a second of it, of five), and it has committed.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "probe 1" }),
      ).toBeInTheDocument(),
    );
    expect(assigned).toBe(null);
  });

  it("goes at once, with nothing said, when the route answers no sentence", async () => {
    replies["/api/stripe/checkout"] = subscribed;
    replies["/api/stripe/change-plan"] = {
      status: 200,
      body: { ok: true, url: URL },
    };
    await press();
    await waitFor(() => expect(assigned).toBe(URL));
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("the ordinary paths", () => {
  it("goes to Stripe Checkout when the purchase is allowed", async () => {
    replies["/api/stripe/checkout"] = {
      status: 200,
      body: { ok: true, url: "https://checkout.stripe.com/c/x" },
    };
    await press();
    await waitFor(() =>
      expect(assigned).toBe("https://checkout.stripe.com/c/x"),
    );
  });

  it("sends a signed-out visitor to sign in", async () => {
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    await press();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});

/**
 * ★ A SIGNED-OUT PRESS CARRIES ITS OWN PAGE THROUGH THE SIGN-IN (crumbs-20: the ROADMAP's six
 * bare `/login` fallbacks, from `crumbs-11`). A session that lapsed while a host sat on a page comes
 * back to that page after the sign-in, not to the dashboard. The page rides only where it is one a
 * sign-in may return to (`loginPath`, lib/auth/return-path.ts): the app's pages, and, since
 * pricing-doors, /pricing, the one marketing page on the list, so the visitor who pressed Get Pro
 * there comes back to the plans she came for instead of an empty dashboard. A page off the list
 * still gets the bare login it always had (reshaped on purpose: /pricing used to be that page's
 * example, and the scar moved to /help, which is still not a place a sign-in may return to).
 */
describe("a signed-out press carries the page it was pressed on", () => {
  it("returns to the host's page after signing in", async () => {
    pathname = "/account";
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    await press();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Faccount"),
    );
  });

  it("does the same when the change-plan hop finds the session gone", async () => {
    pathname = "/dashboard";
    replies["/api/stripe/checkout"] = {
      status: 409,
      body: { ok: false, code: "already_subscribed", message: "On Pro." },
    };
    replies["/api/stripe/change-plan"] = { status: 401, body: {} };
    await press();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Fdashboard"),
    );
  });

  it("★ brings the pricing page's visitor back to the pricing page, not to the dashboard", async () => {
    pathname = "/pricing";
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    await press();
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Fpricing"),
    );
  });

  it("does the same for a pass pressed on that page, a renewal included", async () => {
    pathname = "/pricing";
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    render(
      <CheckoutButton planId="event_pass" renewal>
        Renew
      </CheckoutButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Renew" }));
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/login?next=%2Fpricing"),
    );
  });

  it("keeps the bare login on a page no sign-in returns to", async () => {
    pathname = "/help";
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    await press();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});

/**
 * ★ PRESSED UNTIL THE PAGE HAS GONE (crumbs-83; the ROADMAP's "Checkout, Manage billing and Switch re-enable the moment
 * Stripe's address is assigned, so a second tap while Stripe's page loads opens a second session"). Assigning the address
 * only starts the browser's navigation; the page stands, live, until Stripe answers, so the press holds (`leave.ts`): the
 * button keeps saying it is working until the page hides, a page the browser brings back from its cache lets it go, and so
 * does a page that never left, after the floor.
 */
describe("★ pressed until the page has gone (crumbs-83)", () => {
  const STRIPE = "https://checkout.stripe.com/c/pay/cs_test_hold";
  beforeEach(() => {
    replies["/api/stripe/checkout"] = {
      status: 200,
      body: { ok: true, url: STRIPE },
    };
  });
  const checkouts = () => calls.filter((c) => c.url === "/api/stripe/checkout");

  it("★ stays Opening billing and busy once Stripe's address is assigned: a second tap opens no second session", async () => {
    await press();
    await waitFor(() => expect(assigned).toBe(STRIPE));
    // The old button came back here, "Get Pro" and enabled, while Stripe's page was still on its way.
    const button = screen.getByRole("button", { name: "Opening billing" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(checkouts()).toHaveLength(1);
  });

  it("lets go when the browser brings the page back from its cache (Back from Stripe)", async () => {
    await press();
    await waitFor(() => expect(assigned).toBe(STRIPE));
    act(() => pageshow(false));
    expect(screen.getByRole("button", { name: "Opening billing" })).toHaveAttribute("aria-busy", "true");
    act(() => pageshow(true));
    expect(screen.getByRole("button", { name: "Get Pro" })).toBeEnabled();
  });

  it("stands every door down while one is leaving: another press opens nothing", async () => {
    render(<CheckoutButton planId="event_pass">Buy a pass</CheckoutButton>);
    await press();
    await waitFor(() => expect(assigned).toBe(STRIPE));
    // The other door keeps its words, and takes no press.
    const other = screen.getByRole("button", { name: "Buy a pass" });
    expect(other).toBeDisabled();
    await userEvent.click(other);
    expect(checkouts()).toHaveLength(1);
  });

  describe("a page that never left", () => {
    // Real time moves the clock too (userEvent and waitFor lean on timers); the floor itself is stepped.
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it("lets go after the floor, so no door is left dead (a load she stopped)", async () => {
      await press();
      await waitFor(() => expect(assigned).toBe(STRIPE));
      await vi.advanceTimersByTimeAsync(HOLD_FLOOR_MS - 1_000);
      expect(screen.getByRole("button", { name: "Opening billing" })).toHaveAttribute("aria-busy", "true");
      await vi.advanceTimersByTimeAsync(2_000);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Get Pro" })).toBeEnabled(),
      );
    });
  });

  it("holds nothing for a way out that does not leave (the Library's doors stop where they would)", async () => {
    const leave = vi.fn();
    render(
      <PricingDoorsProvider
        doors={{
          readFacts: async () => null,
          startCheckout: async () => ({ kind: "redirect", url: STRIPE }),
          openPortal: async () => ({ kind: "error", message: "no" }),
          changePlan: async () => ({
            kind: "error",
            message: "no",
            code: null,
          }),
          leave,
          router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() },
        }}
      >
        <CheckoutButton planId="pro_50">Get Pro</CheckoutButton>
      </PricingDoorsProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Get Pro" }));
    await waitFor(() => expect(leave).toHaveBeenCalledWith(STRIPE));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Get Pro" })).toBeEnabled(),
    );
  });
});
