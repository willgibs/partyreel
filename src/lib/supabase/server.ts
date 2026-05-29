/**
 * Supabase client for Server Components, Route Handlers, and Server Functions.
 * Reads/writes the auth cookies via the Next 16 async `cookies()` API.
 *
 * ⚠️ ALWAYS authorize with `supabase.auth.getUser()` — it re-validates the JWT
 * against the Supabase Auth server. NEVER trust `getSession()` for authz: it
 * only decodes the cookie, which a client can spoof.
 *
 * ⚠️ The `setAll` try/catch is required: created inside a Server Component,
 * cookies are read-only and `.set()` throws. Swallowing it is safe because the
 * proxy (src/proxy.ts → lib/supabase/middleware) refreshes the session cookie
 * on every request.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookie writes aren't
            // allowed. Safe to ignore — the proxy refreshes the session cookie.
          }
        },
      },
    },
  );
}
