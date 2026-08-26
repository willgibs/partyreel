import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  getAllArticles,
  getArticlesByCategory,
  getSearchIndex,
  type HelpArticle,
} from "@/lib/content/help";
import { cn } from "@/lib/utils";

import { HelpSearch } from "./help-search";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Guides for Partyreel hosts and guests: create an event, share your QR code, curate your album, manage plans, and make a highlight reel.",
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
        {/* "Start here": the guided path, and the page's ONE accent moment
            (2026-08-25 achromatic ruling) — the mono step numerals wear the
            success green because green reads as GO; everything else on the
            page stays ink. Cards carry the mkt-learn hooks so the chevron
            answers a hover anywhere on the card. */}
        {popular.length > 0 && (
          <section className="py-14 sm:py-16">
            <Container>
              <h2 className="font-heading text-2xl tracking-tight">
                Start here
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {popular.map((article, step) => (
                  <Link
                    key={article.slug}
                    href={`/help/${article.slug}`}
                    className="mkt-learn group flex flex-col gap-2.5 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]"
                  >
                    <span className="font-mono text-xs tracking-wider text-success">
                      {String(step + 1).padStart(2, "0")}
                    </span>
                    {/* No font-medium with font-heading: the 500 utility beats
                        the face's 700 and the title blends into body copy. */}
                    <h3 className="font-heading text-lg">
                      {article.frontmatter.title}
                    </h3>
                    <p className="text-sm text-pretty text-muted-foreground">
                      {article.frontmatter.description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                      Read the guide
                      <LearnChevron />
                    </span>
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
              className={cn("py-14 sm:py-16", index % 2 === 0 && "bg-muted/30")}
            >
              <Container>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground">
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-xl tracking-tight sm:text-2xl">
                      {category.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {category.blurb}
                    </p>
                  </div>
                </div>
                {/* Same defect class as the C1 lone card: a 2-article category
                    in a forced 3-col grid strands the row's last third. Cap the
                    columns at the article count so 2 cards split the row. */}
                <div
                  className={cn(
                    "mt-6 grid gap-3 sm:grid-cols-2",
                    articles.length >= 3 && "lg:grid-cols-3",
                  )}
                >
                  {articles.map((article) => (
                    <CategoryCard
                      key={article.slug}
                      article={article}
                      // C1 fix: a single-article category otherwise renders one
                      // card at 1/3 grid width with two-thirds of the row dead
                      // (a content-count artifact: siblings fill 2-3 cards, this
                      // one just doesn't have them yet). Span the row instead of
                      // leaving a hole, and cap the text width so it still reads
                      // as a comfortable card, not a stretched-thin bar.
                      wide={articles.length === 1}
                    />
                  ))}
                </div>
              </Container>
            </section>
          );
        })}

        <section className="border-t">
          <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
            <h2 className="max-w-xl font-heading text-2xl text-balance sm:text-3xl">
              Still need help?
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Can&rsquo;t find what you&rsquo;re looking for? We&rsquo;re happy
              to help. Reach out and we&rsquo;ll get back to you.
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

// `wide` = the sole card in a single-article category: spans the full row
// (instead of sitting at 1/3 width with the rest of the row empty) and caps
// its text at a comfortable reading width so the card doesn't stretch thin.
function CategoryCard({
  article,
  wide,
}: {
  article: HelpArticle;
  wide?: boolean;
}) {
  return (
    <Link
      href={`/help/${article.slug}`}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border bg-card p-5 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99]",
        wide && "col-span-full sm:p-6",
      )}
    >
      {/* No font-medium with font-heading (500 beats the face's 700). */}
      <h3 className={cn("font-heading text-base", wide && "max-w-xl")}>
        {article.frontmatter.title}
      </h3>
      <p
        className={cn(
          "text-sm text-pretty text-muted-foreground",
          wide && "max-w-xl",
        )}
      >
        {article.frontmatter.description}
      </p>
    </Link>
  );
}
