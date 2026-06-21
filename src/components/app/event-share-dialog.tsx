"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";

import { CopyShareLink } from "@/components/app/copy-share-link";
import { EventQr } from "@/components/app/event-qr";
import { QrDesignerDialog } from "@/components/app/qr-designer-dialog";
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
 * The share dialog. Composes the EXISTING share-suite pieces - the scannable
 * styled QR (EventQr) + the copy-link row (CopyShareLink) - and is opened from
 * two surfaces (Phase 5 S2a + the S3·3b gallery-first rebuild):
 *
 *   - Dashboard event card QR chip: share-at-a-glance (defaults). The manage
 *     link points to the event page.
 *   - The event-page command strip (gallery-first): the PRIMARY Share action.
 *     `showQrDesigner` surfaces the QR designer right here (a fun, core, growth-
 *     loop feature, not tucked into settings), and `manageHref` points the quiet
 *     link to /settings, where the link/slug config + event settings live.
 *
 * The QR + link encode the PERMANENT qr_token URL (joinUrl), never a mutable
 * custom slug: a quick-shared / printed code must never break. The slug control
 * lives in settings (URL config); the QR designer rides with the share flow.
 */
export function EventShareDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  showQrDesigner = false,
  manageHref = `/dashboard/${eventId}`,
  manageLabel = "Manage and customize",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  joinUrl: string;
  qrStyle: string;
  /** Surface the QR designer ("Customize") in the dialog (the event-page Share). */
  showQrDesigner?: boolean;
  /** Where the quiet manage link points (defaults to the event page). */
  manageHref?: string;
  /** The quiet manage link's label. */
  manageLabel?: string;
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
        {showQrDesigner && (
          <QrDesignerDialog
            eventId={eventId}
            joinUrl={joinUrl}
            current={qrStyle}
          />
        )}
        <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
          <Link href={manageHref}>
            <Settings2 /> {manageLabel}
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
