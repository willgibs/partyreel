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
