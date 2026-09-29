"use client";

import Link from "next/link";

import { Gather } from "@/app/(marketing)/(cinema)/about/gather";
import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  ABOUT_CAREERS,
  ABOUT_CONVICTIONS,
  ABOUT_HERO,
  ABOUT_LEDGER,
  ABOUT_STORY,
} from "@/lib/constants/about";
import { IS_HIRING } from "@/lib/constants/careers";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

import { FactsSection, KitBand, KitChapter, KitLine } from "./kit";
import { stopLinks } from "./scene";

/**
 * /about AS IT SHIPS, WITH ONE SLOT OPEN: after the six convictions, and in
 * the close. Everything else is `about/page.tsx`'s composition quoted, its
 * classes verbatim (the hero's display lockup and its clearance, the gather on
 * the cut, the story, the ledger, the careers close), inside the `(cinema)`
 * group's own wrapper and under its header and footer, so "No kit, About as
 * today" is production and every other option is production plus the kit.
 * The analytics attributes are left off: a drawing reports nothing.
 *
 * ★ THE HEADER IS PINNED TO THE PAGE'S TOP, NOT STICKY. It hides while a
 * reader scrolls down and fades its glass in once scrolled, and it reads the
 * LAB page's scroll, not the frame's: in a frame opened at the kit, a sticky
 * bar would sit over the paper wearing whatever the lab's scroll left it in.
 * Held at the top, it is the bar a reader scrolling down has already lost.
 *
 * ★ THE HEADER AND THE FOOTER ARE INERT: a nav panel and the demo's modal
 * portal onto the lab's document, never the frame's.
 */

export type KitForm = "chapter" | "band" | "line" | "none";
export type FactsForm = "none" | "strip";

/** The header's scroll postures, undone for a drawing (the header note). */
const PINNED =
  "[data-ap-page] header{position:relative!important;translate:none!important}[data-ap-page] header[data-stuck]>[aria-hidden]:first-child{opacity:0!important}";

export function AboutDrawing({
  kit,
  facts,
}: {
  kit: KitForm;
  facts: FactsForm;
}) {
  const inKit = kit === "chapter" || kit === "band";
  const strip = facts === "strip";
  // The frame opens on what the answer changes: the kit's block, else the
  // facts on their own, else the close (where the line lives, or nothing).
  const focus = inKit ? "kit" : strip ? "facts" : "close";

  return (
    <div
      data-ap-page=""
      onClickCapture={stopLinks}
      // The (cinema) group's wrapper, as `(cinema)/layout.tsx` sets it; the
      // ground is painted here too, since the frame's body sits outside it.
      className="dark flex min-h-screen flex-col overflow-x-clip bg-background text-foreground"
      data-mkt=""
      data-mkt-skin="cinema"
    >
      <style>{PINNED}</style>
      <div inert>
        <MarketingHeader skin="cinema" overlay />
      </div>
      <main className="flex-1">
        <PageHero
          className="-mt-[var(--mkt-header-h)] pt-28 pb-16 sm:pt-40 sm:pb-20 lg:pt-44"
          scale="display"
          eyebrow={ABOUT_HERO.eyebrow}
          heading={ABOUT_HERO.wordmark}
          subhead={ABOUT_HERO.subhead}
          actions={
            <>
              <Button asChild size="cta">
                <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
              </Button>
              <Button asChild size="cta" variant="outline">
                <Link href={ABOUT_HERO.secondaryHref}>
                  {ABOUT_HERO.secondaryLabel}
                </Link>
              </Button>
            </>
          }
        />

        <Gather />

        <PaperChapter compressStacked={false}>
          <SectionShell
            data-ap-story=""
            reveal="none"
            className="mkt-gather-clear pb-16 sm:pb-20"
          >
            <div className="mx-auto max-w-[36rem]">
              <Eyebrow>{ABOUT_STORY.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-heading text-prose text-balance">
                {ABOUT_STORY.heading}
              </h2>
              <div className="mt-6 flex flex-col gap-5">
                {ABOUT_STORY.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="text-copy text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </SectionShell>

          <SectionShell
            reveal="none"
            className="pt-4 pb-20 sm:pb-24"
            containerClassName="max-w-4xl"
          >
            <div className="max-w-2xl">
              <Eyebrow>{ABOUT_LEDGER.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-heading text-prose text-balance">
                {ABOUT_LEDGER.heading}
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                {ABOUT_LEDGER.lead}
              </p>
            </div>

            <ul className="mt-10 border-t sm:mt-12">
              {ABOUT_CONVICTIONS.map(({ title, body, linkLabel, href }) => (
                <li
                  key={href}
                  className="grid gap-x-10 gap-y-2 border-b py-7 transition-[border-color] duration-150 last:border-b-0 hover:border-b-[color-mix(in_oklab,var(--foreground)_22%,transparent)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:py-8"
                >
                  <h3 className="font-heading text-subhead">{title}</h3>
                  <div>
                    <p className="text-copy text-pretty text-muted-foreground">
                      {body}
                    </p>
                    <LearnMoreLink
                      href={href}
                      className="mt-2 rounded-[2px] py-1 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                    >
                      {linkLabel}
                    </LearnMoreLink>
                  </div>
                </li>
              ))}
            </ul>
          </SectionShell>

          {kit === "chapter" ? <KitChapter facts={strip} /> : null}
          {kit === "band" ? <KitBand facts={strip} /> : null}
          {!inKit && strip ? <FactsSection focus={focus === "facts"} /> : null}

          <section
            className="border-t"
            data-ap-close=""
            data-ap-focus={focus === "close" ? "" : undefined}
          >
            <Container className="flex flex-col items-center gap-5 py-20 text-center sm:py-24">
              <h2 className="max-w-2xl font-heading text-prose text-balance">
                {ABOUT_CAREERS.heading}
              </h2>
              <p className="max-w-xl text-pretty text-muted-foreground">
                {IS_HIRING ? ABOUT_CAREERS.hiring : ABOUT_CAREERS.notHiring}
              </p>
              <Button asChild size="cta" variant="outline" className="mt-1">
                <Link href={ABOUT_CAREERS.href}>
                  {IS_HIRING
                    ? ABOUT_CAREERS.linkLabelHiring
                    : ABOUT_CAREERS.linkLabelNotHiring}
                </Link>
              </Button>
              {kit === "line" ? <KitLine /> : null}
            </Container>
          </section>
        </PaperChapter>
      </main>
      <div inert>
        <MarketingFooter />
      </div>
    </div>
  );
}
