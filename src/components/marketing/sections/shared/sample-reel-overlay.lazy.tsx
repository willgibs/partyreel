"use client";

import { X } from "lucide-react";
import Link from "next/link";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { trackAttrs } from "@/lib/analytics/events";
import { MARKETING_CTA } from "@/lib/constants/marketing-nav";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { parseCssMs } from "@/lib/shared/read-css-ms";
import { cn } from "@/lib/utils";

import { InlineReelPlayer } from "./inline-reel-player";

/**
 * THE CONTAINED REEL PLAYER (`reel-story` r2 `play=modal`, overruling the
 * full-screen `overlay`): a landscape player in a panel over the dimmed page,
 * a caption and Start free under it, small on a phone; closing it returns the
 * reader to the button they pressed. His reason is the principle it serves:
 * "The contained player here keeps them in the marketing lane, rather than
 * just dropping them off in an app demo without realizing, so the video may be
 * framed contextually as needed."
 *
 * ★ ONE PLAYER FOR EVERY "WATCH". The hero's "Watch a sample reel", the home
 * teaser's play mark and the event pages' reel card all open this, each naming
 * its own film (`reelId`): a film is made for the section that shows it, never
 * borrowed from the demo album because the demo exists. Until the films land
 * every mount plays the same stand-in render.
 *
 * A React.lazy island (default export, the GuestReelOverlayLazy precedent), so
 * none of it rides a page's first chunks; a caller mounts it on first press, as
 * a SIBLING of its section, never inside one: a section's cut entrance holds a
 * transform, and a transformed ancestor would pin this fixed layer to itself.
 *
 * The panel is the floating layer's (`floatingPanel`: the float corner, opaque
 * ink, the ring and the layer shadow; glass is media chrome, never a panel), so
 * the only glass is the close control over the picture. The player owns the
 * panel's top corners itself: a rounded, clipping wrapper around it would put
 * its bright edge on a corner the eye does not see (`inline-reel-player.tsx`).
 * Clocks come from the modal recipe (.mkt-modal, marketing.css chapter 2):
 * .is-open on the next frame so the open transition plays, .is-closing then
 * unmount after the close clock (skipping that cleanup makes the NEXT open jump
 * from the closing scale, the recipe's own warning).
 */

/** The stand-in every mount plays until its own film lands (docs/ASSETS.md). */
const STAND_IN_REEL_ID = "hero-candidate-02";

// Mirrors --mkt-modal-close-ms (marketing.css); the live value is read off the
// card at close time so a tuner override still wins. readCssMs() reads :root,
// but the marketing tokens declare on [data-mkt], hence the element-scoped read.
const MODAL_CLOSE_FALLBACK_MS = 150;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SampleReelOverlay({
  onClose,
  reelId = STAND_IN_REEL_ID,
}: {
  onClose: () => void;
  /** The film this mount plays: its section's own, never the demo's. */
  reelId?: string;
}) {
  const titleId = useId();
  const lineId = useId();
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Enter on the next frame so the .mkt-modal open transition can play.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Focus moves in, the page stops scrolling, and on the way out focus goes
  // back to whatever opened the player (a keyboard reader lands on the button
  // they pressed, not at the top of the document).
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeRef.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
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
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // A modal keeps Tab inside itself: past the last control it wraps to the
  // first, and back past the first to the last.
  const trapTab = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !cardRef.current) return;
    const stops = [...cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (stops.length === 0) return;
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={lineId}
      onKeyDown={trapTab}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-8"
    >
      {/* Backdrop click closes; the visible X carries the accessible control. */}
      <div
        aria-hidden
        onClick={requestClose}
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          entered && !closing ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={cardRef}
        className={cn(
          // Wide enough to watch, never taller than the screen: the width is
          // capped where the 16:9 picture plus the caption row still fits a
          // laptop's height (a landscape phone, too short for both, scrolls).
          "mkt-modal @container relative w-full max-w-[min(56rem,calc((100svh-12rem)*16/9))]",
          floatingPanel,
          entered && !closing && "is-open",
          closing && "is-closing",
        )}
      >
        <InlineReelPlayer
          reelId={reelId}
          autoStart
          sizes="(min-width: 1024px) 896px, 100vw"
          className="rounded-t-float rounded-b-none"
        />
        <button
          ref={closeRef}
          type="button"
          onClick={requestClose}
          aria-label="Close the reel"
          className={cn(
            "absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded-full text-white outline-none",
            "transition-transform duration-150 ease-emphasis active:scale-[0.94] motion-reduce:active:scale-100",
            "focus-halo",
            GLASS,
          )}
        >
          <X className={cn("size-4", GLASS_MARK_LIT)} aria-hidden />
        </button>
        <div className="flex flex-col items-start gap-4 p-5 sm:p-6 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-8">
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              id={titleId}
              className="font-heading text-subsection text-balance"
            >
              Every album plays its own reel.
            </h2>
            <p
              id={lineId}
              className="max-w-md text-sm text-pretty text-muted-foreground"
            >
              It plays from the second photo guests add, on every phone and the
              room&rsquo;s screen, with nothing to edit.
            </p>
          </div>
          <Button asChild size="cta" className="shrink-0">
            <Link
              href={MARKETING_CTA.href}
              {...trackAttrs("cta_click", {
                cta: "start-free",
                location: "reel-player",
              })}
            >
              {MARKETING_CTA.label}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
