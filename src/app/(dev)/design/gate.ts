import "server-only";

import { notFound } from "next/navigation";

import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { serverEnv } from "@/lib/env";

// withDesignKey lives in the client-safe links.ts (this file is server-only);
// re-exported here so server pages keep their single "./gate" import.
export { withDesignKey } from "./links";

/**
 * The /design playground gate (V1 identity exploration, program Phase 1).
 *
 * Pass conditions: local dev is always open; production requires `?key=` to
 * timing-safe-match DESIGN_PREVIEW_KEY. Everything else (no key, wrong key, or
 * the env var unset) is an indistinguishable 404 so the playground does not
 * exist for the public. Returns the key so pages can propagate it through
 * internal links (the wrong-key case never returns).
 */
export async function requireDesignKey(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<string | null> {
  const params = await searchParams;
  const key = typeof params.key === "string" ? params.key : undefined;

  if (process.env.NODE_ENV === "development") return key ?? null;

  const secret = serverEnv.DESIGN_PREVIEW_KEY;
  if (!secret || !key || !constantTimeEquals(key, secret)) notFound();
  return key;
}
