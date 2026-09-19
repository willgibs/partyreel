"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

/**
 * THE RETURNING HOST (`returning=dashboard`, Will 2026-09-19): the bar stops
 * offering a door to someone who is already inside. Today a host who lands on
 * any marketing page meets "Log in" and "Start free" and has to take a hop
 * through /login to reach their own events.
 *
 * ★ A HINT, NEVER AUTHORIZATION, and the distinction is the whole design.
 * Nothing here decides what anyone may see. `/dashboard` lives under the (app)
 * layout, whose `getUser()` gate re-validates the JWT with the Auth server on
 * every request and redirects an anonymous visitor to /login; RLS is the real
 * boundary under that. The worst a wrong guess here can do is cost one
 * redirect: a stale `true` sends a signed-out visitor to /login (which is
 * where "Log in" pointed anyway), and a stale `false` shows the pair to a host
 * whose "Start free" also goes to /login, which already forwards a signed-in
 * host into the app. Both failures land on the same page. That is why a cookie
 * SNIFF is an honest signal here and would be indefensible anywhere else.
 *
 * ★ WHY A CLIENT ISLAND AND NOT A SERVER READ. About fifty marketing routes
 * are statically prerendered. One `getUser()` anywhere in this chrome would
 * make every one of them dynamic, cost an Auth round-trip per page view for a
 * visitor who is usually a stranger, and buy nothing the island does not.
 *
 * ★ WHY `useSyncExternalStore` AND NOT AN EFFECT. The server snapshot is
 * `false`, so the prerendered HTML and the first client render agree on the
 * signed-out pair and there is no hydration mismatch; the client snapshot is
 * read during the hydration pass, so a host sees "Dashboard" in the first
 * painted frame rather than a flash of the wrong pair a frame later. An effect
 * would paint twice. Nothing is animated for the same reason: there is no
 * transition to smooth, only a render that was already correct.
 *
 * ★ WHY A COOKIE READ AND NOT A PRESENCE COOKIE SET IN THE PROXY. Checked on
 * the shipped local session: `@supabase/ssr`'s `DEFAULT_COOKIE_OPTIONS` set
 * `httpOnly: false`, and `createBrowserClient` uses `document.cookie` AS its
 * session storage, so the auth cookies are JS-readable BY CONSTRUCTION. If
 * they were not, every client component holding a Supabase session would be
 * broken. So the prefix is already there to read and `updateSession` needs no
 * second cookie carrying the same bit.
 */

/**
 * `sb-<project-ref>-auth-token`, optionally chunked (`.0`, `.1`) when the
 * session outgrows one cookie. Matched by SHAPE rather than derived from
 * NEXT_PUBLIC_SUPABASE_URL: the hint should survive a project ref changing or
 * @supabase/ssr renaming its chunk suffix, and a loose match costs nothing
 * given what a wrong answer does (see above). The name must END at the token,
 * so the PKCE `-auth-token-code-verifier` cookie a SIGNED-OUT visitor carries
 * mid-OAuth can never read as a session. A non-empty value is required, so a
 * cleared cookie is a signed-out one.
 */
const AUTH_COOKIE = /(?:^|;\s*)sb-[\w-]+-auth-token(?:\.\d+)?=[^;\s]/;

function readSession(): boolean {
  try {
    return AUTH_COOKIE.test(document.cookie);
  } catch {
    // A cookie-blocked or partitioned context. Signed out is the safe answer:
    // the pair is what a stranger should see.
    return false;
  }
}

/** Cookies have no change event. These two are the moments a marketing page
 *  can be looking at a session that changed since it was rendered: coming back
 *  from the back-forward cache, and returning to a tab where the host signed
 *  out in another one. Neither polls. */
function subscribeSession(onStoreChange: () => void) {
  window.addEventListener("pageshow", onStoreChange);
  document.addEventListener("visibilitychange", onStoreChange);
  return () => {
    window.removeEventListener("pageshow", onStoreChange);
    document.removeEventListener("visibilitychange", onStoreChange);
  };
}

/** Does a host look like they are already signed in? A HINT (see the file
 *  header): never gate anything on this, on the client or anywhere else. */
export function useSignedInHint(): boolean {
  return useSyncExternalStore(subscribeSession, readSession, () => false);
}

/**
 * The header's right cluster. Signed out it is the ghost/solid pair the bar
 * has always carried; signed in it is ONE primary button in the CTA's place,
 * which is the shape Will picked. Not two (a returning host has no use for
 * "Log in" and none at all for "Start free"), and not an avatar: that is the
 * app's own header, and it needs a profile read on a page a stranger usually
 * sees.
 */
export function HeaderActions() {
  const signedIn = useSignedInHint();
  if (signedIn) {
    return (
      <Button asChild size="sm">
        <Link
          href="/dashboard"
          {...trackAttrs("cta_click", {
            cta: "dashboard",
            location: "header",
          })}
        >
          Dashboard
        </Link>
      </Button>
    );
  }
  return (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
      >
        <Link
          href="/login"
          {...trackAttrs("cta_click", { cta: "log-in", location: "header" })}
        >
          Log in
        </Link>
      </Button>
      <Button asChild size="sm">
        <Link
          href={MARKETING_CTA.href}
          {...trackAttrs("cta_click", {
            cta: "start-free",
            location: "header",
          })}
        >
          {MARKETING_CTA.label}
        </Link>
      </Button>
    </>
  );
}
