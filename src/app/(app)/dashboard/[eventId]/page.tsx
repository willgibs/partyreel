import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
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
import { DEFAULT_TIER, toBillingTier } from "@/lib/constants/tiers";
import { getEvent } from "@/lib/db/queries/events";
import { listEventMedia } from "@/lib/db/queries/media";
import { getProfile } from "@/lib/db/queries/profile";
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
  const media = await listEventMedia(event.id);
  const galleryItems = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key }),
      status: m.status,
    })),
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
              Scanning opens the upload page — no app, no account.
            </p>
            <div className="pt-2">
              <EventQr joinUrl={joinUrl} eventName={event.name} />
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
