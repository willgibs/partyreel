import { ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { CopyButton } from "@/components/marketing/press/copy-button";
import { PressSection } from "@/components/marketing/press/press-section";
import { PressSheet } from "@/components/marketing/press/press-sheet";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_FACTS,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
  formatKitBytes,
} from "@/lib/constants/press";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Press",
  description:
    "The Partyreel press kit: brand marks, an app icon, a share card and a QR code, plus the boilerplate in two lengths and a fact sheet. Ready to quote, ready to publish.",
  alternates: { canonical: "/press" },
};

/**
 * THE PRESS PAGE, built as THE CONTACT SHEET (Will's ruling, 2026-08-28, over the
 * specimen-sheet alternative: "focusing press around the assets and quick hit points").
 * The explored range lives at /design/c/press-identity.
 *
 * ★ THIS PAGE LIVES IN (cinema), NOT (paper), and the reason is the NAV. A dark hero has
 * to be paired with a dark nav (Will), and the header skin is chosen by the group layout,
 * which a page cannot override. /help set the precedent for exactly this: a resource page
 * in the cinema group so the dark overlay header runs seamlessly into its hero, with a
 * PaperChapter carrying the body. The route path is unchanged; only the chrome is.
 *
 * ★ THE SHAPE: dark hero, then everything else on paper, then the always-dark footer. The
 * sheet OPENS the paper body rather than riding in the dark with the hero, so the body
 * reads as one continuous paper surface instead of two dark blocks with a gap.
 *
 * ★ THE BODY IS A STICKY TWO-COLUMN SPINE: Assets / Words / Fact sheet pinned on the left,
 * their content on the right. It replaced a narrow centered reading column that left the
 * page feeling emptier than its own hero. See PressSection for the sticky-in-grid trap.
 *
 * ★ NO BRAND-GUIDELINES SECTION, by ruling. Clear space, minimum size and misuse plates
 * are internal brand-book material. The two usage points that ARE press business ship as
 * quick hits beside the copy they govern. Do not reintroduce a guidelines block.
 *
 * Content single-source is constants/press.ts, shared with the /llms.txt builders, so the
 * quotable version of "what Partyreel is" cannot fork between humans and crawlers.
 */

/** Mono is for DATA, never for scaffolding (the R6 numerals-only ruling, applied here to
 *  the surface that raised it): a year and a price are tabular. Labels, descriptors and
 *  addresses are Inter, and the addresses are links rather than strings. */
const isTabular = (value: string) => /^[\d$]/.test(value);

/** The two fact rows that are addresses rather than prose. Built from the row's own value
 *  so there is no second copy of the domain to drift. */
function factHref(label: string, value: string): string | null {
  if (label === "Website") return `https://${value}`;
  if (label === "Press contact") return `mailto:${value}`;
  return null;
}

/**
 * The page title. Hoisted because it is a TASTE CALL Will may want to keep turning, and
 * it should be one line to change rather than a hunt through the JSX.
 *
 * "Take what you need" was the first cut; the note on it was that the concision is right
 * but the words are not quite there. "Need" rations, which is the opposite of what a
 * press kit means, so this is the generous form of the same sentence. Alternates
 * considered and left on the table: "Help yourself." (warmest, and the host's own line,
 * but it can read as "I am not helping you" on a page whose close offers help),
 * "Take it from here." (invites the writer to run with the story; a shade clever),
 * "Yours to use." (clearest, least warm).
 */
const PAGE_TITLE = "Media";

const INLINE_LINK =
  "underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

/** The pointer under a pinned heading. Icons are semantic, not decorative: the two that
 *  NAVIGATE carry the house learn-more chevron (its arms spread into an arrow on hover,
 *  keyed off the .mkt-learn ancestor), and the one that DOWNLOADS carries the same down
 *  arrow as the hero's kit button, so a glyph means the same thing everywhere here. */
const SECTION_LINK = cn(
  "mkt-learn inline-flex items-center gap-1.5 text-sm font-medium",
  INLINE_LINK,
);

export default function PressPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Press", href: "/press" },
        ]}
      />

      {/* The overlay header sits over this, so the top padding clears it (the /help hero
          idiom) rather than the header reserving space. */}
      <section>
        <Container className="flex flex-col items-center pt-24 pb-20 text-center sm:pt-28 sm:pb-24">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Press
            </Eyebrow>
            <h1
              className="mkt-line mx-auto max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              {PAGE_TITLE}
            </h1>
            <p
              className="mkt-line mx-auto max-w-xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              The boilerplate, the fact sheet, and the brand files, ready to
              quote and ready to publish. Anything else, write to{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={cn("text-foreground", INLINE_LINK)}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </TextsReveal>
          {/* Outside TextsReveal: .mkt-line forces display:block and would break this
              flex row (the standing marketing.css landmine). */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <a href={PRESS_KIT_ZIP} download>
                Download kit
                {/* The size, not the count: "how big is this" is the question a reporter
                    on a hotel connection actually has (Will). */}
                <span className="ml-1 font-mono text-[11px] opacity-60">
                  {formatKitBytes(PRESS_KIT_BYTES)}
                </span>
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 px-6 text-base"
            >
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </Container>
      </section>

      <PaperChapter>
        <PressSection
          id="assets"
          heading="Assets"
          note="Artwork, an app icon, the share card, and a code that resolves to partyreel.com."
          aside={
            <a href={PRESS_KIT_ZIP} download className={SECTION_LINK}>
              <ArrowDown aria-hidden className="size-3.5 shrink-0" />
              Download all ({formatKitBytes(PRESS_KIT_BYTES)})
            </a>
          }
        >
          <PressSheet />
        </PressSection>

        <PressSection
          id="words"
          heading="Words"
          note="Quote any of it, whole or in part. No permission needed."
          aside={
            <Link href="/contact" className={SECTION_LINK}>
              Ask a question
              <LearnChevron />
            </Link>
          }
          className="border-t"
        >
          <div className="flex max-w-2xl flex-col lg:ml-auto">
            <div className="flex items-baseline justify-between gap-4">
              <Eyebrow>The boilerplate</Eyebrow>
              <CopyButton
                value={PRESS_BOILERPLATE}
                label="Copy the boilerplate"
              />
            </div>
            <blockquote className="mt-4 border-l-2 border-foreground/20 pl-5 text-lg leading-8 text-pretty">
              {PRESS_BOILERPLATE}
            </blockquote>

            <div className="mt-10 flex items-baseline justify-between gap-4">
              <Eyebrow>The one-liner</Eyebrow>
              <CopyButton
                value={PRESS_BOILERPLATE_SHORT}
                label="Copy the one-liner"
              />
            </div>
            <p className="mt-4 text-pretty text-muted-foreground">
              {PRESS_BOILERPLATE_SHORT}
            </p>

            {/* The quick hits: the only two usage points that are press business rather
                than brand-book material, sitting beside the copy they govern. */}
            <dl className="mt-10 grid gap-6 border-t pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium">Quote it freely</dt>
                <dd className="mt-1 text-sm text-pretty text-muted-foreground">
                  Whole or in part, edited to fit your piece. No permission
                  needed and no link required, though a link is always welcome.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium">Write the name this way</dt>
                <dd className="mt-1 text-sm text-pretty text-muted-foreground">
                  Partyreel. One word, one capital P, nothing else capitalized,
                  and no &ldquo;the&rdquo; in front of it.
                </dd>
              </div>
            </dl>
          </div>
        </PressSection>

        <PressSection
          id="facts"
          heading="Fact sheet"
          note="The checkable version, for a box-out or a copy desk."
          aside={
            <Link href="/how-it-works" className={SECTION_LINK}>
              How it works
              <LearnChevron />
            </Link>
          }
          className="border-t"
        >
          {/* ★ THE SHARED RIGHT EDGE. Every section's content ends at the same right
              margin; the narrower ones simply START further right (`lg:ml-auto` against a
              width cap). Widening the content to fill the column instead would trade the
              reading measure for width the eye does not want, and the point of the spine
              is the growing gap between a pinned heading and its answer. */}
          <dl className="divide-y divide-border border-t lg:ml-auto lg:max-w-2xl">
            {PRESS_FACTS.map(({ label, value }) => {
              const href = factHref(label, value);
              return (
                // A real two-column split with a gutter down the middle, rather than the
                // value hugging a fixed-width label. The values then read as their own
                // column on the right, which is how a spec sheet is scanned: labels down
                // one edge, answers down the other (Will).
                <div
                  key={label}
                  className="grid gap-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] sm:items-baseline sm:gap-12"
                >
                  <dt className="text-sm font-medium">{label}</dt>
                  <dd
                    className={cn(
                      "text-sm text-pretty text-muted-foreground",
                      isTabular(value) && "font-mono text-[13px]",
                    )}
                  >
                    {href ? (
                      <a
                        href={href}
                        className={cn("text-foreground", INLINE_LINK)}
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </PressSection>

        {/* Centered to close: the spine resolves, and the paper-to-footer cut lands on a
            centered block rather than another left-aligned one. */}
        <section className="border-t py-20 sm:py-24">
          <Container className="flex flex-col items-center gap-5 text-center">
            <h2 className="max-w-2xl font-heading text-2xl text-balance sm:text-3xl">
              Need anything else?
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground">
              Interviews, higher-resolution assets, or a walkthrough of the
              product. Every note gets a reply, usually within a day.
            </p>
            <Button asChild size="lg" className="mt-2 h-11 px-6 text-base">
              <Link href="/contact">Send a message</Link>
            </Button>
          </Container>
        </section>
      </PaperChapter>
    </>
  );
}
