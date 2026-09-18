import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  mdxComponents,
  PlanBadge,
} from "@/components/marketing/mdx-components";
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
  audienceLabel,
  getRelatedArticles,
  resolveAudience,
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

  // Prev/next within the category's shipping order (getAllArticles is already
  // category+order sorted); under-populated ends just render one card.
  const siblings = getAllArticles().filter(
    (a) => a.frontmatter.category === article.frontmatter.category,
  );
  const at = siblings.findIndex((a) => a.slug === slug);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;
  // Related skips what the pagination cards already show.
  const related = getRelatedArticles(
    article,
    3,
    [prev?.slug, next?.slug].filter((s): s is string => Boolean(s)),
  );

  // The audience tag renders only when it says something the category chip
  // does not (help.ts owns that decision, shared with the palette's tail).
  const audience = resolveAudience(article);
  const audienceTag = audienceLabel(article);
  const plans = article.frontmatter.plans;

  // compileMDX (rsc) renders the body to a ReactElement we drop into the prose
  // container. Frontmatter is already stripped (gray-matter), so no parseFrontmatter.
  // blockJS stays on (v6 default) — articles are first-party but we still keep raw JS
  // expressions out; the spec/Callout JSX components are preserved (see marketing-content.md).
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
              <div
                className="flex items-center justify-between gap-4"
                data-print-hide
              >
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
              <header className="mt-8" data-print-keep>
                <span className="surface-paper inline-flex items-center gap-2">
                  <Link href={`/help#${category.slug}`} className="inline-flex">
                    <Badge
                      variant="secondary"
                      className="transition-colors duration-150 hover:bg-secondary/70"
                    >
                      {category.title}
                    </Badge>
                  </Link>
                  {audienceTag && (
                    <Badge variant="outline">{audienceTag}</Badge>
                  )}
                </span>
                <h1 className="mt-4 font-heading text-chapter text-balance">
                  {article.frontmatter.title}
                </h1>
                {/* Paper only: the article's address, so a printed guide can
                    be found again (print CSS reveals it; hidden on screen). */}
                <p
                  className="hidden text-sm text-muted-foreground"
                  data-print-url
                >
                  partyreel.com/help/{slug}
                </p>
                <p className="mt-4 text-sm text-muted-foreground tabular-nums">
                  Updated {formatEventDate(article.frontmatter.updated)}{" "}
                  &middot; {readingTime(article.body)}
                </p>
              </header>

              {/* THE SHORT ANSWER, straddling: frontmatter description as the
                  lead (the legal shell's two-register pattern; AUTHORING.md
                  binds authors to write descriptions that carry this slot).
                  It overhangs the cut, so it wears shadow-lift (an overlap);
                  a card lying flat on the page takes no shadow. */}
              <div className="surface-paper relative z-10 mt-8 -mb-10">
                <div className="rounded-2xl border bg-card p-5 shadow-lift ring-1 ring-foreground/5 sm:p-6">
                  <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    In short
                  </p>
                  <p className="mt-1.5 leading-7 text-pretty text-foreground">
                    {article.frontmatter.description}
                  </p>
                  {/* The card's footer: the one action (the door back into the
                      product) and the "Applies to" plan line. Both are
                      optional frontmatter; most articles render neither. */}
                  {(article.frontmatter.action || plans.length > 0) && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-3.5">
                      {article.frontmatter.action ? (
                        <LearnMoreLink
                          href={article.frontmatter.action.href}
                          className="text-foreground"
                        >
                          {article.frontmatter.action.label}
                        </LearnMoreLink>
                      ) : (
                        <span />
                      )}
                      {plans.length > 0 && (
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          Applies to
                          {plans.map((tier) => (
                            <PlanBadge key={tier} tier={tier} />
                          ))}
                        </span>
                      )}
                    </div>
                  )}
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
                <div data-print-hide>
                  <ChipToc headings={headings} />
                </div>

                {/* prose-headings:font-heading pulls the article's h2/h3 onto the
                house heading face (Urbanist) so long-form matches the chrome,
                and the h2/h3 modifiers put them on the LADDER (Will,
                2026-09-18: nothing sized off it): an article h2 is the paper
                prose head (`prose`) and its h3 the sub-head under it
                (`subhead`), where @tailwindcss/typography had set 24 and 20 at
                every width. The body copy's scale is still the plugin's. The
                MDX components themselves are shared (components/marketing/
                mdx/), so the sizes ride this wrapper, as the face does. */}
                <article
                  id={ARTICLE_BODY_ID}
                  data-print-article
                  className="prose mt-8 max-w-none prose-help first:mt-0 prose-headings:font-heading prose-h2:text-prose prose-h3:text-subhead prose-code:font-sans"
                >
                  {content}
                </article>
                {/* One delegated island upgrades every heading's copy-link anchor. */}
                <HeadingAnchorsDelegate />

                <div data-print-hide>
                  <ArticleFeedback
                    slug={slug}
                    next={
                      next
                        ? { slug: next.slug, title: next.frontmatter.title }
                        : null
                    }
                  />
                </div>

                {(prev || next) && (
                  <nav
                    aria-label={`More in ${category.title}`}
                    className="mt-10 grid gap-3 sm:grid-cols-2"
                    data-print-hide
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
                  <section className="mt-12 border-t pt-10" data-print-hide>
                    <h2 className="font-heading text-subhead">
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
                maps to one marketing rung. A GUEST article ends on the host
                rung instead: the reader just used the product as a guest, and
                "hosting your own" is the growth loop stated once, quietly. */}
                {audience === "guest" ? (
                  <p
                    className="mt-10 text-sm text-muted-foreground"
                    data-print-hide
                  >
                    Hosting your own event?{" "}
                    <LearnMoreLink
                      href="/how-it-works"
                      className="text-foreground"
                    >
                      See how Partyreel works
                    </LearnMoreLink>
                  </p>
                ) : (
                  category.feature && (
                    <p
                      className="mt-10 text-sm text-muted-foreground"
                      data-print-hide
                    >
                      Want the bigger picture?{" "}
                      <LearnMoreLink
                        href={category.feature.href}
                        className="text-foreground"
                      >
                        {category.feature.label}
                      </LearnMoreLink>
                    </p>
                  )
                )}

                <section
                  className="mt-10 rounded-2xl border bg-muted/30 p-8 text-center"
                  data-print-hide
                >
                  <h2 className="font-heading text-subhead">
                    Still need help?
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
                    Can&rsquo;t find the answer here? Reach out and we&rsquo;ll
                    get back to you.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href={`/contact?about=${slug}`}>Contact us</Link>
                  </Button>
                </section>
              </div>

              {/* aside self-stretch is LOAD-BEARING: the grid's lg:items-start
              collapses the rail to content height, leaving sticky zero travel
              room — the ToC never tracked (Will's catch). Stretching restores
              the full-column runway for the sticky rail. */}
              {headings.length >= 2 && (
                <aside
                  className="hidden shrink-0 lg:block lg:w-48 lg:self-stretch"
                  data-print-hide
                >
                  <nav
                    aria-label="On this page"
                    className="sticky top-[var(--mkt-rail-top)]"
                  >
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
