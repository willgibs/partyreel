import "server-only";

import { headers } from "next/headers";

import { env } from "@/lib/env";

/**
 * Resolves the canonical site origin for building absolute URLs server-side
 * (QR join links, share-album links). Prefers the explicit NEXT_PUBLIC_SITE_URL
 * so QR codes encode a stable, environment-correct host; falls back to the
 * request's forwarded host when it isn't set (local dev without the var).
 *
 * WHY this can't reuse the client login-form fallback: that uses
 * window.location.origin, which doesn't exist on the server — here we read the
 * proxied request headers instead. Next 16: headers() is async.
 */
export async function getSiteUrl(): Promise<string> {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
