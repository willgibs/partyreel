import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import {
  ContactSheet,
  SelectMark,
} from "@/components/marketing/sections/careers/contact-sheet";
import {
  CareersStory,
  HERO_SELECTS,
} from "@/components/marketing/sections/careers/careers-story";
import { RoleListings } from "@/components/marketing/sections/careers/role-listings";
import { PageHero } from "@/components/marketing/system/page-hero";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { REPLY_LINE } from "@/lib/constants/contact";
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
 *   CINEMA  the contact sheet + "Join our team"
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
          rare surface spends its delight budget on.

          ! The section is pulled UP under the chrome (the same move home's
            cinema hero makes). The cinema header is an overlay that starts
            transparent, so without this the sheet began below it and left a
            hard horizontal seam across the top of the page. Now the sheet runs
            behind the nav and the scrim's top stop fades it out there instead.
            The Container adds the header height back so the type keeps its
            intended breathing room. */}
      {/* THE SITE LADDER, not a ramp of its own (Will, 2026-08-29): the hero
          composes PageHero at the standard `lg` step. A photographic hero
          earns its presence from the sheet behind the words (the backdrop
          slot), not from a private type step; the blur register is the
          utility trio's named entrance (2026-09-11), with the h1 held at
          paint. */}
      <PageHero
        entrance="blur"
        scale="lg"
        eyebrow={CAREERS_INTRO.eyebrow}
        heading={CAREERS_INTRO.headline}
        subhead={CAREERS_INTRO.subhead}
        actions={
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
        }
        backdrop={
          <>
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <ContactSheet
                selects={HERO_SELECTS}
                columns="grid-cols-5 sm:grid-cols-7 lg:grid-cols-9"
                repeat={3}
                className="size-full [&>figure]:aspect-auto"
              />
            </div>
            <div
              aria-hidden
              className="mkt-careers-scrim pointer-events-none absolute inset-0"
            />
          </>
        }
        className="relative -mt-[var(--mkt-header-h,4rem)] overflow-hidden pt-[calc(var(--mkt-header-h,4rem)+7rem)] pb-28 text-center sm:pt-[calc(var(--mkt-header-h,4rem)+9rem)] sm:pb-36"
      />

      <PaperChapter>
        <CareersStory />

        {/* Three lines, not four paragraphs. "Media is the hero" was retired
            because everything above this now demonstrates it.

            ! THE INDICES ARE CIRCLED, in the page's own hand (Will, 2026-08-29:
              "give it the page's vocabulary"). This was the one beat arguing in
              PROSE on a page whose whole thesis is that it argues in
              photographs, and a bare 01/02/03 under a hairline is the values
              grid any startup could publish. The mark is the sheet's own
              SelectMark, not a new device, so one gesture now repeats at three
              scales: frames in the hero, frames in the roll, indices here. It is
              also true rather than decorative - there were four principles and
              three survived the cut, so these ARE the selects. */}
        <SectionShell
          eyebrow="How we work"
          heading="Our core philosophy"
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
                {/* ! THE BOX IS DELIBERATELY LOOSE around the numeral, and that
                    is the whole difference between a pencil mark and a UI chip.
                    A snug box was tried first and read as a badge: the ellipse
                    became a container FOR the number instead of something drawn
                    AROUND it, and at that size the mark's -6 degree tilt is
                    invisible. Roughly three times the numeral's width gives the
                    stroke room to sit off it. The lighter stroke is the second
                    half: `non-scaling-stroke` renders 2.2px the same on a 48px
                    box as on a 160px frame, which is four times the weight for
                    the size. */}
                <span className="relative inline-flex h-8 w-12 items-center justify-center self-start">
                  <span className="text-xs font-medium text-faint tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <SelectMark index={index} strokeWidth={1.25} onReveal />
                </span>
                <h3 className="font-heading text-subsection">{title}</h3>
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
            OPEN_ROLES.length > 0 ? "We're hiring" : "Nothing open right now"
          }
          subhead={
            OPEN_ROLES.length > 0
              ? "Every application gets read. If nothing specific fits, we'd still love to hear from you."
              : "Every application gets read, and the door below is always open."
          }
        >
          <div className="mt-14">
            <RoleListings />
          </div>

          {/* The close is a FOLLOW-UP to the list, not another band. It used to
              be a full CtaBand, whose heading scale (3xl→5xl) shouted louder
              than the roles it was meant to trail and pushed a screen of air
              between them. It sits inside this section now, tucked under the
              cards and smaller than a role title, so it reads as the last line
              of the listing rather than a new pitch. It points at /contact
              because the footer's product CTA is immediately below. */}
          <Reveal className="mx-auto mt-10 flex max-w-3xl flex-col items-start gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div
              data-mkt-reveal
              style={{ "--i": 0 } as CSSProperties}
              className="flex flex-col gap-1"
            >
              <h3 className="font-heading text-subsection">Not sure yet?</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                Ask anything before you apply. {REPLY_LINE}
              </p>
            </div>
            <div data-mkt-reveal style={{ "--i": 1 } as CSSProperties}>
              <Button asChild variant="outline" className="h-10 px-5">
                <Link
                  href="/contact"
                  {...trackAttrs("cta_click", {
                    cta: "get-in-touch",
                    location: "careers-close",
                  })}
                >
                  Get in touch
                </Link>
              </Button>
            </div>
          </Reveal>
        </SectionShell>
      </PaperChapter>
    </>
  );
}
