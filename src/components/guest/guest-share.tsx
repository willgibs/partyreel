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

// Compact, non-intrusive "invite more guests" card on the event page: a small QR
// (tap to enlarge) + share/copy the JOIN link (so recipients land here and can
// upload too). Shows the host's chosen qr_style; the join link is the capability.
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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label="Enlarge the QR code"
            className="shrink-0 cursor-pointer rounded-lg bg-white p-1.5 ring-1 ring-border transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <StyledQr value={joinUrl} size={72} style={style} />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Invite others</DialogTitle>
            <DialogDescription>
              Scan to join {eventName} and add photos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl bg-white p-3">
              <StyledQr
                ref={enlargedQr}
                value={joinUrl}
                size={232}
                style={style}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                enlargedQr.current?.download(`${eventName}-qr`, "png")
              }
            >
              <Download /> Download QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Invite more guests</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Share the link or let them scan the code.
        </p>
        <div className="flex flex-wrap gap-2">
          {canShare && (
            <Button type="button" size="sm" onClick={nativeShare}>
              <Share2 /> Share
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check /> : <Copy />} Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}
