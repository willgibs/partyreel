import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { EventSlugControl } from "@/components/app/event-slug-control";
import { QrDesignerDialog } from "@/components/app/qr-designer-dialog";
import { EventSettingsForm } from "@/components/app/event-settings-form";
import { EventUploads } from "@/components/app/event-uploads";
import {
  ApproveAllPendingButton,
  HostMediaGrid,
} from "@/components/app/host-media-grid";
import {
  RecentlyDeletedGrid,
  type BinMedia,
} from "@/components/app/recently-deleted-grid";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import {
  DEFAULT_TIER,
  isSettingLocked,
  toBillingTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { getLinkStats } from "@/lib/db/queries/analytics";
import { getEvent } from "@/lib/db/queries/events";
import { getUploaderIdentities } from "@/lib/db/queries/guest-events-admin";
import { getEventLikeCounts } from "@/lib/db/queries/likes";
import { listEventMedia, listRecentlyDeletedMedia } from "@/lib/db/queries/media";
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

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  // Tier gates the settings form (e.g. requiring an account is paid-only). The (app)
  // layout already gated on getUser(), so profile is the signed-in host's.
  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  // Build the guest-facing absolute URLs server-side. The tokens are the
  // capability (ADR-0004); they come straight from the row the DB generated.
  const siteUrl = await getSiteUrl();
  // One link per event (ADR-00010): the QR encodes it, and the host shares it.
  const eventLink = `${siteUrl}/e/${event.qr_token}`;

  // Live gallery — presign each object key server-side (never expose raw keys).
  // Link analytics (aggregate counts) ride along, RLS-scoped to this host's event.
  // likeCounts is HOST-ONLY (get_event_like_counts is gated to this host) — a curation signal shown as a
  // subtle per-tile badge; it never reaches a guest surface.
  const [media, linkStats, deletedMedia, uploaderIdentities, likeCounts] =
    await Promise.all([
      listEventMedia(event.id),
      getLinkStats(event.id),
      listRecentlyDeletedMedia(event.id),
      getUploaderIdentities(event.id),
      getEventLikeCounts(event.id),
    ]);
  // Two presigned URLs per item from one key: an INLINE url the grid/lightbox
  // render, and a forced-download (`attachment`) url the lightbox's Save uses.
  const galleryItems = await Promise.all(
    media.map(async (m) => {
      const [url, downloadUrl] = await Promise.all([
        presignDownload({ key: m.original_key }),
        presignDownload({
          key: m.original_key,
          downloadFilename: buildDownloadFilename({
            eventName: event.name,
            key: m.original_key,
            type: m.type,
          }),
        }),
      ]);
      // Uploader attribution (Phase 2). The HOST gallery is the ONE surface that includes email
      // (for identifying a guest); guest surfaces never carry it.
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
      };
    }),
  );

  // The event's "Recently deleted" bin: presign INLINE only (no download url -> the lightbox hides
  // Save; no original-file download from the bin). countdownDays is computed in the query (keeps
  // the page render-pure — no Date.now() in RSC render; react-hooks/purity).
  const deletedItems: BinMedia[] = await Promise.all(
    deletedMedia.map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key }),
      status: m.status,
      countdownDays: m.countdownDays,
    })),
  );

  // Partition for the host view: hold_for_approval uploads arrive as 'pending'
  // and get their own review queue above the main grid; approved + hidden make
  // up the rest (the host still sees hidden items so they can unhide). 'removed'
  // never reaches here — listEventMedia filters it out.
  const pendingItems = galleryItems.filter((m) => m.status === "pending");
  const visibleItems = galleryItems.filter((m) => m.status !== "pending");

  // One "views" metric now (the album/join split is gone); sum keeps historical counts.
  const views = linkStats.qrScans + linkStats.albumViews;
  // Config-aware: what a guest can do with the link, driven by visibility + uploads.
  const accessLine =
    event.visibility === "private"
      ? "Private. Only you can open this link."
      : event.visibility === "password"
        ? event.accepting_uploads
          ? "Anyone with this link and the password can view and add photos."
          : "Anyone with this link and the password can view the photos. Uploads are closed."
        : event.accepting_uploads
          ? "Anyone with this link can view and add photos."
          : "Anyone with this link can view the photos. Uploads are closed.";

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to events
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.name}
          </h1>
          {event.event_date && (
            <p className="text-sm text-muted-foreground">
              {formatEventDate(event.event_date)}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share with guests</CardTitle>
          <CardDescription>
            Print or display the QR, or send guests the link. One link does it
            all.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3">
            <EventQr
              joinUrl={eventLink}
              eventName={event.name}
              style={resolveQrPreset(event.qr_style)}
            />
            <QrDesignerDialog
              eventId={event.id}
              joinUrl={eventLink}
              current={event.qr_style}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Permanent link
            </p>
            <CopyShareLink url={eventLink} />
          </div>
          <EventSlugControl
            eventId={event.id}
            siteUrl={siteUrl}
            slug={event.custom_slug}
            locked={isSettingLocked("custom_slug", tier)}
            eventName={event.name}
          />
          <p className="text-sm text-muted-foreground">{accessLine}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            {views} {views === 1 ? "view" : "views"}
          </p>
        </CardContent>
      </Card>

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
            <HostMediaGrid eventId={event.id} items={pendingItems} />
          </CardContent>
        </Card>
      )}

      <EventUploads
        eventId={event.id}
        items={visibleItems}
        pendingCount={pendingItems.length}
        videosAllowed={videosAllowedForTier(tier)}
      />

      {deletedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trash</CardTitle>
            <CardDescription>
              {deletedItems.length}{" "}
              {deletedItems.length === 1 ? "item" : "items"} you removed.
              Restore anything within 30 days, or delete it permanently now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentlyDeletedGrid eventId={event.id} items={deletedItems} />
          </CardContent>
        </Card>
      )}

      <EventSettingsForm event={event} tier={tier} />
    </div>
  );
}
