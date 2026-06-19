"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveQrPreset } from "@/lib/constants/qr-presets";

/**
 * The quick-share dialog opened from a dashboard event card's QR chip (Phase 5
 * S2a). Composes the EXISTING share-suite pieces - the scannable styled QR
 * (EventQr) + the copy-link row (CopyShareLink) - plus a link to the event page
 * for the full studio (slug, preset, the eventual configurator). NOT the
 * customize dialog (QrDesignerDialog); this is share-at-a-glance.
 *
 * The QR + link encode the PERMANENT qr_token URL (eventUrl, passed in as
 * joinUrl), never a mutable custom slug: a quick-shared / printed code must
 * never break. Slug-aware sharing lives in the event-page studio behind "Manage".
 */
export function EventShareDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  joinUrl,
  qrStyle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {eventName}</DialogTitle>
          <DialogDescription>
            Guests scan the code or open the link to join your event.
          </DialogDescription>
        </DialogHeader>
        <EventQr
          joinUrl={joinUrl}
          eventName={eventName}
          style={resolveQrPreset(qrStyle)}
        />
        <CopyShareLink url={joinUrl} />
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${eventId}`}>
            <Settings2 /> Manage and customize
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
