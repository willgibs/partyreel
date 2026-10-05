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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GIGABYTE } from "@/lib/constants/tiers";

import { CheckoutButton } from "@/components/app/checkout-button";

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
afterEach(() => {
  vi.unstubAllGlobals();
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
    expect(screen.getByRole("button")).toBeDisabled();
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
    options.action.onClick();
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
    const { unmount } = render(
      <CheckoutButton planId="pro_50">Get Pro</CheckoutButton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Get Pro" }));
    await waitFor(() => expect(toast).toHaveBeenCalledTimes(1));
    unmount();
    await vi.advanceTimersByTimeAsync(10_000);
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
 * sign-in may return to (`loginPath`, lib/auth/return-path.ts): the public pricing page is not, so
 * its visitor still gets the bare login it always had.
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

  it("leaves the public pricing page's visitor on the bare login", async () => {
    pathname = "/pricing";
    replies["/api/stripe/checkout"] = { status: 401, body: {} };
    await press();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});
