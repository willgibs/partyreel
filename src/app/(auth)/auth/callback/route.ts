import { NextResponse } from "next/server";

import { isAdminHost } from "@/lib/auth/admin-host";
import { createClient } from "@/lib/supabase/server";

// OAuth / email-link callback. Supabase redirects the browser here with a
// `code`; we exchange it for a session (the server client writes the auth cookies
// via setAll) and forward into the app.
//
// Host-aware: redirect back to the SAME host the user authenticated on (so an
// admin-subdomain login keeps its host-isolated session) and pick a default
// landing per host — the admin subdomain lands in the portal (/admin), everything
// else on /dashboard. A valid same-origin `next` still wins.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Trust the Host header for the user-facing domain (request.url's host can be an
  // internal Vercel host); build the redirect base from it so we stay on the host
  // they actually hit.
  const host = request.headers.get("host") ?? url.host;
  const base = `${url.protocol}//${host}`;

  // Guard against open redirects: only same-origin absolute paths (reject "//host"
  // and full URLs); otherwise the host-aware default.
  const requested = url.searchParams.get("next");
  const next =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : isAdminHost(host)
        ? "/admin"
        : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  // No code, or the exchange failed — bounce back to login with a flag.
  return NextResponse.redirect(`${base}/login?error=auth_callback`);
}
