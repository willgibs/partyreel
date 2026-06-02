"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

import { StyledQr, type StyledQrHandle } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { resolveQrPreset } from "@/lib/constants/qr-presets";

// The "Invite" action (Part 2 redesign): one compact button in the header action row
// that opens a dialog holding everything share-related — the event QR (host's chosen
// qr_style), Copy link, native Share, and Download. The QR no longer sits inline
// mid-page (that split upload from the gallery); folding it behind one trigger keeps
// upload + gallery contiguous. The join link IS the capability: recipients land on
// /e/[qr_token] and can view + add photos (whatever the configs allow).
export function GuestShare({
  joinUrl,
  qrStyle,
  eventName,
}: {
  joinUrl: string;
  qrStyle: string;
  eventName: string;
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="active:scale-[0.98] motion-reduce:active:scale-100"
        >
          <Share2 /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Invite guests</DialogTitle>
          <DialogDescription>
            Share the link or let them scan the code to join {eventName} and add
            photos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
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
      </DialogContent>
    </Dialog>
  );
}
