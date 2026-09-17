"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";

import { EventShareDialog } from "@/components/app/event-share-dialog";
import { eventUrl } from "@/lib/events/share-urls";

/**
 * The dashboard event card's top-left QR chip (Phase 5 S2a): a white tile that
 * reads as "share / QR" and opens the quick-share dialog. Rendered as the card's
 * `qrSlot` - a SIBLING of the card Link, outside it - so tapping it opens the
 * dialog and NEVER navigates to the event. A crisp QR glyph, not a 30px live QR
 * (which would be an illegible gray square plus N canvas renders); the real
 * scannable styled QR renders full-size inside the dialog.
 */
export function EventCardQr({
  eventId,
  eventName,
  qrToken,
  qrStyle,
  siteUrl,
}: {
  eventId: string;
  eventName: string;
  qrToken: string;
  qrStyle: string;
  siteUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const joinUrl = eventUrl(siteUrl, qrToken);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Share ${eventName}`}
        className="flex items-center justify-center rounded-[var(--radius-tile)] bg-white p-1.5 text-black shadow-lift outline-none transition-transform duration-150 ease-emphasis active:scale-95 focus-visible:ring-2 focus-visible:ring-white motion-reduce:active:scale-100"
      >
        <QrCode className="size-5" aria-hidden />
      </button>
      <EventShareDialog
        open={open}
        onOpenChange={setOpen}
        eventId={eventId}
        eventName={eventName}
        joinUrl={joinUrl}
        qrStyle={qrStyle}
      />
    </>
  );
}
