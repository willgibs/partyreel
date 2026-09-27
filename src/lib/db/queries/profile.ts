/**
 * Profile read for the authenticated host. `profiles_select_own` scopes the row
 * to `auth.uid()`; we still re-check `getUser()` (RLS is the boundary, the proxy
 * is not). `handle_new_user` guarantees a row exists for every signed-in user,
 * but we return null defensively rather than assume.
 *
 * `tier` here is the source of truth the dashboard reads for entitlements — it
 * is written only by the Stripe webhook / service-role, never the client.
 */
import "server-only";

import { cache } from "react";

import { mustQuery } from "@/lib/db/must-query";
import type { Tables } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth, getRequestClient } from "@/lib/supabase/request-auth";

export type ProfileRow = Tables<"profiles">;

// cache() dedupes within a request (the guest-events convention): several pages
// pair getProfile() with other reads, and the request-cached getRequestAuth
// already collapses the getUser() network hop; caching the row read too keeps
// any same-request repeat free. Per-request scoped, so it can't leak across users.
export const getProfile = cache(
  async function getProfile(): Promise<ProfileRow | null> {
    const { supabase, user } = await getRequestAuth();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
);

/**
 * The bits the (app) header account menu needs — the host's editable display name + the avatar
 * marker — in ONE narrow read for the hot layout path (runs on every host page), so we avoid a
 * `select("*")` there. RLS (`profiles_select_own`) scopes the row to auth.uid(); the caller passes
 * its already-validated user id (from the layout's getUser()) so there's no second auth round-trip.
 *
 * The menu reads `profiles.display_name` (the name the host edits in /account, Phase 2) — NOT
 * `user_metadata` — so the account menu, the /account editor, and the guest "Hosted by" byline all
 * show the SAME name. Either field may be null (no name set / no avatar); the UI falls back.
 *
 * It also reads the SLUG, because the menu grew a second door this round
 * (`you=?`, Will 2026-09-20): "Your profile" goes to /u/<slug> for a host who
 * has claimed a handle and to the claim card on /account for one who has not.
 * Three narrow columns on the hot layout path is still one round-trip, and the
 * alternative — the layout guessing and the menu discovering it was wrong — is
 * a door that 404s the first time a handle-less host taps it.
 */
export async function getProfileMenu(userId: string): Promise<{
  displayName: string | null;
  avatarMarker: string | null;
  slug: string | null;
  /** The raw `tier_type`; coerce with toBillingTier() before indexing tiers.ts. */
  tier: string | null;
}> {
  const supabase = await getRequestClient();
  // A swallowed error here reads as "this host has no name", which the guest
  // page renders as a missing byline and the display-name nudge reads as
  // "never set one" — both wrong answers presented as facts.
  const data = await mustQuery(
    supabase
      .from("profiles")
      .select("display_name, avatar_updated_at, slug, tier")
      .eq("id", userId)
      .maybeSingle(),
    "profile menu",
  );
  return {
    displayName: data?.display_name ?? null,
    avatarMarker: data?.avatar_updated_at ?? null,
    slug: data?.slug ?? null,
    // app-pricing-wiring's one column (`doors=menu`): the account menu's Plan
    // and storage row carries the plan's NAME, and this is the narrow read the
    // whole host app already makes on every page. Server-side and RLS-scoped;
    // the webhook remains its sole writer (billing-caps.md).
    tier: data?.tier ?? null,
  };
}

/**
 * The first of `candidates` no other account holds as its handle, for the setup wizard's prefilled
 * first screen (`handleCandidates`, account/profile/handle-suggestion.ts); null when every one is
 * taken, or on a failed read (the field then opens empty and the live check answers as she types).
 *
 * ★ SIGNED-IN ONLY, AND NOTHING THE LIVE CHECK DOES NOT ALREADY SAY. Availability is the same fact a
 * save attempt reveals (`checkProfileSlugAction` answers it per keystroke), asked here for at most ten
 * spellings of the caller's OWN display name, after `getUser()`: it can never become an anonymous
 * enumeration surface. Admin read because profiles RLS is own-row; the SELECT names only `slug`.
 */
export async function firstFreeHandle(
  candidates: string[],
): Promise<string | null> {
  const asked = candidates.slice(0, 10);
  if (asked.length === 0) return null;
  const { user } = await getRequestAuth();
  if (!user) return null;

  // row-cap: a fixed handful, at most ten spellings of one display name (`handleCandidates`), so
  // neither the list in the URL nor the rows that answer it can grow.
  const { data, error } = await createAdminClient()
    .from("profiles")
    .select("slug")
    .in("slug", asked)
    .neq("id", user.id)
    .limit(asked.length);
  // A suggestion is a convenience: a failed read offers none rather than failing the page.
  if (error) return null;
  const taken = new Set((data ?? []).map((row) => row.slug));
  return asked.find((slug) => !taken.has(slug)) ?? null;
}
