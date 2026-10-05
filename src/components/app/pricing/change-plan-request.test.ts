/**
 * THE ONE CLIENT FOR `/api/stripe/change-plan` reads what the route answers beside the url: the uploads sentence a switch
 * below this month's uploads earns (`notice`, crumbs-70), carried only when it is a sentence, so every client that
 * ignores it (the plan sheet, which says it on the card before the press) reads the same outcome it always did.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { requestChangePlan } from "@/components/app/pricing/change-plan-request";

function answer(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("the redirect carries the route's sentence", () => {
  it("passes a notice beside the url", async () => {
    answer(200, {
      ok: true,
      url: "https://billing.stripe.com/x",
      notice: "Hi.",
    });
    expect(await requestChangePlan("pro_50")).toEqual({
      kind: "redirect",
      url: "https://billing.stripe.com/x",
      notice: "Hi.",
    });
  });

  it("is the plain redirect it always was when there is none (or it is not a sentence)", async () => {
    for (const notice of [undefined, "", 7, null]) {
      answer(200, { ok: true, url: "https://billing.stripe.com/x", notice });
      expect(await requestChangePlan("pro_50"), String(notice)).toEqual({
        kind: "redirect",
        url: "https://billing.stripe.com/x",
      });
    }
  });
});
