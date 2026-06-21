"use client";

import Link from "next/link";
import { useState } from "react";
import { QrCode, Settings } from "lucide-react";

import { EventShareDialog } from "@/components/app/event-share-dialog";
import { Button } from "@/components/ui/button";

/**
 * The gallery-first event page's command strip (Phase 5 S3·3b). Share is the
 * host's primary job-to-be-done, so it LEADS as the primary button; Settings is
 * a quiet route link beside it. The Share dialog surfaces the QR designer
 * ("Customize") right here - a fun, core, growth-loop feature kept out of the
 * settings drawer - and points its quiet manage link at /settings for the
 * link/slug config.
 *
 * (Add joins this strip in increment C, when host-add-controls owns the uploader
 * + the floating Add; the review queue left the strip for its own teaser in D.)
 *
 * NO radix Tooltip here: this renders on the SSR'd host page, and wrapping SSR'd
 * elements in radix Tooltips regressed host-gallery hydration on prod (see
 * architecture.md). Native `title`. The Share DIALOG is a client island (the same
 * pattern the dashboard cards use), so it is safe to be rich.
 */
export function HostCommandStrip({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button className="flex-1" onClick={() => setShareOpen(true)}>
        <QrCode /> Share
      </Button>
      <Button variant="outline" title="Event settings" asChild>
        <Link href={`/dashboard/${eventId}/settings`}>
          <Settings /> Settings
        </Link>
      </Button>

      <EventShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        eventId={eventId}
        eventName={eventName}
        joinUrl={joinUrl}
        qrStyle={qrStyle}
        showQrDesigner
        manageHref={`/dashboard/${eventId}/settings`}
        manageLabel="Edit link and settings"
      />
    </div>
  );
}
