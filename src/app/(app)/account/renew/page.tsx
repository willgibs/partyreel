import type { Metadata } from "next";

import { RenewCheckout } from "@/components/app/renew-checkout";

export const metadata: Metadata = { title: "Renew Event Pass" };

/**
 * WHERE THE RENEWAL NUDGE'S BUTTON LANDS (`RENEW_PASS_PATH`, src/lib/email/links.ts). It used to
 * open the dashboard, which renews nothing by itself; this page starts the pass's own renewal
 * Checkout (renew-checkout.tsx says how, and why it is a page rather than a link to Stripe).
 *
 * Gated like every (app) route: the layout's `getUser()` sends a signed-out visitor to /login, and
 * the account layout's name gate covers it. It reads nothing itself: the checkout route decides the
 * renewal from the ledger, server-side, as it does for the Plan card's button.
 */
export default function RenewPassPage() {
  return <RenewCheckout />;
}
