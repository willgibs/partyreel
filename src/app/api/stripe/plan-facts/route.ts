import { NextResponse } from "next/server";

import type { PlanFacts } from "@/lib/billing/plan-facts";
import {
  DEFAULT_TIER,
  effectiveStorageCap,
  toBillingTier,
} from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { captureWarning } from "@/lib/observability/sentry";
import { assessSubscription } from "@/lib/stripe/change-plan";
import { getStripe } from "@/lib/stripe/client";
import { formatEntitlementExpiry } from "@/lib/stripe/entitlement";
import { planForPriceId } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";
import { isProPlanId } from "@/lib/validation/checkout";

/**
 * The plan sheet's one read, made when it opens (the storage guard, billing-caps.md):
 * the host's tier, what they store, the cap in force and, for a Pro host, which of
 * the six prices they are on and whether a switch can open. So every door opens the
 * sheet on a size that fits without carrying a byte count, and a Pro host sees their
 * own price marked.
 *
 * Read-only and self-scoped: getUser(), the RLS-scoped profile row, the RLS-scoped
 * storage summary, and (Pro only) the subscription that row names. It decides
 * nothing; the checkout and change-plan routes re-derive everything themselves.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in." },
      { status: 401 },
    );
  }

  // mustQuery: a swallowed failure would read as a Free host storing nothing, and
  // the sheet would open on the smallest plan for someone it may not fit.
  const [profile, storage] = await Promise.all([
    mustQuery(
      supabase
        .from("profiles")
        .select(
          "tier, storage_cap_bytes, stripe_customer_id, stripe_subscription_id, tier_expires_at",
        )
        .eq("id", user.id)
        .maybeSingle(),
      "stripe/plan-facts: profile",
    ),
    getHostStorageSummary(),
  ]);

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  let currentPlanId: PlanFacts["currentPlanId"] = null;
  let changeBlocked: PlanFacts["changeBlocked"] = null;

  if (tier === "pro") {
    if (!profile?.stripe_customer_id || !profile.stripe_subscription_id) {
      changeBlocked = "no_subscription";
    } else {
      try {
        const sub = await getStripe().subscriptions.retrieve(
          profile.stripe_subscription_id,
        );
        // The price is read on its own so a blocked subscription (unpaid, ending)
        // still shows the host which plan they are on.
        const only = sub.items.data.length === 1 ? sub.items.data[0] : null;
        const current = only ? planForPriceId(only.price.id) : null;
        if (current && isProPlanId(current.id)) currentPlanId = current.id;
        const assessed = assessSubscription(
          sub,
          profile.stripe_customer_id,
          planForPriceId,
        );
        if (!assessed.ok) changeBlocked = assessed.code;
      } catch (error) {
        const code = (error as { code?: unknown } | null)?.code;
        if (code === "resource_missing") {
          changeBlocked = "no_subscription";
        } else {
          // Degrade, never fail the sheet: it still lists the six prices, and the
          // change-plan route re-checks the subscription before any session. Said
          // aloud so a Stripe outage is visible rather than a quiet missing mark.
          captureWarning("billing", "plan-facts: subscription read failed", {
            code: typeof code === "string" ? code : null,
          });
        }
      }
    }
  }

  const facts: PlanFacts = {
    tier,
    hasBilling: Boolean(profile?.stripe_customer_id),
    passExpiry:
      tier === "event_pass" && profile?.tier_expires_at
        ? formatEntitlementExpiry(profile.tier_expires_at)
        : null,
    activeBytes: storage.activeBytes,
    standbyBytes: storage.standbyBytes,
    capBytes: effectiveStorageCap(tier, profile?.storage_cap_bytes ?? null),
    currentPlanId,
    changeBlocked,
  };

  return NextResponse.json(
    { ok: true, facts },
    // One host's plan and bytes: never cached by a browser or anything between.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
