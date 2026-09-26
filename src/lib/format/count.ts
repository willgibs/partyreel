/**
 * ONE COUNT FORMAT, EVERYWHERE A PERSON READS A NUMBER (the 1,000-row round's
 * follow-on, 2026-09-24: the admin review found real counts — 1249, 1145,
 * 1209 — printed raw where the metrics page already grouped them).
 *
 * A bare `n.toLocaleString()` (no locale argument) renders in the SERVER's
 * locale during SSR and the BROWSER's on hydration: a mismatch for any
 * visitor whose browser locale is not the server's, and a silent drift for
 * anyone else. `en-US` is fixed here, explicitly, once, so every count in the
 * product groups the same way regardless of who is reading it or where it
 * rendered. Isomorphic (no `server-only`): several callers are "use client"
 * components that render this on first paint (support/applicants inboxes,
 * the bulk bar), so the same module has to work on both sides.
 */

const GROUPED = new Intl.NumberFormat("en-US");
const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact" });

/** "1249" -> "1,249". The one way a count is printed. */
export function formatCount(n: number): string {
  return GROUPED.format(n);
}

/**
 * "1 photo or video" | "42 photos & videos" — the one way an album's count of EITHER type is said
 * (the guest album's header, its locked tease, the CTA and the email door: build 9 and 10's
 * red-teams both caught "1 photo & videos", the ampersand form pinned at every count). Never "1
 * photo", which lies when the one item is a video. Worded like the dashboard's own two-type count
 * (`claims-card.tsx`'s `confirmDeleteTitle`), but with the guest surface's "&" rather than the
 * dashboard's "and", since the guest header already reads "N photos & videos from M guests".
 */
export function formatMediaCount(n: number): string {
  return n === 1 ? "1 photo or video" : `${formatCount(n)} photos & videos`;
}

/** "1247" -> "+1,247", "-3" -> "-3", "0" -> "0". A delta against a prior period. */
export function formatSignedCount(n: number): string {
  if (n === 0) return "0";
  const sign = n > 0 ? "+" : "-";
  return `${sign}${GROUPED.format(Math.abs(n))}`;
}

/**
 * A chart tick that fits at any magnitude: "1400" -> "1.4K", "12000" -> "12K",
 * "1200000" -> "1.2M"; a number under 1,000 is unchanged. `Intl`'s own compact
 * notation already rounds to at most one decimal digit, which is what keeps
 * the label short enough for a fixed-width axis.
 */
export function formatCompactNumber(n: number): string {
  return COMPACT.format(n);
}

/**
 * A YAxis pixel width that fits the widest compact label `values` can draw,
 * never narrower than the chart's original fixed 28px (so a single-digit
 * axis does not shrink). ~8px per character at the chart's 11px tick font,
 * plus a small margin — generous rather than exact, since Recharts measures
 * nothing and a clipped tick is the bug this exists to prevent.
 */
export function compactAxisWidth(values: readonly number[]): number {
  const widest = values.reduce(
    (max, v) => Math.max(max, formatCompactNumber(v).length),
    1,
  );
  return Math.max(28, widest * 8 + 10);
}
