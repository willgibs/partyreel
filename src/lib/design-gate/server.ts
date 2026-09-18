import "server-only";

import { notFound } from "next/navigation";

import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { serverEnv } from "@/lib/env";

// withDesignKey lives in the client-safe links.ts (this file is server-only);
// re-exported here so server pages keep a single import from this module.
export { withDesignKey } from "./links";

/**
 * The /design playground gate (V1 identity exploration, program Phase 1).
 *
 * Lives in src/lib, not in the lab, because production depends on it: the marketing motion
 * tuner's probe route (/api/design-gate) mirrors this check, and every lab page imports it.
 * The lab is a workshop that shrinks and grows; the gate must never move with it (the library
 * round, 2026-09-02).
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
  if (!designGateOpen(key)) notFound();
  return key ?? null;
}

/**
 * THE ONE GATE PREDICATE (the Library x Lab round, 2026-09-15): local dev is
 * always open; production opens only to a key that timing-safe-matches
 * DESIGN_PREVIEW_KEY. The proxy (src/proxy.ts) runs it on every /design
 * request BEFORE any layout renders, because the shell layout builds the nav
 * (component names, board titles, proposals, tracks) and a layout cannot see
 * searchParams: without the proxy check a keyless request still streamed the
 * layout's props in the flight payload under a 200 while the page's
 * notFound() drew the 404 (measured on the launch-prep alias at 2644310d).
 * The pages keep calling requireDesignKey as the second line.
 */
export function designGateOpen(key: string | null | undefined): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const secret = serverEnv.DESIGN_PREVIEW_KEY;
  return Boolean(secret && key && constantTimeEquals(key, secret));
}

/**
 * The NON-throwing sibling of requireDesignKey, for REAL pages that must keep
 * working for everyone but want to conditionally mount a dev-only affordance
 * (the motion tuner, S4·0) when a designer arrives with `?key=`. Returns a
 * boolean instead of 404ing: opt-in everywhere (no `?key=` -> closed), dev
 * accepts any key, prod requires the timing-safe match. A missing/wrong key just
 * renders the page normally (the gate is closed), never a 404 — so it is SAFE to
 * call on the host event page, where requireDesignKey's notFound() would wrongly
 * nuke the host's own page on a bad key.
 */
export async function isDesignGateOpen(
  searchParams: Promise<Record<string, string | string[] | undefined>>,
): Promise<boolean> {
  const params = await searchParams;
  const key = typeof params.key === "string" ? params.key : undefined;
  if (!key) return false;
  return designGateOpen(key);
}
