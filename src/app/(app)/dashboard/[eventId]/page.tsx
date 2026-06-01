import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, QrCode } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { QrDesignerDialog } from "@/components/app/qr-designer-dialog";
import { EventSettingsForm } from "@/components/app/event-settings-form";
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
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import { getLinkStats } from "@/lib/db/queries/analytics";
import { getEvent } from "@/lib/db/queries/events";
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

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  // Tier gates the settings form (e.g. require_email is paid-only). The (app)
  // layout already gated on getUser(), so profile is the signed-in host's.
  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);

  // Build the guest-facing absolute URLs server-side. The tokens are the
  // capability (ADR-0004); they come straight from the row the DB generated.
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl}/e/${event.qr_token}`;
  const albumUrl = `${siteUrl}/a/${event.share_token}`;

  // Live gallery — presign each object key server-side (never expose raw keys).
  // Link analytics (aggregate counts) ride along, RLS-scoped to this host's event.
  const [media, linkStats] = await Promise.all([
    listEventMedia(event.id),
    getLinkStats(event.id),
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
      return { id: m.id, type: m.type, url, downloadUrl, status: m.status };
    }),
  );

  // Partition for the host view: hold_for_approval uploads arrive as 'pending'
  // and get their own review queue above the main grid; approved + hidden make
  // up the rest (the host still sees hidden items so they can unhide). 'removed'
  // never reaches here — listEventMedia filters it out.
  const pendingItems = galleryItems.filter((m) => m.status === "pending");
  const visibleItems = galleryItems.filter((m) => m.status !== "pending");

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
            Print or display the QR code so guests can join, or send them the
            album link.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 sm:grid-cols-2 sm:items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium">Guest join QR</p>
            <p className="text-sm text-muted-foreground">
              Scanning opens the upload page. No app, no account.
            </p>
            <div className="flex flex-col items-center gap-3 pt-2">
              <EventQr
                joinUrl={joinUrl}
                eventName={event.name}
                style={resolveQrPreset(event.qr_style)}
              />
              <QrDesignerDialog
                eventId={event.id}
                joinUrl={joinUrl}
                current={event.qr_style}
              />
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <QrCode className="size-3.5" />
                {linkStats.qrScans} join-link{" "}
                {linkStats.qrScans === 1 ? "visit" : "visits"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Public album link</p>
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view the album
              {event.is_public ? "." : " once you make it public."}
            </p>
            <div className="pt-2">
              <CopyShareLink url={albumUrl} />
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <Eye className="size-3.5" />
              {linkStats.albumViews} album{" "}
              {linkStats.albumViews === 1 ? "view" : "views"}
            </p>
          </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Uploads</CardTitle>
          <CardDescription>
            {media.length > 0
              ? `${media.length} ${media.length === 1 ? "item" : "items"} from your guests.`
              : "Photos and videos your guests upload will appear here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleItems.length > 0 ? (
            <HostMediaGrid eventId={event.id} items={visibleItems} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {pendingItems.length > 0
                ? "Everything uploaded so far is awaiting your review above."
                : "No uploads yet. Share the QR code above to get started."}
            </p>
          )}
        </CardContent>
      </Card>

      <EventSettingsForm event={event} tier={tier} />
    </div>
  );
}
