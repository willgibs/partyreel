/**
 * The /design link helper, split out of server.ts (which is `server-only`) so the
 * CLIENT sidebar (the lab's lab-nav.tsx) can build keyed links too. Pure + isomorphic;
 * server.ts re-exports it, so server pages keep a single import.
 */

/** Append the preview key to an internal /design link (no-op in open dev mode). */
export function withDesignKey(href: string, key: string | null): string {
  if (!key) return href;
  return `${href}${href.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}`;
}
