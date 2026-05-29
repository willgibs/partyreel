/**
 * Supabase client for Client Components (browser). Uses the PUBLISHABLE key, so
 * every query is constrained by RLS — safe to ship to the browser.
 *
 * Server Components / Route Handlers / Server Functions → use ./server.
 * Privileged server-only work that must bypass RLS      → use ./admin.
 */
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
