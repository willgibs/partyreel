"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useSyncExternalStore } from "react";
import { Check, Copy, QrCode, Share2, X } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  floatingClock,
  floatingPanel,
  floatingTransitionEntrance,
} from "@/components/ui/floating-layer";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { trackAttrs } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

import { useEventShare } from "./event-share-provider";
import { useCopyLink } from "./use-copy-link";

import "./share.css";

/**
 * THE MINI-MODAL — a bigger scannable code, the link to view or copy, and a
 * door to the whole share sheet (Will, `share` note: "clicking it opens a view
 * transition animation-style mini-modal like you have in 1 to get a bigger
 * scannable code, view/copy the link, or visit the share page for everything").
 *
 * ★ IT IS A LOOK, NOT A ROOM, so it takes no URL of its own. A host opens this
 * at a door with someone standing in front of them; the browser's Back should
 * not have to walk four peeks at a code on the way out of the album.
 *
 * ★ ON A PHONE IT IS THE WHOLE SCREEN, WHITE, and that is the product's actual
 * use: a host holds the phone UP and somebody else's camera reads it across a
 * table. A code in a 320px card in dark mode at half brightness is a code that
 * does not scan. The white is scanner contrast, not a theme opinion — the same
 * reason `event-qr.tsx` has always stood its code on a solid white tile — so
 * the ink is spelled in neutrals here rather than in theme tokens that invert.
 *
 * ★ ITS ENTRANCE IS A HOLE IN BIBLE 15, CUT ONCE AND SANCTIONED IN THE
 * CONTRACT. The header's code and this one are one object continuing, so the
 * View Transitions API owns the arrival and `floatingTransitionEntrance`
 * declares no animation of its own — except under reduced motion, where it
 * falls back to the ordinary dialog fade. The corner, the material and the
 * clock still come from the contract, which is what keeps it in the family.
 */
export function EventCodeModal({
  eventName,
  joinUrl,
  prettyUrl,
  qrStyle,
}: {
  eventName: string;
  /** The permanent qr_token URL: what the code encodes and what gets copied. */
  joinUrl: string;
  prettyUrl: string;
  qrStyle: string;
}) {
  const { codeOpen, closeCode, openSheet, morphNameFor } = useEventShare();
  const { copied, copy } = useCopyLink(joinUrl);

  // Feature-detect native share on the CLIENT only: a false server snapshot
  // means no hydration mismatch and no set-state-in-effect (the guest-share
  // pattern, shared deliberately so the two surfaces read the same).
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
      // Dismissed. Nothing to do, and nothing to say about it.
    }
  }

  return (
    <DialogPrimitive.Root
      open={codeOpen}
      onOpenChange={(next) => {
        if (!next) closeCode();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            floatingClock.standard,
          )}
        />
        <DialogPrimitive.Content
          data-slot="event-code-modal"
          className={cn(
            floatingPanel,
            // The phone: the whole screen, its edges the viewport's, so the
            // family's corner comes off. The desk: a panel in the middle.
            "fixed z-50 flex flex-col items-center justify-center gap-5 p-6",
            "inset-0 max-sm:rounded-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-96 sm:-translate-x-1/2 sm:-translate-y-1/2",
            // Scanner contrast, stated in neutrals so dark mode cannot dim it.
            "bg-white text-neutral-900",
            floatingTransitionEntrance,
            floatingClock.standard,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            The code for {eventName}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Point a camera at this code to open the album and add photos.
          </DialogPrimitive.Description>

          {/* The morph's destination while open. Exactly one element carries
              the name at a time; the provider decides which. */}
          <div
            style={{ viewTransitionName: morphNameFor("modal") }}
            className="pr-code-modal-qr rounded-lg bg-white p-3"
          >
            <StyledQr
              value={joinUrl}
              // The drawn size; share.css scales the SVG to 80vw in a hand.
              size={260}
              style={resolveQrPreset(qrStyle)}
            />
          </div>

          <div className="space-y-1 text-center">
            <p className="font-heading text-card-title">{eventName}</p>
            <p className="text-xs text-neutral-500">{prettyUrl}</p>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copy}
              className="flex-1 border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900"
              {...trackAttrs("cta_click", {
                cta: "copy-event-link",
                location: "code-modal",
              })}
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
                className="flex-1 border-neutral-300 text-neutral-900 hover:bg-neutral-100 hover:text-neutral-900"
                {...trackAttrs("cta_click", {
                  cta: "native-share",
                  location: "code-modal",
                })}
              >
                <Share2 /> Share
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                closeCode();
                openSheet("share");
              }}
              className="flex-1"
              {...trackAttrs("cta_click", {
                cta: "share-sheet",
                location: "code-modal",
              })}
            >
              <QrCode /> Everything
            </Button>
          </div>

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]"
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
