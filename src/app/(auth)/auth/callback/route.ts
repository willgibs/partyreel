import { after, NextResponse } from "next/server";

import { adoptDoorName } from "@/app/(auth)/adopt-door-name";
import { isAdminHost } from "@/lib/auth/admin-host";
import { doorFailureKind } from "@/lib/auth/door-failure";
import { syncBillingEmail } from "@/lib/stripe/customer-email";
import { createClient } from "@/lib/supabase/server";

// OAuth / email-link callback. Supabase redirects the browser here with a
// `code`; we exchange it for a session (the server client writes the auth cookies
// via setAll) and forward into the app.
//
// Host-aware: redirect back to the SAME host the user authenticated on (so an
// admin-subdomain login keeps its host-isolated session) and pick a default
// landing per host — the admin subdomain lands in the portal (/admin), everything
// else on /dashboard. A valid same-origin `next` still wins.
//
// ★ WHEN IT FAILS IT NAMES THE KIND (`failure=paths`, Will 2026-09-20). It used
// to bounce back with one flag, `?error=auth_callback`, and the page turned that
// into one sentence with its recoveries in prose. Now it emits a kind from
// `lib/auth/door-failure.ts` and `/login` renders the line AND three real
// buttons from the same table. Supabase's own error params (`error_code`,
// `error`) are mapped through the same function, so a provider that refuses
// before we ever see a code still lands on a door a host can get through.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Trust the Host header for the user-facing domain (request.url's host can be an
  // internal Vercel host); build the redirect base from it so we stay on the host
  // they actually hit.
  const host = request.headers.get("host") ?? url.host;
  const base = `${url.protocol}//${host}`;

  // An email change's links (`requestEmailChangeAction` sets `flow=email_change`)
  // always land on the account page, whatever they carry: see emailChangeLanding.
  if (url.searchParams.get("flow") === "email_change") {
    const landing = await emailChangeLanding(url, code);
    return NextResponse.redirect(
      `${base}/account${landing ? `?email_change=${landing}` : ""}`,
    );
  }

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
      // A guest's tapped link loses the name typed at the door (the in-page step
      // is gone), so the door carries it in the new account's metadata and it is
      // adopted here, before the album can ask for it again. Never throws.
      if (next.startsWith("/e/")) await adoptDoorName();
      return NextResponse.redirect(`${base}${next}`);
    }
    // An exchange that fails on a present code is an aged-out or already-spent
    // link, which is the one thing a host can act on: send a new code.
    return NextResponse.redirect(`${base}/login?error=expired_link`);
  }

  // No code at all: either the provider refused (Supabase puts its own reason in
  // the query) or the link was truncated. Map what we were told, and fall back
  // to the expired link, which is what a link with no code nearly always is.
  const kind =
    doorFailureKind(url.searchParams.get("error_code")) ??
    doorFailureKind(url.searchParams.get("error")) ??
    "expired_link";
  return NextResponse.redirect(`${base}/login?error=${kind}`);
}

/**
 * WHERE AN EMAIL CHANGE'S LINK LANDS, as the account page's `?email_change=` word
 * (lp/identity-email).
 *
 * ★ THE FIRST OF THE TWO LINKS CARRIES NO CODE, AND IS NEVER AN EXPIRED LINK. With
 * "Secure email change" on, GoTrue answers the first confirmation with a message
 * and no session, in the URL FRAGMENT (and in the query too, under PKCE), which a
 * server never sees. So a code-less landing is `half` (one address confirmed, we
 * cannot tell which), unless the query names a refusal.
 *
 * ★ A CODE IS ISSUED ONLY ONCE THE CHANGE HAS COMMITTED, so the exchange decides
 * only whether THIS browser gets the new session (a phone that opens the link in
 * another browser lacks the flow's PKCE verifier). An exchange that works lands
 * `done` and the Stripe customer's copy follows after the response, best-effort,
 * from the session that proved it. One that fails still lands on the account page
 * rather than an expired link, WITH NO WORD: the change stands and the row reads
 * the truth from `getUser()`, and a hand-made `?code=` never earns a "Changed".
 */
async function emailChangeLanding(
  url: URL,
  code: string | null,
): Promise<"half" | "done" | "failed" | null> {
  if (!code) {
    const refused =
      url.searchParams.get("error") ?? url.searchParams.get("error_code");
    return refused ? "failed" : "half";
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const userId = error ? null : (data.user?.id ?? null);
  const email = error ? null : (data.user?.email ?? null);
  if (!userId || !email) return null;
  after(() => syncBillingEmail(userId, email));
  return "done";
}
