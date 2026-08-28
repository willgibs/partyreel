import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { CopyButton } from "@/components/marketing/press/copy-button";
import { PressSheet } from "@/components/marketing/press/press-sheet";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { CinemaChapter } from "@/components/marketing/system/cinema-chapter";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { SectionShell } from "@/components/marketing/system/section-shell";
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
    "The Partyreel press kit: brand marks, the boilerplate in three lengths, and a fact sheet. Everything on one page, ready to quote and ready to publish.",
  alternates: { canonical: "/press" },
};

/**
 * THE PRESS PAGE, rebuilt as THE CONTACT SHEET (Will's ruling, 2026-08-28, over the
 * specimen-sheet alternative: "focusing press around the assets and quick hit points").
 * The explored range lives at /design/c/press-identity.
 *
 * The page it replaced was the site's last wireframe-grade surface: five centered reading
 * columns, reveal="none" on every section so nothing moved below the fold, and a hero
 * copy-pasted verbatim from /careers and /about.
 *
 * ★ NO BRAND-GUIDELINES SECTION, by ruling. Clear space, minimum size and misuse plates
 * are internal brand-book material; a journalist needs the assets, the words, and the
 * facts. The two usage points that ARE press business (how to write the name, and that
 * quoting needs no permission) ship as quick hits beside the copy they govern, not as a
 * section. Do not reintroduce a guidelines block without a new ruling.
 *
 * ★ THE MASTHEAD IS LEFT-ALIGNED, on purpose. /about, /careers and /press all opened with
 * the identical centered "careers idiom" hero; breaking it here is structural, not
 * cosmetic. The H1 keeps the ruled marketing ladder.
 *
 * Content single-source is constants/press.ts, shared with the /llms.txt builders, so the
 * quotable version of "what Partyreel is" cannot fork between humans and crawlers.
 */

/** Mono is for DATA, not scaffolding (the R6 numerals-only ruling, applied here to the
 *  question it was raised on): a year, a domain, an address and a price are tabular; the
 *  labels and the prose are Inter. */
const isTabular = (value: string) => /^[\d$]|@|\.com/.test(value);

export default function PressPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Press & brand", href: "/press" },
        ]}
      />

      <section>
        <Container className="py-20 sm:py-28">
          <TextsReveal className="flex flex-col gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              Press &amp; brand
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Take what you need.
            </h1>
            <p
              className="mkt-line max-w-xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              The boilerplate, the fact sheet, and the brand files, ready to
              quote and ready to publish. Anything else, write to{" "}
              {SUPPORT_EMAIL}.
            </p>
          </TextsReveal>
          {/* Outside TextsReveal: .mkt-line forces display:block and would break this
              flex row (the standing marketing.css landmine). */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <a href={PRESS_KIT_ZIP} download>
                Download the kit
                <span className="ml-1 font-mono text-[11px] opacity-60">
                  {PRESS_KIT.length} files, {formatKitBytes(PRESS_KIT_BYTES)}
                </span>
              </a>
            </Button>
            <CopyButton
              value={PRESS_BOILERPLATE}
              label="Copy the boilerplate"
              className="h-11 px-4 text-sm"
            />
          </div>
        </Container>
      </section>

      <CinemaChapter>
        <PressSheet />
      </CinemaChapter>

      <SectionShell reveal="none">
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
                Whole or in part, edited to fit your piece. No permission needed
                and no link required, though a link is always welcome.
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
      </SectionShell>

      <SectionShell reveal="none" className="border-t">
        <div className="mx-auto max-w-3xl">
          <Eyebrow>The fact sheet</Eyebrow>
          <dl className="mt-6 divide-y">
            {PRESS_FACTS.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:gap-8"
              >
                <dt className="w-36 shrink-0 text-sm font-medium">{label}</dt>
                <dd
                  className={cn(
                    "text-sm text-pretty text-muted-foreground",
                    isTabular(value) && "font-mono text-[13px]",
                  )}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </SectionShell>

      <SectionShell reveal="none" className="border-t">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            Need something that is not here?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Interviews, higher-resolution assets, or a walkthrough of the
            product. Every note gets a reply, usually within a day.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
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
        </div>
      </SectionShell>
    </>
  );
}
