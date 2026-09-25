/**
 * THE BILLING COPY FOLLOWS THE ADDRESS, AND NEVER BREAKS THE CHANGE THAT CALLED IT.
 *
 * `syncBillingEmail` runs after an email change is already committed in Supabase Auth, so the
 * cases below hold its two promises: it points an existing Stripe customer at the new address (and
 * does nothing for an account without one), and every failure is captured and answered, never
 * thrown into the flow.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  profile: { stripe_customer_id: "cus_123" } as {
    stripe_customer_id: string | null;
  } | null,
  readError: null as { message: string } | null,
  update: vi.fn(async () => ({ id: "cus_123" })),
  captureError: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: state.captureError,
}));
vi.mock("@/lib/stripe/client", () => ({
  getStripe: () => ({ customers: { update: state.update } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      expect(table).toBe("profiles");
      return {
        select: (columns: string) => {
          expect(columns).toBe("stripe_customer_id");
          return {
            eq: (column: string, value: string) => {
              expect(column).toBe("id");
              expect(value).toBe("user-1");
              return {
                maybeSingle: async () => ({
                  data: state.readError ? null : state.profile,
                  error: state.readError,
                }),
              };
            },
          };
        },
      };
    },
  }),
}));

const { syncBillingEmail } = await import("@/lib/stripe/customer-email");

beforeEach(() => {
  state.profile = { stripe_customer_id: "cus_123" };
  state.readError = null;
  state.update.mockReset();
  state.update.mockResolvedValue({ id: "cus_123" });
  state.captureError.mockReset();
});

describe("syncBillingEmail", () => {
  it("points the account's Stripe customer at the new address, and only the address", async () => {
    await expect(
      syncBillingEmail("user-1", "new@example.com"),
    ).resolves.toEqual({ status: "updated", customerId: "cus_123" });
    expect(state.update).toHaveBeenCalledWith("cus_123", {
      email: "new@example.com",
    });
  });

  it("does nothing for an account that never became a Stripe customer", async () => {
    state.profile = { stripe_customer_id: null };
    await expect(
      syncBillingEmail("user-1", "new@example.com"),
    ).resolves.toEqual({ status: "none" });
    expect(state.update).not.toHaveBeenCalled();
  });

  it("captures a Stripe refusal and answers it, never throwing into the change", async () => {
    state.update.mockRejectedValue(new Error("Stripe is down"));
    await expect(
      syncBillingEmail("user-1", "new@example.com"),
    ).resolves.toEqual({ status: "failed", customerId: "cus_123" });
    expect(state.captureError).toHaveBeenCalledTimes(1);
    expect(state.captureError.mock.calls[0][0]).toBe("billing");
  });

  it("captures a failed profile read, and never calls Stripe on a guess", async () => {
    state.readError = { message: "connection reset" };
    await expect(
      syncBillingEmail("user-1", "new@example.com"),
    ).resolves.toEqual({ status: "failed", customerId: null });
    expect(state.update).not.toHaveBeenCalled();
    expect(state.captureError).toHaveBeenCalledTimes(1);
  });

  it("never puts an address in what it reports", async () => {
    state.update.mockRejectedValue(new Error("Stripe is down"));
    await syncBillingEmail("user-1", "new@example.com");
    expect(JSON.stringify(state.captureError.mock.calls[0][2])).not.toContain(
      "@",
    );
  });
});
