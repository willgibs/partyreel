"use client";

import Link from "next/link";
import { useState } from "react";
import { ImageUp, QrCode, Settings } from "lucide-react";

import { EventShareDialog } from "@/components/app/event-share-dialog";
import { HostUpload } from "@/components/app/host-upload";
import { FloatingAddButton } from "@/components/shared/floating-add-button";
import { Button } from "@/components/ui/button";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";

/**
 * The gallery-first event page's command bar (Phase 5 S3·3b). Share is the host's
 * primary job-to-be-done, so it LEADS; then Add (the upload panel) and a quiet
 * Settings route link. Responsive: Share full-width with Add + Settings beneath
 * on a phone, one row when there's width. The command bar is full page-width, so
 * VIEWPORT breakpoints are correct here (unlike the narrow share dialog).
 *
 * The Add pattern mirrors the guest (the ratified upload combo): the command Add
 * toggles the inline upload panel below the bar, and a floating Add appears once
 * the bar scrolls out of view (never both, via the sentinel). The floating Add
 * carries a live "N uploading" chip (HostUpload reports its in-flight count) and
 * scrolls back up to the panel on tap.
 *
 * NO radix Tooltip here: this renders on the SSR'd host page, and wrapping SSR'd
 * elements in radix Tooltips regressed host-gallery hydration on prod (see
 * architecture.md). Native `title`. The Share DIALOG + the upload panel are client
 * UI inside this client island, so they are safe to be rich.
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
  const [adding, setAdding] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  // The sentinel rides the command row: the floating Add shows only once the row
  // (with its command Add) has scrolled out of view, so the two never coexist.
  const { sentinelRef, inView } = useInViewSentinel<HTMLDivElement>();

  function openAddFromFloating() {
    setAdding(true);
    // The panel lives at the top, below the bar; bring it back into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={sentinelRef}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Button className="sm:flex-1" onClick={() => setShareOpen(true)}>
          <QrCode /> Share
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            aria-expanded={adding}
            onClick={() => setAdding((v) => !v)}
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
        <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
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

      <FloatingAddButton
        show={!inView}
        uploadingCount={uploadingCount}
        onClick={openAddFromFloating}
      />
    </div>
  );
}
