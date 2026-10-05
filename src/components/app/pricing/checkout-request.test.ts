/**
 * CHECKOUT'S ONE CLIENT READS WHAT THE ROUTE ANSWERS AS OUTCOMES (pricing-doors: `CheckoutButton` used to fetch inline).
 *
 * What is pinned is each answer's reading, since the button only switches on it: the address to go to, the storage
 * guard's numbers, a Pro host's `already_subscribed` (the button's cue to post the same plan to change-plan), the
 * route's own sentence and code for everything else, and a lapsed session. And that nothing a network does rejects: a
 * door that threw would leave the pressing transition with an unhandled rejection and the host with a dead button.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { requestCheckout } from "@/components/app/pricing/checkout-request";
import { GIGABYTE } from "@/lib/constants/tiers";

const REFUSAL = {
  ok: false,
  code: "over_new_cap",
  planId: "pro_50",
  storedBytes: 70 * GIGABYTE,
  capBytes: 50 * GIGABYTE,
  gapBytes: 20 * GIGABYTE,
  fits: ["pro_200", "pro_1tb"],
  message: "You're storing 70 GB. Pro 50 GB holds 50 GB.",
};

const fetchMock = vi.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function stub() {
  vi.stubGlobal("fetch", fetchMock);
}

describe("what it asks", () => {
  it("posts the plan, the renewal flag and the page to come back to, as JSON, and nothing it was not given", async () => {
    stub();
    answer(200, { ok: true, url: "https://checkout.stripe.com/c/x" });
    await requestCheckout("event_pass", { renewal: true, next: "/account" });
    await requestCheckout("pro_200");
    const [first, second] = fetchMock.mock.calls;
    expect(first[0]).toBe("/api/stripe/checkout");
    expect(first[1].method).toBe("POST");
    expect(first[1].headers).toEqual({ "content-type": "application/json" });
    expect(JSON.parse(first[1].body)).toEqual({
      planId: "event_pass",
      renewal: true,
      next: "/account",
    });
    expect(JSON.parse(second[1].body)).toEqual({ planId: "pro_200" });
  });
});

describe("what it reads", () => {
  it("goes to the address the route made", async () => {
    stub();
    answer(200, { ok: true, url: "https://checkout.stripe.com/c/x" });
    expect(await requestCheckout("pro_50")).toEqual({
      kind: "redirect",
      url: "https://checkout.stripe.com/c/x",
    });
  });

  it("★ reads a lapsed session as a sign-in, whatever the body says", async () => {
    stub();
    answer(401, { ok: false, code: "unauthorized", message: "Sign in." });
    expect(await requestCheckout("pro_50")).toEqual({ kind: "signin" });
  });

  it("★ keeps the storage guard's numbers whole, for the surface that prints them", async () => {
    stub();
    answer(409, REFUSAL);
    const outcome = await requestCheckout("pro_50");
    expect(outcome).toMatchObject({
      kind: "refused",
      refusal: {
        planId: "pro_50",
        storedBytes: 70 * GIGABYTE,
        capBytes: 50 * GIGABYTE,
        gapBytes: 20 * GIGABYTE,
        fits: ["pro_200", "pro_1tb"],
        message: REFUSAL.message,
      },
    });
  });

  it("★ names a Pro host's `already_subscribed`, with the route's sentence, apart from every other 409", async () => {
    stub();
    answer(409, {
      ok: false,
      code: "already_subscribed",
      message: "You're already on Pro.",
    });
    expect(await requestCheckout("pro_1tb")).toEqual({
      kind: "subscribed",
      message: "You're already on Pro.",
    });
    answer(409, { ok: false, code: "something_else", message: "Not now." });
    expect(await requestCheckout("pro_1tb")).toEqual({
      kind: "error",
      message: "Not now.",
      code: "something_else",
    });
  });

  it("carries the route's sentence and code for a refusal that is neither", async () => {
    stub();
    answer(403, {
      ok: false,
      code: "not_eligible",
      message: "Renewal applies to an Event Pass that is still active.",
    });
    expect(await requestCheckout("event_pass", { renewal: true })).toEqual({
      kind: "error",
      message: "Renewal applies to an Event Pass that is still active.",
      code: "not_eligible",
    });
  });

  it("asks her to try again when the answer has no sentence, or no address to go to", async () => {
    stub();
    answer(500, {});
    expect(await requestCheckout("pro_50")).toEqual({
      kind: "error",
      message: "Please try again.",
      code: null,
    });
    // A 200 with nothing to follow is a failure, never a redirect to `undefined`.
    for (const url of [undefined, "", 7, null]) {
      answer(200, { ok: true, url });
      expect((await requestCheckout("pro_50")).kind, String(url)).toBe("error");
    }
  });
});

describe("★ it never rejects", () => {
  it("reads a body that is not JSON (a proxy's HTML page) as a failure to retry", async () => {
    stub();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    expect(await requestCheckout("pro_50")).toEqual({
      kind: "error",
      message: "Please try again.",
      code: null,
    });
  });

  it("reads a network that is down as the same", async () => {
    stub();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await requestCheckout("pro_50")).toEqual({
      kind: "error",
      message: "Please try again.",
      code: null,
    });
  });
});
