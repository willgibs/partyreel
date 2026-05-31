import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AlbumFrame } from "@/components/marketing/album-frame";
import { BreadcrumbJsonLd } from "@/components/marketing/jsonld";
import { Section } from "@/components/marketing/section";
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
    "Help build Partyreel — the easiest way to collect every photo, video, and highlight reel from an event. We're a small team that cares about craft, and we're hiring.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Careers", href: "/careers" },
        ]}
      />

      {/* Hero */}
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <span className="text-sm font-medium text-brand">
            {CAREERS_INTRO.eyebrow}
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            {CAREERS_INTRO.headline}
          </h1>
          <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
            {CAREERS_INTRO.subhead}
          </p>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="#open-roles">See open roles</Link>
          </Button>
        </Container>
      </section>

      {/* What we're building — asymmetric 2-col (story + media frame) */}
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
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
      </Section>

      {/* How we work — numbered principles */}
      <Section
        className="bg-muted/30"
        eyebrow="How we work"
        heading="A few things we believe"
      >
        <ol className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
          {HOW_WE_WORK.map(({ title, body }, index) => (
            <li key={title} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-sm font-semibold text-brand">
                  {index + 1}
                </span>
                <h3 className="font-heading text-lg font-medium">{title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Open roles */}
      <Section
        id="open-roles"
        eyebrow="Open roles"
        heading="Come build with us"
      >
        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-4">
          {JOB_OPENINGS.map((job) => (
            <Link
              key={job.slug}
              href={`/careers/${job.slug}`}
              className="group flex flex-col gap-4 rounded-xl border bg-card p-6 transition-colors duration-150 hover:border-brand/40 sm:flex-row sm:items-center sm:justify-between"
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
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-colors duration-150 group-hover:text-brand">
                View role
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
