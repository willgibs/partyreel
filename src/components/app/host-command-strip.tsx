"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageUp, QrCode, Settings } from "lucide-react";

import { EventShareDialog } from "@/components/app/event-share-dialog";
import { useHostAdd } from "@/components/app/host-add-provider";
import { HostUpload } from "@/components/app/host-upload";
import { Button } from "@/components/ui/button";

/**
 * The gallery-first event page's command bar. Share is the host's primary job-to-be-done, so it
 * LEADS; then Add (the upload panel) and a quiet Settings route link. Responsive: Share full-width
 * with Add + Settings beneath on a phone, one row when there's width.
 *
 * The Add state is SHARED via HostAddProvider so the feed's contextual floating action bar (the
 * Gallery action) opens the SAME panel this strip hosts — the floating Add is now part of the feed
 * (it morphs across sections), so this strip no longer owns its own floating button or sentinel. It
 * stays the panel HOST: the inline Add button toggles the upload panel below the bar; HostUpload
 * reports its in-flight count to the provider for the floating "N uploading" chip. (A local
 * fallback keeps the strip functional if it's ever rendered without the provider.)
 *
 * NO radix Tooltip here: this renders on the SSR'd host page, and wrapping SSR'd elements in radix
 * Tooltips regressed host-gallery hydration on prod (see architecture.md). Native `title`. The
 * Share DIALOG + the upload panel are client UI inside this client island, so they stay rich.
 */
export function HostCommandStrip({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  videosAllowed,
}: {
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  videosAllowed: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  // Shared with the feed's floating Add; fall back to local state if no provider wraps the strip.
  // The fallback count is write-only here (the floating "N uploading" chip lives in the feed bar).
  const add = useHostAdd();
  const [localAdding, setLocalAdding] = useState(false);
  const [, setLocalCount] = useState(0);
  const adding = add ? add.adding : localAdding;
  const toggleAdd = add ? add.toggleAdd : () => setLocalAdding((v) => !v);
  const setUploadingCount = add ? add.setUploadingCount : setLocalCount;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button className="sm:flex-1" onClick={() => setShareOpen(true)}>
          <QrCode /> Share
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            aria-expanded={adding}
            onClick={toggleAdd}
          >
            <ImageUp /> Add photos
          </Button>
          <Button variant="outline" title="Event settings" asChild>
            <Link href={`/dashboard/${eventId}/settings`}>
              <Settings /> Settings
            </Link>
          </Button>
        </div>
      </div>

      {adding && (
        <div
          data-settings-reveal
          className="mt-3 rounded-xl border border-border bg-muted/30 p-4"
        >
          <p className="mb-3 text-sm text-muted-foreground">
            {videosAllowed
              ? "Add your own photos and videos, for example a batch from your photographer. These post to the album right away."
              : "Add your own photos, for example a batch from your photographer. These post to the album right away."}
          </p>
          <HostUpload
            eventId={eventId}
            videosAllowed={videosAllowed}
            onUploadingCountChange={setUploadingCount}
          />
        </div>
      )}

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
