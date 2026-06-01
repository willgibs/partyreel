import { describe, expect, it } from "vitest";

import { buildStripeCustomerUrl } from "@/lib/stripe/dashboard";

// The Stripe dashboard has separate test/live spaces; the account detail's customer deep-link must
// match the app's key mode or it 404s in the wrong space.
describe("buildStripeCustomerUrl", () => {
  it("omits the /test/ segment for live", () => {
    expect(buildStripeCustomerUrl("cus_123", true)).toBe(
      "https://dashboard.stripe.com/customers/cus_123",
    );
  });

  it("includes the /test/ segment for test mode", () => {
    expect(buildStripeCustomerUrl("cus_123", false)).toBe(
      "https://dashboard.stripe.com/test/customers/cus_123",
    );
  });
});
