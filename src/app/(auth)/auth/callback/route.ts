import { after, NextResponse } from "next/server";

import {
  ACCOUNT_DELETING,
  isBannedRedirect,
  isUserBanned,
} from "@/app/(auth)/account-deleting";
import { checkExistingAccount } from "@/app/(auth)/actions";
import { adoptDoorName } from "@/app/(auth)/adopt-door-name";
import {
  TOLD_NAME_COOKIE,
  TOLD_NAME_MAX_AGE_S,
  toldNameValue,
} from "@/app/(auth)/adopt-door-name-told";
import { isAdminHost } from "@/lib/auth/admin-host";
import { doorFailureKind } from "@/lib/auth/door-failure";
import {
  ADMIN_RETURN_COOKIE,
  ADMIN_RETURN_COOKIE_PATH,
  adminReturnFromCookies,
  NEXT_PARAM,
  signInLanding,
  signInReturn,
  withReturn,
} from "@/lib/auth/return-path";
import { captureError } from "@/lib/observability/sentry";
import { syncBillingEmail } from "@/lib/stripe/customer-email";
import { createClient } from "@/lib/supabase/server";

import {
  cameFromCreate,
  drawsExisting,
  existingLanding,
} from "./existing-account";

// OAuth / email-link callback. Supabase redirects the browser here with a
// `code`; we exchange it for a session (the server client writes the auth cookies
// via setAll) and forward into the app.
//
// Host-aware: redirect back to the SAME host the user authenticated on (so an
// admin-subdomain login keeps its host-isolated session) and pick a default
// landing per host — the admin subdomain lands in the portal (/admin), everything
// else on /dashboard. A `next` still wins, but only one on that host's return
// allow-list (lib/auth/return-path.ts: the portal's pages on the admin host, the
// pages a gate or a guest's door sends back to elsewhere); anything else, however
// it is dressed, is the default, and never followed.
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

  // ★ NEVER AN OPEN REDIRECT: `next` is followed only when it is one of the
  // allow-listed pages for this host (no scheme, no `//`, no backslash, no
  // encoded escape, no query can pass it, and the admin host takes only the
  // portal's); a refused one is the host-aware default, and it is never carried
  // anywhere, so a hostile value reads exactly like none.
  //
  // The admin host's callback is always bare (its allow-list entry is exact), so
  // there the page rides the cookie the login form left, checked against the
  // portal's pages the same way and cleared whatever it held.
  const onAdminHost = isAdminHost(host);
  const kept = onAdminHost
    ? adminReturnFromCookies(request.headers.get("cookie"))
    : null;
  const next =
    signInReturn(url.searchParams.get(NEXT_PARAM), onAdminHost) ??
    signInReturn(kept, onAdminHost);
  const landing = signInLanding(next, onAdminHost);
  const go = (to: string, told?: { album: string; name: string }) => {
    const res = NextResponse.redirect(`${base}${to}`);
    if (kept !== null) {
      res.cookies.set(ADMIN_RETURN_COOKIE, "", {
        path: ADMIN_RETURN_COOKIE_PATH,
        maxAge: 0,
      });
    }
    // ★ THE NAME THE LINK ADOPTED, LEFT FOR THE ALBUM TO TELL (`adopt-door-name-told.ts`): a cookie bound to the album, spent
    // by the page's read, never a query (a name is a person's own).
    if (told) {
      res.cookies.set(TOLD_NAME_COOKIE, toldNameValue(told.album, told.name), {
        path: "/",
        maxAge: TOLD_NAME_MAX_AGE_S,
        sameSite: "lax",
        secure: url.protocol === "https:",
      });
    }
    return res;
  };

  // ★ AN ACCOUNT STILL BEING ERASED (lp/account-exit): GoTrue refuses a deleted account's tapped
  // link and its Google sign-in with `user_banned` until the nightly purge, and that is no failed
  // link or failed Google. `/login` says why and when (`account-deleting.ts`, which also says why
  // its words there are conditional: this query is one anyone can write).
  const deleting = withReturn(`/login?error=${ACCOUNT_DELETING}`, next);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // A guest's tapped link loses the name typed at the door (the in-page step
      // is gone), so the door carries it in the new account's metadata and it is
      // adopted here, before the album can ask for it again. Never throws. ★ AND
      // WHAT HER PHOTOGRAPHS CARRY NOW rides to the album, so it tells her as the
      // in-page confirm does (crumbs-88).
      if (landing.startsWith("/e/")) {
        const name = await adoptDoorName();
        return go(
          landing,
          name ? { album: landing.slice("/e/".length), name } : undefined,
        );
      }
      // ★ A LINK (OR GOOGLE) THAT SIGNS CREATE ACCOUNT INTO AN ADDRESS THAT ALREADY HAD ONE SAYS SO, as the code does (crumbs-88,
      // `existing=tell`): the Create door marked this address, the exchange has made the session, and the server's own test,
      // about the caller's own row only, decides; a yes lands the dashboard marked, which draws the one line. Only where
      // the landing IS the dashboard (a page a gate sent her back to has no such line), and never an answer before the
      // exchange (the address is proven by now: `existing-account.ts`).
      if (cameFromCreate(url.searchParams) && drawsExisting(landing)) {
        // A line that cannot be asked is not said: the sign-in the exchange just made never fails for it.
        const already = await checkExistingAccount().then(
          (answer) => answer.existing,
          (failure: unknown) => {
            captureError("account", failure, { step: "existing_account" });
            return false;
          },
        );
        if (already) return go(existingLanding());
      }
      return go(landing);
    }
    if (isUserBanned(error)) return go(deleting);
    // An exchange that fails on a present code is an aged-out or already-spent
    // link, which is the one thing a host can act on: send a new code. The page it
    // was going to rides along, so the new code still lands there.
    return go(withReturn("/login?error=expired_link", next));
  }

  if (isBannedRedirect(url.searchParams)) return go(deleting);

  // No code at all: either the provider refused (Supabase puts its own reason in
  // the query) or the link was truncated. Map what we were told, and fall back
  // to the expired link, which is what a link with no code nearly always is.
  const kind =
    doorFailureKind(url.searchParams.get("error_code")) ??
    doorFailureKind(url.searchParams.get("error")) ??
    "expired_link";
  return go(withReturn(`/login?error=${kind}`, next));
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
