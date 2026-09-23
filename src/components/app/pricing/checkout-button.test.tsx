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
  planId: "pro_100",
  storedBytes: 140 * GIGABYTE,
  capBytes: 100 * GIGABYTE,
  gapBytes: 40 * GIGABYTE,
  fits: ["pro_500", "pro_2tb"],
  message:
    "You're storing 140 GB. Pro 100 GB holds 100 GB, so remove 40 GB first, or choose Pro 500 GB.",
};

let assigned: string | null = null;
beforeEach(() => {
  replies = {};
  calls.length = 0;
  assigned = null;
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
    <CheckoutButton planId="pro_100" {...props}>
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
      fits: ["pro_500", "pro_2tb"],
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
    await press({ planId: "pro_2tb_yr", next: "/account" });
    await waitFor(() =>
      expect(assigned).toBe("https://billing.stripe.com/p/session/x"),
    );
    expect(calls.map((c) => c.url)).toEqual([
      "/api/stripe/checkout",
      "/api/stripe/change-plan",
    ]);
    expect(calls[1].body).toEqual({ planId: "pro_2tb_yr", next: "/account" });
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
