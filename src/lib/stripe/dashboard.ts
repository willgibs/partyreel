// Deep-link to a customer in the Stripe dashboard (the admin Accounts detail links out here for any
// billing change — Stripe stays the single source of truth). The dashboard has separate test/live
// spaces, so the URL must match the app's key mode. The caller passes `live` (derived from the key
// in the query layer) so this stays a pure, import-free, unit-testable function.
export function buildStripeCustomerUrl(
  customerId: string,
  live: boolean,
): string {
  return `https://dashboard.stripe.com/${live ? "" : "test/"}customers/${customerId}`;
}
