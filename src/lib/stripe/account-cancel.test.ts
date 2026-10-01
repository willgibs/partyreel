/**
 * AN ACCOUNT'S DELETION CANCELS EVERY SUBSCRIPTION OF ITS CUSTOMER (crumbs-41, from `hardening`). It cancelled only the
 * one the profile follows, so a host who had paid in both Checkout tabs kept paying for the other after her account
 * was gone. Against a stand-in for Stripe's two calls (the list and the cancel), never a charge:
 *
 *  - ★ every subscription that has not ended is cancelled, the followed one and the one nobody follows, an incomplete
 *    one included (its first invoice can still be paid for 23 hours); an expired one is left alone;
 *  - ★ any failure, the list's or one cancel's, is `failed` and names it, so the deletion stops before it destroys
 *    anything; a subscription already gone counts as cancelled, so a retry after a partial run finishes;
 *  - the list is read whole, page after page.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Listed = { id: string; status: string };

const stripe = vi.hoisted(() => ({
  pages: [] as { data: Listed[]; has_more: boolean }[],
  listed: [] as Record<string, unknown>[],
  cancelled: [] as string[],
  listFails: null as unknown,
  cancelFails: {} as Record<string, unknown>,
}));

vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({
    subscriptions: {
      list: async (params: Record<string, unknown>) => {
        stripe.listed.push(params);
        if (stripe.listFails) throw stripe.listFails;
        return stripe.pages.shift() ?? { data: [], has_more: false };
      },
      cancel: async (id: string) => {
        if (stripe.cancelFails[id]) throw stripe.cancelFails[id];
        stripe.cancelled.push(id);
        return { id, status: "canceled" };
      },
    },
  }),
}));

const { cancelSubscriptionsForDeletion } =
  await import("@/lib/stripe/account-cancel");

const sub = (id: string, status = "active"): Listed => ({ id, status });

beforeEach(() => {
  stripe.pages = [];
  stripe.listed = [];
  stripe.cancelled = [];
  stripe.listFails = null;
  stripe.cancelFails = {};
});

describe("cancelSubscriptionsForDeletion", () => {
  it("★ cancels every subscription of the customer that has not ended, not only the one the profile follows", async () => {
    stripe.pages = [
      {
        data: [
          sub("sub_followed"),
          sub("sub_second_tab", "trialing"),
          sub("sub_dunning", "past_due"),
          sub("sub_open_tab", "incomplete"),
          sub("sub_expired_tab", "incomplete_expired"),
          sub("sub_unpaid", "unpaid"),
          sub("sub_paused", "paused"),
        ],
        has_more: false,
      },
    ];

    const result = await cancelSubscriptionsForDeletion({
      customerId: "cus_1",
      subscriptionId: "sub_followed",
    });

    expect(stripe.listed).toEqual([{ customer: "cus_1", limit: 100 }]);
    expect([...stripe.cancelled].sort()).toEqual([
      "sub_dunning",
      "sub_followed",
      "sub_open_tab",
      "sub_paused",
      "sub_second_tab",
      "sub_unpaid",
    ]);
    expect(result).toEqual({
      status: "cancelled",
      subscriptionIds: stripe.cancelled,
    });
  });

  it("★ a cancel that fails on any subscription is a failure that names it, and stops there", async () => {
    stripe.pages = [
      { data: [sub("sub_a"), sub("sub_b"), sub("sub_c")], has_more: false },
    ];
    stripe.cancelFails.sub_b = Object.assign(new Error("card_declined"), {
      code: "card_declined",
      statusCode: 402,
    });

    const result = await cancelSubscriptionsForDeletion({
      customerId: "cus_1",
      subscriptionId: "sub_a",
    });

    expect(result).toEqual({
      status: "failed",
      subscriptionId: "sub_b",
      message: "card_declined",
    });
    expect(stripe.cancelled).toEqual(["sub_a"]);
  });

  it("★ a list that fails is a failure: an unread subscription may be the one still billing", async () => {
    stripe.listFails = Object.assign(new Error("Stripe is unreachable"), {
      statusCode: 500,
    });

    const result = await cancelSubscriptionsForDeletion({
      customerId: "cus_1",
      subscriptionId: "sub_a",
    });

    expect(result).toMatchObject({ status: "failed" });
    expect(stripe.cancelled).toEqual([]);
  });

  it("counts a subscription already gone as cancelled, so a retry after a partial run finishes", async () => {
    stripe.pages = [{ data: [sub("sub_b")], has_more: false }];
    // The followed one was cancelled by the first attempt: the list no longer shows it, and its cancel is missing.
    stripe.cancelFails.sub_a = Object.assign(
      new Error("No such subscription"),
      {
        code: "resource_missing",
        statusCode: 404,
      },
    );

    const result = await cancelSubscriptionsForDeletion({
      customerId: "cus_1",
      subscriptionId: "sub_a",
    });

    expect(result).toEqual({
      status: "cancelled",
      subscriptionIds: ["sub_b", "sub_a"],
    });
  });

  it("reads the list whole, page after page", async () => {
    stripe.pages = [
      { data: [sub("sub_1"), sub("sub_2")], has_more: true },
      { data: [sub("sub_3")], has_more: false },
    ];

    await cancelSubscriptionsForDeletion({
      customerId: "cus_1",
      subscriptionId: null,
    });

    expect(stripe.listed).toEqual([
      { customer: "cus_1", limit: 100 },
      { customer: "cus_1", limit: 100, starting_after: "sub_2" },
    ]);
    expect(stripe.cancelled).toEqual(["sub_1", "sub_2", "sub_3"]);
  });

  it("with no customer still cancels the subscription the profile follows; with neither, there is nothing to do", async () => {
    await expect(
      cancelSubscriptionsForDeletion({
        customerId: null,
        subscriptionId: "sub_a",
      }),
    ).resolves.toEqual({ status: "cancelled", subscriptionIds: ["sub_a"] });
    expect(stripe.listed).toEqual([]);

    await expect(
      cancelSubscriptionsForDeletion({
        customerId: null,
        subscriptionId: null,
      }),
    ).resolves.toEqual({ status: "none" });

    // A customer with nothing live and no followed subscription: nothing to cancel.
    await expect(
      cancelSubscriptionsForDeletion({
        customerId: "cus_1",
        subscriptionId: null,
      }),
    ).resolves.toEqual({ status: "none" });
  });

  it("a customer Stripe no longer has holds nothing that bills", async () => {
    stripe.listFails = Object.assign(new Error("No such customer"), {
      code: "resource_missing",
      statusCode: 404,
    });
    await expect(
      cancelSubscriptionsForDeletion({
        customerId: "cus_gone",
        subscriptionId: null,
      }),
    ).resolves.toEqual({ status: "none" });
  });
});
