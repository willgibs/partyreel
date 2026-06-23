"use client";

import { Clapperboard, RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// The render is async (~a minute on Lambda); poll the status route until the .mp4 lands. The webhook
// flips the DB faster in prod, but polling is the reliable signal (it also drives the local-dev path,
// where Lambda can't reach localhost). 3s keeps it responsive without hammering.
const POLL_MS = 3000;

/**
 * The "Stitching your reel…" modal. Opened by the composer once a render is in flight; polls
 * /api/reel/render until the reel is ready (then auto-downloads + closes) or fails. The host can close
 * and come back, the render keeps going (the webhook + the next Download both pick it up from R2).
 */
export function ReelStitchingDialog({
  eventId,
  open,
  onOpenChange,
  onReady,
  onRetry,
}: {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hand the finished reel's presigned download URL to the trigger (the composer downloads it). */
  onReady: (downloadUrl: string) => void;
  /** Re-kick the render (the composer's Download handler) after a failure. */
  onRetry: () => void;
}) {
  const [phase, setPhase] = useState<"stitching" | "error">("stitching");
  // Reset to "stitching" whenever the modal (re)opens — the React-idiomatic "adjust state when a prop
  // changes" pattern (a setState during render, which React resolves without an extra commit), so we
  // don't reset inside the effect. onReady/onOpenChange are stable (useCallback / setState), so the
  // poll loop below never re-arms spuriously.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPhase("stitching");
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/reel/render?eventId=${encodeURIComponent(eventId)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.status === "ready" && data.downloadUrl) {
          onReady(data.downloadUrl);
          toast.success("Your reel is ready.");
          onOpenChange(false);
        } else if (data?.status === "error") {
          setPhase("error");
        }
        // 'processing' | 'idle' → keep waiting (idle can briefly precede the row flip).
      } catch {
        /* transient network blip — keep polling */
      }
    };

    void tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [open, eventId, onReady, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {phase === "error"
              ? "Couldn't render your reel"
              : "Stitching your reel"}
          </DialogTitle>
          <DialogDescription>
            {phase === "error"
              ? "Something went wrong on our side. Please try again."
              : "This takes about a minute. You can close this and come back, your reel keeps rendering."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          {phase === "error" ? (
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="size-7 text-destructive" />
            </div>
          ) : (
            // A reel-violet clapperboard inside a spinning ring (on-brand, beats a generic spinner).
            <div className="relative flex size-16 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 animate-spin rounded-full border-2 border-reel/20 border-t-reel"
                style={{ animationDuration: "0.9s" }}
              />
              <Clapperboard className="size-7 text-reel" />
            </div>
          )}
        </div>

        {phase === "error" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setPhase("stitching");
                onRetry();
              }}
            >
              <RotateCcw />
              Try again
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
