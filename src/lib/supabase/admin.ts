/**
 * Privileged Supabase client using the SECRET (service-role) key. It BYPASSES
 * RLS entirely, so it must NEVER reach the browser — the `server-only` import
 * turns any client-side import into a build error.
 *
 * Use it ONLY for trusted, privileged paths that must sidestep RLS: the Stripe
 * webhook writing `profiles.tier` (Phase 4), the purge cron (Phase 3), and
 * service-role maintenance. Guest reads/writes do NOT use this — they go through
 * security-definer RPCs validated by capability token (see the schema / ADR-0004).
 */
import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/db/types";
import { env, serverEnv } from "@/lib/env";

export function createAdminClient() {
  if (!serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set — the admin client cannot be created. " +
        "Set it in the server environment (never as NEXT_PUBLIC_).",
    );
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
