import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { CinemaChapter } from "@/components/marketing/system/cinema-chapter";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import {
  ABOUT_CAREERS,
  ABOUT_CONVICTIONS,
  ABOUT_HERO,
  ABOUT_LEDGER,
  ABOUT_META,
  ABOUT_STORY,
} from "@/lib/constants/about";
import { IS_HIRING } from "@/lib/constants/careers";

import { Gather } from "./gather";

export const metadata: Metadata = {
  title: ABOUT_META.title,
  description: ABOUT_META.description,
  alternates: { canonical: "/about" },
};

/**
 * THE ABOUT PAGE. Copy and the page's job live in lib/constants/about.ts; this
 * file owns the composition only.
 *
 * ── THE ARC: DARK, THE VISUAL CARRIES THE CUT, THEN PAPER ──
 *
 * Will's second pass (2026-08-28) inverted the first build's ground. A (paper)
 * route already ends on the global ink footer, so opening on a cinema hero
 * BOOKENDS the page in dark and leaves the reading body in the middle where it
 * belongs. The gather then carries the transition on its own back rather than a
 * bare hairline doing it: the album is centred on the cut, arriving out of the
 * event and landing on the desk. That is the /help emblem-strip move, and the
 * chapter doctrine (cinema = the event, paper = the morning after) drawn
 * literally rather than announced.
 *
 * He flagged this treatment as a candidate for the other resource/utility pages
 * if it lands, which is why the dark ground is `CinemaChapter` and not a
 * one-off: press, careers and blog can take the same hero for free.
 *
 * ── WHY THE PAGE EXISTS AT ALL ──
 *
 * It was on probation ("if we can't figure it out, I plan on killing the page").
 * What earns it is the MISSION, told as a story: everyone is already a
 * photographer, and there has never been a way to get everyone's pictures into
 * one place. The convictions then land as the answer to that story instead of a
 * feature list, and each one links to the page that proves it. The old version
 * promised "you can verify each one" and gave the reader nothing to click.
 *
 * ── COMPOSITION NOTES ──
 *
 * No CtaBand and no Start-free duo: marketing-footer.tsx states that the footer
 * is the paper lane's ONE conversion action, so the close points at careers
 * instead. No mono anywhere (the R6 ruling): the ledger's "30 days" rides
 * Inter's proportional figures because nothing here aligns in a column.
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

      <CinemaChapter>
        {/* THE TITLE PAGE. The wordmark as plain display text (never the Logo
            lockup) at the page's largest scale, because an About page IS a title
            page: the header carries no argument and the story does the work.
            One Reveal drives both lines — the eyebrow rises on the standard
            grammar while the wordmark's tracking closes from open to the heading
            face's own -0.03em (the .mkt-name recipe). Different properties, so
            the two entrances compose instead of fighting. */}
        <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
          <Reveal className="flex flex-col items-center gap-6 text-center">
            <Eyebrow data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              {ABOUT_HERO.eyebrow}
            </Eyebrow>
            <p
              data-mkt-reveal
              style={{ "--i": 1 } as CSSProperties}
              className="mkt-name [margin-inline-start:-0.045em] py-[0.08em] font-heading text-[length:clamp(3.25rem,12vw,10rem)] leading-[0.85] whitespace-nowrap"
            >
              {ABOUT_HERO.wordmark}
            </p>
          </Reveal>
        </section>

        {/* The gather straddles out of the chapter: its own negative bottom
            margin ends the dark ground at the album's midline. */}
        <Gather />
      </CinemaChapter>

      {/* THE STORY. Left-aligned and INK rather than muted: the footer round
          settled that muted body copy reads as small print, and the fix was to
          spend the scale and the ink. Only mechanism lines and captions are
          muted on this page. The top padding clears the album's overhang. */}
      {/* ★ The top padding CLEARS THE ALBUM'S OVERHANG, and that is the whole
          reason it is this large. The straddle pulls the following content up
          by a percentage of the stage width, so half the album (plus a little
          frame) hangs over this section: too little padding here and the
          photographs land on top of the prose, which is exactly what the first
          pass did. It scales per breakpoint because the overhang does. */}
      <SectionShell
        reveal="none"
        className="pt-16 pb-16 sm:pt-64 sm:pb-20 lg:pt-[24rem]"
      >
        <div className="mx-auto max-w-[36rem]">
          <Eyebrow>{ABOUT_STORY.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-heading text-2xl text-balance sm:text-3xl">
            {ABOUT_STORY.heading}
          </h2>
          <div className="mt-6 flex flex-col gap-5">
            {ABOUT_STORY.paragraphs.map((paragraph) => (
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

      {/* THE CONVICTIONS. A ul, not an ol, and no entrance: the footer round
          ruled that a surface reached ON PURPOSE should not be staggered in, and
          a conviction ledger is read on purpose. */}
      <SectionShell
        reveal="none"
        className="pt-4 pb-20 sm:pb-24"
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
              // NEXT sibling, so hover would darken the line above the row being
              // read instead of the one under it.
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
                    py-1 lifts the 24px line box to a 32px hit target, which is
                    why the focus outline takes offset-2 rather than the usual 4
                    (the ring would otherwise sit well clear of the text). */}
                <LearnMoreLink
                  href={href}
                  className="mt-2 rounded-[2px] py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                >
                  {linkLabel}
                </LearnMoreLink>
              </div>
            </li>
          ))}
        </ul>
      </SectionShell>

      {/* THE CLOSE. Points at careers, not at signup: the footer directly below
          already owns the paper lane's one conversion action, and a second
          Start free here would be the same solicitation twice. The hiring claim
          is derived, never hardcoded, so it cannot outlive the open roles. */}
      <section className="border-t">
        <Container className="flex flex-col items-center gap-5 py-20 text-center sm:py-24">
          <h2 className="max-w-2xl font-heading text-2xl text-balance sm:text-3xl">
            {ABOUT_CAREERS.heading}
          </h2>
          <p className="max-w-xl text-pretty text-muted-foreground">
            {IS_HIRING ? ABOUT_CAREERS.hiring : ABOUT_CAREERS.notHiring}
          </p>
          <LearnMoreLink href={ABOUT_CAREERS.href} className="mt-1">
            {IS_HIRING
              ? ABOUT_CAREERS.linkLabelHiring
              : ABOUT_CAREERS.linkLabelNotHiring}
          </LearnMoreLink>
        </Container>
      </section>
    </>
  );
}
