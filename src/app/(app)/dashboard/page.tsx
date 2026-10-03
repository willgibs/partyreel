import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  isPageInviteDismissed,
  PAGE_INVITE_COOKIE,
  pageChoicesHref,
  shouldInviteToPage,
} from "@/app/(app)/account/profile/invite";
import {
  claimEventAction,
  disownEventAction,
} from "@/app/(app)/dashboard/claims-actions";
import { MarkWelcomedOnMount } from "@/app/(app)/welcome/mark-welcomed";
import { ClaimsReview } from "@/components/app/dashboard/claims-review";
import { GraceBanner } from "@/components/app/dashboard/grace-banner";
import { DashboardHome } from "@/components/app/dashboard/home";
import { PageInviteCard } from "@/components/app/dashboard/page-invite-card";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { WELCOME_VALUE } from "@/components/app/pricing/return-path";
import { WelcomeToPro } from "@/components/app/pricing/welcome-to-pro";
import { seedFor } from "@/lib/avatar/seed";
import {
  DEFAULT_TIER,
  TIER_NAMES,
  effectiveStorageCap,
  toBillingTier,
} from "@/lib/constants/tiers";
import { weekEvents } from "@/lib/dashboard/attention";
import {
  EVENTS_VIEW_COOKIE,
  resolveEventsView,
} from "@/lib/dashboard/events-view";
import type { HomeContext } from "@/lib/dashboard/home-event";
import {
  buildHomeView,
  type DeletedEvent,
  type HostedEvent,
} from "@/lib/dashboard/home-view";
import { momentEvent } from "@/lib/dashboard/moment";
import { type StagePhoto, WALL_PHOTOS } from "@/lib/dashboard/stage";
import {
  calendarDayInZone,
  dayInZone,
  resolveViewerZone,
  serverZone,
  VIEWER_ZONE_HEADER,
} from "@/lib/dashboard/viewer-day";
import {
  daysFrom,
  isEvening,
  longDate,
  type Phase,
  phaseOfEvent,
} from "@/lib/dashboard/when";
import { getMyClaimableGuestRows } from "@/lib/db/queries/claims";
import {
  countArrivalsSince,
  getLastArrivals,
  getOpenedCounts,
  getStagePhotos,
} from "@/lib/db/queries/dashboard";
import {
  getDoorCounts,
  getHostDoorWaiting,
} from "@/lib/db/queries/event-doors";
import {
  countActiveEvents,
  getEventCardStats,
  getEventCardStills,
  getEventCoverUrls,
  getReelProgress,
  listEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getLiveReelServerFacts } from "@/lib/db/queries/guest-events-admin";
import { getProfile } from "@/lib/db/queries/profile";
import {
  getEventGuests,
  getMyAttendedEvents,
  getMyGuestEventCards,
} from "@/lib/db/queries/social";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { guestCount } from "@/lib/events/event-guests";
import { uploadsLabel } from "@/lib/events/visibility-labels";
import { formatCount } from "@/lib/format/count";
import { formatDateInZone } from "@/lib/format/date-in-zone";
import {
  binCountdownLabel,
  overStandbyBudget,
} from "@/lib/lifecycle/recently-deleted";
import { captureError } from "@/lib/observability/sentry";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";
import { resolveDashboardEntry } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

const HOUR_MS = 60 * 60 * 1000;

/**
 * At most this many events get readiness's own reads (the code's opens, a closed door's count) on one
 * visit: the stage's and the week's before their day, nearest first. A week holds a handful; the bound
 * keeps a planner with a wall of parties in one week from paying a read per party.
 */
const READY_READS = 12;

/** At most this many events on their day are counted for the busier rule and the pulse. */
const DAY_READS = 6;

/** A read never worth the page: its failure costs its own piece for one render, and says so. */
function quietly<T>(seam: string, fallback: T) {
  return (error: unknown): T => {
    captureError("db", error, { seam });
    return fallback;
  };
}

/**
 * THE HOST'S HOME (host-dashboard r1, Will 2026-10-02: `purpose=stage`, `needs=week`,
 * `events=seasons`, `arrivals=live`, and the board's four carried calls taken: `head`, `tile`,
 * `finished`, `busier`). The page is today's: headed by the viewer's own day, led by the party of the
 * moment on a stage of its own photographs, then this week's parties each saying its one step, then
 * everything else grouped by when. The composition is `components/app/dashboard/home.tsx` and every
 * rule under it is pure and pinned (`lib/dashboard/`); this page reads, in rounds that each ask only
 * what the one before showed the page will say.
 *
 * ★ THE REASON, IN HIS WORDS: "in 1 event dashboards (which every user will experience creating their
 * first and only event, until adding more), the experience feels much more alive that expecting many
 * more events to populate. For example, if I'm getting Partyreel for my wedding, I'm likely to only
 * have that one event for a while (maybe ever)". At one event the page is that party; at forty, time
 * picks the one that leads, and a party long over speaks only when someone waits.
 */
export default async function DashboardPage({
  searchParams,
}: {
  // `welcome=pro` is where Stripe Checkout lands a buyer with nothing to go back and finish
  // (`back=finish`, Will 2026-09-20). The legacy ?tab= / ?filter= deep links are gone with the chips
  // they drove; an old bookmark simply lands here, which is the page they wanted.
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  // Exactly the one value the checkout route sends: a hand-typed ?welcome=x must never manufacture a
  // payment confirmation, and the modal's own claim is decided by the SERVER's tier below.
  const justBought = welcome === WELCOME_VALUE;

  // All reads are RLS-scoped to the signed-in host; the (app) layout already gated on getUser(), so an
  // unauthenticated request never reaches here. `guestCards` are THE EVENTS YOU ADDED TO (guest by
  // upload, Will 2026-09-22), read from the uploads themselves. `eventCount` is COUNTED, never a list's
  // length (the 1,000-row round): the head's number is the head count the create route compares.
  const [
    events,
    eventCount,
    profile,
    guestCards,
    deletedEvents,
    storage,
    siteUrl,
    jar,
    headerList,
  ] = await Promise.all([
    listEvents(),
    countActiveEvents(),
    getProfile(),
    getMyGuestEventCards(),
    listRecentlyDeletedEvents(),
    getHostStorageSummary(),
    getSiteUrl(),
    cookies(),
    headers(),
  ]);

  // Onboarding gate: a public display name before the dashboard, and a brand-new account's one-time
  // intro, UNLESS it is a guest's (`resolveDashboardEntry`). Before any further read or any JSX, so a
  // redirected account sees zero content flash and pays for nothing it will not render.
  const entry = resolveDashboardEntry({
    displayName: profile?.display_name,
    welcomedAt: profile?.welcomed_at,
    hostedEvents: eventCount,
    guestCards: guestCards.length,
  });
  if (entry === "welcome") redirect("/welcome");

  // ★ ONE CLOCK READING, AND "TODAY" IS THE VIEWER'S OWN CALENDAR DAY, NEVER THE SERVER'S: Vercel runs
  // on UTC, so from evening on west of it the server's today is already tomorrow. The zone comes from
  // the request (`x-vercel-ip-timezone`, validated, else the server's own), is used only to render,
  // and is never stored or logged (dashboard.md). Read once, here: a Date read during render is impure.
  const viewerZone = resolveViewerZone(
    headerList.get(VIEWER_ZONE_HEADER),
    serverZone(),
  );
  const now = new Date().getTime();
  const { today, startOfTodayMs, hour } = calendarDayInZone(now, viewerZone);

  const eventIds = events.map((e) => e.id);
  // The covers and the stills each tile dissolves through, the bin's covers, the counts, how far each
  // reel is, who waits at each door, when each album last took a photograph, the claims review's rows
  // and the reel's platform lever: after the welcome gate, in parallel. Keys never reach the browser.
  const [
    cardStills,
    binCovers,
    eventStats,
    reelProgress,
    claimableRows,
    liveReelFacts,
    doorWaiting,
    lastArrivals,
  ] = await Promise.all([
    getEventCardStills(eventIds),
    getEventCoverUrls(deletedEvents.map((e) => e.id)),
    getEventCardStats(eventIds),
    getReelProgress(eventIds),
    getMyClaimableGuestRows({ previews: true }),
    // The platform lever (`ops_flags.live_reel_enabled`) is ONE global fact; any of the host's events
    // answers it. `true` (the lever's own default) when the host has none.
    eventIds.length > 0
      ? getLiveReelServerFacts(eventIds[0])
      : Promise.resolve({ liveReelEnabled: true, tier: null }),
    profile?.id && eventIds.length > 0
      ? getHostDoorWaiting(profile.id).catch(
          quietly<ReadonlyMap<string, number>>("pulse_door_waiting", new Map()),
        )
      : Promise.resolve<ReadonlyMap<string, number>>(new Map()),
    getLastArrivals(eventIds).catch(
      quietly("dashboard_last_arrivals", new Map<string, string>()),
    ),
  ]);

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  const planName = TIER_NAMES[tier];
  // Storage (the storage-cap model): ACTIVE bytes against the effective cap, what the cap is enforced
  // against, so deleting visibly frees room. The ring draws it; the rules read its percent.
  const storageCap = effectiveStorageCap(
    tier,
    profile?.storage_cap_bytes ?? null,
  );
  const storageUsed = storage.activeBytes;
  const storagePct =
    storageCap && storageCap > 0
      ? Math.min(100, Math.round((storageUsed / storageCap) * 100))
      : 0;
  const hasBilling = Boolean(profile?.stripe_customer_id);
  const passExpiry =
    tier === "event_pass" && profile?.tier_expires_at
      ? formatDateInZone(profile.tier_expires_at, viewerZone)
      : null;
  // Over-capacity grace: its deadline costs the host data, so it stays a top-level red banner, never
  // inside the ring, and it reads in the viewer's own zone (a day she has to act by).
  const graceDeadline = profile?.storage_grace_until
    ? formatDateInZone(profile.storage_grace_until, viewerZone)
    : null;

  const ctx: HomeContext = {
    today,
    evening: isEvening(hour),
    liveReelEnabled: liveReelFacts.liveReelEnabled,
    storagePct,
  };

  let hosted: HostedEvent[] = events.map((event) => {
    const stats = eventStats.get(event.id);
    const lastAt = lastArrivals.get(event.id) ?? null;
    // A range's last day (20261003120000), null for one day.
    const endDate = event.event_end_date;
    return {
      id: event.id,
      name: event.name,
      date: event.event_date,
      endDate,
      lastArrival: lastAt
        ? { at: lastAt, day: dayInZone(Date.parse(lastAt), viewerZone) }
        : null,
      createdAt: event.created_at,
      door: event.door,
      hasPassword: event.has_password,
      acceptingUploads: event.accepting_uploads,
      showReel: event.show_reel,
      description: event.description,
      approved: stats?.approved ?? 0,
      pending: stats?.pending ?? 0,
      waiting: doorWaiting.get(event.id) ?? 0,
      playable: reelProgress.get(event.id) ?? 0,
      ready: null,
      arrivals: { today: 0, lastHour: 0 },
      qrToken: event.qr_token,
      qrStyle: event.qr_style,
      stills: cardStills.get(event.id) ?? [],
      // Paused, the hub code's word, never Closed, the door's (`uploadsLabel` says why).
      uploadsLabel: uploadsLabel(event.accepting_uploads),
      dateLabel: event.event_date
        ? formatEventDate(event.event_date, endDate)
        : "No date set",
    };
  });

  // ★ THE ROUNDS THAT FOLLOW ASK ONLY WHAT THE PAGE WILL SAY. The events on their day are counted (the
  // busier rule, the pulse); readiness's own reads go to the week's parties before their day and to a
  // stage before its own; the stage alone reads its wall and its guests.
  const onTheirDay = hosted
    .filter((e) => phaseOfEvent(e, today) === "live")
    .slice(0, DAY_READS);
  // With nothing on its day, the moment needs no count, so it is known now.
  const settled = onTheirDay.length === 0 ? momentEvent(hosted, today) : null;
  const readyIds = [
    ...(settled?.phase === "before" ? [settled.event] : []),
    ...weekEvents(hosted, today).filter((e) => daysFrom(today, e.date!) > 0),
  ]
    .map((e) => e.id)
    .filter((id, i, all) => all.indexOf(id) === i)
    .slice(0, READY_READS);
  const closedIds = readyIds.filter(
    (id) => hosted.find((e) => e.id === id)?.door === "closed",
  );
  // The stage is known now unless two or more events share today: one on its day is the stage.
  const knownStage =
    settled?.event ?? (onTheirDay.length === 1 ? onTheirDay[0]! : null);
  const since = {
    today: new Date(startOfTodayMs).toISOString(),
    hour: new Date(now - HOUR_MS).toISOString(),
  };

  // The stage's own reads, by its phase: its wall on its day, and who came once it has had a day (before
  // it, the stage shows its ticks, and nobody has come).
  const stageReads = (id: string, phase: Phase) =>
    Promise.all([
      phase === "live"
        ? getStagePhotos(id, WALL_PHOTOS).catch(
            quietly<StagePhoto[] | null>("dashboard_stage_photos", null),
          )
        : Promise.resolve(null),
      phase === "before"
        ? Promise.resolve(null)
        : getEventGuests(id)
            .then(guestCount)
            .catch(quietly<number | null>("dashboard_stage_guests", null)),
    ]).then(([photos, guests]) => ({ id, photos, guests }));

  const [dayCounts, opened, closedDoors, earlyStage] = await Promise.all([
    Promise.all(
      onTheirDay.map((e) =>
        Promise.all([
          countArrivalsSince(e.id, since.today),
          countArrivalsSince(e.id, since.hour),
        ])
          .then(
            ([inToday, lastHour]) =>
              [e.id, { today: inToday, lastHour }] as const,
          )
          .catch(
            quietly("dashboard_day_counts", [
              e.id,
              { today: 0, lastHour: 0 },
            ] as const),
          ),
      ),
    ),
    getOpenedCounts(readyIds).catch(
      quietly("dashboard_opened", new Map<string, number>()),
    ),
    Promise.all(
      closedIds.map((id) =>
        getDoorCounts(id)
          .then((c) => [id, c.in] as const)
          .catch(
            quietly<readonly [string, number | null]>("dashboard_door_counts", [
              id,
              null,
            ]),
          ),
      ),
    ),
    knownStage
      ? stageReads(knownStage.id, phaseOfEvent(knownStage, today))
      : Promise.resolve(null),
  ]);

  const counts = new Map(dayCounts);
  const guestsIn = new Map(closedDoors);
  hosted = hosted.map((e) => {
    const opens = opened.get(e.id);
    // Readiness is said only where its reads came back; a door that is not closed needs no count.
    const inside = e.door === "closed" ? guestsIn.get(e.id) : 0;
    return {
      ...e,
      arrivals: counts.get(e.id) ?? e.arrivals,
      ready:
        opens !== undefined && inside !== undefined && inside !== null
          ? { opened: opens, guestsIn: inside }
          : null,
    };
  });

  // Two or more on one night: the busier leads (the counts above decide), and only then is its stage read.
  const lead = momentEvent(hosted, today)?.event ?? null;
  const stageFacts =
    earlyStage && lead && earlyStage.id === lead.id
      ? earlyStage
      : lead && phaseOfEvent(lead, today) === "live"
        ? await stageReads(lead.id, "live")
        : earlyStage;

  const deleted: DeletedEvent[] = deletedEvents.map((event) => ({
    id: event.id,
    name: event.name,
    date: event.event_date,
    endDate: event.event_end_date,
    dateLabel: event.event_date
      ? formatEventDate(event.event_date, event.event_end_date)
      : "No date set",
    coverUrl: binCovers.get(event.id) ?? null,
    deletedAt: event.deleted_at ?? event.created_at,
    countdown: binCountdownLabel(event.countdownDays),
  }));

  const view = buildHomeView({
    ctx,
    hosted,
    guests: guestCards,
    deleted,
    siteUrl,
    stageReads: stageFacts,
  });

  // THE PAGE SETUP'S INVITATION (`identity-profile` r1, `prompt=claim`), decided from server facts alone
  // (account/profile/invite.ts). The read of what her page could show runs only when it could still
  // change the answer.
  const hasHandle = Boolean(profile?.slug);
  const inviteDismissed = profile
    ? isPageInviteDismissed(
        jar.get(PAGE_INVITE_COOKIE)?.value,
        seedFor(profile.id),
      )
    : true;
  const showableEvents =
    !hasHandle && claimableRows.length === 0 && !inviteDismissed
      ? await getMyAttendedEvents().then(
          (attended) => attended.length,
          // An invitation is never worth the page: a failed read withholds it (the quiet direction).
          (error: unknown) => {
            captureError("account", error, { seam: "page_invite" });
            return 0;
          },
        )
      : 0;
  const invitePage = shouldInviteToPage({
    hasHandle,
    claimsWaiting: claimableRows.length,
    showableEvents,
    dismissed: inviteDismissed,
  });

  const counted =
    eventCount > 0
      ? `${formatCount(eventCount)} ${eventCount === 1 ? "event" : "events"}`
      : "No events yet";

  return (
    <DashboardHome
      head={{ day: longDate(today), line: `${counted} · ${planName}` }}
      view={view}
      ctx={ctx}
      initialView={resolveEventsView(jar.get(EVENTS_VIEW_COOKIE)?.value)}
      storage={
        <StorageMeter
          storageUsed={storageUsed}
          storageCap={storageCap}
          storagePct={storagePct}
          standbyBytes={storage.standbyBytes}
          overBudget={overStandbyBudget(storage.standbyBytes, storageCap)}
          passExpiry={passExpiry}
          planName={planName}
          hasBilling={hasBilling}
          isEventPass={tier === "event_pass"}
          tier={tier}
        />
      }
      top={
        <>
          {/* A guest's first visit is its welcome: marked once, from the client, since this server
              component cannot write with the visitor's cookies after it renders. */}
          {entry === "guest-first-visit" && <MarkWelcomedOnMount />}
          {justBought && (
            <WelcomeToPro
              // The webhook is the only writer of profiles.tier, and Stripe can land the buyer here
              // before it fires, so the claim is scoped to what this render can actually see.
              applied={tier !== "free"}
              planName={planName}
              capBytes={storageCap}
              nextUrl="/dashboard"
              door={{ label: "Go to your dashboard" }}
            />
          )}
        </>
      }
      alert={
        graceDeadline && (
          <GraceBanner
            deadline={graceDeadline}
            storageUsed={storageUsed}
            storageCap={storageCap}
            plan={{ tier, hasBilling }}
          />
        )
      }
      notes={
        <>
          {/* THE CLAIMS REVIEW'S BANNER: one slim line above the events (`ticket=banner`), drawn only
              while events wait or its review is open, and ALWAYS mounted, so a refresh behind an open
              review never unmounts it. Its closing toast points at the page (`after=profile`) unless
              the invitation below is about to take the banner's place (one pointer a beat). */}
          <ClaimsReview
            rows={claimableRows}
            pageHref={pageChoicesHref(hasHandle)}
            invitesOnceSorted={!hasHandle && !inviteDismissed}
            claim={claimEventAction}
            disown={disownEventAction}
          />
          {/* THE PAGE SETUP'S INVITATION, in the banner's own place: it arrives the moment the last
              decision lands and the page refreshes behind the review (`prompt=claim`). */}
          {invitePage && <PageInviteCard />}
        </>
      }
    />
  );
}
