import type { Metadata } from "next";

import { AlertTriangle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { healthBadge } from "@/lib/admin/tone";
import { requireAdmin } from "@/lib/auth/admin-context";
import { SITE_URL } from "@/lib/constants/site";
import { getArticle, getCategory } from "@/lib/content/help";
import {
  getArticleFeedbackSummary,
  type ArticleFeedbackSummaryRow,
} from "@/lib/db/queries/article-feedback";
import { getJobSignals } from "@/lib/db/queries/jobs";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";

import { signalHealth, type JobHealth } from "../jobs/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Help feedback" };

/**
 * THE FEEDBACK BEACON'S SURFACE (help-center r1 `feedback=beacon`): every "Did this answer your
 * question?" a reader answered, counted per article, newest first. The reader sees the same
 * thank-you or sorry whether the click landed or not, so this page and the `help_feedback` signal
 * are the only places a beacon recording nothing could ever show (a backend write ships its admin
 * surface and its health signal in the same change).
 *
 * ★ AN UNREADABLE COUNT IS NEVER "NO FEEDBACK YET". Both reads throw (`mustQuery` / `mustCount`),
 * and the page says it could not read them in words, because an empty table here would read as a
 * library nobody has complained about.
 *
 * A row where No outnumbers Yes is tinted: the point of the page is finding the article that loses
 * its reader by scrolling, not by reading every number.
 */

const HEALTH_WORDS: Partial<Record<JobHealth, string>> = {
  ok: "Recording",
  failed: "Dropping clicks",
  never: "No activity",
};

type Row = ArticleFeedbackSummaryRow & {
  title: string;
  categoryTitle: string | null;
  /** The slug still names a published article (a renamed or retired one keeps its counts). */
  published: boolean;
};

function withTitles(rows: ArticleFeedbackSummaryRow[]): Row[] {
  return rows.map((row) => {
    const article = getArticle(row.slug);
    return {
      ...row,
      title: article?.frontmatter.title ?? row.slug,
      categoryTitle: article
        ? getCategory(article.frontmatter.category).title
        : null,
      published: article !== null,
    };
  });
}

function share(row: ArticleFeedbackSummaryRow): string {
  const total = row.helpful + row.notHelpful;
  return total === 0 ? "" : `${Math.round((row.helpful / total) * 100)}%`;
}

export default async function HelpFeedbackPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  let rows: Row[] = [];
  let signal: { ok24h: number; failed24h: number } | null = null;
  let unreadable: string | null = null;
  try {
    const [summary, signals] = await Promise.all([
      getArticleFeedbackSummary(),
      getJobSignals(),
    ]);
    rows = withTitles(summary);
    signal = signals.help_feedback ?? null;
  } catch (e) {
    unreadable = e instanceof Error ? e.message : String(e);
  }

  const health = unreadable ? null : signalHealth(signal);
  const yes = rows.reduce((n, r) => n + r.helpful, 0);
  const no = rows.reduce((n, r) => n + r.notHelpful, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <PageHeading>Help feedback</PageHeading>
        <p className="text-sm text-muted-foreground">
          &ldquo;Did this answer your question?&rdquo; on every help article,
          counted. Readers see the same thank-you either way; only this page
          sees the answers.
        </p>
      </div>

      {unreadable ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              The feedback could not be read
            </CardTitle>
            <CardDescription>
              Nothing below is a count right now. Either the article_feedback
              migration has not been applied yet, or the database is
              unreachable. Readers still see their thank-you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-md bg-muted px-2.5 py-2 text-xs break-all text-muted-foreground select-all">
              {unreadable}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card id="signal" className="scroll-mt-20">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                The beacon
                {health ? (
                  <Badge variant={healthBadge(health)}>
                    {HEALTH_WORDS[health] ?? health}
                  </Badge>
                ) : null}
              </CardTitle>
              <Link
                href="/admin/jobs#job-help_feedback"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                On the jobs console
              </Link>
            </div>
            <CardDescription>
              One row a click: the article, Yes or No, and when. No address,
              account or device is kept, so a row never says who answered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-muted-foreground">Last 24 hours</dt>
                <dd className="tabular-nums">
                  {formatCount(signal?.ok24h ?? 0)} recorded,{" "}
                  <span
                    className={
                      (signal?.failed24h ?? 0) > 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {formatCount(signal?.failed24h ?? 0)} dropped
                  </span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted-foreground">All time</dt>
                <dd className="tabular-nums">
                  {formatCount(yes)} Yes, {formatCount(no)} No, on{" "}
                  {formatCount(rows.length)}{" "}
                  {rows.length === 1 ? "article" : "articles"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {!unreadable && (
        <Card>
          <CardHeader>
            <CardTitle>By article</CardTitle>
            <CardDescription>
              Newest click first. A row where No outnumbers Yes is tinted.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {rows.length === 0 ? (
              <p className="px-6 text-working text-muted-foreground">
                No feedback yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-right">Yes</TableHead>
                    <TableHead className="text-right">No</TableHead>
                    <TableHead className="text-right">Helpful</TableHead>
                    <TableHead>Last click</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.slug}
                      tone={
                        row.notHelpful > row.helpful ? "warning" : undefined
                      }
                    >
                      <TableCell className="max-w-[22rem]">
                        {/* The admin portal is its own host, so the article's link is the
                            site's absolute address, in a new tab. */}
                        <a
                          href={`${SITE_URL}/help/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          <span className="truncate">{row.title}</span>
                          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
                        </a>
                        <span className="block truncate text-xs text-muted-foreground">
                          {row.published
                            ? row.categoryTitle
                            : "No longer published"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.helpful)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCount(row.notHelpful)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {share(row)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatAdminTimestamp(row.lastAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
