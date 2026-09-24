/**
 * Event Pass ledger reads (billing-caps.md). The table is RLS deny-all (service-role
 * only), so every read goes through the admin client AFTER the caller's own auth
 * gate — the same posture as getEventGuestList. Never expose raw rows to the
 * browser; surfaces get derived facts (counts, expiry, credit) only.
 */
import "server-only";

import type { PassRow } from "@/lib/billing/passes";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every UNCONSUMED pass a profile owns — live slots, future renewal windows, and
 * naturally-expired rows alike (the pure helpers in lib/billing/passes.ts decide
 * what each row still grants; expiry is a derivation, not a stored state).
 */
export async function getLivePasses(profileId: string): Promise<PassRow[]> {
  // row-cap: one profile's unconsumed Event Passes: each one a purchase, a handful at most
  const { data, error } = await createAdminClient()
    .from("event_passes")
    .select("id, start_at, expires_at, price_cents, consumed_at")
    .eq("profile_id", profileId)
    .is("consumed_at", null);
  if (error) throw new Error(`event_passes read: ${error.message}`);
  return data ?? [];
}
