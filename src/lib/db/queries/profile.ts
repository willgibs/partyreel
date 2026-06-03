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

import type { Tables } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type ProfileRow = Tables<"profiles">;

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * The bits the (app) header account menu needs — the host's editable display name + the avatar
 * marker — in ONE narrow read for the hot layout path (runs on every host page), so we avoid a
 * `select("*")` there. RLS (`profiles_select_own`) scopes the row to auth.uid(); the caller passes
 * its already-validated user id (from the layout's getUser()) so there's no second auth round-trip.
 *
 * The menu reads `profiles.display_name` (the name the host edits in /account, Phase 2) — NOT
 * `user_metadata` — so the account menu, the /account editor, and the guest "Hosted by" byline all
 * show the SAME name. Either field may be null (no name set / no avatar); the UI falls back.
 */
export async function getProfileMenu(
  userId: string,
): Promise<{ displayName: string | null; avatarMarker: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_updated_at")
    .eq("id", userId)
    .maybeSingle();
  return {
    displayName: data?.display_name ?? null,
    avatarMarker: data?.avatar_updated_at ?? null,
  };
}
