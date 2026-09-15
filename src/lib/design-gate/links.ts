/**
 * The /design link helper, split out of server.ts (which is `server-only`) so the
 * CLIENT chrome (the lab shell's sidebar and links) can build keyed links too. Pure +
 * isomorphic; server.ts re-exports it, so server pages keep a single import.
 */

/**
 * Append the preview key to an internal /design link (no-op in open dev mode).
 * Fragment-aware (the Library x Lab round, 2026-09-15): a lab link often carries
 * an anchor (`/design/lab/palette#palette-ramp`), and the query must sit before
 * the hash or the key lands inside the fragment and the gate 404s.
 */
export function withDesignKey(href: string, key: string | null): string {
  if (!key) return href;
  const hashAt = href.indexOf("#");
  const path = hashAt === -1 ? href : href.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  return `${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(key)}${hash}`;
}
