import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// OAuth / email-link callback. Supabase redirects the browser here with a
// `code`; we exchange it for a session (the server client writes the auth
// cookies via setAll) and forward the host into the app. Wired now so Phase 1
// auth works without touching routing.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // `next` lets a future caller deep-link past login. Guard against open
  // redirects: only same-origin absolute paths are allowed (reject "//host"
  // and full URLs), otherwise fall back to the dashboard.
  const requested = searchParams.get("next");
  const next =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — bounce back to login with a flag.
  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
