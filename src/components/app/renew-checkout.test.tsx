/**
 * THE RENEWAL NUDGE'S LANDING (`emails` r1): the page makes the Plan card's own renewal POST once,
 * however React runs its effects, and leaves for Stripe by replacing itself; a refusal says the
 * route's sentence with a way on; a failure offers another try and charges nothing.
 */
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RenewCheckout, renewOutcome } from "@/components/app/renew-checkout";

type Reply = { status: number; body: unknown } | "throw";
let replies: Reply[] = [];
const calls: { url: string; body: unknown }[] = [];
let replaced: string[] = [];

beforeEach(() => {
  replies = [];
  calls.length = 0;
  replaced = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      const reply = replies.shift() ?? { status: 500, body: {} };
      if (reply === "throw") throw new TypeError("Failed to fetch");
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
      replace: (url: string) => {
        replaced.push(url);
      },
    },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const ENDED =
  "Renewal applies to an Event Pass that is still active. Yours has ended, so start a new Event Pass from the pricing page.";

describe("renewOutcome", () => {
  it("reads every answer the checkout route gives", () => {
    expect(
      renewOutcome(200, { ok: true, url: "https://checkout.stripe.com/c/1" }),
    ).toEqual({
      kind: "redirect",
      url: "https://checkout.stripe.com/c/1",
    });
    expect(renewOutcome(401, { message: "Sign in to upgrade." })).toEqual({
      kind: "signin",
    });
    expect(
      renewOutcome(403, { ok: false, code: "not_eligible", message: ENDED }),
    ).toEqual({
      kind: "refused",
      message: ENDED,
      code: "not_eligible",
    });
    expect(
      renewOutcome(409, {
        code: "already_subscribed",
        message:
          "You're on Pro, which already includes everything a pass adds.",
      }),
    ).toMatchObject({ kind: "refused" });
    // Anything without its own words is ours to say.
    expect(renewOutcome(500, {})).toEqual({ kind: "failed" });
    expect(renewOutcome(200, { ok: true })).toEqual({ kind: "failed" });
    expect(renewOutcome(400, { message: "" })).toEqual({ kind: "failed" });
    expect(renewOutcome(502, null)).toEqual({ kind: "failed" });
  });
});

describe("the page", () => {
  it("posts the Plan card's renewal once, even when effects run twice, and leaves for Stripe", async () => {
    replies = [
      {
        status: 200,
        body: { ok: true, url: "https://checkout.stripe.com/c/9" },
      },
    ];
    render(
      <StrictMode>
        <RenewCheckout />
      </StrictMode>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/opening checkout/i);
    await waitFor(() =>
      expect(replaced).toEqual(["https://checkout.stripe.com/c/9"]),
    );
    expect(calls).toEqual([
      {
        url: "/api/stripe/checkout",
        body: { planId: "event_pass", renewal: true, next: "/account" },
      },
    ]);
  });

  it("says the route's sentence when the pass has ended, and leads with where it points", async () => {
    replies = [
      {
        status: 403,
        body: { ok: false, code: "not_eligible", message: ENDED },
      },
    ];
    render(<RenewCheckout />);
    expect(await screen.findByText(ENDED)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Renew Event Pass" }),
    ).toBeInTheDocument();
    // The sentence says "from the pricing page", so that is the first way on.
    expect(
      screen
        .getAllByRole("link")
        .map((a) => [a.textContent, a.getAttribute("href")]),
    ).toEqual([
      ["See plans", "/pricing"],
      ["Open your plan", "/account#plan"],
    ]);
    expect(replaced).toEqual([]);
  });

  it("sends an account on Pro to its plan first", async () => {
    replies = [
      {
        status: 409,
        body: {
          ok: false,
          code: "already_subscribed",
          message:
            "You're on Pro, which already includes everything a pass adds.",
        },
      },
    ];
    render(<RenewCheckout />);
    expect(
      await screen.findByText(
        "You're on Pro, which already includes everything a pass adds.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link").map((a) => a.textContent)).toEqual([
      "Open your plan",
      "See plans",
    ]);
  });

  it("offers another try when checkout fails, and the try can succeed", async () => {
    replies = [
      "throw",
      {
        status: 200,
        body: { ok: true, url: "https://checkout.stripe.com/c/2" },
      },
    ];
    render(<RenewCheckout />);
    expect(
      await screen.findByRole("heading", { name: "Checkout didn't open" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nothing was charged/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(replaced).toEqual(["https://checkout.stripe.com/c/2"]),
    );
    expect(calls).toHaveLength(2);
  });

  it("sends a signed-out visitor to sign in", async () => {
    replies = [{ status: 401, body: { ok: false, code: "unauthorized" } }];
    render(<RenewCheckout />);
    await waitFor(() => expect(replaced).toEqual(["/login"]));
  });
});
