import { NextResponse } from "next/server";

import { safeReturnPath } from "@/components/app/pricing/return-path";
import { checkPlanChange, uploadsPauseNote } from "@/lib/billing/storage-guard";
import {
  planById,
  toBillingTier,
  DEFAULT_TIER,
  type Plan,
} from "@/lib/constants/tiers";
import { mustQuery } from "@/lib/db/must-query";
import { readHostMonthUploads } from "@/lib/db/queries/month-uploads";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { captureError, captureWarning } from "@/lib/observability/sentry";
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
 *
 * ★ A SWITCH BELOW THIS MONTH'S UPLOADS ANSWERS ITS SENTENCE BESIDE THE URL (`notice`, crumbs-70). A smaller size
 * also carries a smaller uploads allowance, and the plan sheet says so on the size's own card before the press
 * (`uploadsPauseNote`, red-team 52's LOW); /pricing's hop is tier-blind (a static page cannot know what a host
 * uploaded), so it learns on the press and shows the route's words before it leaves. Words only: the webhook allows
 * the switch, so nothing here is ever a refusal, and a failed read answers no sentence rather than no switch.
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

/**
 * The sentence a switch earns, or null. Only a real step DOWN in the uploads allowance can pause anything (her own size
 * at the other billing carries the same one, a bigger size a bigger one), so those never pay the read. Words only:
 * a failed read is said aloud and answers nothing, never a failed switch. It never rejects.
 */
async function uploadsNoticeFor(
  hostId: string,
  current: Plan,
  target: Plan,
): Promise<string | null> {
  if (target.uploadsBytes >= current.uploadsBytes) return null;
  try {
    return uploadsPauseNote(await readHostMonthUploads(hostId), target);
  } catch (error) {
    captureWarning("billing", "change-plan: month uploads read failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
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
  // What she stores, her albums and her Deleted together (getHostStorageSummary,
  // the figure every cap check reads: trash-in-storage), against the target's
  // PLAIN cap. An upgrade always passes; a downgrade that fits passes; one that does
  // not is refused with the numbers, and nothing reaches Stripe.
  const { storedBytes } = await getHostStorageSummary();
  const check = checkPlanChange(storedBytes, target);
  if (!check.ok) {
    return NextResponse.json({ ok: false, ...check.refusal }, { status: 409 });
  }

  const siteUrl = await getSiteUrl();
  // Where a confirmed change lands: the page the host started from, through the
  // same exact-shape allow-list Checkout uses (never the welcome marker: this host
  // has been on Pro all along).
  const returnUrl = `${siteUrl}${safeReturnPath((body as { next?: unknown })?.next)}`;
  // Started now, read after Stripe's page is made: the sentence rides the answer without delaying it.
  const notice = uploadsNoticeFor(user.id, assessed.currentPlan, target);

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
    const sentence = await notice;
    return NextResponse.json({
      ok: true,
      url: session.url,
      ...(sentence ? { notice: sentence } : {}),
    });
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
