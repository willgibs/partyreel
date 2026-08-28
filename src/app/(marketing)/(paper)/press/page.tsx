import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { CopyButton } from "@/components/marketing/press/copy-button";
import { PressSheet } from "@/components/marketing/press/press-sheet";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { CinemaChapter } from "@/components/marketing/system/cinema-chapter";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import {
  PRESS_BOILERPLATE,
  PRESS_BOILERPLATE_SHORT,
  PRESS_FACTS,
  PRESS_KIT,
  PRESS_KIT_BYTES,
  PRESS_KIT_ZIP,
  formatKitBytes,
} from "@/lib/constants/press";
import { SUPPORT_EMAIL } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Press & brand",
  description:
    "The Partyreel press kit: brand marks, an app icon, a share card and a QR code, plus the boilerplate in two lengths and a fact sheet. Ready to quote, ready to publish.",
  alternates: { canonical: "/press" },
};

/**
 * THE PRESS PAGE, built as THE CONTACT SHEET (Will's ruling, 2026-08-28, over the
 * specimen-sheet alternative: "focusing press around the assets and quick hit points").
 * The explored range lives at /design/c/press-identity.
 *
 * ★ THE RESOURCE-PAGE CHAPTER SHAPE (Will + the /about track, 2026-08-28): cinema hero,
 * paper body, and the always-dark footer closing it out. A short utility page does not
 * have the section count to alternate chapters cleanly the way the long marketing pages
 * do, so the dark ground bookends it instead of interrupting it. The sheet rides INSIDE
 * the hero chapter rather than forming a chapter of its own: the assets are what a
 * reporter came for, so they belong above the words, on the ground the artwork looks best
 * against. Do not re-introduce a mid-page cinema block here.
 *
 * ★ EVERY SECTION IS CENTERED, on the same rhythm. The first cut mixed a left-aligned
 * hero, a full-bleed sheet and a narrow centered body, and the width switch read as
 * jarring (Will). Prose stays left-aligned INSIDE its centered column, because centered
 * body copy is unreadable; only headers and the close are centered as text.
 *
 * ★ NO BRAND-GUIDELINES SECTION, by ruling. Clear space, minimum size and misuse plates
 * are internal brand-book material. The two usage points that are press business ship as
 * quick hits beside the copy they govern. Do not reintroduce a guidelines block.
 *
 * Content single-source is constants/press.ts, shared with the /llms.txt builders, so the
 * quotable version of "what Partyreel is" cannot fork between humans and crawlers.
 */

/** Mono is for DATA, never for scaffolding (the R6 numerals-only ruling, applied here to
 *  the surface that raised it): a year, a price, a domain and an address are tabular or
 *  code; every label and every descriptor is Inter. */
const isTabular = (value: string) => /^[\d$]/.test(value);

/** The two fact rows that are addresses rather than prose, so they become real links.
 *  Built from the row's own value so there is no second copy of the domain to drift. */
function factHref(label: string, value: string): string | null {
  if (label === "Website") return `https://${value}`;
  if (label === "Press contact") return `mailto:${value}`;
  return null;
}

export default function PressPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Press & brand", href: "/press" },
        ]}
      />

      <CinemaChapter>
        <section className="pt-20 pb-14 sm:pt-28 sm:pb-16">
          <Container className="flex flex-col items-center text-center">
            <TextsReveal className="flex flex-col items-center gap-6">
              <Eyebrow
                className="mkt-line"
                style={{ "--i": 0 } as CSSProperties}
              >
                Press &amp; brand
              </Eyebrow>
              <h1
                className="mkt-line mx-auto max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ "--i": 1 } as CSSProperties}
              >
                Take what you need.
              </h1>
              <p
                className="mkt-line mx-auto max-w-xl text-lg text-pretty text-muted-foreground"
                style={{ "--i": 2 } as CSSProperties}
              >
                The boilerplate, the fact sheet, and the brand files, ready to
                quote and ready to publish. Anything else, write to{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
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
                  Download the kit
                  <span className="ml-1 font-mono text-[11px] opacity-60">
                    {PRESS_KIT.length} files, {formatKitBytes(PRESS_KIT_BYTES)}
                  </span>
                </a>
              </Button>
              {/* Was a second "Copy" button, which Will had to press to find out what it
                  would even copy. A press page's other action is reaching a person. */}
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

        <PressSheet />
      </CinemaChapter>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl">
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
        </Container>
      </section>

      {/* The gray register (the /contact panel surface), so the fact sheet reads as a
          reference table set apart from the prose above it rather than more page. */}
      <section className="border-y bg-muted/40 py-20 sm:py-24">
        <Container>
          <div className="mx-auto max-w-2xl">
            <Eyebrow>The fact sheet</Eyebrow>
            <dl className="mt-6 divide-y divide-border">
              {PRESS_FACTS.map(({ label, value }) => {
                const href = factHref(label, value);
                return (
                  <div
                    key={label}
                    className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:gap-8"
                  >
                    <dt className="w-36 shrink-0 text-sm font-medium">
                      {label}
                    </dt>
                    <dd
                      className={cn(
                        "text-sm text-pretty text-muted-foreground",
                        isTabular(value) && "font-mono text-[13px]",
                      )}
                    >
                      {href ? (
                        <a
                          href={href}
                          className="text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
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
          </div>
        </Container>
      </section>

      {/* Centered, deliberately: left-aligning this would stack two left-aligned blocks
          back to back against the footer's own left-aligned demo invitation. */}
      <section className="py-20 sm:py-24">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="max-w-2xl font-heading text-2xl text-balance sm:text-3xl">
            Need something that is not here?
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground">
            Interviews, higher-resolution assets, or a walkthrough of the
            product. Every note gets a reply, usually within a day.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-base font-medium underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current"
            >
              {SUPPORT_EMAIL}
            </a>
            <Button asChild variant="outline">
              <Link href="/contact">Send a note</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
