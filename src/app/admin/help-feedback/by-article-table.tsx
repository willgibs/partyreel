import { ArrowUpRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SITE_URL } from "@/lib/constants/site";
import type { ArticleFeedbackSummaryRow } from "@/lib/db/queries/article-feedback";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

/** One article's counts, with the title and shelf the page read from the help library. */
export type ArticleFeedbackRow = ArticleFeedbackSummaryRow & {
  title: string;
  categoryTitle: string | null;
  /** The slug still names a published article (a renamed or retired one keeps its counts). */
  published: boolean;
};

function share(row: ArticleFeedbackSummaryRow): string {
  const total = row.helpful + row.notHelpful;
  return total === 0 ? "" : `${Math.round((row.helpful / total) * 100)}%`;
}

/**
 * THE BEACON'S COUNTS, ONE ROW AN ARTICLE, newest click first, a row where No outnumbers Yes tinted.
 *
 * ★ COLUMNS THAT FIT A PHONE (build 19's red-team: at 375 the five columns were a 617 px table in a
 * 343 px scroller, No cut mid-column and Helpful and Last click off-screen, with nothing saying it
 * scrolled). Below `sm` the table keeps the three columns the page is for, the article and its Yes and
 * No, and folds the rest the way a closed report's line does: the last click's day drops under the
 * article beside its shelf, and the Helpful share, which Yes and No and the row's tint already say,
 * waits for a wider screen. The title wraps there rather than being cut. It stays one table, so a
 * screen reader reads the same rows and headers at every width.
 */
export function ByArticleTable({ rows }: { rows: ArticleFeedbackRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Article</TableHead>
          <TableHead className="text-right">Yes</TableHead>
          <TableHead className="text-right">No</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            Helpful
          </TableHead>
          <TableHead className="hidden sm:table-cell">Last click</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={row.slug}
            tone={row.notHelpful > row.helpful ? "warning" : undefined}
          >
            <TableCell className="sm:max-w-[22rem]">
              {/* The admin portal is its own host, so the article's link is the site's absolute
                  address, in a new tab. */}
              <a
                href={`${SITE_URL}/help/${row.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group font-medium text-pretty break-words text-foreground underline-offset-4 hover:underline sm:inline-flex sm:max-w-full sm:items-center sm:gap-1"
              >
                <span className="sm:truncate">{row.title}</span>
                <ArrowUpRight className="ml-1 inline size-3.5 shrink-0 align-[-0.125em] text-muted-foreground sm:ml-0" />
              </a>
              {/* The shelf gives way before the day does, as a closed report's line keeps its time. */}
              <span className="flex min-w-0 items-baseline gap-1 text-xs text-muted-foreground">
                <span className="min-w-0 truncate">
                  {row.published ? row.categoryTitle : "No longer published"}
                </span>
                <span aria-hidden className="sm:hidden">
                  ·
                </span>
                <span className="shrink-0 tabular-nums sm:hidden">
                  {formatAdminDate(row.lastAt)}
                </span>
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.helpful)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(row.notHelpful)}
            </TableCell>
            <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">
              {share(row)}
            </TableCell>
            <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
              {formatAdminTimestamp(row.lastAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
