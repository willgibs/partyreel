import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { ChipToc } from "@/components/marketing/reading/chip-toc";
import {
  ARTICLE_BODY_ID,
  ArticleToc,
} from "@/components/marketing/reading/article-toc";
import { HeadingAnchorsDelegate } from "@/components/marketing/reading/heading-anchors";
import {
  HeadingAnchor,
  HEADING_SCROLL_MT,
} from "@/components/marketing/reading/heading-anchor";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import {
  LEGAL_DOCUMENTS,
  LEGAL_RELATED,
  legalPlainText,
  legalStatusLine,
  type LegalDocId,
  type LegalSection,
} from "@/lib/constants/legal";
import { readingTime } from "@/lib/content/collection";
import { cn } from "@/lib/utils";

import { LegalBlocks } from "./legal-blocks";

/**
 * THE LEGAL DOCUMENT SHELL (the legal round, 2026-09-01; succeeds the R5
 * LegalArticle). Privacy + Terms share this one composition so the two read as
 * one family and neither page carries layout of its own.
 *
 * ── THE ARC IS THE (cinema) GROUP'S ──
 * Cinema hero, paper body, ink footer: the utility-page rhythm (Will's ruling,
 * 2026-08-28, marketing-content.md). The page takes it by living in the
 * (cinema) group and riding ONE PaperChapter, exactly as /help and /about do;
 * the dark overlay nav and the #040404 chrome arrive with the group. Nothing
 * here is built from the paper side (the (spotlight) lesson).
 *
 * ── THE TWO REGISTERS, KEPT ──
 * Every section still carries its "In short" line beside the formal text: you
 * should never need a law degree to know where your photos stand. The line is
 * ink and the body is muted, so the eye lands on the summary first.
 *
 * ── THE STRADDLE CARD IS THE META, NOT A HEADER ──
 * Version, status and reading time ride the paper card that straddles the
 * cinema→paper cut (the help article's "In short" move). It is a <div> on
 * purpose: ArticleToc measures the FIRST <header> for its scroll offset, and
 * that must stay the overlay MarketingHeader. The card also retires the R5
 * MonoCaption status line: mono holds data, Inter carries labels (the R6 mono
 * ruling), and a version line is a label with one number in it.
 *
 * ── THE RAIL SCROLLS WITHIN ITSELF ──
 * Twenty-two entries at ~34px each do not fit a laptop viewport under the
 * sticky offset, so the nav takes a max-height and its own overflow. The
 * reading spine is the list's own hairline, so scrolling the nav cannot break it.
 *
 * ── THE COLUMN IS CENTRED ON THE HERO'S AXIS ──
 * A three-track grid (gutter, 42rem column, rail) keeps the reading column,
 * the straddle card and the centred hero on ONE axis; the help layout's
 * flush-left row would leave a centred title floating over a left-hung column.
 */
export function LegalDocument({
  doc,
  sections,
}: {
  doc: LegalDocId;
  sections: LegalSection[];
}) {
  const meta = LEGAL_DOCUMENTS[doc];
  const pending = meta.status !== "effective";
  const headings = sections.map((section) => ({
    id: section.id,
    text: section.navLabel ?? section.title,
  }));
  const minutes = readingTime(legalPlainText(sections));

  return (
    <>
      {/* The negative top margin slides the hero UNDER the overlay header (a
          sticky header still takes its flow height), so the room starts at the
          very top; the top padding clears the bar again. cinema-hero.tsx's
          mechanism, the /about and /press values. */}
      <PageHero
        className="-mt-[var(--mkt-header-h)] pt-28 pb-10 sm:pt-36 sm:pb-12"
        scale="lg"
        eyebrow="Legal"
        heading={meta.title}
        subhead={meta.description}
      />

      {/* THE STRADDLE: the meta card arrives out of the dark and lands on the
          desk. Negative bottom margin overhangs the chapter's top padding by
          40px at every width (below lg the chapter compresses the section to
          py-14, which still clears it: help ships this exact pairing). */}
      <section>
        <Container>
          <div className="surface-paper relative z-10 mx-auto -mb-10 max-w-2xl">
            <div className="rounded-2xl border bg-card p-5 shadow-float ring-1 ring-foreground/5 sm:p-6">
              <p className="text-sm text-muted-foreground tabular-nums">
                {legalStatusLine(meta)} &middot; {minutes}
              </p>
              {pending && (
                <div className="mt-4 border-t pt-4" aria-label="Review status">
                  <Eyebrow>Before launch</Eyebrow>
                  <p className="mt-1.5 text-sm leading-6 text-pretty text-foreground">
                    This is the complete text, pending counsel review before it
                    takes effect. The plain-language summary beside each section
                    describes how Partyreel works today, and it stays right there
                    once the formal text is final.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <PaperChapter>
        <section className="pt-16 pb-12 sm:pt-20 sm:pb-16">
          <Container>
            <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[1fr_minmax(0,42rem)_1fr] lg:gap-x-8">
              <div aria-hidden className="hidden lg:block" />

              <div className="mx-auto w-full max-w-2xl min-w-0">
                <ChipToc headings={headings} className="mb-8" />

                <article id={ARTICLE_BODY_ID} className="divide-y">
                  {sections.map((section, index) => (
                    <section
                      key={section.id}
                      id={section.id}
                      className={cn("py-8 first:pt-0", HEADING_SCROLL_MT)}
                    >
                      <div className="flex items-baseline gap-3">
                        {/* The numeral stays mono: it is a datum, aligned in a column. */}
                        <span
                          aria-hidden
                          className="font-mono text-xs tracking-wider text-muted-foreground tabular-nums"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h2 className="group font-heading text-xl text-balance sm:text-2xl">
                          {section.title}
                          <HeadingAnchor id={section.id} />
                        </h2>
                      </div>
                      <p className="mt-3 border-l-2 pl-4 text-sm leading-6 font-medium text-pretty">
                        <Eyebrow className="mr-1.5">In short</Eyebrow>
                        {section.summary}
                      </p>
                      <LegalBlocks
                        sectionId={section.id}
                        blocks={section.blocks}
                      />
                    </section>
                  ))}
                </article>
                {/* One delegated island upgrades every heading's copy-link anchor. */}
                <HeadingAnchorsDelegate />

                <section className="mt-12 border-t pt-10">
                  <h2 className="font-heading text-xl tracking-tight">
                    Read next
                  </h2>
                  <ul className="mt-5 flex flex-col gap-3.5">
                    {LEGAL_RELATED[doc].map((item) => (
                      <li key={item.href}>
                        <LearnMoreLink
                          href={item.href}
                          className="text-foreground"
                        >
                          {item.label}
                        </LearnMoreLink>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* aside self-stretch is LOAD-BEARING (the help page's catch):
                  items-start would collapse the rail to content height and
                  leave sticky no runway. */}
              <aside className="hidden lg:block lg:self-stretch">
                <nav
                  aria-label="On this page"
                  className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-2"
                >
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                    On this page
                  </p>
                  <ArticleToc
                    headings={headings}
                    progress={{ targetId: ARTICLE_BODY_ID }}
                  />
                </nav>
              </aside>
            </div>
          </Container>
        </section>
      </PaperChapter>
    </>
  );
}
