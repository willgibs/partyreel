/**
 * The account page's read of "is her credited Pro on its way" (billing-orphans; the rule is `pro-pending.ts`'s). Only
 * for a profile not on Pro; the profile is the page's own RLS-scoped row, the claim read for that row's id.
 *
 * NEVER THROWS: a read that fails says nothing on the card (Sentry hears), since the card's every other fact stands
 * without it and a guess either way would mislead her.
 */
import "server-only";

import {
  PRO_PENDING_WINDOW_MS,
  proPendingSince,
} from "@/lib/billing/pro-pending";
import { readNewestCreditConversion } from "@/lib/db/queries/pass-credits";
import { captureWarning } from "@/lib/observability/sentry";

export async function readProPendingSince(profile: {
  id: string;
  tier: string;
  stripe_event_created_at: string | null;
}): Promise<string | null> {
  if (profile.tier === "pro") return null;
  const nowMs = Date.now();
  try {
    const conversion = await readNewestCreditConversion(
      profile.id,
      new Date(nowMs - PRO_PENDING_WINDOW_MS).toISOString(),
    );
    return proPendingSince({
      tier: profile.tier,
      stripeEventCreatedAt: profile.stripe_event_created_at,
      conversion,
      nowMs,
    });
  } catch (e) {
    captureWarning("billing", "pro_pending_read_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
