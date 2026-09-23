/**
 * Operator-internal account reads for the admin Accounts browser (P4). SERVICE-ROLE admin client —
 * there is no cross-host profile read elsewhere (RLS scopes `profiles` to the owner). The
 * /admin/accounts pages gate on requireAdmin() first. READ-ONLY: billing changes go through Stripe
 * (the webhook stays the SOLE writer of tier/cap/subscription); nothing here writes.
 */
import "server-only";

import {
  effectiveStorageCap,
  toBillingTier,
  type Tier,
} from "@/lib/constants/tiers";
import { readHostStorageSummary } from "@/lib/db/queries/storage";
import type { Tables } from "@/lib/db/types";
import { serverEnv } from "@/lib/env";
import { buildStripeCustomerUrl } from "@/lib/stripe/dashboard";
import { createAdminClient } from "@/lib/supabase/admin";

const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  pro: "Pro",
  event_pass: "Event Pass",
};

/** Human tier label from a raw DB `tier` value (coerces the retired `max` via toBillingTier). */
export function accountTierLabel(dbTier: string): string {
  return TIER_LABEL[toBillingTier(dbTier)];
}

export type AccountListItem = Pick<
  Tables<"profiles">,
  | "id"
  | "email"
  | "display_name"
  | "tier"
  | "storage_cap_bytes"
  | "storage_used_bytes"
  | "last_active_at"
  | "created_at"
>;

export type AccountDetail = {
  profile: Tables<"profiles">;
  tierLabel: string;
  /** null = unlimited (Pro). */
  effectiveCapBytes: number | null;
  /** Sum of non-removed media in non-deleted events (matches the over-capacity sweep). */
  activeBytes: number;
  /** Raw counter (real R2 bytes; only drops at hard-purge). */
  storageUsedBytes: number;
  eventCount: number;
  mediaCount: number;
  hasSubscription: boolean;
  /** Stripe dashboard deep-link, or null if the host has no Stripe customer yet. */
  stripeCustomerUrl: string | null;
};

/** Account list, newest-active first, with an optional email/name search. Capped at 50. */
export async function searchAccounts(q?: string): Promise<AccountListItem[]> {
  const admin = createAdminClient();
  let query = admin
    .from("profiles")
    .select(
      "id, email, display_name, tier, storage_cap_bytes, storage_used_bytes, last_active_at, created_at",
    )
    .order("last_active_at", { ascending: false })
    .limit(50);

  const term = q?.trim().replace(/[,()*]/g, ""); // strip chars that would break the or() filter
  if (term) {
    query = query.or(`email.ilike.%${term}%,display_name.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAccountDetail(
  id: string,
): Promise<AccountDetail | null> {
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  // ACTIVE media (non-removed, in non-deleted events): the bytes from the one aggregate the host's own meter and the
  // storage guard read (`host_storage_summary`, whose active filter is host_active_bytes'), and the count as an exact
  // HEAD count under the same filters. Neither reads rows, so neither is capped at PostgREST's 1,000 (an unpaged row
  // read would sum the first thousand items of a large account and show the operator a fraction of it).
  const [{ activeBytes }, { count: mediaCount, error: mErr }] =
    await Promise.all([
      readHostStorageSummary(id),
      admin
        .from("media")
        .select("id, events!media_event_id_fkey!inner(host_id, deleted_at)", {
          count: "exact",
          head: true,
        })
        .eq("events.host_id", id)
        .is("events.deleted_at", null)
        .neq("status", "removed"),
    ]);
  if (mErr) throw mErr;

  const { count: eventCount, error: eErr } = await admin
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("host_id", id)
    .is("deleted_at", null);
  if (eErr) throw eErr;

  const tier = toBillingTier(profile.tier);
  // The Stripe dashboard has separate test/live spaces; derive the mode from the secret-key prefix
  // server-side so the customer deep-link lands in the right space (only the URL is exposed).
  const stripeLive =
    serverEnv.STRIPE_SECRET_KEY?.startsWith("sk_live") ?? false;

  return {
    profile,
    tierLabel: TIER_LABEL[tier],
    effectiveCapBytes: effectiveStorageCap(tier, profile.storage_cap_bytes),
    activeBytes,
    storageUsedBytes: profile.storage_used_bytes,
    eventCount: eventCount ?? 0,
    mediaCount: mediaCount ?? 0,
    hasSubscription: Boolean(profile.stripe_subscription_id),
    stripeCustomerUrl: profile.stripe_customer_id
      ? buildStripeCustomerUrl(profile.stripe_customer_id, stripeLive)
      : null,
  };
}
