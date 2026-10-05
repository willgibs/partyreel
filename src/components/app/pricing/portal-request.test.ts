/**
 * THE BILLING PORTAL'S ONE CLIENT READS WHAT THE ROUTE ANSWERS AS OUTCOMES (pricing-doors: `ManageBillingButton` used to
 * fetch inline): the address to go to, a lapsed session, the route's own sentence, and nothing that rejects.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { requestPortal } from "@/components/app/pricing/portal-request";

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

describe("the portal's verb", () => {
  it("posts to the portal route, with no body: it opens the signed-in host's own", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer(200, { ok: true, url: "https://billing.stripe.com/p/session/x" });
    await requestPortal();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/stripe/portal");
    expect(init).toEqual({ method: "POST" });
  });

  it("goes to the address the route made", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer(200, { ok: true, url: "https://billing.stripe.com/p/session/x" });
    expect(await requestPortal()).toEqual({
      kind: "redirect",
      url: "https://billing.stripe.com/p/session/x",
    });
  });

  it("★ reads a lapsed session as a sign-in", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer(401, { ok: false, code: "unauthorized", message: "Sign in." });
    expect(await requestPortal()).toEqual({ kind: "signin" });
  });

  it("carries the route's sentence when there is one, and asks her to try again when there is none", async () => {
    vi.stubGlobal("fetch", fetchMock);
    answer(400, {
      ok: false,
      code: "no_customer",
      message: "No billing account yet.",
    });
    expect(await requestPortal()).toEqual({
      kind: "error",
      message: "No billing account yet.",
    });
    answer(500, {});
    expect(await requestPortal()).toEqual({
      kind: "error",
      message: "Please try again.",
    });
    // A 200 with nothing to follow is a failure, never a redirect to `undefined`.
    for (const url of [undefined, "", 7, null]) {
      answer(200, { ok: true, url });
      expect((await requestPortal()).kind, String(url)).toBe("error");
    }
  });

  it("★ never rejects: a body that is not JSON, and a network that is down, both read as a failure to retry", async () => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    expect(await requestPortal()).toEqual({
      kind: "error",
      message: "Please try again.",
    });
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await requestPortal()).toEqual({
      kind: "error",
      message: "Please try again.",
    });
  });
});
