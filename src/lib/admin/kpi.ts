import type { UploadCounts } from "@/lib/db/queries/metrics";

/**
 * THE FOUR FIGURES THE PORTAL OPENS ON (`home=kpi`, Will 2026-09-20: "the
 * numbers first, the queue beneath").
 *
 * Pure, so the arithmetic is testable without a database: the database counts,
 * this phrases. A FORTNIGHT is the window because the home's sparkline draws
 * fourteen days, and a figure whose delta covers a different span from the line
 * under it is a figure nobody can read.
 *
 * ★ THE COUNTS ARRIVE COUNTED (the 1,000-row round, 2026-09-23). This used to
 * walk every profile row and count them here, from a read PostgREST cut at
 * 1,000 rows, so every figure stopped growing at the 1,001st account.
 * `admin_metrics_snapshot()` counts them in SQL now, the operator left out
 * (the operator is not a customer, so the portal's own account never shows up
 * as growth), and `getPlatformDbMetrics` hands the fortnight's figures here.
 *
 * ★ THREE OF THE FOUR DELTAS ARE REAL AND THE FOURTH SAYS SO. Accounts, active
 * hosts and uploads all have a timestamp per row, so "this fortnight against
 * the one before" is arithmetic. Paid subscribers do not: the Stripe webhook is
 * the sole writer of `tier` (billing-caps.md) and it writes no history, so the
 * database cannot say how many people were paying a fortnight ago. Inventing a
 * plausible arrow there would be the same failure as a fabricated zero on a
 * dead-letter card, so that figure carries a share of the base instead and the
 * ROADMAP carries the line that would make a real delta possible.
 */

export const FORTNIGHT_DAYS = 14;

/**
 * The accounts behind the home's figures, counted over two fortnights. `last_active_at` is one
 * timestamp, so "active in the fortnight before" can only mean "last seen in it": somebody who came
 * back yesterday counts in this fortnight and not in that one, which is the honest reading of a
 * column that keeps no history.
 */
export type FortnightAccounts = {
  /** Every account but the operator's. */
  total: number;
  /** Created in the last fortnight. */
  newAccounts: number;
  /** Created in the fortnight before it. */
  newAccountsBefore: number;
  /** Last seen in the last fortnight. */
  active: number;
  /** Last seen in the fortnight before it. */
  activeBefore: number;
  /** With a live Stripe subscription. */
  paid: number;
};

export type AdminKpi = {
  id: "accounts" | "active" | "uploads" | "paid";
  label: string;
  value: number;
  /**
   * The change against the fortnight before, as a count of things. Null where
   * the database holds no history to compare against.
   */
  delta: number | null;
  /** The one line under the figure, saying what the delta counts. */
  sub: string;
};

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function buildAdminKpis(
  accounts: FortnightAccounts,
  uploads: UploadCounts,
): AdminKpi[] {
  const paidShare =
    accounts.total === 0 ? 0 : Math.round((accounts.paid / accounts.total) * 100);

  return [
    {
      id: "accounts",
      label: "Accounts",
      value: accounts.total,
      delta: accounts.newAccounts - accounts.newAccountsBefore,
      // "new" is its own plural: "2 new this fortnight", never "2 news".
      sub: `${plural(accounts.newAccounts, "new", "new")} this fortnight`,
    },
    {
      id: "active",
      label: "Active hosts",
      value: accounts.active,
      delta: accounts.active - accounts.activeBefore,
      sub: "Last seen in the past fortnight",
    },
    {
      id: "uploads",
      label: "Uploads",
      value: uploads.total,
      delta: uploads.recent - uploads.previous,
      sub: `${plural(uploads.recent, "photo or video", "photos and videos")} this fortnight`,
    },
    {
      id: "paid",
      label: "Paid subscribers",
      value: accounts.paid,
      // No history is stored, so no arrow is drawn (see the note above).
      delta: null,
      sub:
        accounts.total === 0
          ? "No accounts yet"
          : `${paidShare}% of accounts, no history to compare`,
    },
  ];
}

/**
 * THE SPARKLINE, AS A PATH (`home=kpi`: "four figures and a fortnight's trend").
 *
 * Inline SVG rather than the recharts pair the metrics page uses: those are a
 * client island behind `ssr: false` and a Skeleton, and a fourteen-point line
 * that arrives after hydration under a figure that did not is a worse picture
 * than one drawn on the server. Fourteen numbers need a polyline, not a chart
 * library.
 *
 * ★ A FLAT SERIES DRAWS A FLAT LINE, NOT A DIVISION BY ZERO. Every count equal
 * (very often: zero) means max === min, and the naive scale is 0/0. The line
 * sits on the baseline instead, which is what a fortnight of nothing looks like.
 */
export function sparklinePath(
  counts: number[],
  width: number,
  height: number,
): string {
  if (counts.length === 0) return "";
  if (counts.length === 1) {
    const mid = height / 2;
    return `M 0 ${mid} L ${width} ${mid}`;
  }
  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const span = max - min;
  const step = width / (counts.length - 1);
  return counts
    .map((count, i) => {
      const x = round(i * step);
      // A point sits at the bottom when the series is flat, and the top of the
      // box is the highest count: the line is a SHAPE, never a scale with an
      // axis somebody might read a value off.
      const y = round(span === 0 ? height : height - ((count - min) / span) * height);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
