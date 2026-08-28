import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { MarksWall } from "@/components/marketing/sections/careers/careers-marks";
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
 * THE CAREERS HUB (rebuilt from zero, the careers round 2026-08-28).
 *
 *   dark hero (the marks wall) -> PAPER (why we're building it + how we work)
 *   -> dark open roles -> CtaBand.
 *
 * The chapter alternation is the home arc's ratified rhythm (cinema, paper,
 * cinema), and the cut is load-bearing rather than decoration: the company
 * material is a DOCUMENT and reads on paper, while the listings land back in
 * the room so the thing you came to do is the destination.
 *
 * ! WHAT THIS PAGE DELIBERATELY IS NOT (Will's verdict on the first rebuild,
 *   2026-08-28 - do not walk any of it back):
 *   - NOT a tour of how the product works internally. "Why in the world am I
 *     reading about Reel CSS rendering on the careers page... this will all be
 *     handled during interviews." The engine internals are gone; a visitor here
 *     to send a General Application should never meet them.
 *   - NOT centred on one role. The General Application is permanent and more
 *     listings are coming, so RoleListings scales and the catch-all is a
 *     first-class entry, never a peer vacancy card and never an afterthought.
 *   - NOT a pre-launch confessional. "We're building this for launch," so the
 *     page does not dwell on having no users yet.
 *   - NOT self-deprecating in the header. An earlier headline built from our own
 *     "details nobody consciously notices" value read to a prospect as "your
 *     work will be invisible here"; the H1 sells the opportunity instead.
 *
 * The one thing carried over from the lab round is the WALL: abstract
 * achromatic marks of the global Partyreel loop, which Will kept because it
 * "makes it feel cool in a developer 'this is cool work' way versus repeating
 * more images." The metric row from that round was cut with him for lack of
 * honest content (no social proof exists, and hiring facts read as boring).
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

      {/* The room, with the loop drawn across it. The wall is texture, not
          content, so a scrim pools over the type rather than blanketing the
          grid (a blanket made the wall invisible and wasted the device). */}
      <section className="relative overflow-hidden">
        <MarksWall />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mkt-careers-scrim"
        />
        <Container className="relative flex flex-col items-center gap-6 py-24 text-center sm:py-32">
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

      {/* THE DOCUMENT. Why we're building it, then how we work: the company
          material a candidate reads before they look at the list. */}
      <PaperChapter>
        <SectionShell>
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            <h2 className="font-heading text-2xl text-balance sm:text-3xl">
              {CAREERS_MISSION.heading}
            </h2>
            {CAREERS_MISSION.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-pretty text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>

          <Reveal className="mx-auto mt-16 grid max-w-4xl gap-x-10 gap-y-9 sm:grid-cols-2">
            {HOW_WE_WORK.map(({ title, body }, index) => (
              <div
                key={title}
                data-mkt-reveal
                style={{ "--i": index } as CSSProperties}
                className="flex flex-col gap-1.5"
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
      </PaperChapter>

      <RoleListings />

      <CtaBand
        heading="See what you'd be building."
        subhead="The live demo album is open, and the reel is one tap away. It is the fastest way to understand what we do."
        demoLink
      />
    </>
  );
}
