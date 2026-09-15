/**
 * Next 16 renamed Middleware → Proxy. This file MUST be named `proxy.ts` and
 * export a function named `proxy` (the old `middleware` name no longer runs).
 * It runs on the Node.js runtime by default — do NOT add a `runtime` config;
 * Next 16 doesn't allow setting it here.
 *
 * All it does is refresh the Supabase session cookie on every matched request.
 * It is NOT an auth gate: route protection lives in the (app) layout via
 * getUser(), and each Server Function must re-verify authz itself. Treating the
 * proxy as the security boundary is a known footgun — don't.
 */
import { type NextRequest, NextResponse } from "next/server";

import { isAdminHost } from "@/lib/auth/admin-host";
import { designGateOpen } from "@/lib/design-gate/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // The design lab's gate, run before any lab layout renders (the Library x
  // Lab round, 2026-09-15). The lab's shell layout builds its nav server-side
  // and a layout cannot read searchParams, so the page-level notFound() came
  // too late: a keyless production request still streamed the layout's props
  // under a 200. A refused request is rewritten to a path no route serves,
  // which renders the root not-found with a real 404, the same page a missing
  // URL gets; the pages still call requireDesignKey as the second line. Not
  // the security boundary for anything else (see the header).
  const { pathname } = request.nextUrl;
  if (pathname === "/design" || pathname.startsWith("/design/")) {
    const key = request.nextUrl.searchParams.get("key");
    if (!designGateOpen(key)) {
      const url = request.nextUrl.clone();
      url.pathname = "/design-gate/closed";
      url.search = "";
      return NextResponse.rewrite(url, { status: 404 });
    }
    // The shell layout keys every link with it (a layout cannot read
    // searchParams; the request header is how the key reaches it).
    request.headers.set("x-design-key", key ?? "");
  }
  // On the admin subdomain, send the bare root to the portal. The portal's
  // canonical path stays /admin on EVERY host (dev included) — the admin layout
  // host-guards + auth-gates it, and the apex 404s /admin — so this is just a
  // convenience redirect, NOT the security boundary. Everything else (including
  // /login + /auth/callback on the subdomain) gets the usual session refresh.
  if (
    request.nextUrl.pathname === "/" &&
    isAdminHost(request.headers.get("host"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  // Match everything except Next internals, Vercel platform paths (the
  // /_vercel/insights + /_vercel/speed-insights analytics beacons need no
  // session, and each hit here costs a Supabase getUser round-trip), and static
  // image assets, so the auth cookie stays fresh app-wide. The matcher only
  // skips work that never needs a session; route-level protection is enforced
  // in the (app) layout.
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
