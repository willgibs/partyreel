import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";

import { AlbumFrame } from "@/components/marketing/frames";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { TextsReveal } from "@/components/marketing/sections/shared/texts-reveal";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CAREERS_INTRO,
  CAREERS_MISSION,
  HOW_WE_WORK,
  JOB_OPENINGS,
} from "@/lib/constants/careers";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Help build Partyreel: the easiest way to collect every photo, video, and highlight reel from an event. We're a small team that cares about craft, and we're hiring.",
  alternates: { canonical: "/careers" },
};

// The paper type ladder (2026-08-25 ruling): H1 4xl/5xl in the heading face;
// section h2s step below at 2xl/3xl (SectionShell's built-in heading reaches
// 5xl at lg — a tie with the paper H1 — so the section headers here are
// composed bespoke inside the shell and only the rhythm/anchor plumbing is
// SectionShell's). Sections migrated off the deprecated section.tsx.
export default function CareersPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ]}
      />

      {/* Hero — the one entrance (texts-reveal), calm register. */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <TextsReveal className="flex flex-col items-center gap-6">
            <Eyebrow className="mkt-line" style={{ "--i": 0 } as CSSProperties}>
              {CAREERS_INTRO.eyebrow}
            </Eyebrow>
            <h1
              className="mkt-line max-w-3xl font-heading text-4xl text-balance sm:text-5xl"
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
            <span
              className="mkt-line"
              style={{ "--i": 3 } as CSSProperties}
            >
              <Button asChild size="lg" className="h-11 px-6 text-base">
                <Link href="#open-roles">See open roles</Link>
              </Button>
            </span>
          </TextsReveal>
        </Container>
      </section>

      {/* What we're building — asymmetric 2-col (story + media frame) */}
      <SectionShell reveal="none">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-2xl text-balance sm:text-3xl">
              {CAREERS_MISSION.heading}
            </h2>
            {CAREERS_MISSION.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-pretty text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </div>
          <AlbumFrame label="partyreel.com/a/the-team" />
        </div>
      </SectionShell>

      {/* How we work — numbered principles, mono numerals in achromatic chips */}
      <SectionShell reveal="none" className="bg-muted/30">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How we work</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl text-balance sm:text-3xl">
            A few things we believe
          </h2>
        </div>
        <ol className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-9 sm:grid-cols-2">
          {HOW_WE_WORK.map(({ title, body }, index) => (
            <li key={title} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-lg font-medium">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* Open roles */}
      <SectionShell id="open-roles" reveal="none">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Open roles</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl text-balance sm:text-3xl">
            Come build with us
          </h2>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-4">
          {JOB_OPENINGS.map((job) => (
            <Link
              key={job.slug}
              href={`/careers/${job.slug}`}
              className="mkt-learn group flex flex-col gap-4 rounded-xl border bg-card p-6 transition-[border-color,transform] duration-150 hover:border-foreground/25 active:scale-[0.99] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-heading text-lg font-medium">
                  {job.title}
                </h3>
                <p className="text-sm text-muted-foreground">{job.hook}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{job.team}</Badge>
                  <Badge variant="secondary">{job.type}</Badge>
                  {job.location && (
                    <Badge variant="secondary">{job.location}</Badge>
                  )}
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                View role
                <LearnChevron />
              </span>
            </Link>
          ))}
        </div>
      </SectionShell>
    </>
  );
}
