"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { CategoryEmblem } from "@/components/marketing/help/help-emblems";
import { HelpFactsBand } from "@/components/marketing/help/help-facts-band";
import { HelpPaletteProvider } from "@/components/marketing/help/help-palette";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { REPLY_LINE } from "@/lib/constants/contact";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  CATEGORIES,
  CATEGORY_CHIPS,
  FACTS,
  QUICK_LINKS,
  SEARCH_INDEX,
  START_HERE,
} from "./fixtures";
import { Hero, type WhoFirstShape } from "./who-first";
import { stopLinks } from "./vocab";

/**
 * DECISION 2: THE HUB, staged after `who-first`. The hero is drawn WEARING
 * that decision's answer (`defineExploration`'s staging rule), so a reviewer
 * sees the hub in the world they already picked; what this decision varies is
 * the category doors and whether the index stays under them.
 *
 * ★ "AS TODAY" IS /help AS IT SHIPS (help/page.tsx), redrawn from the file
 * because round one's `sheet` put the index straight under the hero, a page
 * that has not existed since the cinema move (`49e010ff`, 08-27): the four
 * quick questions and the guest line under the search, the ten-door emblem
 * strip straddling the cut, then Start here's three guides, the numbers'
 * filmstrip, every guide in order, and the dark close. Every option keeps
 * Start here and the numbers, so the tiles differ only in the doors and the
 * index. The page's in-view entrances are left out (a still drawing is the
 * state they settle on), which is why no `.mkt-line` or `data-mkt-reveal`
 * appears in the copies below.
 */
export type HubShape = "strip" | "doors" | "hybrid";

/* ── The emblem strip: ten small doors across the hero's edge ─────────────── */

function EmblemStrip() {
  return (
    <nav
      aria-label="Browse by category"
      className="surface-paper relative z-10 mx-auto mt-10 -mb-10 w-full max-w-3xl"
    >
      <div className="[scrollbar-width:none] overflow-x-auto rounded-2xl border bg-card shadow-lift ring-1 ring-foreground/5 [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max snap-x sm:grid sm:min-w-0 sm:grid-cols-10">
          {CATEGORIES.map((category, i) => (
            <a
              key={category.slug}
              href={`#${category.slug}`}
              className={cn(
                "group flex min-w-[84px] snap-start flex-col items-center gap-1 px-2 py-3 transition-colors duration-150 hover:bg-muted/60 sm:min-w-0",
                i > 0 && "border-l",
              )}
            >
              <CategoryEmblem slug={category.slug} className="scale-90" />
              <span className="text-micro leading-tight whitespace-nowrap text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                {category.stripLabel}
              </span>
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ── The big doors (round one's proposal, unchanged): four doors, six chips ── */

const FEATURED = [
  "getting-started",
  "qr-and-invites",
  "guest-experience",
  "troubleshooting",
];

function BigDoors() {
  const rest = CATEGORIES.filter((c) => !FEATURED.includes(c.slug));
  // A div, not a section: the chapter's phone compression (`[&>section]:py-14`)
  // would stack a second 56px gap between the doors and Start here.
  return (
    <div className="pt-14 sm:pt-16">
      <Container className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURED.map((slug) => {
            const category = CATEGORIES.find((c) => c.slug === slug)!;
            return (
              <a
                key={slug}
                href={`#${slug}`}
                className="flex flex-col gap-2 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5 transition-colors duration-150 hover:border-foreground/25"
              >
                <CategoryEmblem slug={slug} size="lg" />
                <h3 className="mt-1 font-heading text-subsection">
                  {category.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {category.blurb}
                </p>
              </a>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {rest.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-foreground/40 hover:text-foreground"
            >
              <CategoryEmblem slug={c.slug} className="scale-[0.55]" />
              {c.title}
            </a>
          ))}
        </div>
      </Container>
    </div>
  );
}

/* ── Start here: help/page.tsx's trio, its scenes quoted ──────────────────── */

function StartHere({ clearStrip }: { clearStrip: boolean }) {
  return (
    <section
      className={cn(
        clearStrip ? "pt-24 sm:pt-28" : "pt-14 sm:pt-16",
        "pb-14 sm:pb-16",
      )}
    >
      <Container>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-prose">Start here</h2>
          <p className="text-sm text-muted-foreground">
            Three guides that answer most first questions.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {START_HERE.map((article, index) => (
            <a
              key={article.slug}
              href={`/help/${article.slug}`}
              className="group mkt-learn flex flex-col overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 transition-[transform,border-color] duration-200 ease-emphasis hover:-translate-y-0.5 hover:border-foreground/25 active:scale-[0.99] motion-reduce:transition-none"
            >
              <span className="relative flex h-32 items-center justify-center border-b bg-muted/40">
                {index === 0 && <MiniAlbumScene />}
                {index === 1 && <CreateScene />}
                {index === 2 && <ReelScene />}
              </span>
              <span className="flex flex-1 flex-col gap-2.5 p-6">
                <span className="text-xs tracking-wider text-success tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-subsection">
                  {article.title}
                </h3>
                <span className="flex-1 text-sm text-pretty text-muted-foreground">
                  {article.description}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                  Read the guide
                  <LearnChevron />
                </span>
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── The numbers: the real filmstrip over the same constants ─────────────── */

function Numbers() {
  return (
    <section className="border-y bg-muted/30">
      <Container className="py-14 sm:py-16">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-prose">The numbers</h2>
          <p className="text-sm text-muted-foreground">
            The limits at a glance, rendered from the product itself.
          </p>
        </div>
        <div className="mt-6">
          <HelpFactsBand facts={FACTS} />
        </div>
      </Container>
    </section>
  );
}

/* ── The index: every guide, in order, help/page.tsx's sheet quoted ───────── */

function IndexSheet() {
  // Troubleshooting always closes the sheet wide; the guest lane opens wide
  // when the rest leave an odd count (nine regular panes at ten categories).
  const oddRegular = (CATEGORIES.length - 1) % 2 === 1;
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="flex flex-col gap-1.5">
          <h2 className="font-heading text-prose">Every guide, in order</h2>
          <p className="text-sm text-muted-foreground">
            The whole product, indexed. Scan the sheet, or search from anywhere
            with the palette.
          </p>
        </div>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border ring-1 ring-foreground/5 lg:grid-cols-2">
          {CATEGORIES.map((category, groupIndex) => {
            const wide =
              category.slug === "troubleshooting" ||
              (category.slug === "guest-experience" && oddRegular);
            const columns = wide || category.guides.length >= 7;
            return (
              <div
                key={category.slug}
                id={category.slug}
                className={cn(
                  "group relative bg-card p-7 sm:p-8",
                  wide && "lg:col-span-2",
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute top-3 right-6 font-heading text-chapter text-foreground/[0.06] tabular-nums select-none"
                >
                  {String(groupIndex + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center gap-4">
                  <CategoryEmblem slug={category.slug} size="lg" />
                  <div className="min-w-0">
                    <p className="text-label font-medium text-muted-foreground uppercase">
                      {category.guides.length}{" "}
                      {category.guides.length === 1 ? "guide" : "guides"}
                    </p>
                    <h3 className="mt-0.5 font-heading text-subhead">
                      {category.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-pretty text-muted-foreground">
                  {category.blurb}
                </p>
                <ul className={cn("mt-4", columns && "sm:columns-2 sm:gap-10")}>
                  {category.guides.map((title, articleIndex) => (
                    <li
                      key={title}
                      className={cn(
                        "break-inside-avoid border-t",
                        articleIndex === 0 && "border-t-0",
                      )}
                    >
                      <a
                        href="#"
                        className="group/row flex items-center gap-3 py-2.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <span className="w-5 shrink-0 text-micro text-faint tabular-nums transition-colors duration-150 group-hover/row:text-success">
                          {String(articleIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">{title}</span>
                        <ArrowRight className="size-3.5 shrink-0 -translate-x-1 text-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover/row:translate-x-0 group-hover/row:opacity-100 motion-reduce:transition-none" />
                      </a>
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
  );
}

/* ── The close: back in the dark room ─────────────────────────────────────── */

function Close() {
  return (
    <section>
      <Container className="flex flex-col items-center gap-4 py-16 text-center sm:py-20">
        <h2 className="font-heading text-prose">Still need help?</h2>
        <p className="max-w-md text-pretty text-muted-foreground">
          Can&rsquo;t find what you&rsquo;re looking for? Reach out and
          we&rsquo;ll get back to you.
        </p>
        <Button size="cta" className="mt-1">
          Contact us
        </Button>
        <p className="text-sm text-muted-foreground">{REPLY_LINE}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-6 text-sm">
          <span className="text-muted-foreground">Keep exploring:</span>
          <LearnMoreLink href="/how-it-works" className="text-foreground">
            See the loop, start to finish
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
  );
}

export function HubPreview({
  shape,
  mode,
  whoFirst,
}: {
  shape: HubShape;
  mode: "desktop" | "phone";
  whoFirst: WhoFirstShape;
}) {
  // /help is a (cinema) page: the room is dark whatever the lab wears, and the
  // body is the one paper chapter inside it.
  return (
    <div
      onClickCapture={stopLinks}
      className="dark bg-background text-foreground"
    >
      <HelpPaletteProvider
        index={SEARCH_INDEX}
        quickLinks={QUICK_LINKS}
        categories={CATEGORY_CHIPS}
      >
        <Hero
          shape={whoFirst}
          mode={mode}
          quickLinks={QUICK_LINKS}
          strip={shape === "strip" ? <EmblemStrip /> : undefined}
        />
        <PaperChapter>
          {shape !== "strip" && <BigDoors />}
          <StartHere clearStrip={shape === "strip"} />
          <Numbers />
          {shape !== "doors" && <IndexSheet />}
        </PaperChapter>
        <Close />
      </HelpPaletteProvider>
    </div>
  );
}

/* ── The Start-here scenes, quoted from help/page.tsx (page furniture) ────── */

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
            "relative block size-16 overflow-hidden rounded-lg shadow-lift ring-1 ring-foreground/10",
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
      <span className="absolute -right-4 -bottom-2 z-20 flex size-7 items-center justify-center rounded-md border bg-card shadow-lift">
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
      <span className="relative z-10 flex size-10 translate-x-1.5 rotate-3 items-center justify-center rounded-[10px] border-2 border-foreground bg-card">
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
      <span className="relative z-10 -mx-2 block h-[74px] w-[52px] overflow-hidden rounded-md shadow-lift ring-1 ring-foreground/10">
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
