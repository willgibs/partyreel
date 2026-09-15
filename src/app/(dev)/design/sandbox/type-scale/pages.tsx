"use client";

import {
  ArrowLeft,
  CalendarPlus,
  Eye,
  Images,
  SearchX,
  Users,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import type { Mode } from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
import { Eyebrow } from "@/components/marketing/system/eyebrow";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { NotFoundScreen } from "@/components/shared/not-found-screen";
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

import {
  APP_BODY_PX,
  optics,
  type Ladder,
  type Spec,
  type StepId,
} from "./ladders";

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
  return (
    <SpecStep
      spec={mode === "phone" ? pair.phone : pair.desktop}
      kind={kind}
      className={className}
    >
      {children}
    </SpecStep>
  );
}

/** The same wrapper driven by a bare spec rather than a ladder step, for the
 *  two stages that compare registers a ladder does not carry (round two's
 *  reconsideration of C, and the tracking law at one size under two values). */
export function SpecStep({
  spec,
  kind = "heading",
  ships = false,
  className,
  children,
}: {
  spec: Spec;
  kind?: "heading" | "card";
  /** This half shows what production SHIPS: pin the body face and its weight,
   *  and outrank any candidate block applied to the whole site (board.css). */
  ships?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-tsc-step={kind}
      data-tsc-ships={ships ? "" : undefined}
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

/**
 * THE APP'S SECTION TIER, and the two idioms production actually ships there.
 *
 * Neither is a heading: `uppercase` is the dashboard and the event feed's
 * 11px uppercase label inside an h2 (feed-section, feed-section-header,
 * empty-section-teaser), `label` is admin's 14px one (metrics,
 * announcements). Both are rendered here exactly as they ship, so a ladder
 * with no step for this tier shows the hole instead of papering over it. B and
 * C give the tier a real step, and the difference is the whole of stage 10.
 */
export type AppIdiom = "uppercase" | "label";

const IDIOM: Record<AppIdiom, { className: string; where: string }> = {
  uppercase: {
    className:
      "text-[11px] font-semibold tracking-wide text-muted-foreground uppercase",
    where: "the dashboard and the event feed",
  },
  label: {
    className: "text-sm font-medium text-muted-foreground",
    where: "admin metrics and announcements",
  },
};

function AppSection({
  ladder,
  mode,
  idiom = "uppercase",
  children,
}: PageProps & { idiom?: AppIdiom; children: ReactNode }) {
  if (!ladder.steps.subsection) {
    return <h2 className={IDIOM[idiom].className}>{children}</h2>;
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
            gridTemplateColumns: `repeat(${isPhone(mode) ? 2 : 6}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: isPhone(mode) ? 4 : 6 }).map((_, i) => (
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
        <AppSection ladder={ladder} mode={mode} idiom="label">
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

/* ─────────────────── Round two's four new compositions ────────────────── */

/**
 * THE HOME HERO AS THE HERO BOARD DRAWS IT (round two, the fourth goal).
 *
 * The hero board's concepts do not use PageHero: they lay the lockup out
 * absolutely around the QR and resolve the ladder's `xl` step by hand, then add
 * a leading of their own (`leading-[1.02]`, four concepts, and
 * `leading-[1.03]` on a fifth). That local leading is the clearest evidence on
 * the site that the ladder owes each step a named line-height, and it also
 * means the loudest step on the site is NOT reached by changing PageHero.
 *
 * ★ The two class strings are copied here rather than imported from
 * `home-hero/shared.tsx`. That board is being reworked in the same round, and a
 * cross-board import would make this stage break when it moves; the values are
 * pinned by `ladders.test.ts` against today's ladder instead.
 */
const HERO_BOARD_LADDER = {
  desktop: "text-8xl",
  phone: "text-5xl",
} as const;

export function HeroBoardLockup({ ladder, mode }: PageProps) {
  const phone = isPhone(mode);
  // The numbers in both captions, resolved, because under Today the two
  // lockups differ ONLY in leading and a reviewer would otherwise read the
  // stage as a no-op instead of as the fault it is.
  const step = phone ? ladder.steps.hero!.phone : ladder.steps.hero!.desktop;
  const shipped = phone ? 48 : 96;
  const lockup = (title: string, body: ReactNode) => (
    <div className={phone ? "px-4 py-6 text-center" : "px-28 py-8 text-center"}>
      <p className="mb-3 text-[11px] text-white/45">{title}</p>
      {body}
      <p
        className={cn(
          "mx-auto mt-5 text-pretty text-white/80",
          phone ? "max-w-xs text-[15px]" : "max-w-xl text-[15px]",
        )}
      >
        Guests scan the code. Their photos and videos land in your album, with
        no app and no account.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" className="h-11 px-6 text-base">
          Start free
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11 border-white/35 bg-white/5 px-5 text-base text-white"
        >
          See a real album
        </Button>
      </div>
    </div>
  );
  const line = "The album starts here.";
  return (
    <div className="flex flex-col divide-y divide-white/10">
      {lockup(
        `As the hero board draws it: the ramp resolved by hand at ${shipped}px, a local leading of 1.02, and the face constant, -0.03em`,
        <h1
          // ★ THE LADDER CLASS FIRST, THE LEADING AFTER. tailwind-merge drops a
          // `leading-*` that precedes a `text-{size}` in the same cn(), because
          // a size utility may carry a line-height of its own; written the
          // other way round this h1 measured 96px at a leading of 1, which is
          // not what the hero board draws. The same note is on shared.tsx
          // ("it bit the reel twice"), and this stage is the third time.
          className={cn(
            "mx-auto font-heading text-balance text-white",
            HERO_BOARD_LADDER[mode],
            "leading-[1.02]",
          )}
          style={{ maxWidth: phone ? 340 : 1000 }}
        >
          {line}
        </h1>,
      )}
      {lockup(
        `Under ${ladder.name}: the hero step at ${step.px}px, leading ${step.lh}, tracking ${step.ls}em, all three named by the ladder`,
        <Step step="hero" ladder={ladder} mode={mode}>
          <h1
            className="mx-auto font-heading text-balance text-white"
            style={{ maxWidth: phone ? 340 : 1000 }}
          >
            {line}
          </h1>
        </Step>,
      )}
    </div>
  );
}

/* ── The app's missing middle ─────────────────────────────────────────── */

function MiddleColumn({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[11px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
      </div>
      <div className="rounded-lg border border-border bg-background p-4">
        {children}
      </div>
    </div>
  );
}

function TwoCards({ ladder, mode }: PageProps) {
  return (
    <Step
      step="card"
      ladder={ladder}
      mode={mode}
      kind="card"
      className="mt-2.5 grid gap-3"
    >
      {[
        { name: "Mara and Tom", meta: "214 photos, 23 guests" },
        { name: "Ridgeway block party", meta: "96 photos, 11 guests" },
      ].map((event) => (
        <Card key={event.name}>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>{event.meta}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </Step>
  );
}

/**
 * THE APP'S MISSING MIDDLE (round two, the second goal), judged where it lives.
 *
 * Between a 24px page title and a 16px card title the app has nothing, so the
 * tier that wants to say "Your events" is written as a label inside an h2: 11px
 * uppercase on the dashboard and the event feed, 14px on admin, and once as an
 * `sr-only` heading that is not drawn at all. Each is production's own class
 * string, beside what the selected ladder puts there.
 */
export function MissingMiddle({ ladder, mode }: PageProps) {
  const phone = isPhone(mode);
  const has = Boolean(ladder.steps.subsection);
  const spec = ladder.steps.subsection
    ? phone
      ? ladder.steps.subsection.phone
      : ladder.steps.subsection.desktop
    : null;
  const grid = {
    gridTemplateColumns: `repeat(${phone ? 1 : 2}, minmax(0, 1fr))`,
  };
  return (
    <div className="space-y-5 p-5">
      <div className="grid gap-5" style={grid}>
        <MiddleColumn
          title="As it ships: the dashboard"
          note="h2, 11px uppercase semibold, muted (feed-section, the event feed, the empty teaser)"
        >
          <h2 className={IDIOM.uppercase.className}>Your events</h2>
          <TwoCards ladder={ladder} mode={mode} />
        </MiddleColumn>
        <MiddleColumn
          title={`Under ${ladder.name}`}
          note={
            spec
              ? `the subsection step: ${spec.px}px / ${spec.lh} / ${spec.ls}em, the heading face at 600`
              : "no step at this tier, so the label stays a label and the tier stays missing"
          }
        >
          {has ? (
            <Step step="subsection" ladder={ladder} mode={mode}>
              <h2 className="font-heading font-semibold">Your events</h2>
            </Step>
          ) : (
            <h2 className={IDIOM.uppercase.className}>Your events</h2>
          )}
          <TwoCards ladder={ladder} mode={mode} />
        </MiddleColumn>
      </div>
      <div className="grid gap-5" style={grid}>
        <MiddleColumn
          title="As it ships: admin"
          note="h2, 14px medium, muted (admin metrics, announcements). The same tier, a different idiom."
        >
          <h2 className={IDIOM.label.className}>Uploads today</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Four hosts, 212 files, nothing queued.
          </p>
        </MiddleColumn>
        <MiddleColumn
          title={`Under ${ladder.name}`}
          note={
            spec
              ? "one tier, one step, both idioms retired"
              : "unchanged, and the third idiom stays too: events-section writes this heading sr-only, so the tier is sometimes not drawn at all"
          }
        >
          {has ? (
            <Step step="subsection" ladder={ladder} mode={mode}>
              <h2 className="font-heading font-semibold">Uploads today</h2>
            </Step>
          ) : (
            <h2 className={IDIOM.label.className}>Uploads today</h2>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Four hosts, 212 files, nothing queued.
          </p>
        </MiddleColumn>
      </div>
      <p className="text-[11px] text-muted-foreground">
        The third idiom is invisible: the events section writes the same heading
        sr-only, so on the dashboard the tier exists for a screen reader and not
        for the eye. A ladder with a step here is what lets that heading be
        drawn.
      </p>
    </div>
  );
}

/* ── C's app register, reconsidered ───────────────────────────────────── */

/** The three app registers side by side (round two, the seventh goal). C's
 *  round-one column is kept as history: it is what the reconsideration
 *  rejected, and Will can see the rejected thing rather than read about it. */
const REGISTERS: {
  name: string;
  note: string;
  page: Spec;
  section: Spec | null;
  card: Spec;
  verdict: string;
}[] = [
  {
    name: "Today",
    note: "24 page, no section step, 16 card",
    page: { px: 24, lh: 1.333, ls: -0.03 },
    section: null,
    card: { px: 16, lh: 1.375, ls: -0.03 },
    verdict:
      "The title is the loudest thing on a page whose subject is photographs, and the tier under it is a label.",
  },
  {
    name: "C, as round one proposed it",
    note: "20 page, 16 section, 14 card",
    page: { px: 20, lh: 1.3, ls: -0.014 },
    section: { px: 16, lh: 1.4, ls: -0.006 },
    card: { px: 14, lh: 1.45, ls: -0.002 },
    verdict: `The card title is the size of the sentence under it. A card sets text-sm on its whole subtree, so at 14 the event name is separated from its ${APP_BODY_PX}px metadata by weight and colour alone.`,
  },
  {
    name: "C, as round two ships it",
    note: "20 page, 18 section, 16 card",
    page: { px: 20, lh: 1.3, ls: -0.014 },
    section: { px: 18, lh: 1.35, ls: -0.01 },
    card: { px: 16, lh: 1.4, ls: -0.006 },
    verdict: `The quiet title holds (in an app a title is a locator, not a headline) and the floor holds under it: no heading smaller than the ${APP_BODY_PX}px body it sits on.`,
  },
];

export function AppRegisters({ mode }: { mode: Mode }) {
  const phone = isPhone(mode);
  return (
    <div
      className="grid gap-4 p-5"
      style={{
        gridTemplateColumns: `repeat(${phone ? 1 : 3}, minmax(0, 1fr))`,
      }}
    >
      {REGISTERS.map((r) => (
        <div key={r.name} className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-medium text-foreground">{r.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {r.note}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-4">
            <SpecStep spec={r.page}>
              <PageHeading>Dashboard</PageHeading>
            </SpecStep>
            <p className="text-sm text-muted-foreground">3 of 10 events used</p>
            <div className="mt-4">
              {r.section ? (
                <SpecStep spec={r.section}>
                  <h2 className="font-heading font-semibold">Your events</h2>
                </SpecStep>
              ) : (
                <h2 className={IDIOM.uppercase.className}>Your events</h2>
              )}
              <SpecStep spec={r.card} kind="card" className="mt-2.5">
                <Card>
                  <CardHeader>
                    <CardTitle>Mara and Tom</CardTitle>
                    <CardDescription>214 photos, 23 guests</CardDescription>
                  </CardHeader>
                </Card>
              </SpecStep>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {r.verdict}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── The 404 ──────────────────────────────────────────────────────────── */

/**
 * THE ONE H1 THAT IS NOT ON THE LADDER (round two, the fifth goal).
 * `not-found-screen.tsx` writes its title as `text-3xl font-semibold
 * tracking-tight sm:text-4xl`, with no `font-heading`: it is the only page
 * title on the site in Inter, and `tracking-tight` is a no-op because the theme
 * zeroes that token. It renders on the marketing 404, the app 404, the admin
 * 404 and a dead guest link, so it is not an edge case.
 */
export function NotFoundStage({ ladder, mode }: PageProps) {
  const marketingStep = ladder.steps.prose ? "prose" : "section";
  const screen = (title: string, note: string, body: ReactNode) => (
    <div className="flex flex-1 flex-col items-center gap-3 px-5 py-6">
      <div className="w-full max-w-md">
        <p className="text-[11px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{note}</p>
      </div>
      {body}
    </div>
  );
  const content = (
    <NotFoundScreen
      icon={SearchX}
      eyebrow="404"
      title="We could not find that page"
      description="The link may be old, or the event may have been deleted."
      actions={
        <Button size="lg" className="h-11 px-6 text-base">
          Back to the home page
        </Button>
      }
    />
  );
  return (
    <div
      className={cn(
        "flex",
        isPhone(mode) ? "flex-col" : "flex-row items-start",
      )}
    >
      {screen(
        "As it ships",
        "Inter at 600, 30px on a phone and 36 on a desktop, with a tracking-tight the theme zeroes",
        <SpecStep
          spec={
            isPhone(mode)
              ? { px: 30, lh: 1.2, ls: 0 }
              : { px: 36, lh: 1.111, ls: 0 }
          }
          ships
          className="flex w-full justify-center"
        >
          {content}
        </SpecStep>,
      )}
      {screen(
        `On the ladder, under ${ladder.name}`,
        `the heading face at 700, the app 404 at the page step and the marketing 404 at the ${marketingStep} step`,
        <Step
          step={marketingStep}
          ladder={ladder}
          mode={mode}
          className="flex w-full justify-center"
        >
          <div data-tsc-face className="flex justify-center">
            {content}
          </div>
        </Step>,
      )}
    </div>
  );
}

/* ── The tracking law, alone ──────────────────────────────────────────── */

/**
 * THE THIRD ASK ON ITS OWN (round two, the third goal): the same word at 160
 * and the same card title at 16, under the flat -0.03em and under the law.
 * Nothing here moves a size, which is the point: the law can be adopted
 * whichever ladder wins, and it is the only fault of the three that today's
 * sizes can fix by themselves.
 */
export function TrackingLaw({ mode }: { mode: Mode }) {
  const phone = isPhone(mode);
  const big = phone ? 52 : 160;
  const law = optics(big);
  const cardLaw = optics(16);
  const row = (label: string, ls: number, lh: number) => (
    <div>
      <p className="text-[11px] text-muted-foreground tabular-nums">
        {label}: {big}px at {ls}em
      </p>
      <p
        className="font-heading whitespace-nowrap"
        style={{ fontSize: big, lineHeight: lh, letterSpacing: `${ls}em` }}
      >
        Partyreel
      </p>
    </div>
  );
  const card = (label: string, ls: number, lh: number) => (
    <div className="flex-1">
      <p className="mb-1.5 text-[11px] text-muted-foreground tabular-nums">
        {label}: 16px at {ls}em
      </p>
      <SpecStep spec={{ px: 16, lh, ls }} kind="card">
        <Card>
          <CardHeader>
            <CardTitle>Ridgeway block party</CardTitle>
            <CardDescription>96 photos, 11 guests</CardDescription>
          </CardHeader>
        </Card>
      </SpecStep>
    </div>
  );
  return (
    <div className="flex flex-col gap-5 px-5 py-5">
      {row("The flat constant", -0.03, 0.85)}
      {row("The law", law.ls, law.lh)}
      <div
        className={cn(
          "flex gap-4 border-t border-foreground/10 pt-4",
          phone && "flex-col",
        )}
      >
        {card("The flat constant", -0.03, 1.375)}
        {card("The law", cardLaw.ls, cardLaw.lh)}
      </div>
      <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
        One value cannot serve both ends. At {big}px the constant leaves the
        word loose, because a geometric sans at a poster size wants more
        negative tracking than a UI label does; at 16px the same value pulls a
        card title tight enough to cost legibility at the size that is read
        most. The law is a function of size, so it is adoptable on its own:
        today&rsquo;s sizes, nothing moved but the leading and the tracking.
      </p>
    </div>
  );
}
