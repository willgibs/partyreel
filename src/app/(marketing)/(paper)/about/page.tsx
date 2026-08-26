import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Partyreel exists: one QR code collects every photo and video from an event, guests need no app and no account, and the whole thing comes home at full quality.",
  alternates: { canonical: "/about" },
};

// THE MISSION & PRINCIPLES PAGE (R5, ruled 2026-08-26): we-voice throughout,
// ZERO team/headcount/founder framing (ruled: nothing that hints at less than
// a stellar product), every principle verifiable in the shipped product.
// Footer-only placement (Company column) by ruling; deliberately quiet.
// All copy PROVISIONAL (the SECTION_HEADERS pattern; Will rules later).
const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Nothing to install",
    body: "Guests join with a camera and a browser. If someone can scan a code, they are in, and the uploads start before the second song.",
  },
  {
    title: "Originals in, originals out",
    body: "Full resolution up, full resolution down, zero re-compression in between. A memory should not lose quality on the way to you.",
  },
  {
    title: "Private by default",
    body: "An album opens exactly as wide as its host chooses, and links stay out of search engines. Public means people with your link, not the internet.",
  },
  {
    title: "Built to keep",
    body: "Albums do not expire. Deletes are reversible for 30 days, and every file lives in two regions with daily checks behind it.",
  },
  {
    title: "People, not machines",
    body: "A real person reviews every report. The judgment calls that touch your event are made by humans, never fired off by a filter.",
  },
  {
    title: "Your photos leave with you",
    body: "Download one shot or the whole album whenever you like, at the quality it arrived. No lock-in, and never an export fee.",
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />

      {/* Hero: the careers idiom (texts-reveal, calm paper register). */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              About
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl"
              style={{ "--i": 1 } as CSSProperties}
            >
              Why Partyreel exists.
            </h1>
            <p
              className="mkt-line max-w-2xl text-lg text-pretty text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Every event ends the same way: the best shots scattered across a
              dozen phones, a group chat that fizzles, and most of it never
              seen again. We built Partyreel so the whole event comes home.
            </p>
          </TextsReveal>
        </Container>
      </section>

      {/* The what + the why, in two short paragraphs. */}
      <SectionShell reveal="none">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            One code in, one album out.
          </h2>
          <p className="text-pretty text-muted-foreground">
            Partyreel collects the photos and videos from everyone at an event
            through one QR code. Guests scan and upload straight from their
            phones, with no app and no account. The host curates, everyone
            browses the same link afterward, and the night can end as a
            one-minute highlight reel.
          </p>
          <p className="text-pretty text-muted-foreground">
            It exists because the morning after deserves better than chasing
            screenshots. One link holds the whole event, at full quality, for
            as long as you want it.
          </p>
          <MonoCaption className="mt-2">
            The name: a party, plus a reel. Every album can end as a film.
          </MonoCaption>
        </div>
      </SectionShell>

      {/* The principles: the numbered mono-rows register (the careers grid /
          privacy 01-07 grammar; the site's proven trust artifact shape). */}
      <SectionShell reveal="none" className="bg-muted/30">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What we hold ourselves to</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl text-balance sm:text-3xl">
            Six principles, all of them checkable.
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Nothing here is aspiration. Every line below is how the product
            already works, and you can verify each one on your first event.
          </p>
        </div>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-9 sm:grid-cols-2">
          {PRINCIPLES.map(({ title, body }, index) => (
            <li key={title} className="flex flex-col gap-1.5">
              <span className="font-mono text-xs tracking-wider text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-heading text-lg sm:text-xl">{title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* Quiet close: pointers + one modest action. */}
      <SectionShell reveal="none">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="font-heading text-2xl text-balance sm:text-3xl">
            See it for yourself.
          </h2>
          <p className="text-pretty text-muted-foreground">
            The fastest way to understand Partyreel is to open an album. Start
            a free event, or take the product story from the top.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6 text-base">
              <Link href={MARKETING_CTA.href}>{MARKETING_CTA.label}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-base">
              <Link href="/how-it-works">How it works</Link>
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {[
              { label: "Press & brand", href: "/press" },
              { label: "Careers", href: "/careers" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {link.label}
                <LearnChevron />
              </Link>
            ))}
          </div>
        </div>
      </SectionShell>
    </>
  );
}
