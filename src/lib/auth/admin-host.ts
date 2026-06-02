/**
 * Pure host helpers for the admin/operations portal. Shared by the proxy
 * (src/proxy.ts), the admin auth seam (admin-context.ts), and the login form, so
 * the "which host is the portal" rule lives in exactly one place. No `server-only`
 * here on purpose — the proxy and a client component both import `isAdminHost`.
 */
import { env } from "@/lib/env";

/** The portal host (e.g. "admin.partyreel.com"), or null when unset (local dev). */
export const ADMIN_HOST = env.NEXT_PUBLIC_ADMIN_HOST ?? null;

/**
 * True when a request's `Host` header matches the configured admin subdomain.
 * The port is stripped so `admin.localhost:3000`-style hosts still match. When
 * ADMIN_HOST is unset (dev) this is always false, so the proxy adds no host
 * behavior and the portal is reachable directly at `/admin`.
 */
export function isAdminHost(host: string | null | undefined): boolean {
  if (!ADMIN_HOST || !host) return false;
  return host.split(":")[0].toLowerCase() === ADMIN_HOST.toLowerCase();
}

/**
 * Where a freshly signed-in user should land, host-aware: the admin subdomain → the
 * portal, everywhere else → the host dashboard. Mirrors the `/auth/callback` route's
 * fallback (which additionally honors a same-origin `?next=`). Used by the in-page OTP
 * verify on `/login` (which navigates client-side, bypassing the callback route).
 */
export function loginTarget(host: string | null | undefined): string {
  return isAdminHost(host) ? "/admin" : "/dashboard";
}
