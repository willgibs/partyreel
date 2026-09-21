"use client";

import Link from "next/link";
import { Check, Copy, ExternalLink, Printer, Share2 } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

import { EventQr, QrDownloadMenu } from "@/components/app/event-qr";
import { EventSlugControl } from "@/components/app/event-slug-control";
import { QrDesignerDialog } from "@/components/app/qr-designer-dialog";
import type { StyledQrHandle } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { trackAttrs } from "@/lib/analytics/events";

import { useCopyLink } from "./use-copy-link";

import "./share.css";

/**
 * THE ONE SHARING SURFACE (Will, `share` note: "share should have a room of its
 * own for a home to support all current and any future sharing functionality
 * comprehensively (as well as slug claim, etc)" — then his `settings` note
 * overrode the ROOM into a sheet: "we likely want to apply this sheet concept
 * everywhere and have share on a sheet as well. This overrides that answer").
 *
 * It gathers what used to be scattered across three places: the code and its
 * downloads (the share dialog), the designer (the share dialog), the link, and
 * the custom-link claim that lived on the settings ROUTE. Everything future
 * that is about getting people to this album belongs here and nowhere else.
 *
 * ★ REDRAWN AT 375 (`hand=same`, Will 2026-09-21). His verdict kept THIS
 * surface over the two prettier ones for a reason he stated — "it allows guests
 * to also send out the code or link themselves more easily (rather than simply
 * allowing it to be scanned from their phone for another guest)" — and then said
 * the drawing "could be improved a lot". So the ARGUMENT is what got bigger: the
 * code takes the sheet's full width instead of sitting at 200 px with two rows
 * of controls under it, and the four verbs a host actually reaches for (Copy,
 * Share, Open, Print) are ONE row directly beneath it. The quieter doors — the
 * file downloads and the designer — moved below that row, because a host holding
 * a phone out at a door is not downloading an SVG.
 *
 * ★ THE PRINT DOOR IS HERE AND NOT ONLY IN THE CREATE BEAT (`venue=sheet`). The
 * beat happens once in an event's life; the sheet is where a host comes back the
 * night before, which is when paper is actually wanted. It opens in a new tab so
 * the album is still behind it when the print dialog closes.
 *
 * ★ THE PRO GATE ON THE SLUG IS UNTOUCHED. `EventSlugControl` decides what a
 * Free host sees from `locked`, which the server computes from the tier; moving
 * the control to a new surface must not become a second opinion about who may
 * claim a link. It is imported whole, props unchanged.
 *
 * ★ EVERYTHING HERE ENCODES THE PERMANENT LINK. A printed code outlives a slug.
 */
export function EventShareSheet({
  open,
  onOpenChange,
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  siteUrl,
  slug,
  slugLocked,
  showQrDesigner = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  /** The permanent qr_token URL. */
  joinUrl: string;
  qrStyle: string;
  /** Null when the sheet is opened from a surface with no slug context (the
   *  dashboard card): the claim section simply does not render. */
  siteUrl?: string | null;
  slug?: string | null;
  slugLocked?: boolean;
  showQrDesigner?: boolean;
}) {
  const { copied, copy } = useCopyLink(joinUrl);
  const qrRef = useRef<StyledQrHandle>(null);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function nativeShare() {
    try {
      await navigator.share({
        title: eventName,
        text: `Add your photos and videos to ${eventName}`,
        url: joinUrl,
      });
    } catch {
      // Dismissed.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        responsive
        className="overflow-y-auto"
        aria-describedby={undefined}
      >
        <SheetHeader>
          {/* ONE LINE. "Share <name>" plus a sentence explaining what a QR code
              is spent two lines of a phone's screen on words nobody standing at
              a door reads; the code below says the rest by being a code. */}
          <SheetTitle className="truncate">Share {eventName}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6">
          <EventQr
            ref={qrRef}
            joinUrl={joinUrl}
            style={resolveQrPreset(qrStyle)}
          />

          {/* THE ROW. Copy takes the room because it is the verb a host presses
              most; the native share appears only where the browser has one (a
              dead Share on a laptop is a worse row than a three-verb row). */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={copy}
              {...trackAttrs("cta_click", {
                cta: "copy-event-link",
                location: "share-sheet",
              })}
            >
              <span data-copy-pop={copied ? "on" : undefined} className="flex">
                {copied ? <Check /> : <Copy />}
              </span>
              {copied ? "Copied" : "Copy link"}
            </Button>
            {canShare && (
              <Button variant="outline" size="sm" onClick={nativeShare}>
                <Share2 /> Share
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink /> Open
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              {...trackAttrs("cta_click", {
                cta: "print-stock",
                location: "share-sheet",
              })}
            >
              <Link
                href={`/dashboard/${eventId}/print`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Printer /> Print
              </Link>
            </Button>
          </div>
          <span aria-live="polite" className="sr-only">
            {copied ? "Link copied" : ""}
          </span>

          {/* The quiet doors: the files, and the styler that has always ridden
              with sharing rather than being tucked into settings. */}
          <div className="flex flex-wrap items-center gap-1">
            <QrDownloadMenu qrRef={qrRef} eventName={eventName} />
            {showQrDesigner && (
              <QrDesignerDialog
                eventId={eventId}
                joinUrl={joinUrl}
                current={qrStyle}
              />
            )}
          </div>

          {siteUrl && (
            <section className="space-y-2">
              <h3 className="font-heading text-card-title">A readable link</h3>
              <EventSlugControl
                eventId={eventId}
                siteUrl={siteUrl}
                slug={slug ?? null}
                locked={slugLocked ?? true}
                eventName={eventName}
                // `back=finish`: a host who buys from the lock here comes back
                // to this sheet, reopened, with the control unlocked.
                returnTo={`/dashboard/${eventId}?room=share`}
              />
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
