import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { MarkWelcomedOnMount } from "@/app/(app)/welcome/mark-welcomed";
import { ClaimsCard } from "@/components/app/dashboard/claims-card";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { JustArrived } from "@/components/app/dashboard/just-arrived";
import { NextStepBand } from "@/components/app/dashboard/next-step-band";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";
import { WELCOME_VALUE } from "@/components/app/pricing/return-path";
import { WelcomeToPro } from "@/components/app/pricing/welcome-to-pro";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  effectiveStorageCap,
  formatLimit,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import {
  EVENTS_VIEW_COOKIE,
  resolveEventsView,
  type EventListRow,
} from "@/lib/dashboard/events-view";
import { resolveNextSteps } from "@/lib/dashboard/next-step";
import { getMyClaimableGuestRows } from "@/lib/db/queries/claims";
import {
  countActiveEvents,
  getEventCardStats,
  getEventCoverUrls,
  listEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getEventsWithReels, getPulse } from "@/lib/db/queries/pulse";
import { getProfile } from "@/lib/db/queries/profile";
import { getMyGuestEventCards } from "@/lib/db/queries/social";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { binCountdownLabel } from "@/lib/lifecycle/recently-deleted";
import { overStandbyBudget } from "@/lib/lifecycle/recently-deleted";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";
import { resolveDashboardEntry } from "@/lib/welcome";
import { PageHeading } from "@/components/shared/page-heading";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * THE HOST'S HOME, AS A PULSE (`home=pulse`, Will 2026-09-20; the band order
 * by `busy=collapsed`'s note, app-shape round two, 2026-09-20).
 *
 * "What needs you, then what just arrived": the steps first, then the storage
 * line, then your events, then what just arrived — beneath them, not above.
 * His words ruling the order: "I like 'just arrived' underneath the events.
 * Notices & storage are more helpful above, more global and immediately
 * helpful." The five-chip inbox is gone and so are the personal feeds — your
 * uploads, your likes and the people you follow now live in the profile's
 * owner mode, where everything else about the PERSON rather than the PARTY
 * already lives (`you=?`, his own answer in the note).
 *
 * ★ THE BAND ORDER IS ANSWERING A WORRY, NOT A TASTE. He approved the pulse
 * while warning that the old inbox existed to stop the app feeling "limited
 * and empty... until more things start to happen (which creates a very boring
 * and bland initial host experience sometimes)". So band one is a RULE over
 * real state that always has something to say (past three steps, folded
 * behind an "N more" chip — `busy=collapsed`, `NextStepBand`'s own fold), the
 * arrivals band WIDENS its window rather than going blank, and the storage
 * line and the create door are unconditional. Nothing on this page is allowed
 * to render as a void. `home-states` (app-shape round two) drew the three host
 * states on this composition: the zero-event and one-event pages hold
 * unchanged, and a busy host's band now actually folds.
 */
export default async function DashboardPage({
  searchParams,
}: {
  // `welcome=pro` is where Stripe Checkout lands a buyer with nothing to go back
  // and finish (`back=finish`, Will 2026-09-20). It replaces the old `upgraded=1`
  // receipt toast. The legacy ?tab= / ?filter= deep links are gone with the chips
  // they drove; an old bookmark simply lands on the pulse, which is the page they
  // wanted.
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  // Exactly the one value the checkout route sends: a hand-typed ?welcome=x must
  // never manufacture a payment confirmation, and the modal's own claim is
  // decided by the SERVER's tier below, never by this marker.
  const justBought = welcome === WELCOME_VALUE;

  // All reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here. Kept
  // BLOCKING (no Suspense) - dashboard streaming is deferred post-launch (S1).
  // `guestCards` are THE EVENTS YOU ADDED TO (guest by upload, Will
  // 2026-09-22: "uploading to an event is now effectively saving"): every event
  // where this account holds a live upload and does not host, read from the
  // uploads themselves, so a card leaves when its last live upload does.
  // `eventCount` is COUNTED, never `events.length` (the 1,000-row round,
  // 2026-09-23): the "X of N used" line and the cap are the same head count the
  // create route's `enforce_event_limit` compares, whatever the list holds.
  const [
    events,
    eventCount,
    profile,
    guestCards,
    deletedEvents,
    storage,
    siteUrl,
    jar,
  ] = await Promise.all([
    listEvents(),
    countActiveEvents(),
    getProfile(),
    getMyGuestEventCards(),
    listRecentlyDeletedEvents(),
    getHostStorageSummary(),
    getSiteUrl(),
    cookies(),
  ]);

  // Onboarding gate: every account must set a public display name (Phase 1) before reaching the
  // dashboard, and a brand-new one (welcomed_at null) gets the one-time intro, UNLESS it is a
  // guest's: an account that hosts nothing and already holds a Guest card (the capture's "this
  // event came with it") lands here on its first visit, and that visit is marked as its welcome
  // (`resolveDashboardEntry`, lib/welcome.ts). Runs BEFORE the presign batch + any JSX, so a
  // redirected account sees zero content flash.
  const entry = resolveDashboardEntry({
    displayName: profile?.display_name,
    welcomedAt: profile?.welcomed_at,
    hostedEvents: eventCount,
    guestCards: guestCards.length,
  });
  if (entry === "welcome") redirect("/welcome");

  // ONE clock reading for the whole render, taken HERE rather than inside any
  // component: a Date read during render is impure (react-hooks purity), and
  // two readings could straddle midnight and disagree about what "today" is.
  // Local parts, not UTC — `events.event_date` is a date-only column the whole
  // app already treats as the host's own calendar day (see formatEventDate).
  const clock = new Date();
  const now = clock.getTime();
  const startOfToday = new Date(
    clock.getFullYear(),
    clock.getMonth(),
    clock.getDate(),
  ).getTime();
  const today = `${clock.getFullYear()}-${String(clock.getMonth() + 1).padStart(2, "0")}-${String(clock.getDate()).padStart(2, "0")}`;

  const eventIds = events.map((e) => e.id);
  // Cover art for the owned AND recently-deleted cards, per-event stats, which
  // events already have a reel, the pulse's own strips, and the claim
  // ticket's rows (the guest identity round, 2026-09-22): fetched HERE,
  // after the nameless-profile redirect above, so a profile that is about to
  // bounce to /welcome never pays for a query it will not render. Keys never
  // reach the browser — everything is presigned server-side. In parallel.
  const [coverUrls, eventStats, reeledIds, pulse, claimableRows] =
    await Promise.all([
      getEventCoverUrls([...events, ...deletedEvents].map((e) => e.id)),
      getEventCardStats(eventIds),
      getEventsWithReels(eventIds),
      getPulse(eventIds, now, startOfToday),
      getMyClaimableGuestRows(),
    ]);

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  // Stacked Event Passes (billing-caps.md): event_slots is the webhook-derived concurrent-pass
  // count and overrides the static tier limit, exactly as enforce_event_limit does in SQL.
  const maxEvents = profile?.event_slots ?? MAX_EVENTS[tier];
  const used = eventCount;
  // withinLimit(current, limit) answers "can I add one more?" — so its negation
  // is "already at the cap." `null` maxEvents (Pro = unlimited) is never at cap.
  const atCap = !withinLimit(used, maxEvents);
  const planName = TIER_NAMES[tier];

  // Storage gauge (storage-cap model): ACTIVE bytes vs the effective cap (explicit override else
  // the tier default). Active bytes = non-removed media in non-deleted events — what the cap is
  // enforced against, so deleting visibly frees room. The StorageMeter owns the display.
  const storageCap = effectiveStorageCap(tier, profile?.storage_cap_bytes ?? null);
  const storageUsed = storage.activeBytes;
  const standbyBytes = storage.standbyBytes;
  const overBudget = overStandbyBudget(standbyBytes, storageCap);
  const storagePct =
    storageCap && storageCap > 0
      ? Math.min(100, Math.round((storageUsed / storageCap) * 100))
      : 0;
  const hasBilling = Boolean(profile?.stripe_customer_id);
  const passExpiry =
    tier === "event_pass" && profile?.tier_expires_at
      ? new Date(profile.tier_expires_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;
  // Over-capacity grace (set by the lifecycle cron when a lapsed account is over cap). High-urgency
  // (its deadline costs the user data), so it stays a top-level red banner, NEVER inside the meter.
  const graceDeadline = profile?.storage_grace_until
    ? new Date(profile.storage_grace_until).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Band one: the rule, over the state above.
  const steps = resolveNextSteps({
    events: events.map((e) => ({
      id: e.id,
      name: e.name,
      pending: eventStats.get(e.id)?.pending ?? 0,
      items: eventStats.get(e.id)?.approved ?? 0,
      acceptingUploads: e.accepting_uploads,
      hasReel: reeledIds.has(e.id),
      eventDate: e.event_date,
    })),
    storagePct,
    today,
  });
  // The same rule phrases the row view's trailing column, so the home never
  // tells a host two different things about one event.
  const needsByEvent = new Map(
    steps
      .filter((s) => s.eventId)
      .map((s) => [s.eventId as string, s.short] as const),
  );

  // One list, three kinds; the section's lens decides which are shown.
  const rows: EventListRow[] = [
    ...events.map((event): EventListRow => {
      const stats = eventStats.get(event.id);
      return {
        id: event.id,
        kind: "hosted",
        name: event.name,
        href: `/dashboard/${event.id}`,
        coverUrl: coverUrls.get(event.id) ?? null,
        dateLabel: event.event_date
          ? formatEventDate(event.event_date)
          : "No date set",
        sortDate: event.created_at,
        items: stats?.approved ?? 0,
        guests: null,
        pending: stats?.pending ?? 0,
        statusLabel: event.accepting_uploads ? "Open" : "Closed",
        byline: null,
        needs: needsByEvent.get(event.id) ?? null,
        qr: { token: event.qr_token, style: event.qr_style },
      };
    }),
    ...guestCards.map(
      (card): EventListRow => ({
        id: card.eventId,
        kind: "guest",
        name: card.name,
        href: card.href,
        coverUrl: card.coverUrl,
        dateLabel: card.dateLabel,
        sortDate: card.lastUploadAt,
        items: 0,
        guests: null,
        pending: 0,
        statusLabel:
          card.accessible && card.passwordProtected ? "Password" : null,
        byline: card.byline,
        needs: null,
        qr: null,
      }),
    ),
    ...deletedEvents.map(
      (event): EventListRow => ({
        id: event.id,
        kind: "deleted",
        name: event.name,
        href: null,
        coverUrl: coverUrls.get(event.id) ?? null,
        dateLabel: event.event_date
          ? formatEventDate(event.event_date)
          : "No date set",
        sortDate: event.deleted_at ?? event.created_at,
        items: 0,
        guests: null,
        pending: 0,
        statusLabel: binCountdownLabel(event.countdownDays),
        byline: null,
        needs: null,
        qr: null,
      }),
    ),
  ];

  return (
    <div className="space-y-6">
      {/* A guest's first visit is its welcome: marked once, from the client,
          since this server component cannot write with the visitor's cookies
          after it renders. It draws nothing; the Guest card below leads. */}
      {entry === "guest-first-visit" && <MarkWelcomedOnMount />}

      {justBought && (
        <WelcomeToPro
          // The webhook is the only writer of profiles.tier, and Stripe can land the
          // buyer here before it fires, so the claim is scoped to what this render can
          // actually see. `tier` is read fresh above on every dashboard render.
          applied={tier !== "free"}
          planName={planName}
          capBytes={storageCap}
          nextUrl="/dashboard"
          // Nobody was in the middle of anything: this is the purchase that
          // started somewhere with no control to return to (his own words), so
          // the door simply puts them on the home they are already looking at.
          door={{ label: "Go to your dashboard" }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeading>Dashboard</PageHeading>
          <p className="text-sm text-muted-foreground">
            {used} of {formatLimit(maxEvents)} event
            {maxEvents === 1 ? "" : "s"} used
          </p>
        </div>
        {/* The create door is UNCONDITIONAL on this page (never absent): it is
            half of what stops a quiet home reading as an empty one.
            ★ AND IT IS LIVE AT THE CAP NOW (`limit=door`, Will 2026-09-21).
            Disabling it made the refusal unreachable and unexplained: a host at
            their one event met a dead button and a paragraph further down the
            page. The route itself is the refusal now — it names the plan's
            number, names the event holding the slot, and offers both ways
            forward — so the door has to open for that to be reachable at all. */}
        <Button asChild>
          <Link
            href="/dashboard/new"
            {...trackAttrs("cta_click", {
              cta: "new-event",
              location: "dashboard",
            })}
          >
            <CalendarPlus /> New event
          </Link>
        </Button>
      </div>

      {graceDeadline && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">
            You&rsquo;re over your storage limit
          </p>
          <p className="mt-1 text-muted-foreground">
            Upgrade or remove media by{" "}
            <strong className="text-foreground">{graceDeadline}</strong>. After
            that we&rsquo;ll automatically reduce your storage (largest files
            first).{" "}
            <PricingSheet
              trigger={{ kind: "room", needed: storageUsed }}
              plan={{ tier, hasBilling }}
              returnTo="/dashboard"
            >
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-4"
              >
                See plans
              </button>
            </PricingSheet>
            .
          </p>
        </div>
      )}

      {/* BAND 1 — what needs you. Never empty: it says so calmly instead.
          `plans` is the storage step's door: the same server-derived facts
          and bytes the storage meter's "Need more?" opens its sheet on. */}
      {used > 0 && (
        <NextStepBand
          steps={steps}
          plans={{
            plan: { tier, hasBilling, passExpiry },
            needed: storageUsed,
          }}
        />
      )}

      {/* BAND 2 — the storage line, always. It was gated on having an event;
          the pulse promises it unconditionally, and a host with no events
          still has a plan and a shelf. */}
      <StorageMeter
        storageUsed={storageUsed}
        storageCap={storageCap}
        storagePct={storagePct}
        standbyBytes={standbyBytes}
        overBudget={overBudget}
        passExpiry={passExpiry}
        planName={planName}
        hasBilling={hasBilling}
        isEventPass={tier === "event_pass"}
        tier={tier}
      />

      {atCap && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          You&rsquo;ve used every event on the {planName} plan. Delete one to
          free a slot, or{" "}
          <PricingSheet
            trigger={{ kind: "room" }}
            plan={{ tier, hasBilling }}
            returnTo="/dashboard"
          >
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
            >
              upgrade for more
            </button>
          </PricingSheet>
          .
        </p>
      )}

      {/* THE CLAIM TICKET — above the events feed, rendered only when
          claimable rows exist (ClaimsCard returns null otherwise); sits
          above the create-first teaser too, since EventsSection decides
          that swap on its own `rows` prop independently of this one. */}
      <ClaimsCard rows={claimableRows} />

      {/* BAND 3 — your events, cover cards or rows, the choice remembered. */}
      <EventsSection
        rows={rows}
        newestByEvent={pulse.newestByEvent}
        initialView={resolveEventsView(jar.get(EVENTS_VIEW_COOKIE)?.value)}
        siteUrl={siteUrl}
      />

      {/* BAND 4 — what just arrived, beneath your events (his `busy` note:
          notices and storage are the more global, immediately helpful ones,
          above), in whichever window holds twelve. */}
      <JustArrived tiles={pulse.arrivals} caption={pulse.caption} />
    </div>
  );
}
