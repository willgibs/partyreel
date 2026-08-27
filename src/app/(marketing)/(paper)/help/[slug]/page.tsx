import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readingTime } from "@/lib/content/collection";
import {
  extractHeadings,
  getAllArticles,
  getAllSlugs,
  getArticle,
  getCategory,
  getRelatedArticles,
  type HelpArticle,
} from "@/lib/content/help";
import { cn, formatEventDate } from "@/lib/utils";

import { ArticleFeedback } from "../article-feedback";
import { ArticleToc } from "../article-toc";
import { HeadingAnchorsDelegate } from "../heading-anchors";
import { HelpSearchTrigger } from "../help-palette";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.frontmatter.title,
    description: article.frontmatter.description,
    alternates: { canonical: `/help/${slug}` },
    openGraph: {
      // `tags`, not `keywords` (which is not an openGraph field and would
      // silently do nothing). The share IMAGE comes from the file-convention
      // opengraph-image.tsx beside this page.
      type: "article",
      publishedTime: article.frontmatter.updated,
      modifiedTime: article.frontmatter.updated,
      tags: article.frontmatter.keywords.length
        ? article.frontmatter.keywords
        : undefined,
    },
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const category = getCategory(article.frontmatter.category);
  const headings = extractHeadings(article.body);
  const related = getRelatedArticles(article);

  // Prev/next within the category's shipping order (getAllArticles is already
  // category+order sorted); under-populated ends just render one card.
  const siblings = getAllArticles().filter(
    (a) => a.frontmatter.category === article.frontmatter.category,
  );
  const at = siblings.findIndex((a) => a.slug === slug);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;

  // compileMDX (rsc) renders the body to a ReactElement we drop into the prose
  // container. Frontmatter is already stripped (gray-matter), so no parseFrontmatter.
  // blockJS stays on (v6 default) — articles are first-party but we still keep raw JS
  // expressions out; the spec/Callout JSX components are preserved (see ADR-0006).
  const { content } = await compileMDX({
    source: article.body,
    components: mdxComponents,
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Help center", href: "/help" },
          { name: article.frontmatter.title, href: `/help/${slug}` },
        ]}
      />
      <ArticleJsonLd
        headline={article.frontmatter.title}
        description={article.frontmatter.description}
        path={`/help/${slug}`}
        datePublished={article.frontmatter.updated}
        dateModified={article.frontmatter.updated}
      />

      <Container className="py-12 sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="max-w-2xl min-w-0">
            {/* Top utility row: the way back + the way to search (the palette
                is also on ⌘K, but a visible affordance beats a secret one). */}
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/help"
                className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                Help center
              </Link>
              <HelpSearchTrigger variant="compact" />
            </div>

            {/* Header ladder (the 2026-08-25 type ruling): article H1 reaches
                4xl/5xl in the heading face; the meta line is Inter small muted
                with tabular digits (the R6 mono ruling: mono only for
                numerals/tabular alignment, never caption prose). */}
            <header className="mt-6">
              {/* The badge is the way back to this category's pane on the
                  index (the ids landed with the R6 index sheet). */}
              <Link href={`/help#${category.slug}`} className="inline-flex">
                <Badge
                  variant="secondary"
                  className="transition-colors duration-150 hover:bg-secondary/70"
                >
                  {category.title}
                </Badge>
              </Link>
              <h1 className="mt-4 font-heading text-4xl text-balance sm:text-5xl">
                {article.frontmatter.title}
              </h1>
              <p className="mt-4 text-sm text-muted-foreground tabular-nums">
                Updated {formatEventDate(article.frontmatter.updated)} &middot;{" "}
                {readingTime(article.body)}
              </p>
            </header>

            {/* THE SHORT ANSWER (R6, answer-first): the frontmatter description
                rendered as the article's lead — the legal shell's two-register
                "In short" pattern come home. AUTHORING.md binds authors to
                write descriptions that can carry this slot. */}
            <div className="mt-7 border-l-2 border-foreground/25 pl-4">
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                In short
              </p>
              <p className="mt-1.5 leading-7 text-pretty">
                {article.frontmatter.description}
              </p>
            </div>

            {/* Mobile contents: the zero-JS chip row (the desktop rail is
                lg-only; an accordion here was deliberately cut). */}
            {headings.length >= 2 && (
              <nav
                aria-label="On this page"
                className="mt-7 flex flex-wrap items-center gap-2 lg:hidden"
              >
                <span className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </span>
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            )}

            {/* prose-headings:font-heading pulls the article's h2/h3 onto the
                house heading face (Urbanist) so long-form matches the chrome;
                the prose SCALE itself is untouched (the ruling keeps it). */}
            <article className="prose mt-8 max-w-none prose-help prose-headings:font-heading">
              {content}
            </article>
            {/* One delegated island upgrades every heading's copy-link anchor. */}
            <HeadingAnchorsDelegate />

            <ArticleFeedback slug={slug} />

            {(prev || next) && (
              <nav
                aria-label={`More in ${category.title}`}
                className="mt-10 grid gap-3 sm:grid-cols-2"
              >
                {prev ? (
                  <PaginationCard direction="prev" article={prev} />
                ) : (
                  <span aria-hidden className="hidden sm:block" />
                )}
                {next && <PaginationCard direction="next" article={next} />}
              </nav>
            )}

            {related.length > 0 && (
              <section className="mt-12 border-t pt-10">
                <h2 className="font-heading text-xl tracking-tight">
                  Related articles
                </h2>
                <ul className="mt-5 flex flex-col gap-3.5">
                  {related.map((item) => (
                    <li key={item.slug}>
                      <LearnMoreLink
                        href={`/help/${item.slug}`}
                        className="text-foreground"
                      >
                        {item.frontmatter.title}
                      </LearnMoreLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* The ladder points UP too (the de-silo ruling): each category
                maps to one marketing rung. */}
            {category.feature && (
              <p className="mt-10 text-sm text-muted-foreground">
                Want the bigger picture?{" "}
                <LearnMoreLink
                  href={category.feature.href}
                  className="text-foreground"
                >
                  {category.feature.label}
                </LearnMoreLink>
              </p>
            )}

            <section className="mt-10 rounded-2xl border bg-muted/30 p-8 text-center">
              <h2 className="font-heading text-xl tracking-tight">
                Still need help?
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
                Can&rsquo;t find the answer here? Reach out and we&rsquo;ll get
                back to you.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/contact?about=${slug}`}>Contact us</Link>
              </Button>
            </section>
          </div>

          {headings.length >= 2 && (
            <aside className="hidden shrink-0 lg:block lg:w-48">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </p>
                <ArticleToc headings={headings} />
              </nav>
            </aside>
          )}
        </div>
      </Container>
    </>
  );
}

// Prev/next within the category: the reading order made walkable. Direction
// shapes alignment + which arrow nudges on hover.
function PaginationCard({
  direction,
  article,
}: {
  direction: "prev" | "next";
  article: HelpArticle;
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/help/${article.slug}`}
      className={cn(
        "group flex flex-col gap-1.5 rounded-2xl border bg-card p-5 ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]",
        isNext && "items-end text-right",
      )}
    >
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {!isNext && (
          <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
        )}
        {isNext ? "Next" : "Previous"}
        {isNext && (
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        )}
      </span>
      <span className="text-sm font-medium text-balance text-foreground">
        {article.frontmatter.title}
      </span>
    </Link>
  );
}
