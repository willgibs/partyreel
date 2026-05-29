/**
 * Session refresh for the proxy (src/proxy.ts). Runs on every matched request,
 * rotates the Supabase auth cookie, and keeps server & client in sync.
 *
 * ⚠️ Three rules that, if broken, cause intermittent logout bugs:
 *   1. Use `createServerClient` (NOT the browser client) here.
 *   2. Call `supabase.auth.getUser()` BEFORE returning — that call is what
 *      triggers the token refresh and the Set-Cookie writes.
 *   3. Return the SAME `supabaseResponse` whose cookies getAll/setAll mutated.
 *      Building a fresh NextResponse afterward drops the refreshed cookies and
 *      silently logs users out.
 *
 * This REFRESHES the session; it does not AUTHORIZE. Route protection lives in
 * the (app) layout via getUser(), and every Server Function must re-check authz
 * itself — never rely on the proxy alone as a security boundary.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/db/types";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Triggers token refresh + Set-Cookie. Do NOT remove or move below the return.
  await supabase.auth.getUser();

  return supabaseResponse;
}
