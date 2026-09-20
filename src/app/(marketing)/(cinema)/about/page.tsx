import type { Metadata } from "next";
import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import {
  ABOUT_CAREERS,
  ABOUT_CONVICTIONS,
  ABOUT_HERO,
  ABOUT_LEDGER,
  ABOUT_META,
  ABOUT_STORY,
} from "@/lib/constants/about";
import { IS_HIRING } from "@/lib/constants/careers";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

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
 * Will's second pass (2026-08-28) inverted the first build's ground: opening on
 * a cinema hero BOOKENDS the page in dark against the global ink footer and
 * leaves the reading body in the middle where it belongs. The gather then
 * carries the transition on its own back rather than a bare hairline doing it:
 * the album is centred on the cut, arriving out of the event and landing on the
 * desk. That is the /help emblem-strip move, and the chapter doctrine (cinema =
 * the event, paper = the morning after) drawn literally rather than announced.
 *
 * ★ THAT ARC IS THE (cinema) GROUP'S, NOT A NEW ONE. This page opens on the
 * room and rides ONE PaperChapter, which is what /help and all six feature
 * pages already do; the group's layout brings the dark overlay nav, the dark
 * dropdowns, the dark overscroll and the #040405 browser chrome with it. The
 * round's first build reached the same picture from the paper side (a
 * (spotlight) group whose header wore a hand-assembled --gallery* set), and
 * the reason that direction is closed is measurable: such a set is always one
 * token behind. It redeclared --foreground but not --popover, so the nav
 * panels painted lab(96.52) type on a lab(99.65) ground -- the whole primary
 * nav at ~1.07:1. `.dark` flips the block, so nothing can be left behind.
 * Utility pages take this arc by JOINING THIS GROUP; see design-system.md.
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

      {/* THE TITLE PAGE. The wordmark as the page's h1 at the largest step of
          the shared lockup, because an About page IS a title page: the header
          carries no argument and the story does the work. It is display TYPE,
          never the Logo lockup.
          The round shipped it as a <p>, which left the page with no h1 at all;
          it is a heading again here. Nothing about the type changes, and the
          lockup's `display` step carries the optical trim that lets the shared
          gap measure ink to ink under a 160px line (see page-hero.tsx) — the
          hero-spacing note Will raised.
          One Reveal drives the stack: the eyebrow rises on the standard
          grammar while the wordmark's tracking closes from open to the heading
          face's own -0.03em (the .mkt-name recipe). Different properties, so
          the two entrances compose instead of fighting. */}
      {/* The negative top margin slides the hero UNDER the overlay header (a
          sticky header still takes its 64px of flow), so the room starts at the
          very top of the page. The top padding then clears the bar again. This
          is cinema-hero.tsx's mechanism verbatim.
          No `!` here: the round's first build needed it to out-rank a chapter
          wrapper's `max-lg:[&>section]:py-14`, and with the hero on the group's
          own ground there is no wrapper to fight. That also revives `lg:pt-44`,
          which the `!` on sm:pt-40 had been silently beating at every width
          above 1024px. */}
      <PageHero
        className="-mt-[var(--mkt-header-h)] pt-28 pb-16 sm:pt-40 sm:pb-20 lg:pt-44"
        scale="display"
        eyebrow={ABOUT_HERO.eyebrow}
        heading={ABOUT_HERO.wordmark}
        subhead={ABOUT_HERO.subhead}
        actions={
          // `size="cta"` is the site's hero CTA size (button.tsx), the same one
          // cinema-hero and CtaBand wear: this is the one control pair the page
          // carries, so it matches the others exactly.
          <>
            <Button asChild size="cta">
              <Link
                href={MARKETING_CTA.href}
                {...trackAttrs("cta_click", {
                  cta: "start-free",
                  location: "hero",
                })}
              >
                {MARKETING_CTA.label}
              </Link>
            </Button>
            <Button asChild size="cta" variant="outline">
              <Link href={ABOUT_HERO.secondaryHref}>
                {ABOUT_HERO.secondaryLabel}
              </Link>
            </Button>
          </>
        }
      />

      {/* The gather straddles the cut: its negative bottom margin pulls the
          paper chapter up under itself, so the album's midline lands on the
          seam. Its twin is the chapter's `mkt-gather-clear` padding below. */}
      <Gather />

      {/* THE PAPER BODY, as ONE chapter (the ratified "chapter cuts, not
          stripes" rule): story, ledger and close share a single cut rather than
          striping the page. compressStacked is off because the story section
          has to clear the album's overhang below lg — see paper-chapter.tsx. */}
      <PaperChapter compressStacked={false}>
        {/* THE STORY. Left-aligned and INK rather than muted: the footer round
            settled that muted body copy reads as small print, and the fix was
            to spend the scale and the ink. Only mechanism lines and captions
            are muted on this page. */}
        {/* ★ `mkt-gather-clear` CLEARS THE ALBUM'S OVERHANG and is the twin of
            `mkt-gather-straddle`: the straddle pulls this chapter up by a
            percentage of the stage width, so half the album hangs over this
            section, and too little clearance lands the photographs on the
            prose. The two live together in marketing.css precisely so retuning
            one cannot silently strand the other. */}
        <SectionShell reveal="none" className="mkt-gather-clear pb-16 sm:pb-20">
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
                // Per-row border-b, never divide-y: divide-y hangs the rule on the
                // NEXT sibling, so hover would darken the line above the row being
                // read instead of the one under it.
                key={href}
                className="grid gap-x-10 gap-y-2 border-b py-7 transition-[border-color] duration-150 last:border-b-0 hover:border-b-[color-mix(in_oklab,var(--foreground)_22%,transparent)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:py-8"
              >
                {/* No text-balance on a 2-4 word heading in a grid cell: balance
                  can pick a worse break than the natural one at that length. */}
                <h3 className="font-heading text-subhead">{title}</h3>
                <div>
                  <p className="text-copy text-pretty text-muted-foreground">
                    {body}
                  </p>
                  {/* Only this column is a link, so the h3 deliberately does not
                    move on hover: moving it would lie about what is clickable.
                    py-1 lifts the 24px line box to a 32px hit target, which is
                    why the focus outline takes offset-2 rather than the usual 4
                    (the ring would otherwise sit well clear of the text). */}
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

        {/* THE CLOSE. Points at careers, not at signup: the footer directly below
          already owns the paper lane's one conversion action, and a second
          Start free here would be the same solicitation twice. The hiring claim
          is derived, never hardcoded, so it cannot outlive the open roles. */}
        <section className="border-t">
          <Container className="flex flex-col items-center gap-5 py-20 text-center sm:py-24">
            <h2 className="max-w-2xl font-heading text-prose text-balance">
              {ABOUT_CAREERS.heading}
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground">
              {IS_HIRING ? ABOUT_CAREERS.hiring : ABOUT_CAREERS.notHiring}
            </p>
            {/* A button, not a text link: the heading asks a question, so the
              answer should look clickable. Outline rather than filled because
              the footer's Start free sits ~200px below and the two must not
              compete (its doctrine: the footer is the paper lane's one
              CONVERSION action). Same size as the hero's secondary, so the
              page's two action moments match. */}
            <Button asChild size="cta" variant="outline" className="mt-1">
              <Link
                href={ABOUT_CAREERS.href}
                {...trackAttrs("cta_click", {
                  cta: "careers",
                  location: "about-close",
                })}
              >
                {IS_HIRING
                  ? ABOUT_CAREERS.linkLabelHiring
                  : ABOUT_CAREERS.linkLabelNotHiring}
              </Link>
            </Button>
          </Container>
        </section>
      </PaperChapter>
    </>
  );
}
