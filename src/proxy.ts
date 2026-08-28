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
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
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
