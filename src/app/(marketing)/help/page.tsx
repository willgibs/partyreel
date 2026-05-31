import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  getAllArticles,
  getArticlesByCategory,
  getCategory,
  getSearchIndex,
  type HelpArticle,
} from "@/lib/content/help";
import { cn } from "@/lib/utils";

import { HelpSearch } from "./help-search";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Guides for Partyreel hosts and guests — create an event, share your QR code, curate your album, manage plans, and make a highlight reel.",
  alternates: { canonical: "/help" },
};

// Curated fast-paths, shown above the full category browse.
const POPULAR_SLUGS = [
  "how-partyreel-works",
  "create-your-first-event",
  "the-highlight-reel",
];

export default function HelpIndexPage() {
  const groups = getArticlesByCategory();
  const bySlug = new Map(getAllArticles().map((a) => [a.slug, a]));
  const popular = POPULAR_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (a): a is HelpArticle => Boolean(a),
  );

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Help center", href: "/help" },
        ]}
      />

      <HelpSearch items={getSearchIndex()}>
        {/* Browse — shown when the search box is empty. */}
        {popular.length > 0 && (
          <section className="py-12 sm:py-16">
            <Container>
              <h2 className="font-heading text-xl font-semibold tracking-tight">
                Start here
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {popular.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/help/${article.slug}`}
                    className="group flex flex-col gap-2 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-colors duration-150 hover:border-brand/40"
                  >
                    <span className="text-xs font-medium text-brand">
                      {getCategory(article.frontmatter.category).title}
                    </span>
                    <h3 className="font-heading text-lg font-medium transition-colors duration-150 group-hover:text-brand">
                      {article.frontmatter.title}
                    </h3>
                    <p className="text-sm text-pretty text-muted-foreground">
                      {article.frontmatter.description}
                    </p>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {groups.map(({ category, articles }, index) => {
          const Icon = category.icon;
          return (
            <section
              key={category.slug}
              className={cn("py-12 sm:py-16", index % 2 === 0 && "bg-muted/30")}
            >
              <Container>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-xl font-semibold tracking-tight">
                      {category.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {category.blurb}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/help/${article.slug}`}
                      className="group flex flex-col gap-1.5 rounded-xl border bg-card p-5 transition-colors duration-150 hover:border-brand/40"
                    >
                      <h3 className="font-medium transition-colors duration-150 group-hover:text-brand">
                        {article.frontmatter.title}
                      </h3>
                      <p className="text-sm text-pretty text-muted-foreground">
                        {article.frontmatter.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </Container>
            </section>
          );
        })}

        <section className="border-t">
          <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Still need help?
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Can&rsquo;t find what you&rsquo;re looking for? We&rsquo;re happy
              to help — reach out and we&rsquo;ll get back to you.
            </p>
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href="/contact">
                Contact us
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </Container>
        </section>
      </HelpSearch>
    </>
  );
}
