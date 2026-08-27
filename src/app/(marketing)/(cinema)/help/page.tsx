import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { marketingImage } from "@/lib/constants/marketing-media";
import {
  getArticlesByCategory,
  getHelpFacts,
  getStartHereArticles,
  HELP_QUICK_LINKS,
} from "@/lib/content/help";
import { cn } from "@/lib/utils";

import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { HelpFactsBand } from "@/components/marketing/help/help-facts-band";
import { HelpSearchTrigger } from "@/components/marketing/help/help-palette";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "Guides for Partyreel hosts and guests: create an event, share your QR code, curate your album, manage plans, and make a highlight reel.",
  alternates: { canonical: "/help" },
};

// One-word strip labels: the hero's emblem row is an instrument, and
// instruments read at a glance (full titles live on the panes below).
const STRIP_LABELS: Record<string, string> = {
  "getting-started": "Start",
  "qr-and-invites": "QR",
  "guest-experience": "Guests",
  "event-album": "Album",
  "sharing-and-downloads": "Sharing",
  "highlight-reel": "Reel",
  "plans-and-billing": "Plans",
  "privacy-and-safety": "Privacy",
  troubleshooting: "Fixes",
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

      {/* ── Hero: the front desk, now NATIVE CINEMA (Will's dark-nav note,
             2026-08-27: /help moved into the (cinema) group, so the dark
             stage runs seamlessly from the overlay header instead of sitting
             under a light bar). The search field and emblem strip are PAPER
             ISLANDS (surface-paper token flips — the sanctioned
             .dark > .surface-paper direction) floating on the dark room.
             CENTERING IDIOM: .mkt-line forces display:block (the texts-reveal
             recipe, 0,2,1 specificity), silently killing flex utilities on
             the same element — constrained children center with mx-auto,
             never a parent justify-center (the off-center-search bug Will
             caught on the first polish pass). */}
      <section>
        <Container className="flex flex-col items-center pt-16 pb-0 text-center sm:pt-20">
          <TextsReveal className="flex w-full flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Help center
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
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
              className="surface-paper mkt-line mt-1 w-full"
              style={{ "--i": 3 } as CSSProperties}
            >
              <HelpSearchTrigger variant="hero" className="mx-auto" />
            </div>
            <div
              className="mkt-line max-w-3xl text-center"
              style={{ "--i": 4 } as CSSProperties}
            >
              {HELP_QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="mx-1 mb-2 inline-flex rounded-full border px-3.5 py-1.5 text-[13px] text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* THE EMBLEM STRIP: the nine categories as a paper instrument
                row (art AND wayfinding; snap-scroll on phones), STRADDLING
                the cinema→paper cut — the negative bottom margin ends the
                dark stage halfway up the strip, so the index arrives out of
                the dark the way the album arrives out of the event on home
                (the R2 negative-margin move: real layout, no translate). */}
            <nav
              aria-label="Browse by category"
              className="surface-paper mkt-line relative z-10 mx-auto mt-6 -mb-10 w-full max-w-3xl"
              style={{ "--i": 5 } as CSSProperties}
            >
              <div className="overflow-x-auto rounded-2xl border bg-card shadow-float ring-1 ring-foreground/5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max snap-x sm:grid sm:min-w-0 sm:grid-cols-9">
                  {groups.map(({ category }, i) => (
                    <a
                      key={category.slug}
                      href={`#${category.slug}`}
                      className={cn(
                        "group flex min-w-[84px] snap-start flex-col items-center gap-1 px-2 py-3 transition-colors duration-150 hover:bg-muted/60",
                        i > 0 && "border-l",
                      )}
                    >
                      <CategoryEmblem slug={category.slug} className="scale-90" />
                      <span className="text-[11px] leading-tight whitespace-nowrap text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                        {STRIP_LABELS[category.slug] ?? category.title}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </nav>
          </TextsReveal>
        </Container>
      </section>

      {/* THE PAPER CHAPTER: the reading body (trio, filmstrip, sheet) on
          forced light inside the cinema page — the ratified chapter grammar
          (pricing precedent). The strip above straddles into its top edge. */}
      <PaperChapter>
      {/* ── Start here: the guided path, media-led (the elevation layer: real
             photo compositions + the float shadow; the sheet below stays
             hairline-flat on purpose — featured vs index). The success-green
             numerals stay the page's accent moment. Top padding clears the
             straddling strip. ────────────────────────────────────────────── */}
      <section className="pt-24 pb-14 sm:pt-28 sm:pb-16">
        <Container>
          <Reveal className="flex flex-col gap-1.5">
            <h2
              data-mkt-reveal
              className="font-heading text-2xl tracking-tight sm:text-3xl"
            >
              Start here
            </h2>
            <p
              data-mkt-reveal
              style={{ "--i": 1 } as CSSProperties}
              className="text-sm text-muted-foreground"
            >
              Three guides that answer most first questions.
            </p>
          </Reveal>
          <Reveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {startHere.map((article, index) => (
              <Link
                key={article.slug}
                data-mkt-reveal
                style={{ "--i": index } as CSSProperties}
                href={`/help/${article.slug}`}
                className="group mkt-learn flex flex-col overflow-hidden rounded-2xl border bg-card shadow-float ring-1 ring-foreground/5 transition-[transform,border-color] duration-200 ease-emphasis hover:-translate-y-0.5 hover:border-foreground/25 active:scale-[0.99] motion-reduce:transition-none"
              >
                <span className="relative flex h-32 items-center justify-center border-b bg-muted/40">
                  {index === 0 && <MiniAlbumScene />}
                  {index === 1 && <CreateScene />}
                  {index === 2 && <ReelScene />}
                </span>
                <span className="flex flex-1 flex-col gap-2.5 p-6">
                  <span className="font-mono text-xs tracking-wider text-success">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-lg">
                    {article.frontmatter.title}
                  </h3>
                  <span className="flex-1 text-sm text-pretty text-muted-foreground">
                    {article.frontmatter.description}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                    Read the guide
                    <LearnChevron />
                  </span>
                </span>
              </Link>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* ── The numbers: THE FILMSTRIP — hard limits printed on a strip of
             film (perforated edges, framed cells, digits popping in), every
             value from the real constants, every frame a link. ────────────── */}
      <section className="border-y bg-muted/30">
        <Container className="py-14 sm:py-16">
          <Reveal className="flex flex-col gap-1.5">
            <h2
              data-mkt-reveal
              className="font-heading text-2xl tracking-tight sm:text-3xl"
            >
              The numbers
            </h2>
            <p
              data-mkt-reveal
              style={{ "--i": 1 } as CSSProperties}
              className="text-sm text-muted-foreground"
            >
              The limits at a glance, rendered from the product itself.
            </p>
          </Reveal>
          <div className="mt-6">
            <HelpFactsBand facts={facts} />
          </div>
        </Container>
      </section>

      {/* ── The index sheet: every guide, in order (the printed-index layer:
             hairline grid, ghost folio numerals at display scale, emblems at
             folio size; deliberately flat next to the elevated trio). ─────── */}
      <section className="py-16 sm:py-20">
        <Container>
          <Reveal className="flex flex-col gap-1.5">
            <h2
              data-mkt-reveal
              className="font-heading text-2xl tracking-tight sm:text-3xl"
            >
              Every guide, in order
            </h2>
            <p
              data-mkt-reveal
              style={{ "--i": 1 } as CSSProperties}
              className="text-sm text-muted-foreground"
            >
              The whole product, indexed. Scan the sheet, or search from
              anywhere with the palette.
            </p>
          </Reveal>

          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border ring-1 ring-foreground/5 lg:grid-cols-2">
            {groups.map(({ category, articles }, groupIndex) => {
              const wide = category.slug === "troubleshooting";
              return (
                <div
                  key={category.slug}
                  id={category.slug}
                  className={cn(
                    "group relative scroll-mt-[calc(var(--mkt-header-h,4rem)+1.5rem)] bg-card p-7 sm:p-8",
                    wide && "lg:col-span-2",
                  )}
                >
                  {/* The ghost folio: the category number at print-index scale
                      (mono per the ruling; decorative ink at 5%). */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-3 right-6 font-mono text-6xl leading-none tracking-tight text-foreground/[0.05] tabular-nums select-none sm:text-7xl"
                  >
                    {String(groupIndex + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-4">
                    <CategoryEmblem slug={category.slug} size="lg" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                        {articles.length}{" "}
                        {articles.length === 1 ? "guide" : "guides"}
                      </p>
                      <h3 className="mt-0.5 font-heading text-xl sm:text-2xl">
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

      </PaperChapter>

      {/* ── The multi-path close: back in the cinema room (the dark bookend;
             contact first, then onward per the de-silo ruling). ───────────── */}
      <section>
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

// ── The Start-here scenes (page furniture, aria-hidden via their wrapper) ─────
// Real manifest photos in miniature product frames: the one place the index
// carries media, so the featured layer glows against the hairline sheet.

function MiniAlbumScene() {
  const tiles = ["party-balloons", "wedding-golden", "concert-confetti"].map(
    (id) => marketingImage(id),
  );
  return (
    <span aria-hidden className="relative flex items-center">
      {tiles.map((img, i) => (
        <span
          key={img.id}
          className={cn(
            "relative block size-16 overflow-hidden rounded-lg shadow-sm ring-1 ring-foreground/10",
            i === 0 && "-rotate-6",
            i === 1 && "z-10 -mx-2.5 scale-110",
            i === 2 && "rotate-6",
          )}
        >
          <Image
            src={img.src}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </span>
      ))}
      {/* The QR chip: how all of it arrived. */}
      <span className="absolute -right-4 -bottom-2 z-20 flex size-7 items-center justify-center rounded-md border bg-card shadow-sm">
        <span className="relative block size-3.5">
          <span className="absolute top-0 left-0 size-[5px] rounded-tl-[2px] border-[1.5px] border-r-0 border-b-0 border-foreground" />
          <span className="absolute top-0 right-0 size-[5px] rounded-tr-[2px] border-[1.5px] border-b-0 border-l-0 border-foreground" />
          <span className="absolute bottom-0 left-0 size-[5px] rounded-bl-[2px] border-[1.5px] border-t-0 border-r-0 border-foreground" />
          <span className="absolute right-0 bottom-0 size-1 rounded-[1px] bg-foreground" />
        </span>
      </span>
    </span>
  );
}

function CreateScene() {
  return (
    <span aria-hidden className="relative flex items-center justify-center">
      <span className="absolute size-10 -translate-x-3.5 -rotate-6 rounded-[10px] border-2 border-dashed border-foreground/25" />
      <span className="relative z-10 flex size-10 translate-x-1.5 rotate-3 items-center justify-center rounded-[10px] border-2 border-foreground bg-card shadow-sm">
        <span className="absolute h-0.5 w-4 rounded-full bg-foreground" />
        <span className="absolute h-4 w-0.5 rounded-full bg-foreground" />
      </span>
    </span>
  );
}

function ReelScene() {
  const poster = marketingImage("wedding-petals");
  return (
    <span aria-hidden className="relative flex items-center">
      <span className="block h-16 w-11 -rotate-6 rounded-md border-2 border-foreground/20 bg-card" />
      <span className="relative z-10 -mx-2 block h-[74px] w-[52px] overflow-hidden rounded-md shadow-sm ring-1 ring-foreground/10">
        <Image
          src={poster.src}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-6 items-center justify-center rounded-full bg-foreground/55">
            <span className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-card" />
          </span>
        </span>
      </span>
      <span className="block h-16 w-11 rotate-6 rounded-md border-2 border-foreground/20 bg-foreground/10" />
    </span>
  );
}
