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

import { MetricCard } from "@/components/admin/metric-card";
import type { Mode } from "@/components/dev/board";
import { Caption } from "@/components/marketing/system/caption";
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
import { cn } from "@/lib/utils";

import { optics, type Ladder, type Spec, type StepId } from "./ladders";

/**
 * THE REAL PAGES THE LADDER IS JUDGED ON.
 *
 * Since round four the MARKETING surfaces are the routes themselves, in frames
 * at the canvas's true pixels (board.tsx's PageFrame over REAL_PAGES), so what
 * is left here is four surfaces that stay composed, plus the two stages that
 * are arguments rather than pages (the app's missing middle, and the tracking
 * law on its own).
 *
 * WHY THESE FOUR ARE NOT FRAMES, since three of them are perfectly reachable.
 * The dashboard has always mounted a design island, and admin and the guest
 * routes mount one now (round four), so all three are in WALK and wear an
 * applied block in a real tab. It is judging them in a frame that does not
 * work, for three separate reasons:
 *  - /admin is behind `requireAdmin()` and a second factor, so a frame of it
 *    renders a 404 or an MFA enrollment screen for the host account this board
 *    is reviewed on, not the portal;
 *  - the dashboard and the event page render whatever events the REVIEWER's own
 *    account holds, so the thing being compared changes between two flips of
 *    the switch, and a type ruling wants the same words under both;
 *  - sign-in does not resolve on localhost by design (the Supabase redirect
 *    allow-list), so with Vercel capped this round a signed-in frame could not
 *    have been verified at all before the handoff, and an unverified frame is
 *    exactly the control-that-shows-nothing this board keeps removing.
 * The root 404 is the fourth, and that one really is unreachable: it renders
 * outside every island (NO_ISLAND in ladders.ts). A composed stage also carries
 * what no frame can, the tier production does not have (MissingMiddle), since a
 * frame only ever moves what a hook reaches. The decline is written on the
 * board itself, under act three.
 *
 * Each is composed from the production components (PageHeading, Card, Button,
 * Badge, NotFoundScreen) with production copy, and none of them is modified: a
 * <Step> wrapper hands the selected pair's size, leading and tracking to
 * board.css, which spends them on whatever heading the component renders.
 * Change the app ladder in the dock and the same components re-lay themselves
 * out, which is the only way a type proposal can be judged rather than imagined.
 *
 * One thing is hand-resolved per canvas, for the reason the home-hero board
 * carries a GUTTER constant: a stage is a 375 or 1440 canvas inside a real
 * window, so Tailwind's `sm:`/`lg:` breakpoints read the WINDOW even at 1:1
 * (that is exactly what the frames fix for the real pages). Every column count
 * here comes from `mode`, never from a responsive utility.
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
 *  two places that show a value no ladder carries: the tracking law at one size
 *  under two tracking values, and the 404's title as production ships it. */
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

/* ═════════════ ROUND FOUR CUT EVERY MARKETING RECONSTRUCTION ═══════════════

   Four stages stood here: the home's two section tiers, a feature page, /about
   on paper, and the hero board's lockup. All four were the production
   components re-composed by hand, and round four replaced them with the ROUTES
   (REAL_PAGES in ladders.ts, rendered by the board's PageFrame): the real home
   arc top to bottom, /pricing, a feature page, /help, a help article and
   /about, each in a frame exactly the canvas wide with the selected pair
   injected into it.

   A frame beats a reconstruction at three things a type ruling turns on. Its
   breakpoints are the CANVAS's rather than the browser window's, so the phone
   end is the page's real phone end; its `vw` measures the frame, so the clamp
   the wiring round bakes is EVALUATED rather than resolved here by hand; and
   everything on the page moves, so the sixteen hand-rolled headings no hook
   reaches are visible as the reach of the ruling instead of a footnote about
   it. The app stages below stay composed, and for one reason only: /dashboard,
   an event page and /admin are behind a sign-in, so a frame would render the
   login screen. ═════════════════════════════════════════════════════════════ */

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

/* ROUND THREE cut the admin-page stage. It rendered the same two app steps as
   the dashboard above it (PageHeading and CardTitle) with admin's own label
   idiom, and that idiom is already on the missing-middle stage beside the
   dashboard's. A paste cannot reach /admin anyway (no design island in
   admin/layout.tsx, which is named on the board), so this stage was the third
   telling of the same thing. */

/**
 * AN ADMIN PAGE (round four put it back; round three had cut it).
 *
 * Will asked for admin among the judged surfaces, and it earns its place again
 * now that the two registers are ruled separately: admin is where the app's
 * quiet register is quietest, and where the missing middle is written in its
 * SECOND idiom (a 14px medium h2, not the dashboard's 11px uppercase one). The
 * tiles are the production `MetricCard`, whose value is a `text-2xl` numeral
 * that is deliberately NOT on the heading ladder: it is a data numeral on the
 * body face with tabular figures, and it is drawn here because an app register
 * that drops the page title to 20 puts the title BELOW the numbers on its own
 * page, which is the one thing about C that a dashboard cannot show.
 */
export function AdminPage({ ladder, mode }: PageProps) {
  const phone = isPhone(mode);
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Step step="page" ladder={ladder} mode={mode}>
          <PageHeading>Metrics</PageHeading>
        </Step>
        <span className="text-xs text-muted-foreground">
          Operations portal, last 30 days
        </span>
      </div>

      <div className="space-y-3">
        <AppSection ladder={ladder} mode={mode} idiom="label">
          Platform
        </AppSection>
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${phone ? 2 : 4}, minmax(0, 1fr))`,
          }}
        >
          {[
            {
              label: "Hosts",
              value: "1,284",
              sub: "+38 this week",
              icon: Users,
            },
            {
              label: "Events",
              value: "3,106",
              sub: "212 live now",
              icon: CalendarPlus,
            },
            {
              label: "Media",
              value: "412,980",
              sub: "9.2 TB stored",
              icon: Images,
            },
            { label: "Views", value: "88,412", sub: "album opens", icon: Eye },
          ].map((m) => (
            <MetricCard
              key={m.label}
              label={m.label}
              value={m.value}
              sub={m.sub}
              icon={m.icon}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <AppSection ladder={ladder} mode={mode} idiom="label">
          Needs a human
        </AppSection>
        <Step step="card" ladder={ladder} mode={mode} kind="card">
          <Card>
            <CardHeader>
              <CardTitle>Four reports open</CardTitle>
              <CardDescription>
                Oldest is eleven hours. Two are the same album.
              </CardDescription>
            </CardHeader>
          </Card>
        </Step>
      </div>
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

/* ROUND THREE cut the app-registers stage (today, C as round one proposed it,
   C as round two ships it). Its question was settled by round two's own
   reconsideration: the floor is a law every ladder obeys and `ladders.test.ts`
   pins it, so there was nothing left on that stage for Will to rule on, and a
   rejected proposal kept on the board is an ask he has to read past. What it
   showed, toggling the dashboard stage between today and C shows live. The
   reasoning lives in the C comment in ladders.ts and in the manifest. */

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
 * THE TRACKING ASK ON ITS OWN, AND THE PAIRING UNDER IT.
 *
 * The same word at the masthead size and the same card title at 16, under the
 * flat -0.03em and under the law. Nothing in the first half moves a size, which
 * is the point: the law is adoptable whichever ladder wins, and it is the only
 * fault of the three that today's numbers can fix by themselves.
 *
 * ★ ROUND THREE folded the pairing stage in here rather than giving it a stage
 * of its own. The pairing and the tracking are the same evidence read twice:
 * what makes Urbanist look wrong at a poster size is the constant, not the
 * face, so the verdict belongs directly under the demonstration of the
 * constant. The pairing is a departure with a verdict now, not an ask.
 *
 * The first half does NOT move with the ladder toggle (it is today's sizes
 * under two tracking rules) and says so on the board; the pairing rows below
 * take the selected ladder's title step.
 */
export function TrackingLaw({ ladder, mode }: PageProps) {
  const phone = isPhone(mode);
  const big = phone ? 52 : 160;
  const law = optics(big);
  const cardLaw = optics(16);
  const titlePair = ladder.steps.title!;
  const title = phone ? titlePair.phone : titlePair.desktop;
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
        Neither row above moves with the ladder toggle, which is what makes this
        a separate ruling.
      </p>

      <div className="flex flex-col gap-4 border-t border-foreground/10 pt-5">
        <p className="text-[11px] font-medium">
          And the face pairing, which the same evidence answers
        </p>
        <div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            Urbanist at the title step, tracked the way it ships: -0.03em at
            every size
          </p>
          <p
            className="font-heading"
            style={{
              fontSize: title.px,
              lineHeight: title.lh,
              letterSpacing: "-0.03em",
            }}
          >
            Every photo, from every guest
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            The same face and size at this step&rsquo;s own tracking, {title.ls}
            em
          </p>
          <p
            className="font-heading"
            style={{
              fontSize: title.px,
              lineHeight: title.lh,
              letterSpacing: `${title.ls}em`,
            }}
          >
            Every photo, from every guest
          </p>
        </div>
        <p className="max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          Inter underneath, unchanged. The board&rsquo;s verdict: the pairing
          holds, so there is no face ask. A geometric sans at a poster size
          wants more negative tracking than a UI label does, and the constant is
          the whole of what makes Urbanist read loose at {big}px and cramped at
          16. Fix the tracking and no case for a new face is left standing.
        </p>
      </div>
    </div>
  );
}
