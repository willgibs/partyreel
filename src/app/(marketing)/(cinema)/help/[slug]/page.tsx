import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
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

import { ArticleFeedback } from "@/components/marketing/help/article-feedback";
import {
  ARTICLE_BODY_ID,
  ArticleToc,
} from "@/components/marketing/reading/article-toc";
import { ChipToc } from "@/components/marketing/reading/chip-toc";
import { HeadingAnchorsDelegate } from "@/components/marketing/reading/heading-anchors";
import { HelpSearchTrigger } from "@/components/marketing/help/help-palette";

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

      {/* THE DARK STAGE (R6 polish v3, the index treatment applied): the
          article opens in the cinema room — way back, search, category, the
          title — and THE SHORT ANSWER rides a paper card STRADDLING the
          cinema→paper cut (negative margin, the strip's sibling move): the
          answer arriving out of the dark is the article's whole thesis. */}
      <section>
        <Container className="pt-10 pb-0 sm:pt-12">
          <div className="relative mx-auto max-w-5xl">
            {/* Stage art: the category's emblem drawn LARGE in light ink on
                the dark room (the strokes are border-foreground, so cinema
                renders them light for free) — fills the stage's right reach
                so the header stops feeling like narrow content on a void. */}
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-10 hidden -translate-y-1/3 opacity-30 lg:block xl:right-20"
            >
              <span className="block scale-[2.75]">
                <CategoryEmblem slug={category.slug} size="lg" />
              </span>
            </span>
            <div className="max-w-2xl min-w-0">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/help"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
                  Help center
                </Link>
                {/* Paper island: the trigger stays a light pill on the dark
                    stage (the hero search-card grammar). */}
                <span className="surface-paper inline-flex">
                  <HelpSearchTrigger variant="compact" />
                </span>
              </div>

              {/* Header ladder (the 2026-08-25 type ruling): H1 at 4xl/5xl in
                  the heading face; meta in Inter small muted with tabular
                  digits (the mono ruling). The badge is the way back to this
                  category's pane on the index — a paper chip on the stage. */}
              <header className="mt-8">
                <span className="surface-paper inline-flex">
                  <Link href={`/help#${category.slug}`} className="inline-flex">
                    <Badge
                      variant="secondary"
                      className="transition-colors duration-150 hover:bg-secondary/70"
                    >
                      {category.title}
                    </Badge>
                  </Link>
                </span>
                <h1 className="mt-4 font-heading text-4xl text-balance sm:text-5xl lg:text-6xl">
                  {article.frontmatter.title}
                </h1>
                <p className="mt-4 text-sm text-muted-foreground tabular-nums">
                  Updated {formatEventDate(article.frontmatter.updated)}{" "}
                  &middot; {readingTime(article.body)}
                </p>
              </header>

              {/* THE SHORT ANSWER, straddling: frontmatter description as the
                  lead (the legal shell's two-register pattern; AUTHORING.md
                  binds authors to write descriptions that carry this slot). */}
              <div className="surface-paper relative z-10 mt-8 -mb-10">
                <div className="rounded-2xl border bg-card p-5 shadow-float ring-1 ring-foreground/5 sm:p-6">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    In short
                  </p>
                  <p className="mt-1.5 leading-7 text-pretty text-foreground">
                    {article.frontmatter.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <PaperChapter>
      <section className="pt-16 pb-12 sm:pt-20 sm:pb-16">
        <Container>
        <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="max-w-2xl min-w-0">
            {/* Mobile contents: the zero-JS chip row (the desktop rail is
                lg-only; an accordion here was deliberately cut). */}
            <ChipToc headings={headings} />

            {/* prose-headings:font-heading pulls the article's h2/h3 onto the
                house heading face (Urbanist) so long-form matches the chrome;
                the prose SCALE itself is untouched (the ruling keeps it). */}
            <article
              id={ARTICLE_BODY_ID}
              className="prose mt-8 max-w-none prose-help first:mt-0 prose-headings:font-heading"
            >
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

          {/* aside self-stretch is LOAD-BEARING: the grid's lg:items-start
              collapses the rail to content height, leaving sticky zero travel
              room — the ToC never tracked (Will's catch). Stretching restores
              the full-column runway for sticky top-24. */}
          {headings.length >= 2 && (
            <aside className="hidden shrink-0 lg:block lg:w-48 lg:self-stretch">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </p>
                {/* The reading spine, shared with the blog article (Will, 2026-08-29):
                    both long-form surfaces are built from this component, so they run
                    one behaviour. The target is the BODY, never the page - the feedback
                    block and the footer below it must not count as reading. */}
                <ArticleToc
                  headings={headings}
                  progress={{ targetId: ARTICLE_BODY_ID }}
                />
              </nav>
            </aside>
          )}
        </div>
        </Container>
      </section>
      </PaperChapter>
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
