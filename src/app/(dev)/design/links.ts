/**
 * The /design link helper, split out of gate.ts (which is `server-only`) so the
 * CLIENT sidebar (lab-nav.tsx) can build keyed links too. Pure + isomorphic;
 * gate.ts re-exports it, so server pages keep importing from "./gate" unchanged.
 */

/** Append the preview key to an internal /design link (no-op in open dev mode). */
export function withDesignKey(href: string, key: string | null): string {
  if (!key) return href;
  return `${href}${href.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
}
