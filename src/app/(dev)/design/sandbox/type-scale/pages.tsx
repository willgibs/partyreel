"use client";

import { ArrowLeft, CalendarPlus, Eye, Images, Users } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import type { Mode } from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FEATURE_PAGES } from "@/lib/constants/feature-pages";
import {
  SECTION_HEADERS,
  SITE_SUBHEAD,
  SITE_THESIS,
} from "@/lib/constants/marketing-voice";
import { cn } from "@/lib/utils";

import type { Ladder, StepId } from "./ladders";

/**
 * THE REAL PAGES THE LADDER IS JUDGED ON.
 *
 * Every stage here is composed from the production components (PageHero,
 * SectionShell, PageHeading, Card) with the production copy, and none of them
 * is modified: a <Step> wrapper hands the selected ladder's size, leading and
 * tracking to board.css, which spends them on whatever heading the component
 * renders. Change the ladder and the same components re-lay themselves out,
 * which is the only way a type proposal can be judged rather than imagined.
 *
 * Two things are hand-resolved per canvas, for the reason the home-hero board
 * carries a GUTTER constant: a stage is a zoomed 375 or 1440 canvas inside a
 * real window, so Tailwind's `sm:`/`lg:` breakpoints read the WINDOW. The page
 * gutter rides --tsc-gutter (board.css) and every column count here comes from
 * `mode`, never from a responsive utility.
 */

/** The step wrapper: three custom properties, nothing else. A ladder that does
 *  not carry the step renders the component exactly as it ships, which is how
 *  today's and A's missing app tier stay visible instead of being papered over. */
export function Step({
  step,
  ladder,
  mode,
  kind = "heading",
  className,
  children,
}: {
  step: StepId;
  ladder: Ladder;
  mode: Mode;
  kind?: "heading" | "card";
  className?: string;
  children: ReactNode;
}) {
  const pair = ladder.steps[step];
  if (!pair) return <div className={className}>{children}</div>;
  const spec = mode === "phone" ? pair.phone : pair.desktop;
  return (
    <div
      data-tsc-step={kind}
      className={className}
      style={
        {
          "--tsc-size": `${spec.px}px`,
          "--tsc-lh": spec.lh,
          "--tsc-ls": `${spec.ls}em`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

export type PageProps = { ladder: Ladder; mode: Mode };

const isPhone = (mode: Mode) => mode === "phone";

/** Section padding, resolved per canvas rather than left to `sm:py-24`. */
const pad = (mode: Mode) => (isPhone(mode) ? "py-12" : "py-24");

/** A neutral stand-in tile. The event page needs something for its type to sit
 *  against; a type board should not spend its attention on photographs. */
function Tile({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-foreground/[0.07] ring-1 ring-foreground/10",
        className,
      )}
      aria-hidden
    />
  );
}

/* ───────────────────────────── Marketing ─────────────────────────────── */

/** The home hero. The shipped one (cinema-hero.tsx) hand-rolls this same ramp
 *  plus a `leading-[1.02]` of its own, which is the clearest evidence that the
 *  ladder owes each step a named line-height. */
export function HomeHero({ ladder, mode }: PageProps) {
  return (
    <Step step="hero" ladder={ladder} mode={mode}>
      <PageHero
        entrance="cut"
        scale="xl"
        align="left"
        className={isPhone(mode) ? "pt-16 pb-12" : "pt-28 pb-20"}
        eyebrow="One QR code"
        heading={SITE_THESIS}
        subhead={SITE_SUBHEAD}
        actions={
          <>
            <Button size="lg" className="h-11 px-6 text-base">
              Start free
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-5 text-base">
              Try the live demo
            </Button>
          </>
        }
      />
    </Step>
  );
}

/** The home arc's two section tiers: the chapter anchor and a body section. */
export function HomeSections({ ladder, mode }: PageProps) {
  return (
    <>
      <Step step="chapter" ladder={ladder} mode={mode}>
        <SectionShell
          reveal="none"
          scale="lg"
          eyebrow="The live demo"
          heading={SECTION_HEADERS.liveDemo.line}
          subhead="A real event, filling up while you watch."
          className={pad(mode)}
        />
      </Step>
      <Step step="section" ladder={ladder} mode={mode}>
        <SectionShell
          reveal="none"
          eyebrow="Curation"
          heading={SECTION_HEADERS.curation.line}
          subhead="Review uploads before they appear, or clean up afterward in one pass."
          className={pad(mode)}
        />
      </Step>
    </>
  );
}

/** A feature page: the standard page title over the card row it introduces. */
export function FeaturePage({ ladder, mode }: PageProps) {
  const page = FEATURE_PAGES[2];
  return (
    <>
      <Step step="title" ladder={ladder} mode={mode}>
        <PageHero
          entrance="cut"
          scale="lg"
          eyebrow="Curation"
          heading={page.h1}
          subhead={page.heroSub}
          className={isPhone(mode) ? "pt-14 pb-10" : "pt-24 pb-16"}
        />
      </Step>
      <Step step="section" ladder={ladder} mode={mode}>
        <SectionShell
          reveal="none"
          heading="Three ways to keep the album yours"
          className={isPhone(mode) ? "py-8" : "py-16"}
        >
          <Step
            step="card"
            ladder={ladder}
            mode={mode}
            kind="card"
            className={cn("mt-10 grid gap-4", isPhone(mode) && "mt-6")}
          >
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${isPhone(mode) ? 1 : 3}, minmax(0, 1fr))`,
              }}
            >
              {[
                {
                  title: "Approve before it appears",
                  body: "Nothing reaches the album until you say so.",
                },
                {
                  title: "Clean up in one pass",
                  body: "Hide a shot and it leaves every view at once.",
                },
                {
                  title: "Guests keep their own",
                  body: "A guest always sees what they uploaded.",
                },
              ].map((card) => (
                <Card key={card.title}>
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </Step>
        </SectionShell>
      </Step>
    </>
  );
}

/** /help's masthead: the same title step in the blur register, with the front
 *  desk's quick links under it so the title is judged against real furniture. */
export function HelpMasthead({ ladder, mode }: PageProps) {
  return (
    <Step step="title" ladder={ladder} mode={mode}>
      <PageHero
        entrance="blur"
        scale="lg"
        eyebrow="Help center"
        heading="How can we help?"
        subhead="Guides for hosts and guests: setup, sharing, privacy, plans, and the highlight reel."
        className={cn(
          "text-center",
          isPhone(mode) ? "pt-14 pb-10" : "pt-20 pb-16",
        )}
      >
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {["Getting started", "For guests", "Sharing", "Plans"].map(
            (label) => (
              <span
                key={label}
                className="inline-flex rounded-full border px-3.5 py-1.5 text-[13px] text-muted-foreground"
              >
                {label}
              </span>
            ),
          )}
        </div>
      </PageHero>
    </Step>
  );
}

/** /about on paper: the display step over the prose tier, which is the only
 *  place the two loudest and quietest marketing steps meet on one page. */
export function AboutPaper({ ladder, mode }: PageProps) {
  return (
    <>
      <Step step="display" ladder={ladder} mode={mode}>
        <PageHero
          scale="display"
          eyebrow="About"
          heading="Partyreel"
          subhead="Built so the photos from an event actually come back to the people who were there."
          className={isPhone(mode) ? "pt-12 pb-10" : "pt-24 pb-16"}
        />
      </Step>
      <Step
        step="prose"
        ladder={ladder}
        mode={mode}
        className={cn("mx-auto w-full max-w-3xl", pad(mode))}
        // The prose tier is bespoke on /about and /press (24/30 today), so it
        // is composed here rather than through SectionShell, which is the
        // honest shape: a story section is a heading and two paragraphs.
      >
        <div style={{ paddingInline: "var(--tsc-gutter)" }}>
          <Eyebrow>The story</Eyebrow>
          <h2 className="mt-3 font-heading text-balance">
            Every event ends the same way
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
            The morning after, the photos are scattered across a group chat,
            three camera rolls and a folder nobody opens again. Compression
            ruins the quality, half of it never gets shared, and the one person
            who took the best shot of the night forgets to send it.
          </p>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            Partyreel puts one code in the room and gives the host the whole
            event, at full quality, in one album that stays theirs.
          </p>
        </div>
      </Step>
    </>
  );
}

/* ─────────────────────────────── The app ─────────────────────────────── */

/** The app's section tier. Today and A have no step for it, so it renders what
 *  production actually ships there: a 14px h2 that is a label wearing a heading
 *  tag. B and C give it a real step, and the difference is the point. */
function AppSection({
  ladder,
  mode,
  children,
}: PageProps & { children: ReactNode }) {
  if (!ladder.steps.subsection) {
    return (
      <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
    );
  }
  return (
    <Step step="subsection" ladder={ladder} mode={mode}>
      <h2 className="font-heading font-semibold">{children}</h2>
    </Step>
  );
}

export function Dashboard({ ladder, mode }: PageProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Step step="page" ladder={ladder} mode={mode}>
            <PageHeading>Dashboard</PageHeading>
          </Step>
          <p className="text-sm text-muted-foreground">3 of 10 events used</p>
        </div>
        <Button>
          <CalendarPlus /> New event
        </Button>
      </div>

      <div className="space-y-3">
        <AppSection ladder={ladder} mode={mode}>
          Your events
        </AppSection>
        <Step
          step="card"
          ladder={ladder}
          mode={mode}
          kind="card"
          className="grid gap-4"
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${isPhone(mode) ? 1 : 3}, minmax(0, 1fr))`,
            }}
          >
            {[
              { name: "Mara and Tom", meta: "214 photos, 23 guests" },
              { name: "Ridgeway block party", meta: "96 photos, 11 guests" },
              { name: "Anna turns thirty", meta: "41 photos, 8 guests" },
            ].map((event) => (
              <Card key={event.name}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>{event.meta}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Step>
      </div>
    </div>
  );
}

export function EventPage({ ladder, mode }: PageProps) {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to events
        </span>
        <div className="space-y-2">
          {/* The event name is the one app title that carries a size override
              today (`text-3xl` on PageHeading). Under a named ladder it is just
              the page step, and the override has nothing left to do. */}
          <Step step="page" ladder={ladder} mode={mode}>
            <PageHeading>Mara and Tom</PageHeading>
          </Step>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Saturday 14 June</span>
            <span className="flex items-center gap-1.5">
              <Images className="size-3.5" />
              <span className="tabular-nums">214</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              <span className="tabular-nums">23</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="size-3.5" />
              <span className="tabular-nums">1,204</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary">Link only</Badge>
            <Badge variant="secondary">Uploads open</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <AppSection ladder={ladder} mode={mode}>
          The album
        </AppSection>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${isPhone(mode) ? 2 : 5}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: isPhone(mode) ? 4 : 10 }).map((_, i) => (
            <Tile key={i} className="aspect-square" />
          ))}
        </div>
        <Caption>
          Stand-in tiles: this stage is judging type, not media.
        </Caption>
      </div>
    </div>
  );
}

export function AdminPage({ ladder, mode }: PageProps) {
  return (
    <div className="space-y-8 p-6">
      <div>
        <Step step="page" ladder={ladder} mode={mode}>
          <PageHeading>Operations</PageHeading>
        </Step>
        <p className="text-sm text-muted-foreground">
          Internal tools for running Partyreel.
        </p>
      </div>

      <div className="space-y-3">
        <AppSection ladder={ladder} mode={mode}>
          Today
        </AppSection>
        <Step
          step="card"
          ladder={ladder}
          mode={mode}
          kind="card"
          className="grid gap-4"
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${isPhone(mode) ? 1 : 2}, minmax(0, 1fr))`,
            }}
          >
            {[
              {
                title: "Jobs",
                body: "Every cron and worker, with its last run.",
                count: 2,
              },
              {
                title: "Accounts",
                body: "Hosts, tiers and storage.",
                count: 0,
              },
              {
                title: "Reports",
                body: "Guest reports awaiting a decision.",
                count: 5,
              },
              {
                title: "Security",
                body: "Two-factor and portal access.",
                count: 0,
              },
            ].map((card) => (
              <Card key={card.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {card.title}
                    {card.count > 0 ? <Badge>{card.count}</Badge> : null}
                  </CardTitle>
                  <CardDescription>{card.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Step>
      </div>
    </div>
  );
}
