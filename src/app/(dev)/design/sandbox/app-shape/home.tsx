"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clapperboard,
  CalendarPlus,
  HardDrive,
  ListChecks,
  PauseCircle,
  Printer,
} from "lucide-react";

import { EventCard } from "@/components/app/event-card";
import { EventCardQr } from "@/components/app/event-card-qr";
import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { JustArrived } from "@/components/app/dashboard/just-arrived";
import { NextStepBand } from "@/components/app/dashboard/next-step-band";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { MAX_EVENTS, TIER_NAMES, formatLimit, withinLimit } from "@/lib/constants/tiers";
import {
  resolveNextSteps,
  type NextStep,
  type NextStepKind,
} from "@/lib/dashboard/next-step";
import { cn } from "@/lib/utils";

import {
  BUSY_ARRIVALS,
  BUSY_ARRIVALS_CAPTION,
  BUSY_EVENTS,
  BUSY_SAVED,
  BUSY_STORAGE,
  EMPTY_STORAGE,
  FIRST_EVENT,
  FIRST_STORAGE,
  type HostEvent,
  JOIN_URL,
  TODAY,
} from "./fixtures";

/**
 * THE PULSE, ACROSS THREE HOST STATES — round two's whole job.
 *
 * Round one asked what the home IS; that is answered and wired (`home=pulse`,
 * `home-wiring`, 2026-09-20). So every option below is built from the REAL
 * shipped bands — `NextStepBand`, `JustArrived`, `StorageMeter`,
 * `EventsEmptyTeaser` — fed this file's fixtures, never a redrawing of them.
 * The one exception is `busy.collapsed`: a NEW variant `next-step-band.tsx`
 * does not ship, and that file is production's (`reads`, never `owns`), so it
 * is drawn here as its own small component over the SAME `NextStep[]`
 * `resolveNextSteps` produces, restyled just enough to read as the same band.
 *
 * "Your events" is drawn as a plain grid of the real `EventCard`, never the
 * real `EventsSection`: that component's view toggle calls the real
 * `setEventsViewAction` Server Action, which writes `pr_events_view` with
 * `path: "/"` — a click inside this lab board would silently rewrite the
 * reviewer's OWN live dashboard preference. `density=cover` is already ruled
 * and wired; this round never re-asks it, so the toggle has nothing to prove
 * here and the cards-only grid is the whole of what these three asks need.
 */

/* ── The shared pieces every state's page is built from ──────────────────── */

function Head({ used, maxEvents }: { used: number; maxEvents: number | null }) {
  const atCap = !withinLimit(used, maxEvents);
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <PageHeading>Dashboard</PageHeading>
        <p className="text-sm text-muted-foreground">
          {used} of {formatLimit(maxEvents)} event{maxEvents === 1 ? "" : "s"}{" "}
          used
        </p>
      </div>
      {atCap ? (
        <Button disabled>
          <CalendarPlus /> New event
        </Button>
      ) : (
        <Button asChild>
          <Link href="/dashboard/new">
            <CalendarPlus /> New event
          </Link>
        </Button>
      )}
    </div>
  );
}

/** `resolveNextSteps`, fed one state's events — never a hand-typed step. */
function stepsFor(events: HostEvent[], storagePct: number): NextStep[] {
  return resolveNextSteps({
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      pending: e.pending,
      items: e.items,
      acceptingUploads: e.accepting,
      hasReel: e.reelClips !== null,
      eventDate: e.eventDate,
    })),
    storagePct,
    today: TODAY,
  });
}

const FIXTURE_QR_TOKEN = "a".repeat(32);
const SITE_URL = "https://partyreel.com";

/**
 * "Your events", cards only (see the file comment on why never
 * `EventsSection`). Cover cards never show a per-event "needs" label in
 * production either — only the row view's `EventsRowList` does — so this
 * takes no `needsByEvent`: the real per-event step already surfaces through
 * `NextStepBand`'s own chips, keyed by the same event.
 */
function EventsGrid({
  events,
  savedCard,
}: {
  events: HostEvent[];
  /** The one saved-event card, when this state's board has one. */
  savedCard?: typeof BUSY_SAVED;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <li key={e.id}>
          <EventCard
            href={`/dashboard/${e.id}`}
            name={e.name}
            coverUrl={e.cover}
            dateLabel={e.dateLabel}
            itemsLabel={`${e.items} ${e.items === 1 ? "item" : "items"}`}
            statusLabel={e.accepting ? "Open" : "Closed"}
            pendingCount={e.pending}
            qrSlot={
              <EventCardQr
                eventId={e.id}
                eventName={e.name}
                qrToken={FIXTURE_QR_TOKEN}
                qrStyle="classic"
                siteUrl={SITE_URL}
              />
            }
          />
        </li>
      ))}
      {savedCard && (
        <li>
          <EventCard
            variant="saved"
            href={`/e/${FIXTURE_QR_TOKEN}`}
            name={savedCard.name}
            coverUrl={savedCard.cover}
            dateLabel={savedCard.dateLabel}
            itemsLabel={null}
            statusLabel={null}
            byline={`Hosted by ${savedCard.host}`}
          />
        </li>
      )}
    </ul>
  );
}

/**
 * The same "photographic promise" ghost pack `EventsEmptyTeaser` draws its
 * cards from (public webp stills). A third independent reference to the
 * shared asset files, exactly how the dashboard teaser and the guest empty
 * state (`GUEST_GHOST_FRAMES`) each already keep their own list rather than
 * import one another's.
 */
const GHOST_IMAGES = Array.from(
  { length: 9 },
  (_, i) => `/guest-ghost/g0${i + 1}.webp`,
);

/* ── Empty: Alex Rivera, nothing created yet ─────────────────────────────── */

function EmptyStorageMeter() {
  return (
    <StorageMeter
      storageUsed={EMPTY_STORAGE.used}
      storageCap={EMPTY_STORAGE.cap}
      storagePct={EMPTY_STORAGE.pct}
      standbyBytes={EMPTY_STORAGE.standby}
      overBudget={false}
      passExpiry={null}
      planName={TIER_NAMES.free}
      hasBilling={false}
      isEventPass={false}
    />
  );
}

/** TODAY: exactly what zero events renders — the band gated off, the strip
 *  self-nulling, the storage line and the create door unconditional. */
function EmptyWizard() {
  return (
    <div className="space-y-6">
      <Head used={0} maxEvents={MAX_EVENTS.free} />
      <JustArrived tiles={[]} caption="Nothing yet" />
      <EmptyStorageMeter />
      <EventsEmptyTeaser />
    </div>
  );
}

function GhostNextStepBand() {
  return (
    <section aria-label="What needs you, not yet" className="space-y-1.5">
      <div aria-hidden className="flex flex-wrap items-center gap-2">
        <span className="h-9 w-40 rounded-full border border-dashed border-border" />
        <span className="h-9 w-48 rounded-full border border-dashed border-border" />
        <span className="h-9 w-32 rounded-full border border-dashed border-border" />
      </div>
      <p className="text-xs text-muted-foreground">
        What needs you will show up here once you have an event.
      </p>
    </section>
  );
}

function GhostJustArrived() {
  return (
    <section className="space-y-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2 className="font-heading text-subsection text-muted-foreground">
          Just arrived
        </h2>
        <span className="text-xs text-muted-foreground">
          will show your newest photos here
        </span>
      </div>
      <ul
        aria-hidden
        className="grid grid-cols-4 gap-[var(--gap-gallery)] sm:grid-cols-8 xl:grid-cols-12"
      >
        {GHOST_IMAGES.slice(0, 6).map((src) => (
          <li
            key={src}
            className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] opacity-25 grayscale"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset */}
            <img src={src} alt="" loading="lazy" className="size-full object-cover" />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The shape visible before any event is: both bands as faint placeholders. */
function EmptyGhosts() {
  return (
    <div className="space-y-6">
      <Head used={0} maxEvents={MAX_EVENTS.free} />
      <GhostNextStepBand />
      <GhostJustArrived />
      <EmptyStorageMeter />
      <EventsEmptyTeaser />
    </div>
  );
}

/** The pulse replaced by one welcome moment: a hero over the host's first
 *  three steps (derived from `HOW_IT_WORKS`, the SAME three the real
 *  `/welcome` tutorial tells — never a fourth retelling), ending in the
 *  create door. */
function EmptyGuided() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <PageHeading className="text-center">
          Welcome to Partyreel
        </PageHeading>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Create your first event and your guests start adding photos and
          videos in seconds, straight from their phones.
        </p>
      </div>
      <ul className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-3">
        {HOW_IT_WORKS.map((step) => (
          <li
            key={step.title}
            className="space-y-2 rounded-xl border border-border bg-card p-4 text-center"
          >
            <step.icon className="mx-auto size-5 text-muted-foreground" aria-hidden />
            <h2 className="font-heading text-card-title">{step.title}</h2>
            <p className="text-xs text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ul>
      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/dashboard/new">
            <CalendarPlus /> Create your first event
          </Link>
        </Button>
      </div>
    </div>
  );
}

export type EmptyOption = "wizard" | "ghosts" | "guided";
export const emptyOf = (v: string | undefined): EmptyOption =>
  v === "ghosts" || v === "guided" ? v : "wizard";

export function EmptyState({ option }: { option: EmptyOption }) {
  if (option === "ghosts") return <EmptyGhosts />;
  if (option === "guided") return <EmptyGuided />;
  return <EmptyWizard />;
}

/* ── First: Jordan Kim, one event made minutes ago ───────────────────────── */

/** `MAX_EVENTS.free` is 1: Jordan is at cap the moment the event exists, on
 *  every option below, exactly as `DashboardPage` would actually render it
 *  (see fixtures.ts's own note — left to happen, never hidden). */
function AtCapNotice() {
  return (
    <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      You&rsquo;ve used every event on the {TIER_NAMES.free} plan. Delete one
      to free a slot, or{" "}
      <Link
        href="/pricing"
        className="font-medium text-foreground underline underline-offset-4"
      >
        upgrade for more
      </Link>
      .
    </p>
  );
}

function FirstStorageMeter() {
  return (
    <StorageMeter
      storageUsed={FIRST_STORAGE.used}
      storageCap={FIRST_STORAGE.cap}
      storagePct={FIRST_STORAGE.pct}
      standbyBytes={FIRST_STORAGE.standby}
      overBudget={false}
      passExpiry={null}
      planName={TIER_NAMES.free}
      hasBilling={false}
      isEventPass={false}
    />
  );
}

function FirstEventsSection() {
  return (
    <section aria-label="Your events" className="space-y-3">
      <h2 className="font-heading text-subsection">Your events</h2>
      <EventsGrid events={[FIRST_EVENT]} />
    </section>
  );
}

/** Today's exact composition, unmodified. */
function FirstPulse() {
  const steps = stepsFor([FIRST_EVENT], FIRST_STORAGE.pct);
  return (
    <div className="space-y-6">
      <Head used={1} maxEvents={MAX_EVENTS.free} />
      <NextStepBand steps={steps} />
      <JustArrived tiles={[]} caption="Nothing yet" />
      <FirstStorageMeter />
      <AtCapNotice />
      <FirstEventsSection />
    </div>
  );
}

/** A share card leads the page: the code, the link and a copy button — the
 *  one thing not yet done, named first — before the pulse's own bands. */
function FirstShare() {
  const steps = stepsFor([FIRST_EVENT], FIRST_STORAGE.pct);
  const joinUrl = `https://${JOIN_URL}`;
  return (
    <div className="space-y-6">
      <Head used={1} maxEvents={MAX_EVENTS.free} />
      <section
        aria-label={`Share ${FIRST_EVENT.name}`}
        className="space-y-3 rounded-xl border border-border bg-card p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-heading text-subsection">
            Share {FIRST_EVENT.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            Nobody has the code yet.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <EventQr
            joinUrl={joinUrl}
            eventName={FIRST_EVENT.name}
            style={resolveQrPreset(undefined)}
          />
          <div className="w-full space-y-2 sm:max-w-xs sm:pt-1">
            <p className="text-xs font-medium text-muted-foreground">
              Or send the link
            </p>
            <CopyShareLink url={JOIN_URL} />
          </div>
        </div>
      </section>
      <NextStepBand steps={steps} />
      <JustArrived tiles={[]} caption="Nothing yet" />
      <FirstStorageMeter />
      <AtCapNotice />
      <FirstEventsSection />
    </div>
  );
}

/** The guest album's own voice, turned on the host: one hero for Jordan's one
 *  event rather than a pulse built for many. */
function FirstPromise() {
  return (
    <div className="space-y-6">
      <Head used={1} maxEvents={MAX_EVENTS.free} />
      <section className="relative overflow-hidden rounded-xl border border-border">
        <div
          aria-hidden
          className="grid grid-cols-3 gap-1 opacity-25 grayscale"
        >
          {GHOST_IMAGES.slice(0, 6).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- tiny local decorative asset
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="space-y-1.5">
            <h2 className="font-heading text-subsection text-balance">
              {FIRST_EVENT.name}&rsquo;s album starts with you
            </h2>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Share the code and the first photos will land right here.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/dashboard/${FIRST_EVENT.id}`}>Open the event</Link>
          </Button>
        </div>
      </section>
      <FirstStorageMeter />
      <AtCapNotice />
    </div>
  );
}

export type FirstOption = "share" | "promise" | "pulse";
export const firstOf = (v: string | undefined): FirstOption =>
  v === "promise" || v === "pulse" ? v : "share";

export function FirstState({ option }: { option: FirstOption }) {
  if (option === "promise") return <FirstPromise />;
  if (option === "pulse") return <FirstPulse />;
  return <FirstShare />;
}

/* ── Busy: Maya Chen, five events at once ────────────────────────────────── */

const busySteps = stepsFor(BUSY_EVENTS, BUSY_STORAGE.pct);

function BusyStorageMeter() {
  return (
    <StorageMeter
      storageUsed={BUSY_STORAGE.used}
      storageCap={BUSY_STORAGE.cap}
      storagePct={BUSY_STORAGE.pct}
      standbyBytes={BUSY_STORAGE.standby}
      overBudget={false}
      passExpiry={null}
      planName={TIER_NAMES.pro}
      hasBilling
      isEventPass={false}
    />
  );
}

function BusyEventsSection() {
  return (
    <section aria-label="Your events" className="space-y-3">
      <h2 className="font-heading text-subsection">Your events</h2>
      <EventsGrid events={BUSY_EVENTS} savedCard={BUSY_SAVED} />
    </section>
  );
}

/** As ruled, unmodified: every chip the real precedence produces. */
function BusyRuled() {
  return (
    <div className="space-y-6">
      <Head used={BUSY_EVENTS.length} maxEvents={MAX_EVENTS.pro} />
      <NextStepBand steps={busySteps} />
      <JustArrived tiles={BUSY_ARRIVALS} caption={BUSY_ARRIVALS_CAPTION} />
      <BusyStorageMeter />
      <BusyEventsSection />
    </div>
  );
}

const STEP_ICONS: Record<NextStepKind, typeof ListChecks> = {
  review: ListChecks,
  paused: PauseCircle,
  reel: Clapperboard,
  print: Printer,
  storage: HardDrive,
};

// The same tone language `next-step-band.tsx` uses (amber only where it
// matters), restyled locally rather than imported: that file's TONES map is
// not exported, and this is a proposed variant of it, not a copy fed back in.
const STEP_TONES: Record<NextStep["tone"], string> = {
  waiting: "border-transparent bg-warning/15 text-warning",
  warning: "border-warning/40 text-warning",
  quiet: "border-border text-muted-foreground",
};

const TONE_RANK: Record<NextStep["tone"], number> = {
  waiting: 0,
  warning: 1,
  quiet: 2,
};

function StepChip({ step }: { step: NextStep }) {
  const Icon = STEP_ICONS[step.kind];
  return (
    <Link
      href={step.href}
      className={cn(
        "flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
        STEP_TONES[step.tone],
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {step.label}
    </Link>
  );
}

/**
 * `busy.collapsed`: the top three steps by tone (waiting, then warning, then
 * quiet), the rest behind one chip that expands in place. A lab-only variant
 * — `next-step-band.tsx` is production's and out of this lane's `owns` — built
 * on the SAME `NextStep[]` the shipped band reads, never a duplicate of the
 * rule that produced them.
 */
function CollapsedNextStepBand({ steps }: { steps: NextStep[] }) {
  const [expanded, setExpanded] = useState(false);
  if (steps.length === 0) return <NextStepBand steps={steps} />;

  const ranked = [...steps].sort(
    (a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone],
  );
  const head = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const shown = expanded ? ranked : head;

  return (
    <section aria-label="What needs you">
      <ul className="flex flex-wrap items-center gap-2">
        {shown.map((step) => (
          <li key={`${step.kind}-${step.eventId ?? "account"}`}>
            <StepChip step={step} />
          </li>
        ))}
        {!expanded && rest.length > 0 && (
          <li>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex h-9 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-emphasis hover:text-foreground"
            >
              +{rest.length} more
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

/** The band collapsed to three, the events list untouched beneath it. */
function BusyCollapsed() {
  return (
    <div className="space-y-6">
      <Head used={BUSY_EVENTS.length} maxEvents={MAX_EVENTS.pro} />
      <CollapsedNextStepBand steps={busySteps} />
      <JustArrived tiles={BUSY_ARRIVALS} caption={BUSY_ARRIVALS_CAPTION} />
      <BusyStorageMeter />
      <BusyEventsSection />
    </div>
  );
}

/** Your events leads the page; the next-step band and Just arrived follow. */
function BusyEventsFirst() {
  return (
    <div className="space-y-6">
      <Head used={BUSY_EVENTS.length} maxEvents={MAX_EVENTS.pro} />
      <BusyEventsSection />
      <NextStepBand steps={busySteps} />
      <JustArrived tiles={BUSY_ARRIVALS} caption={BUSY_ARRIVALS_CAPTION} />
      <BusyStorageMeter />
    </div>
  );
}

export type BusyOption = "ruled" | "collapsed" | "events-first";
export const busyOf = (v: string | undefined): BusyOption =>
  v === "ruled" || v === "events-first" ? v : "collapsed";

export function BusyState({ option }: { option: BusyOption }) {
  if (option === "ruled") return <BusyRuled />;
  if (option === "events-first") return <BusyEventsFirst />;
  return <BusyCollapsed />;
}
