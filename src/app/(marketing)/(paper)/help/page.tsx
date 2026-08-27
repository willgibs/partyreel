import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  getArticlesByCategory,
  getHelpFacts,
  getStartHereArticles,
  HELP_QUICK_LINKS,
} from "@/lib/content/help";
import { cn } from "@/lib/utils";

import { CategoryEmblem } from "./help-emblems";
import { HelpSearchTrigger } from "./help-palette";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Guides for Partyreel hosts and guests: create an event, share your QR code, curate your album, manage plans, and make a highlight reel.",
  alternates: { canonical: "/help" },
};

// Which emblem each Start-here card wears (the guides are cross-category
// evergreens, so the scene is picked per card, not derived).
const START_EMBLEMS: Record<string, string> = {
  "how-partyreel-works": "qr-and-invites",
  "create-your-first-event": "getting-started",
  "the-highlight-reel": "highlight-reel",
};

// THE INDEX OF EVERYTHING (R6, ruled): the help center as the product's printed
// index — hairline sheet, numbered categories and rows, DOM-art emblems, the
// palette as the primary interface. Reveal choreography is deliberately hero-
// only: this is a utility surface, and below the fold everything is simply
// THERE (the Emil frequency call for high-frequency surfaces). Mono appears on
// numerals only (the R6 mono ruling). The page stays declarative: every list
// here is registry-driven from help.ts (curated slugs are test-pinned).
export default function HelpIndexPage() {
  const groups = getArticlesByCategory();
  const startHere = getStartHereArticles();
  const facts = getHelpFacts();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Help center", href: "/help" },
        ]}
      />

      {/* ── Hero: the question, then the answer machine. ─────────────────── */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <TextsReveal className="flex w-full flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Help center
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              How can we help?
            </h1>
            <p
              className="mkt-line max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Guides for hosts and guests: setup, sharing, privacy, plans, and
              the highlight reel.
            </p>
            <div
              className="mkt-line mt-1 flex w-full justify-center"
              style={{ "--i": 3 } as CSSProperties}
            >
              <HelpSearchTrigger variant="hero" />
            </div>
            <div
              className="mkt-line flex max-w-2xl flex-wrap justify-center gap-2"
              style={{ "--i": 4 } as CSSProperties}
            >
              {HELP_QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:border-foreground/25 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </TextsReveal>
        </Container>
      </section>

      {/* ── Start here: the guided path (the page's one accent moment — the
             success-green numerals, because green reads as GO). ───────────── */}
      <section className="py-14 sm:py-16">
        <Container>
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Start here
          </h2>
          <div className="mt-6 grid overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 sm:grid-cols-3">
            {startHere.map((article, index) => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
                className={cn(
                  "group mkt-learn relative flex flex-col gap-2.5 p-6 transition-colors duration-150 hover:bg-muted/60 active:bg-muted",
                  index > 0 && "border-t sm:border-t-0 sm:border-l",
                )}
              >
                <CategoryEmblem
                  slug={START_EMBLEMS[article.slug] ?? "getting-started"}
                  className="absolute top-5 right-5 opacity-80"
                />
                <span className="font-mono text-xs tracking-wider text-success">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-lg">
                  {article.frontmatter.title}
                </h3>
                <p className="flex-1 pr-10 text-sm text-pretty text-muted-foreground">
                  {article.frontmatter.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                  Read the guide
                  <LearnChevron />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── The numbers: the product's hard limits, straight from the
             constants, each linking to the guide that explains it. ────────── */}
      <section className="pb-14 sm:pb-16">
        <Container>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              The numbers
            </h2>
            <p className="text-sm text-muted-foreground">
              The limits at a glance, rendered from the product itself.
            </p>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border ring-1 ring-foreground/5 sm:grid-cols-2 lg:grid-cols-5">
            {facts.map((fact, index) => (
              <Link
                key={fact.label}
                href={fact.href}
                className={cn(
                  "group flex flex-col gap-1 bg-card p-5 transition-colors duration-150 hover:bg-muted/60",
                  // 5 cells on a 2-col sm grid: the last one spans the row.
                  index === facts.length - 1 && "sm:col-span-2 lg:col-span-1",
                )}
              >
                <span className="font-heading text-xl tabular-nums sm:text-2xl">
                  {fact.value}
                </span>
                <span className="text-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                  {fact.label}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── The index sheet: every guide, in order. ──────────────────────── */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
              Every guide, in order
            </h2>
            <p className="text-sm text-muted-foreground">
              The whole product, indexed. Scan the sheet, or search from
              anywhere with the palette.
            </p>
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border ring-1 ring-foreground/5 lg:grid-cols-2">
            {groups.map(({ category, articles }, groupIndex) => {
              const wide = category.slug === "troubleshooting";
              return (
                <div
                  key={category.slug}
                  id={category.slug}
                  className={cn(
                    "group scroll-mt-[calc(var(--mkt-header-h,4rem)+1.5rem)] bg-card p-7 sm:p-8",
                    wide && "lg:col-span-2",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <CategoryEmblem slug={category.slug} />
                    <div className="min-w-0">
                      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                        <span className="font-mono text-foreground">
                          {String(groupIndex + 1).padStart(2, "0")}
                        </span>{" "}
                        &middot; {articles.length}{" "}
                        {articles.length === 1 ? "guide" : "guides"}
                      </p>
                      <h3 className="mt-0.5 font-heading text-lg sm:text-xl">
                        {category.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-pretty text-muted-foreground">
                    {category.blurb}
                  </p>

                  <ul className={cn("mt-4", wide && "sm:columns-2 sm:gap-10")}>
                    {articles.map((article, articleIndex) => (
                      <li
                        key={article.slug}
                        className={cn(
                          "border-t break-inside-avoid",
                          articleIndex === 0 && "border-t-0",
                        )}
                      >
                        <Link
                          href={`/help/${article.slug}`}
                          prefetch={false}
                          className="group/row flex items-center gap-3 py-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                        >
                          <span className="w-5 shrink-0 font-mono text-[11px] text-muted-foreground/50 tabular-nums transition-colors duration-150 group-hover/row:text-success">
                            {String(articleIndex + 1).padStart(2, "0")}
                          </span>
                          <span className="min-w-0 flex-1">
                            {article.frontmatter.title}
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 -translate-x-1 text-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover/row:translate-x-0 group-hover/row:opacity-100 motion-reduce:transition-none" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {category.feature && (
                    <p className="mt-4 border-t pt-3.5 text-xs text-muted-foreground">
                      On the site:{" "}
                      <LearnMoreLink
                        href={category.feature.href}
                        className="text-xs text-foreground"
                      >
                        {category.feature.label}
                      </LearnMoreLink>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── The multi-path close: contact first, then onward (the de-silo
             ruling — help is one resource inside a bigger site). ──────────── */}
      <section className="border-t">
        <Container className="flex flex-col items-center gap-4 py-16 text-center sm:py-20">
          <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
            Still need help?
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            Can&rsquo;t find what you&rsquo;re looking for? Reach out and
            we&rsquo;ll get back to you.
          </p>
          <Button asChild size="lg" className="mt-1 h-11 px-6 text-base">
            <Link href="/contact">Contact us</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Replies from a real person, usually within a day.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-6 text-sm">
            <span className="text-muted-foreground">Keep exploring:</span>
            <LearnMoreLink href="/how-it-works" className="text-foreground">
              How Partyreel works
            </LearnMoreLink>
            <LearnMoreLink href="/pricing" className="text-foreground">
              Pricing
            </LearnMoreLink>
            <LearnMoreLink href="/blog" className="text-foreground">
              The blog
            </LearnMoreLink>
          </div>
        </Container>
      </section>
    </>
  );
}
