import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Globe, Images, Lock, Shield, Users } from "lucide-react";

import { EventUploads } from "@/components/app/event-uploads";
import { HostCommandStrip } from "@/components/app/host-command-strip";
import {
  ApproveAllPendingButton,
  HostMediaGrid,
} from "@/components/app/host-media-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { listEventMedia } from "@/lib/db/queries/media";
import { getProfile } from "@/lib/db/queries/profile";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import { presignDownload } from "@/lib/r2/presign";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";

// Presigned gallery URLs are per-request + short-lived, so this page must never
// be statically cached.
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it in both the page and generateMetadata.
type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? event.name : "Event" };
}

// The host event page, gallery-first (Phase 5 S3·3b): the gallery IS the page
// under a minimal header + a Share-primary command strip, mirroring the guest
// experience. Settings + the Deleted bin live on the /settings route; the QR
// designer rides with the Share dialog. (B enriches the header into the editorial
// status row; C adds the floating + command Add; D adds the review teaser.)
export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
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
  const [media, linkStats, uploaderIdentities, likeCounts] = await Promise.all([
    listEventMedia(event.id),
    getLinkStats(event.id),
    getUploaderIdentities(event.id),
    getEventLikeCounts(event.id),
  ]);
  // Two presigned URLs per item from one key: an INLINE url the grid/lightbox
  // render, and a forced-download (`attachment`) url the lightbox's Save uses.
  const galleryItems = await Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl] = await Promise.all([
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
      ]);
      // Uploader attribution (Phase 2). The HOST gallery is the ONE surface that
      // includes email (for identifying a guest); guest surfaces never carry it.
      const who = uploaderIdentities.get(m.id);
      return {
        id: m.id,
        type: m.type,
        url,
        downloadUrl,
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
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.name}
          </h1>
          {/* Stat line: date + the icon sub-stats (items / contributors / views).
              Native title only; NO radix Tooltip on these SSR'd elements (the
              host-hydration regression cause, see architecture.md). */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {event.event_date && <span>{formatEventDate(event.event_date)}</span>}
            <span
              className="flex items-center gap-1.5"
              title="Photos and videos in the album"
            >
              <Images className="size-3.5" />
              {itemCount}
            </span>
            <span
              className="flex items-center gap-1.5"
              title={contributorCount === 1 ? "1 contributor" : `${contributorCount} contributors`}
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

      <HostCommandStrip
        eventId={event.id}
        eventName={event.name}
        joinUrl={eventLink}
        qrStyle={event.qr_style}
        videosAllowed={videosAllowedForTier(tier)}
      />

      {pendingItems.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Pending review</CardTitle>
              <CardDescription>
                {pendingItems.length}{" "}
                {pendingItems.length === 1 ? "item is" : "items are"} waiting
                for your approval before guests can see them.
              </CardDescription>
            </div>
            <ApproveAllPendingButton
              eventId={event.id}
              count={pendingItems.length}
            />
          </CardHeader>
          <CardContent>
            <HostMediaGrid
              eventId={event.id}
              items={pendingItems}
              shareUrl={eventLink}
            />
          </CardContent>
        </Card>
      )}

      <EventUploads
        eventId={event.id}
        items={visibleItems}
        pendingCount={pendingItems.length}
        shareUrl={eventLink}
      />
    </div>
  );
}
