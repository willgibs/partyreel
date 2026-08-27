import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import Link from "next/link";
import { notFound } from "next/navigation";
import remarkGfm from "remark-gfm";

import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { mdxComponents } from "@/components/marketing/mdx-components";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  extractHeadings,
  getAllSlugs,
  getArticle,
  getCategory,
  getRelatedArticles,
} from "@/lib/content/help";
import { formatEventDate } from "@/lib/utils";

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
                4xl/5xl in the heading face; the meta line goes mono (the
                marketing caption voice for factual lines). */}
            <header className="mt-6">
              <Badge variant="secondary">{category.title}</Badge>
              <h1 className="mt-4 font-heading text-4xl text-balance sm:text-5xl">
                {article.frontmatter.title}
              </h1>
              <MonoCaption className="mt-4">
                Updated {formatEventDate(article.frontmatter.updated)}
              </MonoCaption>
            </header>

            {/* prose-headings:font-heading pulls the article's h2/h3 onto the
                house heading face (Urbanist) so long-form matches the chrome;
                the prose SCALE itself is untouched (the ruling keeps it). */}
            <article className="prose mt-8 max-w-none prose-help prose-headings:font-heading">
              {content}
            </article>

            {related.length > 0 && (
              <section className="mt-16 border-t pt-10">
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

            <section className="mt-12 rounded-2xl border bg-muted/30 p-8 text-center">
              <h2 className="font-heading text-xl tracking-tight">
                Still need help?
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
                Can&rsquo;t find the answer here? Reach out and we&rsquo;ll get
                back to you.
              </p>
              <Button asChild className="mt-4">
                <Link href="/contact">Contact us</Link>
              </Button>
            </section>
          </div>

          {headings.length >= 2 && (
            <aside className="hidden shrink-0 lg:block lg:w-48">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  On this page
                </p>
                <ul className="mt-3 flex flex-col border-l">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="-ml-px block border-l border-transparent py-1.5 pl-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}
        </div>
      </Container>
    </>
  );
}
