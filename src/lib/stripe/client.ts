/**
 * The server-side Stripe SDK client. `server-only` keeps the secret key out of any
 * client bundle. Lazily constructed (and memoized) so the app still builds/deploys
 * before STRIPE_SECRET_KEY is set — assertStripeEnv() only runs when a Stripe route
 * is actually hit.
 *
 * apiVersion is PINNED to the version bundled with the installed `stripe` package
 * (22.2.0 → 2026-05-27.dahlia). Pinning decouples our request/response shapes from
 * account-level API-version changes; bump it deliberately when upgrading the SDK.
 */
import "server-only";

import Stripe from "stripe";

import { assertStripeEnv } from "@/lib/env";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(assertStripeEnv().STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return client;
}
