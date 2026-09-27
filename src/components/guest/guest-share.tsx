"use client";

import { QrCode } from "lucide-react";

import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * THE GUEST'S "INVITE": one compact button in the action row (and the dock)
 * that opens the event's code card, the same card the host's own code opens
 * (`popups` r1, `share=card`, Will 2026-09-27: "this screen could be opened by
 * an 'Invite' button ..., then 'Share' opens the share sheet as users expect").
 * A guest's Invite and a host's are one object: the code filling a phone in
 * white, a 384 card at a desk, Copy link and Share under it, and Download for
 * the guest where the host has the kit.
 *
 * The QR has never sat inline mid-page (that split upload from the gallery);
 * folding it behind one trigger keeps upload and gallery contiguous. The join
 * link IS the capability: recipients land on /e/[qr_token] and can view and add
 * photos (whatever the configs allow).
 */
export function GuestShare({
  joinUrl,
  qrStyle,
  eventName,
  triggerClassName,
}: {
  joinUrl: string;
  qrStyle: string;
  eventName: string;
  /** Lets the header action row size/stretch the trigger. */
  triggerClassName?: string;
}) {
  return (
    <CodeCard
      who="guest"
      eventName={eventName}
      joinUrl={joinUrl}
      prettyUrl={readableLink(joinUrl)}
      qrStyle={qrStyle}
      location="guest-invite"
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "active:scale-[0.98] motion-reduce:active:scale-100",
            triggerClassName,
          )}
        >
          <QrCode /> Invite
        </Button>
      }
    />
  );
}
