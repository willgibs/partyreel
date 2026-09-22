/**
 * WHICH SURFACE THIS DEPLOYMENT SERVES: the one home for the admin split (2026-09-18).
 *
 * One repository, one tree, TWO Vercel projects building the same code:
 *   • `partyreel`       with NEXT_PUBLIC_SURFACE=app: the marketing site, the host app, the guest
 *     links and the lab. `/admin` is a 404 here whatever the Host header says.
 *   • `partyreel-admin` with NEXT_PUBLIC_SURFACE=admin: `admin.partyreel.com` and nothing else,
 *     which is the portal, its sign-in and MFA, and the two routes named below.
 *   • unset: both surfaces, exactly as before the split (local dev, and any deployment whose
 *     project has not been given the var). Unsetting it is also how the split rolls back.
 *
 * WHY a module rather than three `env.NEXT_PUBLIC_SURFACE ===` reads: the proxy (the outer 404),
 * the admin gate (the belt and braces inside `requireAdmin`) and the purge cron (which must run
 * once, not once per project) have to agree by construction. They agree because they all decide
 * here, and this file is pure, so the whole rule set is unit-testable with no request in hand.
 *
 * Will's reason for the split, verbatim (2026-09-18): each surface
 * "exist[s] elegantly serving its own purpose, with far fewer security risks than having
 * everything tied together". The smaller the admin deployment's served path set, the less of the
 * platform an attacker who reaches that host can even address. So the admin surface is an
 * ALLOW-LIST (an unknown path is a 404) while the app surface only subtracts `/admin`.
 *
 * Nothing here imports `next/server` or `server-only`: the proxy, a Server Component and a route
 * handler all read it.
 */
import { env } from "@/lib/env";

export type Surface = "app" | "admin";

/**
 * The path the proxy REWRITES a refused request to. No route serves it, so Next renders the root
 * `not-found` under a real 404: the same page and the same status a mistyped URL gets, which is
 * the point, because the admin host must not be able to tell you which of its 404s hide a real
 * route. (The same shape as the lab's keyless 404, which rewrites to `/design-gate/closed`.)
 */
export const SURFACE_404_PATH = "/surface/not-served";

/**
 * What the ADMIN surface serves, by path PREFIX (segment-aware, so `/admin` covers `/admin/jobs`
 * and never `/administrators`). Everything absent from this list, and from EXACT_ADMIN_PATHS
 * below, is a 404 on the admin deployment.
 */
const ADMIN_SURFACE_PREFIXES = [
  // The portal itself. Its Server Actions POST to these same paths, so the segment covers them.
  "/admin",
  // `requireAdmin()` redirects an anonymous admin to `/login?next=/admin`; the sign-in form and
  // the in-page OTP verify are Server Actions on this path.
  "/login",
  // `/auth/callback`: the OAuth and email-link code exchange that writes the admin's host-isolated
  // session cookie. On this host `callbackUrl()` uses window.location.origin, never the apex.
  "/auth",
  // vercel.json is ONE file in ONE repo, so BOTH projects register its cron. The route has to be
  // reachable here to ANSWER (and no-op): a 404 would show up in the admin project's cron log as
  // a daily failure, which is a lie about a job that is deliberately not this surface's.
  "/api/cron",
  // The key-gated design-gate probe. `src/app/admin/layout.tsx` mounts `AppDesignIsland`, which
  // asks this route whether a visitor's `?key=` is valid before mounting the tuner, and that is
  // how a design sitting walks the REAL portal with candidate tokens. Keyless requests 404 inside
  // the route itself and it reads no data. 404ing it here would silently kill an affordance the
  // portal's own layout mounts.
  "/api/design-gate",
];

/**
 * Exact paths the admin surface serves.
 * • `/` because the proxy redirects it to `/admin`; served so that redirect can happen.
 * • `/robots.txt` because the shared `robots.ts` DISALLOWs `/admin`, `/login`, `/auth` and
 *   `/api/`, which on this host is every path there is. A 404 here would mean "crawl freely" by
 *   default, so serving the shared file is strictly the safer answer.
 */
const EXACT_ADMIN_PATHS = ["/", "/robots.txt"];

/** The portal's own segment, subtracted from the APP surface whatever the Host header says. */
const ADMIN_PORTAL_PREFIX = "/admin";

/** Segment-aware prefix match: `/admin` covers `/admin` and `/admin/x`, never `/administrators`. */
function underPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** True for the operations portal's own paths (the segment, not the substring). */
export function isAdminPortalPath(pathname: string): boolean {
  return underPrefix(pathname, ADMIN_PORTAL_PREFIX);
}

/** True for every path the admin deployment is allowed to serve. */
export function isAdminSurfacePath(pathname: string): boolean {
  return (
    EXACT_ADMIN_PATHS.includes(pathname) ||
    ADMIN_SURFACE_PREFIXES.some((prefix) => underPrefix(pathname, prefix))
  );
}

/** The surface this build serves, or undefined when it serves both (local dev, pre-cutover). */
export function surface(): Surface | undefined {
  return env.NEXT_PUBLIC_SURFACE;
}

/**
 * Does this build serve the admin portal? True on the admin surface AND when the flag is unset
 * (both surfaces, as today). The `s` parameter exists so a test can ask about a surface it is not
 * running on; callers omit it and get this build's.
 */
export function servesAdmin(s: Surface | undefined = surface()): boolean {
  return s !== "app";
}

/** Does this build serve the app (marketing, host, guest, lab)? Unset serves it too. */
export function servesApp(s: Surface | undefined = surface()): boolean {
  return s !== "admin";
}

export type SurfaceDecision = "serve" | "not-found";

/**
 * THE PROXY'S RULE, as a pure function (src/proxy.ts applies it before anything else).
 *
 * • admin surface: an ALLOW-LIST, so anything outside `isAdminSurfacePath` is a real 404 and the
 *   marketing site, the host app, the guest links, the lab and every other API route simply do not
 *   exist on `admin.partyreel.com`.
 * • app surface: one SUBTRACTION, so `/admin` is a 404 regardless of Host. The host guard inside
 *   `requireAdmin()` stays as belt and braces; this is the outer line.
 * • unset: everything is served, byte for byte the behaviour before the split. Rolling the split
 *   back is exactly "unset the var", which is why nothing here is a one-way door.
 */
export function decideBySurface(
  pathname: string,
  s: Surface | undefined = surface(),
): SurfaceDecision {
  if (s === "admin")
    return isAdminSurfacePath(pathname) ? "serve" : "not-found";
  if (s === "app") return isAdminPortalPath(pathname) ? "not-found" : "serve";
  return "serve";
}
