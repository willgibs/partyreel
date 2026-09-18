/**
 * Next 16 renamed Middleware → Proxy. This file MUST be named `proxy.ts` and
 * export a function named `proxy` (the old `middleware` name no longer runs).
 * It runs on the Node.js runtime by default — do NOT add a `runtime` config;
 * Next 16 doesn't allow setting it here.
 *
 * Two gates and a session refresh, in that order: which SURFACE this deployment
 * serves (the admin split), the design lab's key, then the Supabase session
 * cookie on every matched request.
 *
 * It is NOT an auth gate: route protection lives in the (app) layout via
 * getUser(), and each Server Function must re-verify authz itself. Treating the
 * proxy as the security boundary is a known footgun — don't. The surface rule
 * below is a REACHABILITY rule (which paths this deployment answers at all),
 * not an authorization one; `requireAdmin()` still gates every admin request.
 */
import { type NextRequest, NextResponse } from "next/server";

import { isAdminHost } from "@/lib/auth/admin-host";
import { designGateOpen } from "@/lib/design-gate/server";
import { updateSession } from "@/lib/supabase/middleware";
import { decideBySurface, SURFACE_404_PATH, surface } from "@/lib/surface";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const currentSurface = surface();

  // THE SURFACE RULE, first, because a refused path must not reach any other
  // rule (the admin split, 2026-09-18). One repo, two Vercel projects:
  //   • NEXT_PUBLIC_SURFACE=admin (partyreel-admin, admin.partyreel.com) serves
  //     ONLY /admin, /login, /auth, the cron route and the design-gate probe.
  //     An allow-list, so the marketing site, the host app, the guest links and
  //     the lab do not exist on the admin host at all.
  //   • NEXT_PUBLIC_SURFACE=app (partyreel, the apex) 404s /admin whatever the
  //     Host header says; the host guard inside requireAdmin() stays as the
  //     second line, not the only one.
  //   • unset (local dev, and every deployment until the cutover) serves both,
  //     byte for byte as before, which is also how the split rolls back.
  // The allow-list itself lives in src/lib/surface so the cron route and the
  // admin gate decide from the same source. A refused request is REWRITTEN to a
  // path no route serves, rendering the root not-found under a real 404: the
  // same answer a mistyped URL gets, so the admin host never reveals which of
  // its 404s is hiding a route (the lab's keyless 404 uses this same shape).
  if (decideBySurface(pathname, currentSurface) === "not-found") {
    const url = request.nextUrl.clone();
    url.pathname = SURFACE_404_PATH;
    url.search = "";
    return NextResponse.rewrite(url, { status: 404 });
  }

  // The design lab's gate, run before any lab layout renders (the Library x
  // Lab round, 2026-09-15). The lab's shell layout builds its nav server-side
  // and a layout cannot read searchParams, so the page-level notFound() came
  // too late: a keyless production request still streamed the layout's props
  // under a 200. A refused request is rewritten to a path no route serves,
  // which renders the root not-found with a real 404, the same page a missing
  // URL gets; the pages still call requireDesignKey as the second line. Not
  // the security boundary for anything else (see the header). APP SURFACE only:
  // on the admin surface /design never reaches here (the rule above 404s it).
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
  // Send the bare root to the portal. The portal's canonical path stays /admin
  // on EVERY host (dev included) — the admin layout host-guards + auth-gates it,
  // and the apex 404s /admin — so this is just a convenience redirect, NOT the
  // security boundary. Everything else (including /login + /auth/callback on the
  // subdomain) gets the usual session refresh.
  //
  // Per surface: the ADMIN deployment serves nothing else at `/`, so it
  // redirects unconditionally (its Host is the admin host by construction, and
  // a preview alias whose host is not yet in NEXT_PUBLIC_ADMIN_HOST would
  // otherwise dead-end on a root it does not serve). With the flag UNSET the
  // old Host check decides, unchanged. On the APP surface it never fires:
  // /admin is a 404 there, so redirecting into it would be worse than serving
  // the marketing home on a host the app no longer owns.
  if (
    pathname === "/" &&
    (currentSurface === "admin" ||
      (currentSurface === undefined &&
        isAdminHost(request.headers.get("host"))))
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
  //
  // The surface rule rides this same matcher, so what is skipped here is served
  // on BOTH surfaces: Next's build output, the Vercel beacons and static
  // images. Deliberate, because the portal's own JS, CSS and icons come out of
  // /_next and none of those paths names a route.
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
