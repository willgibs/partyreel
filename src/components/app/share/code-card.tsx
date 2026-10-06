"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { usePortalContainer } from "@/components/ui/portal-container";
import { useRef, useSyncExternalStore, type ReactElement } from "react";
import { Check, Copy, Download, QrCode, Share2, X } from "lucide-react";

import { StyledQr, type StyledQrHandle } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  floatingClock,
  floatingPanel,
  floatingTransitionEntrance,
} from "@/components/ui/floating-layer";
import { POPUP_KINDS } from "@/components/ui/popup-kinds";
import { trackAttrs } from "@/lib/analytics/events";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { useCopyLink } from "./use-copy-link";

import "./share.css";

/**
 * THE CODE CARD: EVERY SHARE'S FIRST SURFACE (`popups` r1, `share=card`, Will
 * 2026-09-27: "this screen could be opened by an 'Invite' button ..., then
 * 'Share' opens the share sheet as users expect. Makes more sense to open
 * 'Invite' then 'Share'.").
 *
 * So one card, from every door: the host's code on the event page (where it
 * started, his `share=room` mini-modal), the host's code chip on the dashboard,
 * the checklist's Invite and a guest's Invite. Each door reads Invite; the
 * card's Share hands the link to the phone's own share sheet (Messages,
 * AirDrop), and where a browser has none (most laptops) Share is simply not
 * offered and Copy link stands alone. A host's full kit waits one tap behind
 * Everything; a guest's third button saves the code as a picture.
 *
 * ★ ON A PHONE IT IS THE WHOLE SCREEN, WHITE, and that is the product's actual
 * use: a phone held UP and somebody else's camera reading it across a table. A
 * code in a small card in dark mode at half brightness is a code that does not
 * scan. The white is scanner contrast, not a theme opinion (the same reason
 * `event-qr.tsx` stands its code on a solid white tile), so the ink is spelled
 * in neutrals rather than in theme tokens that invert. At a desk it is a 384
 * card in the middle, over a darker scrim than a dialog's.
 *
 * ★ IT IS A LOOK, NOT A PLACE: no URL of its own and no history entry. A host
 * opens it at a door with someone standing in front of them; the browser's Back
 * should not have to walk four peeks at a code on the way out of the album.
 *
 * ★ ON THE EVENT PAGE ITS ENTRANCE IS A VIEW TRANSITION (`viewTransition`), the
 * floating layer's one sanctioned hole (`floatingTransitionEntrance`): the
 * header's code and the card's are one object continuing. From every other
 * door it arrives on the layer's own fade, with the hair of scale only where it
 * is a card (a whole screen that zooms reads as the page lurching).
 */
/**
 * ★ ITS ROW IN THE ONE TABLE (`popup-kinds.ts`, `share`) SAYS `card` AT BOTH
 * WIDTHS, and this line holds it: a row moved to a dialog or a sheet stops
 * compiling here, the one place the card would have to become that shape.
 */
const SHARE_ROW: { desk: "card"; hand: "card" } = POPUP_KINDS.share;

export function CodeCard({
  open,
  onOpenChange,
  eventName,
  joinUrl,
  prettyUrl,
  qrStyle,
  who,
  onEverything,
  viewTransition = false,
  morphName,
  trigger,
  location,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  eventName: string;
  /** The permanent qr_token URL: what the code encodes and what gets copied. */
  joinUrl: string;
  /** The readable form of the link, shown under the name (never copied). */
  prettyUrl: string;
  qrStyle: string;
  /** A host's card leads to the kit (Everything); a guest's saves the code. */
  who: "host" | "guest";
  /** The host's kit, one tap behind the card. */
  onEverything?: () => void;
  /** The event page's arrival: a view transition the provider starts, never this card. */
  viewTransition?: boolean;
  /** The morph's name, while this card's code is the one carrying it. */
  morphName?: string;
  /** The Invite that opens it, for a door that is a button of its own. */
  trigger?: ReactElement;
  /** Where the door is, for the analytics a click carries. */
  location: string;
}) {
  const { copied, copy } = useCopyLink(joinUrl);
  const qrRef = useRef<StyledQrHandle>(null);

  // Feature-detect native share on the CLIENT only: a false server snapshot
  // means no hydration mismatch and no set-state-in-effect.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function nativeShare() {
    try {
      await navigator.share({
        title: eventName,
        // "and", never "&": the house style for this native-share line.
        text: `Add your photos and videos to ${eventName}`,
        url: joinUrl,
      });
    } catch {
      // Dismissed. Nothing to do, and nothing to say about it.
    }
  }

  const outline =
    "flex-1 border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900";

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal container={usePortalContainer()}>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            floatingClock.standard,
          )}
        />
        <DialogPrimitive.Content
          data-slot="code-card"
          data-shape={SHARE_ROW.desk}
          data-who={who}
          className={cn(
            floatingPanel,
            // The phone: the whole screen, its edges the viewport's, so the
            // family's corner comes off. The desk: a card in the middle.
            "fixed z-50 flex flex-col items-center justify-center gap-5 p-6 outline-none",
            "inset-0 max-sm:rounded-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2",
            // Scanner contrast, stated in neutrals so dark mode cannot dim it.
            "bg-white text-neutral-900",
            viewTransition
              ? floatingTransitionEntrance
              : "ease-emphasis data-open:animate-in data-open:fade-in-0 sm:data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 sm:data-closed:zoom-out-95",
            floatingClock.standard,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            {who === "host"
              ? `The code for ${eventName}`
              : `Invite guests to ${eventName}`}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Point a camera at this code to open the album and add photos.
          </DialogPrimitive.Description>

          {/* The morph's destination while open, on the event page: exactly one
              element carries the name at a time, and the provider decides. */}
          <div
            style={morphName ? { viewTransitionName: morphName } : undefined}
            className="pr-code-modal-qr rounded-lg bg-white p-3"
          >
            <StyledQr
              ref={qrRef}
              value={joinUrl}
              // The drawn size; share.css scales the SVG to 80vw in a hand.
              size={260}
              style={resolveQrPreset(qrStyle)}
            />
          </div>

          <div className="space-y-1 text-center">
            <p className="font-heading text-card-title">{eventName}</p>
            <p className="text-xs break-all text-neutral-500">{prettyUrl}</p>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className={outline}
              {...trackAttrs("cta_click", { cta: "copy-event-link", location })}
            >
              <span data-copy-pop={copied ? "on" : undefined} className="flex">
                {copied ? <Check /> : <Copy />}
              </span>
              {copied ? "Copied" : "Copy link"}
            </Button>
            {canShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={nativeShare}
                className={outline}
                {...trackAttrs("cta_click", { cta: "native-share", location })}
              >
                <Share2 /> Share
              </Button>
            )}
            {who === "host" ? (
              <Button
                size="sm"
                onClick={onEverything}
                className="flex-1"
                {...trackAttrs("cta_click", { cta: "share-sheet", location })}
              >
                <QrCode /> Everything
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  qrRef.current?.download(`${eventName}-qr`, "png")
                }
                className={outline}
              >
                <Download /> Download
              </Button>
            )}
          </div>

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-neutral-500 transition-colors outline-none hover:bg-neutral-100 hover:text-neutral-900 focus-halo active:scale-[0.97]"
            >
              <X className="size-4" aria-hidden />
            </button>
          </DialogPrimitive.Close>
          <span aria-live="polite" className="sr-only">
            {copied ? "Link copied" : ""}
          </span>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The link as a person reads it: no scheme and no query (the demo's own share
 * link carries a pairing id, which is the copy's business, never the eye's).
 */
export function readableLink(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/[?#].*$/, "");
}
