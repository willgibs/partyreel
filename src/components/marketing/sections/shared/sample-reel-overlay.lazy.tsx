"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { parseCssMs } from "@/lib/shared/read-css-ms";
import { cn } from "@/lib/utils";

import { InlineReelPlayer, requireReel } from "./inline-reel-player";

/**
 * The "Watch a sample reel" overlay: a React.lazy island (default export, the
 * GuestReelOverlayLazy precedent) so none of this rides the home's initial
 * chunks; the hero mounts it on first open. Plays the PORTRAIT manifest reel
 * poster-first via InlineReelPlayer with autoStart (the CTA click is the
 * gesture). Clocks come from the modal recipe (.mkt-modal, marketing.css
 * chapter 2): .is-open on the next frame so the open transition plays,
 * .is-closing then unmount after the close clock (skipping that cleanup makes
 * the NEXT open jump from the closing scale, the recipe's own warning).
 */

// The LANDSCAPE sample: its frame is full (the portrait classic render
// letterboxes the all-landscape interim clip set into black bars — judged on
// screenshots; revisit when batch-1's portrait media lands). Stays valid
// across the final-media re-render (the recipe ledger re-renders by id).
const OVERLAY_REEL_ID = "hero-candidate-02";

// Mirrors --mkt-modal-close-ms (marketing.css); the live value is read off the
// card at close time so a tuner override still wins. readCssMs() reads :root,
// but the marketing tokens declare on [data-mkt], hence the element-scoped read.
const MODAL_CLOSE_FALLBACK_MS = 150;

export default function SampleReelOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const reel = requireReel(OVERLAY_REEL_ID);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Enter on the next frame so the .mkt-modal open transition can play.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus the close control + lock the page scroll while the dialog is up.
  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const requestClose = useCallback(() => {
    setClosing(true);
    const card = cardRef.current;
    const ms = card
      ? parseCssMs(
          getComputedStyle(card).getPropertyValue("--mkt-modal-close-ms"),
          MODAL_CLOSE_FALLBACK_MS,
        )
      : MODAL_CLOSE_FALLBACK_MS;
    window.setTimeout(onClose, ms);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sample reel"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop click closes; the visible X carries the accessible control. */}
      <div
        aria-hidden
        onClick={requestClose}
        className={cn(
          "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          entered && !closing ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={cardRef}
        className={cn(
          "mkt-modal relative w-full max-w-[min(58rem,85svh*16/9)]",
          entered && !closing && "is-open",
          closing && "is-closing",
        )}
      >
        <InlineReelPlayer
          reelId={OVERLAY_REEL_ID}
          autoStart
          sizes="(min-width: 1024px) 928px, 100vw"
          className="max-h-[80svh]"
        />
        <MonoCaption className="mt-3 text-center text-white/60">
          A sample reel, straight from the engine · 0:
          {String(Math.round(reel.durationSeconds)).padStart(2, "0")}
        </MonoCaption>
        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          aria-label="Close the sample reel"
          className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white/80 transition-colors duration-150 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
