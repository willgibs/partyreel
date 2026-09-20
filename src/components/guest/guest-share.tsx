"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { StyledQr, type StyledQrHandle } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { resolveQrPreset } from "@/lib/constants/qr-presets";

/**
 * The "Invite" action: one compact button in the action row that opens
 * everything share-related — the event QR (the host's chosen `qr_style`), Copy
 * link, native Share and Download. The QR has never sat inline mid-page (that
 * split upload from the gallery); folding it behind one trigger keeps upload
 * and gallery contiguous. The join link IS the capability: recipients land on
 * /e/[qr_token] and can view and add photos (whatever the configs allow).
 *
 * ★ IT WEARS THE ONE PRODUCT SHEET NOW (Will, `dialogs=stands`, 2026-09-20 —
 * "the earlier ruling stands", the earlier ruling being `settings=sheet`'s "we
 * likely want to apply this sheet concept everywhere"). It was a centred
 * Dialog, which on a phone is a box floating in the middle of the screen with
 * the album showing around it, while the host's sharing, the settings and the
 * guest's own gate all arrive from an edge. `responsive` is the whole change: a
 * side panel at a desk, a bottom sheet in a hand, one primitive. Nothing is
 * typed in here, so this migration carries none of the keyboard risk the
 * Report sheet next door does.
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
  /** Lets the header action row size/stretch the trigger (Phase 4). */
  triggerClassName?: string;
}) {
  const style = resolveQrPreset(qrStyle);
  const enlargedQr = useRef<StyledQrHandle>(null);
  const [copied, setCopied] = useState(false);
  // Feature-detect native share on the client only — useSyncExternalStore gives a
  // false server snapshot (no hydration mismatch) without set-state-in-effect.
  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && "share" in navigator,
    () => false,
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      toast.success("Invite link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: eventName,
        text: `Add your photos & videos to ${eventName}`,
        url: joinUrl,
      });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "active:scale-[0.98] motion-reduce:active:scale-100",
            triggerClassName,
          )}
        >
          <Share2 /> Invite
        </Button>
      </SheetTrigger>
      <SheetContent responsive className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invite guests</SheetTitle>
          <SheetDescription>
            Share the link or let them scan the code to join {eventName} and add
            photos.
          </SheetDescription>
        </SheetHeader>
        {/* The body carries its own padding (SheetHeader owns the top): a panel
            runs to its own edges, where the dialog box this replaced did not. */}
        <div className="flex flex-col items-center gap-4 px-4 pb-6">
          <div className="rounded-xl bg-white p-3">
            <StyledQr
              ref={enlargedQr}
              value={joinUrl}
              size={232}
              style={style}
            />
          </div>
          <div className="flex w-full flex-wrap justify-center gap-2">
            {canShare && (
              <Button
                type="button"
                size="sm"
                onClick={nativeShare}
                className="active:scale-[0.98] motion-reduce:active:scale-100"
              >
                <Share2 /> Share
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {copied ? <Check /> : <Copy />} Copy link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                enlargedQr.current?.download(`${eventName}-qr`, "png")
              }
              className="active:scale-[0.98] motion-reduce:active:scale-100"
            >
              <Download /> Download
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
