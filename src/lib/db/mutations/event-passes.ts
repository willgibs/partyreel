/**
 * Event Pass ledger writes (billing-caps.md) — service-role only, called by the Stripe
 * webhook and the nightly sweeps. Three invariants live here:
 *
 *   1. INSERTS ARE THE IDEMPOTENCY BOUNDARY: one Checkout session mints at most
 *      one row (unique partial index on stripe_session_id); a Stripe re-delivery
 *      surfaces as 23505 and is reported as "replay", never an error.
 *   2. THE PROFILE IS DERIVED STATE: recomputePassEntitlement is the ONLY writer
 *      of the pass-owned profile fields (tier/storage_cap_bytes/event_slots/
 *      tier_expires_at for non-Pro profiles), always writing the full set from
 *      derivePassEntitlement so a replayed recompute lands the same row.
 *   3. NEVER TOUCH A PRO PROFILE: the subscription webhook owns those fields for
 *      tier='pro'. The guard rides IN THE WHERE CLAUSE (atomic under READ
 *      COMMITTED, the applyEntitlement lesson) so a concurrent Pro provision
 *      can't be clobbered by a pass recompute that read a stale tier.
 */
import "server-only";

import { derivePassEntitlement } from "@/lib/billing/passes";
import { getLivePasses } from "@/lib/db/queries/event-passes";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

export type PassPurchaseInsert = {
  profileId: string;
  startAt: string;
  expiresAt: string;
  priceCents: number;
  source: "initial" | "renewal";
  stripeSessionId: string;
};

/** Mint the ledger row for one paid Checkout session. Replay-safe by session id. */
export async function insertPassPurchase(
  purchase: PassPurchaseInsert,
): Promise<"inserted" | "replay"> {
  const { error } = await createAdminClient().from("event_passes").insert({
    profile_id: purchase.profileId,
    start_at: purchase.startAt,
    expires_at: purchase.expiresAt,
    price_cents: purchase.priceCents,
    source: purchase.source,
    stripe_session_id: purchase.stripeSessionId,
  });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return "replay";
    throw new Error(`event_passes insert: ${error.message}`);
  }
  return "inserted";
}

/**
 * Convert every live pass to consumed('pro_credit') — the "nothing gets banked"
 * write when a host starts Pro with a prorated credit. Consumes ALL unconsumed
 * rows (the credit was computed over all of them at checkout time). Returns how
 * many rows this call consumed: 0 = a replay (already consumed), which the
 * webhook treats as success.
 */
export async function consumeLivePassesForProCredit(
  profileId: string,
): Promise<number> {
  const { data, error } = await createAdminClient()
    .from("event_passes")
    .update({
      consumed_at: new Date().toISOString(),
      consumed_reason: "pro_credit",
    })
    .eq("profile_id", profileId)
    .is("consumed_at", null)
    .select("id");
  if (error) throw new Error(`event_passes consume: ${error.message}`);
  return (data ?? []).length;
}

export type RecomputeResult = "updated" | "unchanged" | "skipped_pro";

/**
 * Re-derive a profile's pass entitlement from its ledger and write the four
 * pass-owned fields together. Safe to call any time (webhook, sweeps, drift
 * healing): it is a pure function of the ledger + the clock. `.neq("tier",
 * "pro")` keeps it off subscription-owned rows atomically.
 */
export async function recomputePassEntitlement(
  profileId: string,
  now: Date = new Date(),
): Promise<RecomputeResult> {
  const admin = createAdminClient();
  const passes = await getLivePasses(profileId);
  const derived = derivePassEntitlement(passes, now);

  const { data: current, error: readError } = await admin
    .from("profiles")
    .select("tier, storage_cap_bytes, event_slots, tier_expires_at")
    .eq("id", profileId)
    .maybeSingle();
  if (readError) throw new Error(`recompute read: ${readError.message}`);
  if (!current) return "unchanged";
  if (current.tier === "pro") return "skipped_pro";

  // Timestamps compare as epoch ms: Postgres serializes "+00:00" where our derived
  // ISO says ".000Z", and a string compare would report perpetual drift.
  const sameExpiry =
    (current.tier_expires_at === null && derived.tierExpiresAt === null) ||
    (current.tier_expires_at !== null &&
      derived.tierExpiresAt !== null &&
      Date.parse(current.tier_expires_at) ===
        Date.parse(derived.tierExpiresAt));
  const same =
    current.tier === derived.tier &&
    current.storage_cap_bytes === derived.storageCapBytes &&
    current.event_slots === derived.eventSlots &&
    sameExpiry;
  if (same) return "unchanged";

  const { data: updated, error } = await admin
    .from("profiles")
    .update({
      tier: derived.tier,
      storage_cap_bytes: derived.storageCapBytes,
      event_slots: derived.eventSlots,
      tier_expires_at: derived.tierExpiresAt,
    })
    .eq("id", profileId)
    .neq("tier", "pro")
    .select("id");
  if (error) throw new Error(`recompute write: ${error.message}`);
  return (updated ?? []).length === 1 ? "updated" : "skipped_pro";
}
