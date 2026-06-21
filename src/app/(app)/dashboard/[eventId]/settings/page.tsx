import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EventSettingsForm } from "@/components/app/event-settings-form";
import { EventSlugControl } from "@/components/app/event-slug-control";
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
import {
  DEFAULT_TIER,
  isSettingLocked,
  toBillingTier,
} from "@/lib/constants/tiers";
import { getEvent } from "@/lib/db/queries/events";
import { listRecentlyDeletedMedia } from "@/lib/db/queries/media";
import { getProfile } from "@/lib/db/queries/profile";
import { presignDownload } from "@/lib/r2/presign";
import { getSiteUrl } from "@/lib/site-url";

// The bin presigns per-request, short-lived URLs, so this route must never be
// statically cached (same reason as the event page).
export const dynamic = "force-dynamic";

// Next 16: params is a Promise — await it in both the page and generateMetadata.
type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? `Settings · ${event.name}` : "Settings" };
}

// The host event SETTINGS route (Phase 5 S3·3b). Split out of the gallery-first
// event page so the gallery IS the page: this holds the event settings form, the
// link/slug (URL) config, and the Deleted recovery bin (intentionally behind the
// settings step — the retrieval path is where a host looks for it). The QR
// DESIGNER deliberately does NOT live here; it rides with the Share flow on the
// event page (a fun, core, growth-loop feature, not tucked into settings).
export default async function EventSettingsPage({ params }: PageProps) {
  const { eventId } = await params;
  const [event, profile] = await Promise.all([getEvent(eventId), getProfile()]);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, treated as a 404 (no leaking existence).
  if (!event) notFound();

  const tier = toBillingTier(profile?.tier ?? DEFAULT_TIER);
  const siteUrl = await getSiteUrl();

  // The event's "Recently deleted" bin: presign INLINE only (no download url ->
  // the lightbox hides Save). countdownDays is computed in the query (render-pure
  // — no Date.now() in RSC render; react-hooks/purity).
  const deletedMedia = await listRecentlyDeletedMedia(event.id);
  const deletedItems: BinMedia[] = await Promise.all(
    deletedMedia.map(async (m) => ({
      id: m.id,
      type: m.type,
      url: await presignDownload({ key: m.original_key, stable: true }),
      status: m.status,
      countdownDays: m.countdownDays,
      width: m.width,
      height: m.height,
      durationSeconds: m.duration_seconds,
    })),
  );

  return (
    // The route crossfades in (data-route-fade); WITHIN it the sections settle in a
    // light top-down stagger (S4·A5, --arrive-i per section via [data-arrive]) so the
    // settings page reads as composed rather than snapping in all at once.
    <div data-route-fade className="space-y-8">
      <div
        data-arrive
        style={{ "--arrive-i": 0 } as CSSProperties}
        className="space-y-4"
      >
        <Link
          href={`/dashboard/${event.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to event
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      <div data-arrive style={{ "--arrive-i": 1 } as CSSProperties}>
        <EventSettingsForm event={event} tier={tier} />
      </div>

      <Card data-arrive style={{ "--arrive-i": 2 } as CSSProperties}>
        <CardHeader>
          <CardTitle>Event link</CardTitle>
          <CardDescription>
            The permanent link guests use. Pro hosts can set a custom, readable
            slug.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventSlugControl
            eventId={event.id}
            siteUrl={siteUrl}
            slug={event.custom_slug}
            locked={isSettingLocked("custom_slug", tier)}
            eventName={event.name}
          />
        </CardContent>
      </Card>

      {deletedItems.length > 0 && (
        <Card data-arrive style={{ "--arrive-i": 3 } as CSSProperties}>
          <CardHeader>
            <CardTitle>Deleted</CardTitle>
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
    </div>
  );
}
