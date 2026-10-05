/**
 * Event Pass ledger writes (billing-caps.md) — service-role only, called by the Stripe
 * webhook and the nightly sweeps. Four invariants live here:
 *
 *   1. INSERTS ARE THE IDEMPOTENCY BOUNDARY: one Checkout session mints at most
 *      one row (unique partial index on stripe_session_id); a Stripe re-delivery
 *      surfaces as 23505 and is reported as "replay", never an error.
 *   2. THE PROFILE IS DERIVED STATE: recomputePassEntitlement is the ONLY writer
 *      of the pass-owned profile fields (tier/storage_cap_bytes/event_slots/
 *      tier_expires_at for non-Pro profiles), always writing the full set from
 *      derivePassEntitlement so a replayed recompute lands the same row; the one
 *      other write is the credit's conversion (4), which only clears the chain.
 *   3. NEVER TOUCH A PRO PROFILE: the subscription webhook owns those fields for
 *      tier='pro'. The guard rides IN THE WHERE CLAUSE (atomic under READ
 *      COMMITTED, the applyEntitlement lesson) so a concurrent Pro provision
 *      can't be clobbered by a pass recompute that read a stale tier.
 *   4. ★ THE CREDIT'S CONVERSION TAKES HER PROFILES ROW FIRST (billing-locks): it is one
 *      SQL transaction (`consume_passes_for_pro_credit`), never two requests, in the one
 *      lock order every capacity body keeps (database-security.md): an upload's complete
 *      holds her profiles row while it counts on her live pass, so a conversion that took
 *      the passes first, in one transaction, would close a cycle with it.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { derivePassEntitlement } from "@/lib/billing/passes";
import { getLivePasses } from "@/lib/db/queries/event-passes";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";

/**
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE: `consume_passes_for_pro_credit` arrives with migration
 * 20261005130000, so its call goes through this untyped client (drop the cast then).
 */
function passCreditDb(db: ReturnType<typeof createAdminClient>) {
  return db as unknown as SupabaseClient;
}

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
 * Convert every live pass to consumed('pro_credit') and clear the chain fields
 * (`tier_expires_at`, `event_slots`): the "nothing gets banked" write when a host
 * starts Pro with a prorated credit. Consumes ALL unconsumed rows (the credit was
 * computed over all of them at checkout time). Returns how many rows this call
 * consumed: 0 = a replay (already consumed), which the webhook treats as success.
 *
 * ★ ONE CALL, ONE TRANSACTION, HER PROFILES ROW FIRST (`consume_passes_for_pro_credit`,
 * 20261005130000). It was two requests, the passes and then the profile: the reverse
 * of an upload's complete (her profiles row, then the pass it counts on), held apart
 * only because each request is its own transaction, so a host sat between them with
 * her passes consumed and her chain still set. A failed call throws, so the webhook
 * answers 500 and Stripe retries (the credit's balance grant before it is keyed, so a
 * retry never grants twice).
 */
export async function consumeLivePassesForProCredit(
  profileId: string,
): Promise<number> {
  const { data, error } = await passCreditDb(createAdminClient()).rpc(
    "consume_passes_for_pro_credit",
    { p_host_id: profileId },
  );
  if (error) {
    throw new Error(`consume_passes_for_pro_credit: ${error.message}`);
  }
  // The function answers a row count; anything else is a broken call, never "nothing to consume".
  if (typeof data !== "number" || !Number.isInteger(data) || data < 0) {
    throw new Error(
      "consume_passes_for_pro_credit answered something other than a count",
    );
  }
  return data;
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
