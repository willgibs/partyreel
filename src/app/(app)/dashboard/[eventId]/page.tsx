import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Globe,
  Images,
  Lock,
  Shield,
  Users,
} from "lucide-react";

import { EventFeed } from "@/components/app/event-feed/event-feed";
import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { EventUploads } from "@/components/app/event-uploads";
import { GuestList } from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { HostCommandStrip } from "@/components/app/host-command-strip";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { ReelPanel } from "@/components/app/reel-panel";
import { ReelProvider } from "@/components/reel/reel-provider";
import { ReelStageProvider } from "@/components/reel/reel-stage-provider";
import {
  DEFAULT_TIER,
  toBillingTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { getLinkStats } from "@/lib/db/queries/analytics";
import { getEvent } from "@/lib/db/queries/events";
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { getReelConfig, listReelItems } from "@/lib/db/queries/reel";
import { getEventGuestList } from "@/lib/db/queries/social";
import { listEventMedia } from "@/lib/db/queries/media";
import { withAvatarUrls } from "@/lib/social/cards";
import { toHostGalleryItems } from "@/lib/event/gallery-items";
import { resolveInitialEventSection } from "@/lib/event/sections";
import { getProfile } from "@/lib/db/queries/profile";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";
import { VISIBILITY_LABELS } from "@/lib/events/visibility-labels";
import { PageHeading } from "@/components/shared/page-heading";

// Presigned gallery URLs are per-request + short-lived, so this page must never
// be statically cached.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it.
type PageProps = {
  params: Promise<{ eventId: string }>;
  // `?section=` is the new feed filter; `?eventTab=` is the legacy tab alias (still honored).
  searchParams: Promise<{ section?: string; eventTab?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? event.name : "Event" };
}

// The host event page, media-forward feed: a minimal header + a Share-primary command strip, then
// a dashboard-style STACKED, PILL-FILTERED feed (the tabs are retired) — "All" stacks Review +
// Gallery + Reel in urgency order, pills narrow to one, the review pop-up is inlined, and a
// contextual floating action bar follows the scroll. Settings + the Deleted bin live on the
// /settings route; the QR designer rides with the Share dialog.
export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { eventId } = await params;
  const { section, eventTab } = await searchParams;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  // Tier gates uploads (videos are paid-only). The (app) layout already gated on
  // getUser(), so profile is the signed-in host's.
  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  // The guest-facing absolute URL — the qr_token IS the capability (database-security.md),
  // straight from the row. One link per event (guest-flow.md): the command strip's
  // Share encodes it.
  const siteUrl = await getSiteUrl();
  const eventLink = `${siteUrl}/e/${event.qr_token}`;

  // Live gallery — presign each object key server-side (never expose raw keys).
  // Link analytics (aggregate counts) ride along, RLS-scoped to this host's event.
  // likeCounts is HOST-ONLY (get_event_like_counts is gated to this host) — a
  // curation signal shown as a subtle per-tile badge; never on a guest surface.
  const [
    media,
    linkStats,
    uploaderIdentities,
    likeCounts,
    reelIds,
    reelConfig,
    guestListEntries,
  ] = await Promise.all([
    listEventMedia(event.id),
    getLinkStats(event.id),
    getUploaderIdentities(event.id),
    getEventLikeCounts(event.id),
    listReelItems(event.id),
    // The composer config (theme/seed/length/cover); null until the host first composes.
    getReelConfig(event.id),
    // profiles-social.md Guests section: null = show_guest_list off (or the pre-apply
    // seam) -> the section renders its turn-it-on teaser instead of a list.
    getEventGuestList(event.id),
  ]);
  const guestListItems = guestListEntries
    ? await withAvatarUrls(guestListEntries)
    : null;
  // The presign + attribution + quick-add-signal mapping lives in ONE place
  // (lib/event/gallery-items) because the Studio route needs the identical items;
  // two pages hand-building "the same" shape is how a field goes missing on one.
  const galleryItems = await toHostGalleryItems({
    media,
    eventName: event.name,
    uploaderIdentities,
    likeCounts,
  });

  // Partition for the host view: hold_for_approval uploads arrive as 'pending'
  // and get their own review queue above the main grid; approved + hidden make
  // up the rest (the host still sees hidden items so they can unhide). 'removed'
  // never reaches here — listEventMedia filters it out.
  const pendingItems = galleryItems.filter((m) => m.status === "pending");
  const visibleItems = galleryItems.filter((m) => m.status !== "pending");

  // The Review section is always present under moderation (urgency-ordered: top while a queue
  // waits, bottom when caught up); a moderation-off teaser offers to turn it on. The initial filter
  // is "all" by default (the review-first behavior is now SPATIAL — the top of the stack — not a
  // landing tab); a legacy ?eventTab= deep link still resolves (reviews -> the review section).
  const isModerationOn = event.moderation_mode === "hold_for_approval";
  const initialSection = resolveInitialEventSection(section, eventTab);

  // One "views" metric now (the album/join split is gone); sum keeps historical counts.
  const views = linkStats.qrScans + linkStats.albumViews;
  // Config-aware: what a guest experiences with the link (visibility + accounts +
  // uploads). Shares the single-source helper with the settings form's live
  // preview, so the two never drift. (B folds this into the editorial header.)
  const accessLine = guestExperienceSummary({
    visibility: event.visibility,
    accountRequired: !event.allow_anonymous_uploads,
    acceptingUploads: event.accepting_uploads,
  });

  // Header sub-stats (S3·3b·B). contributorCount is computed HERE, not via
  // getGalleryStats (which zeroes counts for password/private events as a GUEST
  // privacy guard) so the host always sees real numbers on their OWN event:
  // distinct guest_id across the visible album + 1 if the host uploaded (a null
  // guest_id). itemCount mirrors the gallery's "N items" (approved + hidden;
  // pending lives in the review queue, not the album count).
  const visibleMedia = media.filter((m) => m.status !== "pending");
  const itemCount = visibleMedia.length;
  const guestContributors = new Set<string>();
  let hostContributed = false;
  for (const m of visibleMedia) {
    if (m.guest_id) guestContributors.add(m.guest_id);
    else hostContributed = true;
  }
  const contributorCount = guestContributors.size + (hostContributed ? 1 : 0);
  // Visibility chip glyph + label (Public / Password / Private).
  // ★ The word for `visibility = 'open'` is "Public", never "Open" (Will's ruling,
  // 2026-09-02: "Public sounds much clearer than open"). "Open" belongs to the
  // ACCEPTING-UPLOADS state alone, which is the chip rendered right beside this one, and
  // this label read "Open" while the settings selector called the same row "Public".
  // The word comes from the server-safe record in lib/events/visibility-labels.ts,
  // the same module the client selector and the marketing access switch read (it used
  // to be re-typed here because an RSC cannot dot into a "use client" module).
  const VisibilityIcon =
    event.visibility === "open"
      ? Globe
      : event.visibility === "password"
        ? Lock
        : Shield;
  const visibilityLabel = VISIBILITY_LABELS[event.visibility];

  return (
    <div data-route-fade className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to events
        </Link>
        <div className="space-y-2">
          {/* No size override: the event name is this page's h1 and wears the
              ladder's `page` step like every other app title (2026-09-17). */}
          <PageHeading>{event.name}</PageHeading>
          {/* Stat line: date + the icon sub-stats (items / contributors / views).
              Native title only; NO radix Tooltip on these SSR'd elements (the
              host-hydration regression cause, see architecture.md). */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {event.event_date && (
              <span>{formatEventDate(event.event_date)}</span>
            )}
            <span
              className="flex items-center gap-1.5"
              title="Photos and videos in the album"
            >
              <Images className="size-3.5" />
              {itemCount}
            </span>
            <span
              className="flex items-center gap-1.5"
              title={
                contributorCount === 1
                  ? "1 contributor"
                  : `${contributorCount} contributors`
              }
            >
              <Users className="size-3.5" />
              {contributorCount}
            </span>
            <span className="flex items-center gap-1.5" title="Views">
              <Eye className="size-3.5" />
              {views}
            </span>
          </div>
          {/* Config status: how the link behaves for guests, at a glance. The
              visibility chip's title carries the full plain-language summary. */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground"
              title={accessLine}
            >
              <VisibilityIcon className="size-3" />
              {visibilityLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${event.accepting_uploads ? "bg-success" : "bg-muted-foreground/40"}`}
              />
              {event.accepting_uploads ? "Accepting uploads" : "Uploads paused"}
            </span>
          </div>
        </div>
      </div>

      {/* HostAddProvider shares the "add photos" state so the feed's contextual floating bar (the
          Gallery action) opens the SAME upload panel the command strip hosts. ReelProvider wraps the
          feed (the shared reel-membership source), so adding from the Gallery reflects instantly in
          the Reel section. The Gallery + Reel sections are pre-rendered SLOTS (client islands fed by
          RSC-resolved props — presigned, hydration-safe); the Review queue crosses as DATA because
          its inline triage is interactive (driven by the feed + the floating bar). */}
      <HostAddProvider>
        <HostCommandStrip
          eventId={event.id}
          eventName={event.name}
          joinUrl={eventLink}
          qrStyle={event.qr_style}
          videosAllowed={videosAllowedForTier(tier)}
        />
        <ReelProvider eventId={event.id} initialReelIds={reelIds}>
          {/* HostSelectionProvider shares the Gallery album bulk-select state so the floating bar's bulk
              cluster and the gallery grid's tiles + long-press drive one selection; it sits inside
              ReelProvider (the shared reel membership, which its "Add to reel" bulk action commits).
              ReelStageProvider wraps the FEED (not just the Reel section) because the reel's
              lifecycle stage has two readers: the section, which is either the builder or the
              Marquee, and the floating action bar, which is either Create reel or Open studio.
              (A ReelReorderProvider used to wrap these two; host-app.md moved reorder into the Studio's
              dock, so the feed no longer has a reorder MODE to share.) */}
          <HostSelectionProvider>
            <ReelStageProvider initialCreated={reelConfig != null}>
              <EventFeed
                eventId={event.id}
                moderationOn={isModerationOn}
                initialSection={initialSection}
                pendingItems={pendingItems}
                galleryCount={visibleItems.length}
                // ★ The reel count IS listReelItems' length, on purpose. That query already applies
                // the MEMBERSHIP predicate (media status in approved|hidden, ghosts dropped), so the
                // pill and the ReelProvider seed agree by construction. Do NOT re-filter here against
                // visibleItems: a second, differently scoped predicate is exactly how the count and
                // the grid drifted apart before.
                reelCount={reelIds.length}
                guestsCount={guestListItems?.length ?? 0}
                guestsSection={
                  guestListItems ? (
                    <GuestList items={guestListItems} />
                  ) : (
                    // The host key is off: the discovery teaser (the review
                    // moderation-off pattern). The consented flip lives in
                    // Settings, where the LOUD copy spells out what it does.
                    <FeedSectionEmpty
                      icon={Users}
                      title="Introduce your guests"
                      desc="Turn on the guest list to name everyone who added photos while signed in, right on the album."
                      action={
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/${event.id}/settings`}>
                            Guest list settings
                          </Link>
                        </Button>
                      }
                    />
                  )
                }
                gallerySection={
                  <EventUploads
                    eventId={event.id}
                    items={visibleItems}
                    pendingCount={pendingItems.length}
                    shareUrl={eventLink}
                  />
                }
                reelSection={
                  <ReelPanel
                    eventId={event.id}
                    eventName={event.name}
                    items={visibleItems}
                    reelConfig={reelConfig}
                    // Free reels carry the partyreel.com wordmark (the upgrade nudge); the player
                    // mirrors it so the host sees what they'll download. The render route re-derives
                    // this server-side — the client flag is cosmetic only. The tier likewise drives
                    // the length cap (30s/60s), UX only.
                    watermark={tier === "free"}
                    tier={tier}
                    guestVisible={reelConfig?.guestVisible ?? false}
                  />
                }
              />
            </ReelStageProvider>
          </HostSelectionProvider>
        </ReelProvider>
      </HostAddProvider>
    </div>
  );
}
