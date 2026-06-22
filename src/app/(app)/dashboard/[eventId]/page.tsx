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
import { EventUploads } from "@/components/app/event-uploads";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { HostCommandStrip } from "@/components/app/host-command-strip";
import { HostSelectionProvider } from "@/components/app/host-selection-provider";
import { ReelPanel } from "@/components/app/reel-panel";
import { ReelProvider } from "@/components/reel/reel-provider";
import { ReelReorderProvider } from "@/components/reel/reel-reorder-provider";
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
import { listReelItems } from "@/lib/db/queries/reel";
import { listEventMedia } from "@/lib/db/queries/media";
import { resolveInitialEventSection } from "@/lib/event/sections";
import { getProfile } from "@/lib/db/queries/profile";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import { presignDownload } from "@/lib/r2/presign";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";
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

  // The guest-facing absolute URL — the qr_token IS the capability (ADR-0004),
  // straight from the row. One link per event (ADR-0010): the command strip's
  // Share encodes it.
  const siteUrl = await getSiteUrl();
  const eventLink = `${siteUrl}/e/${event.qr_token}`;

  // Live gallery — presign each object key server-side (never expose raw keys).
  // Link analytics (aggregate counts) ride along, RLS-scoped to this host's event.
  // likeCounts is HOST-ONLY (get_event_like_counts is gated to this host) — a
  // curation signal shown as a subtle per-tile badge; never on a guest surface.
  const [media, linkStats, uploaderIdentities, likeCounts, reelIds] =
    await Promise.all([
      listEventMedia(event.id),
      getLinkStats(event.id),
      getUploaderIdentities(event.id),
      getEventLikeCounts(event.id),
      listReelItems(event.id),
    ]);
  // Two presigned URLs per item from one key: an INLINE url the grid/lightbox
  // render, and a forced-download (`attachment`) url the lightbox's Save uses.
  const galleryItems = await Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl, previewUrl] = await Promise.all([
        presignDownload({ key: m.original_key, stable: true }),
        presignDownload({
          key: m.original_key,
          stable: true,
          downloadFilename: buildDownloadFilename({
            eventName: event.name,
            key: m.original_key,
            type: m.type,
          }),
        }),
        // The tile-only small preview (this page builds its OWN items, not via toGridItems).
        m.preview_key
          ? presignDownload({ key: m.preview_key, stable: true })
          : Promise.resolve(null),
      ]);
      // Uploader attribution (Phase 2). The HOST gallery is the ONE surface that
      // includes email (for identifying a guest); guest surfaces never carry it.
      const who = uploaderIdentities.get(m.id);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
        previewUrl,
        status: m.status,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        isAnonymous: who?.isAnonymous ?? false,
        uploaderEmail: who?.email ?? null,
        likeCount: likeCounts.get(m.id) ?? 0,
        // Natural geometry for the masonry (S3·3a). Null on pre-measure rows ->
        // the grid falls back to 1:1 (no CLS). Rides OUTSIDE any ETag.
        width: m.width,
        height: m.height,
        durationSeconds: m.duration_seconds,
      };
    }),
  );

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
  // Visibility chip glyph + label (Open / Password / Private).
  const VisibilityIcon =
    event.visibility === "open"
      ? Globe
      : event.visibility === "password"
        ? Lock
        : Shield;
  const visibilityLabel =
    event.visibility === "open"
      ? "Open"
      : event.visibility === "password"
        ? "Password"
        : "Private";

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
          <PageHeading className="text-3xl">
            {event.name}
          </PageHeading>
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
          {/* ReelReorderProvider shares the Reel drag-reorder MODE between the header Reorder/Done button
              and the Reel section body (the sortable grid). HostSelectionProvider shares the Gallery
              album bulk-select state so the floating bar's bulk cluster and the gallery grid's tiles +
              long-press drive one selection. Both inside ReelProvider (the shared reel membership). */}
          <ReelReorderProvider>
            <HostSelectionProvider>
            <EventFeed
              eventId={event.id}
              moderationOn={isModerationOn}
              initialSection={initialSection}
              pendingItems={pendingItems}
              galleryCount={visibleItems.length}
              reelCount={reelIds.length}
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
                  items={visibleItems}
                  shareUrl={eventLink}
                />
              }
            />
            </HostSelectionProvider>
          </ReelReorderProvider>
        </ReelProvider>
      </HostAddProvider>
    </div>
  );
}
