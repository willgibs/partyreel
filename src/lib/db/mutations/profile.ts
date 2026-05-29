/**
 * Host activity clock for free-tier inactivity removal. Bumps profiles.last_active_at on
 * sign-in / any authenticated host page load (called from the (app) layout). Throttled to
 * ~once per 12h via the WHERE clause, so it's a cheap no-op on most requests. Service-role
 * (last_active_at is not client-writable). Best-effort — never block or fail the page.
 */
import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const THROTTLE_MS = 12 * 60 * 60 * 1000;

export async function touchHostActive(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - THROTTLE_MS).toISOString();
  await createAdminClient()
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId)
    .lt("last_active_at", cutoff);
}
