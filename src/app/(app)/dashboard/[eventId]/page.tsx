import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { EventSettingsForm } from "@/components/app/event-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEvent } from "@/lib/db/queries/events";
import { getSiteUrl } from "@/lib/site-url";
import { formatEventDate } from "@/lib/utils";

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
  const event = await getEvent(eventId);
  // getEvent is RLS-scoped and filters deleted_at — a missing/foreign/deleted
  // event resolves to null, which we treat as a 404 (no leaking existence).
  if (!event) notFound();

  // Build the guest-facing absolute URLs server-side. The tokens are the
  // capability (ADR-0004); they come straight from the row the DB generated.
  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl}/e/${event.qr_token}`;
  const albumUrl = `${siteUrl}/a/${event.share_token}`;

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

      <EventSettingsForm event={event} />
    </div>
  );
}
