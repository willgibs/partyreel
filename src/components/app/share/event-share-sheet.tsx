"use client";

import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import { EventQr } from "@/components/app/event-qr";
import { EventSlugControl } from "@/components/app/event-slug-control";
import { QrDesignerDialog } from "@/components/app/qr-designer-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
          <SheetTitle>Share {eventName}</SheetTitle>
          <SheetDescription>
            Guests scan the code or open the link. No app required.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          {/* The code, at the size a printed sheet wants, with its SVG/PNG
              downloads and the designer — a growth-loop feature that has always
              ridden with sharing rather than being tucked into settings. */}
          <EventQr
            joinUrl={joinUrl}
            eventName={eventName}
            style={resolveQrPreset(qrStyle)}
          />
          {showQrDesigner && (
            <QrDesignerDialog
              eventId={eventId}
              joinUrl={joinUrl}
              current={qrStyle}
            />
          )}

          <section className="space-y-2">
            <h3 className="font-heading text-card-title">The link</h3>
            <div className="flex gap-2">
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
            </div>
            <span aria-live="polite" className="sr-only">
              {copied ? "Link copied" : ""}
            </span>
          </section>

          {siteUrl && (
            <section className="space-y-2">
<h3 className="font-heading text-card-title">A readable link</h3>
              <EventSlugControl
                eventId={eventId}
                siteUrl={siteUrl}
                slug={slug ?? null}
                locked={slugLocked ?? true}
                eventName={eventName}
              />
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
