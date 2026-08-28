import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  MarkBadge,
  MarksField,
  type MarkKind,
} from "@/components/marketing/sections/careers/careers-marks";
import { RoleListings } from "@/components/marketing/sections/careers/role-listings";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { CtaBand } from "@/components/marketing/system/cta-band";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import {
  CAREERS_INTRO,
  CAREERS_MISSION,
  HOW_WE_WORK,
} from "@/lib/constants/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Help build Partyreel: one QR code that collects every photo and video from an event, and hands it back as an album worth keeping. We're a small team that cares about craft, and we're hiring.",
  alternates: { canonical: "/careers" },
};

/**
 * THE CAREERS HUB.
 *
 *   dark hero (the marks field) -> PAPER (why it matters) -> dark (how we work)
 *   -> PAPER (open roles) -> dark CtaBand.
 *
 * ! THE CHAPTERS ALTERNATE, and that is a fix, not a flourish. The first pass
 *   ran hero / paper / dark / dark and Will's read was that it "feels very
 *   bland, not very engaging as you scroll, nor much hierarchy to visually
 *   track", and that "only having one paper section also feels forced." Two
 *   paper chapters give the page a rhythm instead of a single light interlude,
 *   and the roles now land ON paper, which is the same move /pricing ruled for
 *   the money: a listing is a DOCUMENT, so the job turns the page.
 *
 * ! The hero's mark vocabulary is reused down the page as the principle
 *   anchors. That is what stops the field from being decoration that appears
 *   once and never returns, and it is most of the missing hierarchy: each
 *   principle now has a shape to track, not just a number.
 *
 * WHAT THIS PAGE DELIBERATELY IS NOT (Will's earlier verdict, still binding):
 * not a tour of the product's internals ("this will all be handled during
 * interviews"), not centred on one role, not a pre-launch confessional, and not
 * self-deprecating in the header.
 */

/**
 * Each principle borrows a mark from the hero's own vocabulary, chosen for
 * meaning AND for surviving 34px: craft = the reel we make, media = the album,
 * the party = the QR a guest meets there, ownership = the album kept.
 */
const PRINCIPLE_MARKS: MarkKind[] = ["reel", "album", "scan", "keep"];

export default function CareersPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ]}
      />

      {/* The room, with the product loop drifting through it in three planes. */}
      <section className="relative overflow-hidden">
        <MarksField />
        <div
          aria-hidden
          className="mkt-careers-scrim pointer-events-none absolute inset-0"
        />
        <Container className="relative flex flex-col items-center gap-6 py-28 text-center sm:py-36">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              {CAREERS_INTRO.eyebrow}
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              {CAREERS_INTRO.headline}
            </h1>
            <p
              className="mkt-line max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              {CAREERS_INTRO.subhead}
            </p>
            {/* A DIV, not a span: [data-mkt] .mkt-line forces display:block, so
                a flex/inline wrapper on the same element is silently killed.
                The button centers off the section's text-center instead. */}
            <div className="mkt-line" style={{ "--i": 3 } as CSSProperties}>
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link
                  href="#open-roles"
                  {...trackAttrs("cta_click", {
                    cta: "see-open-roles",
                    location: "careers-hero",
                  })}
                >
                  {CAREERS_INTRO.cta}
                </Link>
              </Button>
            </div>
          </TextsReveal>
        </Container>
      </section>

      {/* Chapter one: why the work matters. Asymmetric on purpose - a centered
          column here was most of what made the page read as flat. */}
      <PaperChapter>
        <SectionShell reveal="none">
          <Reveal className="grid gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div data-mkt-reveal style={{ "--i": 0 } as CSSProperties}>
              <Eyebrow>Why it matters</Eyebrow>
              <h2 className="mt-3 font-heading text-2xl text-balance sm:text-3xl">
                {CAREERS_MISSION.heading}
              </h2>
            </div>
            <div className="flex max-w-2xl flex-col gap-4 lg:pt-1">
              {CAREERS_MISSION.paragraphs.map((paragraph, i) => (
                <p
                  key={paragraph}
                  data-mkt-reveal
                  style={{ "--i": i + 1 } as CSSProperties}
                  className="text-lg text-pretty text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </SectionShell>
      </PaperChapter>

      {/* Chapter two: how we work, back on the room. Each principle carries a
          mark from the hero so the page keeps one visual vocabulary. */}
      <SectionShell
        eyebrow="How we work"
        heading="Four things we actually do."
        align="left"
        reveal="standard"
      >
        <Reveal className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {HOW_WE_WORK.map(({ title, body }, index) => (
            <div
              key={title}
              data-mkt-reveal
              style={{ "--i": index } as CSSProperties}
              className="flex flex-col gap-3 border-t pt-6"
            >
              <div className="flex items-center gap-3">
                <MarkBadge kind={PRINCIPLE_MARKS[index]} />
                <span className="font-mono text-xs tracking-wider text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl">{title}</h3>
              <p className="text-pretty text-muted-foreground">{body}</p>
            </div>
          ))}
        </Reveal>
      </SectionShell>

      {/* Chapter three: the job turns the page to paper. */}
      <PaperChapter>
        <SectionShell
          id="open-roles"
          eyebrow="Open roles"
          heading="Where you'd fit."
          subhead="Every application gets read. If nothing here is yours, the last entry is always open."
        >
          <div className="mt-14">
            <RoleListings />
          </div>
        </SectionShell>
      </PaperChapter>

      <CtaBand
        heading="Try it before you apply."
        subhead="The live demo album is open and the reel is one tap away. It is the fastest way to understand what we do all day."
        demoLink
      />
    </>
  );
}
