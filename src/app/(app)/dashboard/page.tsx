import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import { DashboardFeed } from "@/components/app/dashboard/dashboard-feed";
import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { EventsSection } from "@/components/app/dashboard/events-section";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { TrashSection } from "@/components/app/dashboard/trash-section";
import { MyLikesGallery } from "@/components/app/my-likes-gallery";
import { MyUploadsGallery } from "@/components/app/my-uploads-gallery";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_TIER,
  MAX_EVENTS,
  TIER_NAMES,
  effectiveStorageCap,
  formatLimit,
  toBillingTier,
  withinLimit,
} from "@/lib/constants/tiers";
import { resolveInitialFilter } from "@/lib/dashboard/filters";
import { resolveDashboardLayout } from "@/lib/dashboard/layout";
import {
  getEventCardStats,
  getEventCoverUrls,
  listEvents,
  listRecentlyDeletedEvents,
} from "@/lib/db/queries/events";
import { getMyLikeCards } from "@/lib/db/queries/my-likes";
import { getMyUploadCards } from "@/lib/db/queries/my-uploads";
import { getProfile } from "@/lib/db/queries/profile";
import { getSavedEventCards } from "@/lib/db/queries/saved-events";
import { getHostStorageSummary } from "@/lib/db/queries/storage";
import { overStandbyBudget } from "@/lib/lifecycle/recently-deleted";
import { getSiteUrl } from "@/lib/site-url";
import { needsDisplayName, shouldShowWelcome } from "@/lib/welcome";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  // The feed is deep-linkable via ?filter= (all|events|uploads|likes|trash);
  // legacy ?tab= bookmarks still resolve (see resolveInitialFilter).
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const { tab, filter } = await searchParams;

  // All reads are RLS-scoped to the signed-in host; the (app) layout already
  // gated on getUser(), so an unauthenticated request never reaches here. Kept
  // BLOCKING (no Suspense) - dashboard streaming is deferred post-launch (S1).
  const [
    events,
    profile,
    savedCards,
    deletedEvents,
    storage,
    uploads,
    likes,
    siteUrl,
  ] = await Promise.all([
    listEvents(),
    getProfile(),
    getSavedEventCards(),
    listRecentlyDeletedEvents(),
    getHostStorageSummary(),
    getMyUploadCards(),
    getMyLikeCards(),
    getSiteUrl(),
  ]);

  // Onboarding gate: a brand-new account (welcomed_at null) gets the one-time intro, AND every
  // account must set a public display name (Phase 1) before reaching the dashboard. Runs BEFORE
  // the presign batch + any JSX, so a nameless account redirects with zero content flash.
  if (needsDisplayName(profile?.display_name) || shouldShowWelcome(profile?.welcomed_at)) {
    redirect("/welcome");
  }

  // Cover art for the owned AND recently-deleted cards + per-event stats (approved/pending), both
  // keyed by event id. One presign batch (a deleted event's media stay non-removed, so it still
  // resolves a cover); stats drive the V3 card's item pill + amber review chip. Keys never reach
  // the browser — presigned here. In parallel.
  const [coverUrls, eventStats] = await Promise.all([
    getEventCoverUrls([...events, ...deletedEvents].map((e) => e.id)),
    getEventCardStats(events.map((e) => e.id)),
  ]);

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  const maxEvents = MAX_EVENTS[tier];
  const used = events.length;
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

  // The single-feed layout gates (pure + unit-tested, the four canonical states): meter visibility
  // (1+ events OR standby bytes to report), chip visibility (anything to navigate), and the
  // teaser-vs-gallery emptiness per section.
  const layout = resolveDashboardLayout({
    events: used,
    saved: savedCards.length,
    uploads: uploads.items.length,
    likes: likes.items.length,
    deleted: deletedEvents.length,
    standbyBytes,
  });

  // The four section slots, rendered server-side (presigned URLs never cross as client data) and
  // handed to the client feed. Events owns its own card-grid-or-create-hero; uploads/likes show the
  // gallery when populated (it owns becoming-empty on client-only unlike) else the slim teaser.
  const eventsSection = (
    <EventsSection
      events={events}
      savedCards={savedCards}
      coverUrls={coverUrls}
      eventStats={eventStats}
      siteUrl={siteUrl}
    />
  );
  const uploadsSection = layout.uploadsEmpty ? (
    <EmptySectionTeaser
      heading="Your uploads"
      blurb="Photos and videos you add to any event, yours or a friend's, collect here."
    />
  ) : (
    <FeedSection heading="Your uploads">
      <MyUploadsGallery items={uploads.items} truncated={uploads.truncated} />
    </FeedSection>
  );
  const likesSection = layout.likesEmpty ? (
    <EmptySectionTeaser
      heading="Your likes"
      blurb="Tap the heart on any photo or video and it lands here, across every event."
    />
  ) : (
    <FeedSection heading="Your likes">
      <MyLikesGallery items={likes.items} truncated={likes.truncated} />
    </FeedSection>
  );
  const trashSection = (
    <TrashSection deletedEvents={deletedEvents} coverUrls={coverUrls} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {used} of {formatLimit(maxEvents)} event
            {maxEvents === 1 ? "" : "s"} used
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
            <Link
              href="/pricing"
              className="font-medium text-foreground underline underline-offset-4"
            >
              See plans
            </Link>
            .
          </p>
        </div>
      )}

      {/* Ambient storage meter — hosting telemetry: shown with an event OR standby bytes to report
          (so a host who deleted every event still sees their Trash-budget status). */}
      {layout.showMeter && (
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
        />
      )}

      {atCap && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          You&rsquo;ve used every event on the {planName} plan. Delete one to
          free a slot, or{" "}
          <Link
            href="/pricing"
            className="font-medium text-foreground underline underline-offset-4"
          >
            upgrade for more
          </Link>
          .
        </p>
      )}

      <DashboardFeed
        initialFilter={resolveInitialFilter(tab, filter)}
        trashCount={deletedEvents.length}
        showChips={layout.showChips}
        eventsSection={eventsSection}
        uploadsSection={uploadsSection}
        likesSection={likesSection}
        trashSection={trashSection}
      />
    </div>
  );
}
