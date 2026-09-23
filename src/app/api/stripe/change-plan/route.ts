import { NextResponse } from "next/server";

import { safeReturnPath } from "@/components/app/pricing/return-path";
import { checkPlanChange } from "@/lib/billing/storage-guard";
import { planById, toBillingTier, DEFAULT_TIER } from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { captureError } from "@/lib/observability/sentry";
import {
  CHANGE_REFUSAL_MESSAGES,
  assessSubscription,
  changePlanSessionParams,
  type ChangePlanRefusalCode,
} from "@/lib/stripe/change-plan";
import { getStripe } from "@/lib/stripe/client";
import { planForPriceId, priceIdForPlan } from "@/lib/stripe/plans";
import {
  ChangePlanConfigurationMissingError,
  changePlanConfigurationId,
  forgetChangePlanConfiguration,
} from "@/lib/stripe/portal-config";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { changePlanSchema } from "@/lib/validation/checkout";

/**
 * THE ONE DOOR FOR A PRO SIZE OR CADENCE CHANGE (the storage guard, billing-caps.md).
 *
 * Every Pro door reaches here: a Pro host's click on /pricing (the checkout route
 * refuses `already_subscribed` and the button posts the clicked plan here), the
 * plan sheet's list of six prices, the account page's Plan card and the storage
 * meter's popover (both open that sheet). It verifies who is asking and that the
 * subscription is theirs, live, single-item and on one of our prices; runs the
 * storage check on the target's PLAIN cap; and only then opens Stripe's confirm
 * page for exactly that one price at quantity 1, on the portal configuration
 * tagged for this job. It writes nothing to the profile: the webhook applies the
 * new cap when Stripe confirms, exactly as it always has.
 */
export const runtime = "nodejs";

const REFUSAL_STATUS: Partial<Record<ChangePlanRefusalCode, number>> = {
  not_yours: 403,
};

function refuse(code: ChangePlanRefusalCode) {
  return NextResponse.json(
    { ok: false, code, message: CHANGE_REFUSAL_MESSAGES[code] },
    { status: REFUSAL_STATUS[code] ?? 409 },
  );
}

/** A Stripe API error, read by shape so a test double can speak it too. */
function stripeErrorIs(error: unknown, code: string, param?: string): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; param?: unknown };
  return e.code === code && (param === undefined || e.param === param);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "unauthorized",
        message: "Sign in to change your plan.",
      },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }
  const parsed = changePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Unknown plan." },
      { status: 400 },
    );
  }
  const target = planById(parsed.data.planId);

  // mustQuery: a swallowed failure here reads as "not subscribed" and tells a
  // paying host their plan does not exist. Money path: fail loudly instead.
  const profile = await mustQuery(
    supabase
      .from("profiles")
      .select("tier, stripe_customer_id, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle(),
    "stripe/change-plan: profile",
  );
  if (toBillingTier(profile?.tier ?? DEFAULT_TIER) !== "pro") {
    return refuse("not_subscribed");
  }
  // Pro with no subscription on record is a plan Partyreel set by hand (a comp or
  // a test account): there is nothing in Stripe to change.
  if (!profile?.stripe_customer_id || !profile.stripe_subscription_id) {
    return refuse("no_subscription");
  }

  const stripe = getStripe();
  let subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id,
    );
  } catch (error) {
    if (stripeErrorIs(error, "resource_missing")) {
      return refuse("no_subscription");
    }
    throw error;
  }

  const assessed = assessSubscription(
    subscription,
    profile.stripe_customer_id,
    planForPriceId,
  );
  if (!assessed.ok) return refuse(assessed.code);

  const targetPriceId = priceIdForPlan(target.id);
  // Choosing the plan you are on is a no-op, unless the old quantity stepper
  // left it at 2 or 3: then the same price at quantity 1 is a real (and kind) fix.
  if (targetPriceId === assessed.currentPriceId && assessed.quantity === 1) {
    return refuse("already_on_plan");
  }

  // ── THE STORAGE GUARD ───────────────────────────────────────────────────────
  // Active bytes (getHostStorageSummary, the host_active_bytes definition) against
  // the target's PLAIN cap. An upgrade always passes; a downgrade that fits passes;
  // one that does not is refused with the numbers, and nothing reaches Stripe.
  const { activeBytes } = await getHostStorageSummary();
  const check = checkPlanChange(activeBytes, target);
  if (!check.ok) {
    return NextResponse.json({ ok: false, ...check.refusal }, { status: 409 });
  }

  const siteUrl = await getSiteUrl();
  // Where a confirmed change lands: the page the host started from, through the
  // same exact-shape allow-list Checkout uses (never the welcome marker: this host
  // has been on Pro all along).
  const returnUrl = `${siteUrl}${safeReturnPath((body as { next?: unknown })?.next)}`;

  const sessionFor = (configurationId: string) =>
    stripe.billingPortal.sessions.create(
      changePlanSessionParams({
        customerId: profile.stripe_customer_id!,
        configurationId,
        subscriptionId: assessed.subscriptionId,
        itemId: assessed.itemId,
        priceId: targetPriceId,
        returnUrl,
      }),
    );

  try {
    let session;
    try {
      session = await sessionFor(await changePlanConfigurationId());
    } catch (error) {
      // The cached id went stale (the configuration was re-created or switched
      // off while this instance stayed warm): look it up once more, then give up.
      if (!stripeErrorIs(error, "resource_missing", "configuration")) {
        throw error;
      }
      forgetChangePlanConfiguration();
      session = await sessionFor(await changePlanConfigurationId());
    }
    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    if (error instanceof ChangePlanConfigurationMissingError) {
      // Fail CLOSED, loudly: never fall back to the default configuration, which
      // carries the plan switcher this path exists to route around.
      captureError("billing", error, { route: "stripe/change-plan" });
      return NextResponse.json(
        {
          ok: false,
          code: "unavailable",
          message:
            "Plan changes are unavailable right now. Please try again shortly.",
        },
        { status: 503 },
      );
    }
    throw error;
  }
}
