/**
 * Host activity clock for free-tier inactivity removal. Bumps profiles.last_active_at on
 * sign-in / any authenticated host page load (called from the (app) layout). Throttled to
 * ~once per 12h via the WHERE clause, so it's a cheap no-op on most requests. Service-role
 * (last_active_at is not client-writable). Best-effort — never block or fail the page.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const THROTTLE_MS = 12 * 60 * 60 * 1000;

export async function touchHostActive(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - THROTTLE_MS).toISOString();
  await createAdminClient()
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId)
    .lt("last_active_at", cutoff);
}

/**
 * Mark the signed-in host as having seen the first-time welcome (Phase 6). RLS self-update of
 * profiles.welcomed_at via the REGULAR server client — the column grant + profiles_update_own
 * let the host write THIS column (unlike touchHostActive's last_active_at, which is
 * service-role-only). Best-effort. The /welcome flow calls this before navigating away so the
 * /dashboard guard doesn't bounce them back.
 */
export async function markWelcomed(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ welcomed_at: new Date().toISOString() })
    .eq("id", user.id);
}
