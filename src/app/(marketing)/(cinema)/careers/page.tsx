import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { ContactSheet } from "@/components/marketing/sections/careers/contact-sheet";
import {
  CareersStory,
  SELECT_INDICES,
} from "@/components/marketing/sections/careers/careers-story";
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
  HOW_WE_WORK,
  OPEN_ROLES,
} from "@/lib/constants/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Help build Partyreel: one QR code that collects every photo and video from an event, and hands it back as an album worth keeping. We're a small team that cares about craft, and we're hiring.",
  alternates: { canonical: "/careers" },
};

/**
 * THE CAREERS HUB (the photographic rebuild).
 *
 *   CINEMA  the contact sheet + "We're hiring."
 *   PAPER   the roll -> the selects -> the reel, how we work, open roles, close
 *   INK     the footer
 *
 * ! ONE CUT, NOT STRIPES (Will, 2026-08-28). An earlier pass alternated cinema
 *   and paper section by section and it "feels overwhelming when it's every
 *   section on a shorter page." It also broke the ratified chapter doctrine,
 *   where a theme switch introduces a CONCEPT GROUP and is "never stripe
 *   alternation" (home/section-ids.ts). Everything between the hero and the
 *   footer is one paper chapter, the CtaBand included.
 *
 * ! THE PAGE ARGUES IN PHOTOGRAPHS. Two prototypes were rejected as generic,
 *   and the reason was content, not layout: both were claims about ourselves
 *   ("why it matters" was the product pitch restated, "how we work" was a
 *   values list) on a page whose reader had already seen the pitch twice. The
 *   only thing here nobody else can publish is our own event media and the reel
 *   it makes, so that carries the argument now and the prose got out of its
 *   way. Do not reintroduce a paragraph section to "explain" a beat.
 */
export default function CareersPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ]}
      />

      {/* THE PROOF SHEET. The marks draw themselves in on arrival: the page
          performs a curation pass in front of you, which is the one beat this
          rare surface spends its delight budget on. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <ContactSheet
            selects={SELECT_INDICES}
            columns="grid-cols-5 sm:grid-cols-7 lg:grid-cols-9"
            repeat={3}
            className="size-full [&>figure]:aspect-auto"
          />
        </div>
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
              className="mkt-line font-heading text-5xl text-balance sm:text-6xl md:text-7xl"
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

      <PaperChapter>
        <CareersStory />

        {/* Three lines, not four paragraphs. "Media is the hero" was retired
            because everything above this now demonstrates it. */}
        <SectionShell
          eyebrow="How we work"
          heading="Three things we hold to."
          align="left"
        >
          <Reveal className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-3">
            {HOW_WE_WORK.map(({ title, body }, index) => (
              <div
                key={title}
                data-mkt-reveal
                style={{ "--i": index } as CSSProperties}
                className="flex flex-col gap-2 border-t pt-5"
              >
                <span className="font-mono text-xs tracking-wider text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-lg sm:text-xl">{title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </Reveal>
        </SectionShell>

        {/* The heading DERIVES, so the day the last role closes the section
            stops advertising one. Same invariant IS_HIRING protects for the
            footer badge; the listings own the row-level empty state. */}
        <SectionShell
          id="open-roles"
          eyebrow="Open roles"
          heading={
            OPEN_ROLES.length > 0
              ? "Come and take one."
              : "Nothing open right now."
          }
          subhead={
            OPEN_ROLES.length > 0
              ? "Every application gets read. If nothing here is yours, the last entry is always open."
              : "Every application gets read, and the door below is always open."
          }
        >
          <div className="mt-14">
            <RoleListings />
          </div>
        </SectionShell>

        {/* Points at /contact, not the product: the footer carries a product
            CTA immediately below this, and two in a row is a wall. */}
        <CtaBand
          heading="Not sure yet?"
          subhead="Ask anything before you apply. Every note gets a reply, usually within a day."
          primary={{ label: "Get in touch", href: "/contact" }}
        />
      </PaperChapter>
    </>
  );
}
