/**
 * Next 16 renamed Middleware → Proxy. This file MUST be named `proxy.ts` and
 * export a function named `proxy` (the old `middleware` name no longer runs).
 * It runs on the Node.js runtime by default — do NOT add a `runtime` config;
 * Next 16 doesn't allow setting it here.
 *
 * Two gates and a session refresh, in that order: which SURFACE this deployment
 * serves (the admin split), the design lab's key, then the Supabase session
 * cookie, with the request's path handed to the layouts' sign-in gates on the
 * way. It runs only where one of those matters (the matcher at the foot says
 * where, and why everything else is left to the CDN or refreshes its own
 * session).
 *
 * It is NOT an auth gate: route protection lives in the (app) layout via
 * getUser(), and each Server Function must re-verify authz itself. Treating the
 * proxy as the security boundary is a known footgun — don't. The surface rule
 * below is a REACHABILITY rule (which paths this deployment answers at all),
 * not an authorization one; `requireAdmin()` still gates every admin request.
 */
import { type NextRequest, NextResponse } from "next/server";

import { isAdminHost } from "@/lib/auth/admin-host";
import { REQUEST_PATH_HEADER, RETURN_PATH_MAX } from "@/lib/auth/return-path";
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
  // THE PATH, FOR THE GATES (crumbs-11). A layout cannot read its own URL, and
  // the (app) and (print) gates send a signed-out visitor to /login carrying the
  // page they asked for (lib/auth/login-redirect.ts). Written on every request
  // the matcher takes, and it takes every page whose gate reads it, so a
  // client's own copy never survives to a gate; left off for a path longer than
  // any page that may be returned to rather than copying a long URL into a
  // header. The gate re-checks it against the allow-list: a reachability hint
  // for one redirect, never an authorization.
  if (pathname.length <= RETURN_PATH_MAX) {
    request.headers.set(REQUEST_PATH_HEADER, pathname);
  } else {
    request.headers.delete(REQUEST_PATH_HEADER);
  }
  // ★ A PAGE GOES ON WITH NO STATUS OF THE PROXY'S (gone-link-soft). On
  // Vercel a request sent on with one (`NextResponse.next({ status: 404 })`)
  // is answered with the platform's own /404, the root's page from its cache,
  // and the page never renders: a stale guest link showed the site's generic
  // 404 in place of its own screen (build 30's red-team; `next start` honours
  // the status on the page's render, which is how it passed locally). A link
  // that names nothing is the page's to draw, at 200 and noindex
  // (marketing-content.md, "The 404 pages"). The two rewrites above keep their
  // 404: the page they render is the root's, the same page Vercel serves.
  return updateSession(request);
}

/**
 * WHERE THE PROXY RUNS: ONLY WHERE A SESSION MATTERS (compute-levers, the compute model's lever 1). On Vercel the
 * proxy is an invocation of its own, run BEFORE the CDN on every request its matcher takes, so a matcher of
 * everything made it half of every call count (`pnpm compute:model`): each album poll, presign, prefetch, crawler hit
 * and `/manifest.webmanifest` paid a run that refreshed a session nothing was rendering.
 *
 * 1. THE PAGES THAT RENDER A SESSION, on every host, their RSC requests and prefetches included, because a refresh
 *    must happen BEFORE such a render: a Server Component cannot write a cookie (`lib/supabase/server.ts` swallows
 *    the write), so a token refreshed inside a render is spent and lost, and the next request presents the spent
 *    refresh token. Segment-aware (`/e` is never `/events`):
 *    - `/dashboard`, `/account`, `/me`, `/welcome`: the (app), (as-guest) and (print) gates, which read the path
 *      written above (`x-pr-path`, overwritten here so a client's own copy never reaches them);
 *    - `/login`, `/auth`: sign-in, which sends a signed-in visitor on, and the callback;
 *    - `/e`, `/u`, `/report`: the guest's link, the profile and the report page, which read the viewer's account;
 *    - `/admin`: the portal, and the app surface's 404 of it;
 *    - `/design`: the lab's key gate, before any lab layout renders (`x-design-key`, written only here).
 *    ★ A session page's PREFETCH keeps its run (`/login`'s, from the marketing bar, is one): it renders the page's
 *    layout, whose `getUser()` would otherwise refresh inside a render. Prefetches of every other page leave with it.
 * 2. THE ADMIN HOST, EVERY PATH: the admin deployment is an allow-list (`src/lib/surface`), so a path left to the CDN
 *    there would be a marketing page or an API route answering on the portal's host. A matcher can only be literals
 *    read at build, so it cannot see NEXT_PUBLIC_SURFACE; the host is the one fact it can read about which deployment
 *    is answering. So the pattern names the admin project's hosts: any `admin.<domain>` (admin.partyreel.com,
 *    admin.localhost) and the partyreel-admin project's own vercel.app hosts (its alias, its deployments). ★ An admin
 *    domain outside it would serve the app's static pages and API routes unrefused (`proxy.test.ts` holds every
 *    host the repo names, both ways).
 *
 * EVERYTHING ELSE RUNS NO PROXY: the marketing site and the metadata routes (prerendered, the CDN's), the API routes
 * (each one that reads a session asks `getUser()` through `lib/supabase/server.ts`, whose cookie writes land on a
 * route handler's response, so an expired token is refreshed there), and Server Functions posted to those pages (the
 * same writes land on an action's response). What the first matcher always skipped (Next's build output, the Vercel
 * beacons, static images) stays skipped on BOTH surfaces: the portal's own JS, CSS and icons come out of /_next.
 *
 * ★ LITERALS ONLY. Next reads this object statically at build, and one value it cannot read (a variable, an import, a
 * spread) drops the WHOLE config, so the proxy silently runs on everything again; `proxy.test.ts` reads it the
 * build's way and holds the two readings equal.
 */
export const config = {
  matcher: [
    "/(dashboard|account|me|welcome|login|auth|e|u|report|admin|design)/:path*",
    {
      source:
        "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      has: [
        {
          type: "host",
          value:
            "(?:admin\\..+|partyreel-admin(?:-[a-z0-9-]+)?\\.vercel\\.app)",
        },
      ],
    },
  ],
};
