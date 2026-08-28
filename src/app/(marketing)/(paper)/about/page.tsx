import type { Metadata } from "next";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperHero } from "@/components/marketing/system/paper-hero";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import {
  ABOUT_ARGUMENT,
  ABOUT_CLOSE,
  ABOUT_CONVICTIONS,
  ABOUT_HERO,
  ABOUT_LEDGER,
  ABOUT_META,
} from "@/lib/constants/about";
import { SITE_THESIS } from "@/lib/constants/marketing-voice";

import { Gather } from "./gather";

export const metadata: Metadata = {
  title: ABOUT_META.title,
  description: ABOUT_META.description,
  alternates: { canonical: "/about" },
};

/**
 * THE CONVICTION PAGE.
 *
 * The page's job (R5 2026-08-26, extended 2026-08-28) and all its copy live in
 * lib/constants/about.ts, which is where the content fences reach it. This file
 * owns the composition only.
 *
 * ── WHY THE PAGE IS SHAPED LIKE THIS ──
 *
 * About cannot use team, traction, testimonials or counts: three separate
 * rulings and two mechanical fences take all of them away. That leaves exactly
 * two currencies, CONVICTION and CHECKABLE TRUTH, which happen to be the only
 * two an About page was ever any good at. So the page argues in ink, goes dark
 * once to SHOW rather than claim, and makes every conviction a link to the page
 * that proves it. The old version promised "you can verify each one" and gave
 * the reader nothing to click; here the promise IS the architecture.
 *
 * Registers run quiet / medium / LOUD / medium / quiet, with the one loud beat
 * at ~40% depth. Alignment runs centred, left, centred (dark), left, centred:
 * the page opens and closes centred and does its work left, which is legible at
 * thumbnail size and is the biggest structural break from the four consecutive
 * centred blocks this replaced.
 *
 * Tempo is AUTHORED, not uniform. Five sections at a metronomic py-20 sm:py-24
 * is the thing that reads as a template, so the argument gives back its bottom
 * padding (the cut answers it, and two full paddings meeting at a cut read as
 * dead space) and the close takes a long run-up (the page has finished arguing;
 * the masthead gets a field of paper to arrive into).
 *
 * ── NO CTA BAND, ON PURPOSE ──
 *
 * marketing-footer.tsx states the rule: "The footer's one conversion action, and
 * the only one a (paper) route gets: CtaBand sits above the footer on cinema
 * pages but nowhere on /about, /press, /careers or a 404." The old page's
 * Press / Careers / Contact link row went for the same reason: it reproduced the
 * footer's Resources column about 200px above the actual footer.
 *
 * ── NO MONO ANYWHERE ──
 *
 * The 01-06 index numerals are gone. Careers owns numbered principle rows and
 * the legal shell owns numbered 01-07 sections; a third instance is the site
 * sounding like it has one idea. That also removes the page's last mono, which
 * the R6 ruling (mono is numerals and tabular alignment ONLY) welcomes: the
 * ledger's "30 days" rides Inter's proportional figures because nothing on this
 * page aligns in a column. No tabular-nums, no font-mono, no MonoCaption here.
 */
export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />

      {/* bordered={false}: the shared paper idiom ships a full-bleed hairline
          under the hero, but this page's whole structure is ONE plane change,
          and a competing division 800px above the cut dilutes it. The stagger
          retune is local (custom properties inherit, so the token set here
          reaches the .mkt-line children): 40ms lands the opening statement in
          120ms flat, which is a flinch on a page whose argument is patience. */}
      <PaperHero
        bordered={false}
        className="[--mkt-lines-stagger:90ms]"
        eyebrow={ABOUT_HERO.eyebrow}
        heading={ABOUT_HERO.heading}
        subhead={ABOUT_HERO.subhead}
      />

      {/* THE ARGUMENT. Left-aligned, and INK rather than muted: the footer round
          settled that muted body copy reads as small print, and the fix was to
          spend the scale and the ink. Only mechanism lines and captions are
          muted on this page. The rule above the header is inset to the PROSE
          measure, never the Container, so it ends where the argument ends. */}
      <SectionShell reveal="none" className="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div className="mx-auto max-w-[36rem]">
          <h2 className="border-t pt-3 font-heading text-2xl text-balance sm:text-3xl">
            {SITE_THESIS}
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            {ABOUT_ARGUMENT.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="text-[17px] leading-8 text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </SectionShell>

      <Gather />

      {/* THE CONVICTIONS LEDGER. A ul, not an ol, and no entrance: the footer
          round ruled that a surface reached ON PURPOSE should not be staggered
          in, and a conviction ledger is read on purpose. */}
      <SectionShell
        reveal="none"
        className="pt-16 pb-24 sm:pt-20"
        containerClassName="max-w-4xl"
      >
        <div className="max-w-2xl">
          <Eyebrow>{ABOUT_LEDGER.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-heading text-2xl text-balance sm:text-3xl">
            {ABOUT_LEDGER.heading}
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            {ABOUT_LEDGER.lead}
          </p>
        </div>

        <ul className="mt-10 border-t sm:mt-12">
          {ABOUT_CONVICTIONS.map(({ title, body, linkLabel, href }) => (
            <li
              // Per-row border-b, never divide-y: divide-y hangs the rule on the
              // NEXT sibling, so group-hover would darken the line above the row
              // being read instead of the one under it.
              key={href}
              className="grid gap-x-10 gap-y-2 border-b py-7 transition-[border-color] duration-150 last:border-b-0 hover:border-b-[color-mix(in_oklab,var(--foreground)_22%,transparent)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:py-8"
            >
              {/* No text-balance on a 2-4 word heading in a grid cell: balance
                  can pick a worse break than the natural one at that length. */}
              <h3 className="font-heading text-xl sm:text-2xl">{title}</h3>
              <div>
                <p className="text-[15px] leading-7 text-pretty text-muted-foreground">
                  {body}
                </p>
                {/* Only this column is a link, so the h3 deliberately does not
                    move on hover: moving it would lie about what is clickable.
                    -my-1 py-1 lifts the 24px line box to a 32px hit target
                    (the footer's trick), which is why the focus outline takes
                    offset-2 rather than the usual 4. */}
                <LearnMoreLink
                  href={href}
                  className="-my-1 mt-3 rounded-[2px] py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  {linkLabel}
                </LearnMoreLink>
              </div>
            </li>
          ))}
        </ul>

        {/* A short terminal mark, not a full-width rule: a full-width closing
            rule makes a page feel like it continues. */}
        <div className="mt-10 w-16 border-t" />
      </SectionShell>

      {/* THE CLOSE. Reading order is link, then the masthead, then the caption:
          a page that ends on a link ends on an errand, a page that ends on its
          own name ends on a conviction. */}
      <section className="pt-8 pb-32 sm:pb-40">
        <Container className="flex flex-col items-center gap-10 text-center">
          <LearnMoreLink href={ABOUT_CLOSE.linkHref}>
            {ABOUT_CLOSE.linkLabel}
          </LearnMoreLink>

          {/* The masthead. text-[length:...] because Tailwind v4 must be told
              whether a clamp() in text-* is a size or a color, and leading-[0.85]
              because at this scale 0.9 leaves a gap that reads as an accidental
              margin. py keeps the tight line box from clipping the l ascender
              and the y descender; the negative inline start is optical centering
              (the P carries a large left sidebearing and -0.03em pulls the final
              advance in). The .mkt-name recipe owns the tracking settle, and its
              REST state is font-heading's own -0.03em, so reduced motion gets
              the correct wordmark with nothing written; no-JS holds the open
              tracking, which reads as a wordmark set loose, never as broken. */}
          <Reveal threshold={0.4}>
            <p className="mkt-name [margin-inline-start:-0.045em] py-[0.08em] font-heading text-[length:clamp(3.75rem,13vw,10rem)] leading-[0.85] whitespace-nowrap">
              {ABOUT_CLOSE.wordmark}
            </p>
          </Reveal>

          <p className="max-w-xl text-[15px] leading-7 text-pretty text-muted-foreground sm:text-base">
            {ABOUT_CLOSE.caption}
          </p>
        </Container>
      </section>
    </>
  );
}
