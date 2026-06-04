"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { PlayBadge } from "@/components/shared/play-badge";
import { videoPosterSrc } from "@/lib/media/poster";

// Shared full-screen media viewer for BOTH galleries (public album + host grid).
// Built by composing the radix Dialog PRIMITIVES rather than the wrapped
// <DialogContent> on purpose: a lightbox needs a dark, edge-to-edge backdrop and
// object-contain media, whereas DialogContent hard-codes a light bg-black/10
// overlay + max-w-sm popover. Composing still gives us radix's focus-trap, Esc,
// and scroll-lock for free. `index` is controlled by the grid so prev/next walks
// the whole set; null = closed.
//
// The displayed media uses each item's INLINE url; the Save button uses its
// download url (a presigned `attachment` URL — see lib/r2/presign.ts), so a plain
// <a> saves the original even cross-origin to R2.
//
// MOBILE SWIPE (peek-the-neighbor): on touch, the media area is a 3-slot windowed
// track [prev, current, next] that follows the finger; release commits to a
// neighbor (distance OR flick velocity) or springs back. Only the 3-slot window is
// rendered, and slots are keyed by item id so the slid-to neighbor's already-loaded
// <img> is REUSED (moved, not reloaded) when it becomes current — that's what makes
// the settle seamless. Desktop/mouse is untouched: finger-follow is gated to
// `pointerType === "touch"`, so chevrons + keyboard stay the pointer-free nav.

// Gesture tuning — all in screen px / px-per-ms; tunable on real-device feel.
const DIR_LOCK_PX = 10; // travel before we commit to horizontal vs vertical/tap
const COMMIT_RATIO = 0.2; // slow drag commits past 20% of stage width
const COMMIT_VELOCITY = 0.25; // OR a quick flick (px/ms) commits regardless of distance
const CONTROLS_STRIP_PX = 64; // bottom band reserved for a PLAYING video's native scrubber
const SETTLE_MS = 240; // commit settle (< 300ms per the motion budget)
const SPRINGBACK_MS = 200; // release-snap is a touch quicker than a commit

// Slot = one full-stage-width cell of the track. 3 of them = 300% wide; the track
// is translated so the middle slot sits in the (overflow-hidden) stage viewport.
const SLOT_CLASS =
  "relative flex h-full shrink-0 grow-0 basis-full items-center justify-center px-2 pb-6";

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  axis: "unknown" | "x";
  allowSwipe: boolean;
  width: number;
  startOffset: number;
  hasPrev: boolean;
  hasNext: boolean;
  captured: boolean;
};

// Diminishing-returns damping past the first/last item — the end feels elastic
// (slows toward a soft limit) instead of hitting an invisible wall.
function damp(raw: number, width: number) {
  const maxPull = width * 0.18;
  const pulled = maxPull * (1 - 1 / (Math.abs(raw) / maxPull + 1));
  return Math.sign(raw) * pulled;
}

// Turn a raw finger delta into the on-screen offset: full follow toward a real
// neighbor (clamped to one slide), damped friction toward a missing one.
function applyFriction(
  raw: number,
  width: number,
  hasPrev: boolean,
  hasNext: boolean,
) {
  if ((raw > 0 && !hasPrev) || (raw < 0 && !hasNext)) return damp(raw, width);
  return Math.max(-width, Math.min(width, raw));
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function MediaLightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: GridMedia[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const current = index === null ? null : (items[index] ?? null);
  const prevItem =
    index !== null && index > 0 ? (items[index - 1] ?? null) : null;
  const nextItem =
    index !== null && index < items.length - 1
      ? (items[index + 1] ?? null)
      : null;
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < items.length - 1;

  // offset = px added to the base "current centered" transform (0 = centered).
  // dragging toggles `transition: none` so the track tracks the finger 1:1.
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const centerVideoRef = useRef<HTMLVideoElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const isPlayingRef = useRef(false); // play state of the CENTER video (scrub heuristic)
  const suppressClickRef = useRef(false); // swallow the click that trails a drag
  const settleTimerRef = useRef<number | null>(null); // transitionend fallback
  const finishRef = useRef<(() => void) | null>(null); // idempotent commit-finalizer

  // ← / → step through the set while open (Esc/backdrop close come from radix).
  useEffect(() => {
    if (index === null) return;
    const i = index; // narrowed capture for the listener closure
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && i > 0) onIndexChange(i - 1);
      else if (e.key === "ArrowRight" && i < items.length - 1)
        onIndexChange(i + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onIndexChange]);

  // Videos are CLICK-TO-PLAY, not autoplay: a swiped-in video "sets" on its clean
  // first frame with the native play button ready, so guests choose what to watch
  // (saves bandwidth — `preload="metadata"` fetches only the poster, not the file)
  // and swiping past videos stays clean (no controls overlay popping in after an
  // autoplay). This effect upholds that: the newly-centered item starts paused, and
  // a video you played then swiped past gets paused so it doesn't keep streaming
  // off-screen. (Its onPause won't fire once it's a controls-less neighbor, so we
  // reset isPlayingRef here too — it gates the swipe-vs-scrub heuristic.)
  useEffect(() => {
    isPlayingRef.current = false;
    const v = centerVideoRef.current;
    return () => {
      v?.pause();
    };
  }, [index]);

  // Single close funnel (Esc + the X both fire onOpenChange; backdrop tap calls this
  // directly). Resets the transform and CANCELS any in-flight settle — without this,
  // a settle timer firing after close would call onIndexChange(null! + dir) and
  // silently reopen the lightbox. Done in an event handler (not an effect) on purpose.
  const handleClose = useCallback(() => {
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    finishRef.current = null;
    gestureRef.current = null;
    setOffset(0);
    setDragging(false);
    onClose();
  }, [onClose]);

  const settleTo = useCallback(
    (target: number, dir: -1 | 0 | 1) => {
      // Reduced motion: keep the (direct-manipulation) finger-follow but drop the
      // autonomous slide — commit/recenter instantly. No transitionend will fire
      // (no transition rule), so finalize here rather than waiting on the fallback.
      if (prefersReducedMotion()) {
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        finishRef.current = null;
        if (dir !== 0) onIndexChange(index! + dir);
        setOffset(0);
        setDragging(false);
        return;
      }

      const dur = dir === 0 ? SPRINGBACK_MS : SETTLE_MS;
      trackRef.current?.style.setProperty("--lightbox-settle", `${dur}ms`);
      setDragging(false); // enable the CSS transition
      setOffset(target); // ...and animate toward the target

      if (settleTimerRef.current !== null) {
        window.clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      finishRef.current = null;
      if (dir === 0) return; // spring-back: nothing to finalize (offset back at 0)

      // Animate-then-swap: once the neighbor has slid fully to center, swap the
      // index and recenter the new window WITHOUT animation by shifting the index +
      // resetting the offset in one batch while `dragging` holds transition:none, so
      // the -2·w → -1·w jump is invisible. transitionend is the trigger; the timeout
      // is a belt-and-suspenders fallback.
      //
      // We deliberately do NOT re-enable the transition here (e.g. via rAF): a next-
      // frame re-enable races the browser's recalc — React can flush the transition-
      // off recenter and the transition-on re-enable in the SAME frame before paint,
      // so the recenter animates as a visible SECOND slide (the mobile "reanimate"
      // glitch). Leaving `dragging` true keeps transition:none until the next
      // gesture's settleTo flips it false; by then many frames have painted, so the
      // jump never animates. No transform changes happen in between, so nothing that
      // SHOULD animate is suppressed.
      const finish = () => {
        if (finishRef.current !== finish) return; // already ran / superseded
        finishRef.current = null;
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        setDragging(true);
        onIndexChange(index! + dir);
        setOffset(0);
      };
      finishRef.current = finish;
      settleTimerRef.current = window.setTimeout(finish, SETTLE_MS + 80);
    },
    [index, onIndexChange],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "touch") return; // finger-follow is touch-only
      if (gestureRef.current) return; // ignore a 2nd finger mid-drag
      const track = trackRef.current;
      if (!track) return;
      suppressClickRef.current = false; // fresh gesture; only a real drag suppresses
      const width = track.getBoundingClientRect().width || 1;

      // Swipe-vs-scrub: a PLAYING video reserves its bottom strip for the native
      // scrubber; everywhere else (and any PAUSED video) swipes. Boundary is fuzzy
      // by design — native controls aren't queryable.
      let allowSwipe = true;
      if (current?.type === "video" && isPlayingRef.current) {
        const rect = centerVideoRef.current?.getBoundingClientRect();
        if (rect && e.clientY > rect.bottom - CONTROLS_STRIP_PX)
          allowSwipe = false;
      }

      gestureRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startTime: e.timeStamp,
        axis: "unknown",
        allowSwipe,
        width,
        startOffset: 0,
        hasPrev,
        hasNext,
        captured: false,
      };
    },
    [current, hasPrev, hasNext],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current;
    if (!g || e.pointerId !== g.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.axis === "unknown") {
      if (Math.hypot(dx, dy) < DIR_LOCK_PX) return;
      // Vertical, or a disallowed start (scrubber strip): bail so the browser keeps
      // vertical scroll/pinch and the native video scrubber.
      if (Math.abs(dx) <= Math.abs(dy) || !g.allowSwipe) {
        gestureRef.current = null;
        return;
      }
      // Engage horizontal drag: interrupt any in-flight settle and seed the offset
      // from the LIVE transform so re-grabbing a moving slide continues smoothly.
      g.axis = "x";
      const track = trackRef.current;
      if (track) {
        if (settleTimerRef.current !== null) {
          window.clearTimeout(settleTimerRef.current);
          settleTimerRef.current = null;
        }
        finishRef.current = null;
        const cs = getComputedStyle(track).transform;
        if (cs && cs !== "none") {
          try {
            // base translateX is -width (centered); live offset = m41 - (-width).
            g.startOffset = new DOMMatrixReadOnly(cs).m41 + g.width;
          } catch {
            g.startOffset = 0;
          }
        }
        try {
          track.setPointerCapture(g.pointerId);
          g.captured = true;
        } catch {}
      }
      suppressClickRef.current = true; // a drag happened → swallow the trailing click
      setDragging(true);
    }

    if (g.axis !== "x") return;
    e.preventDefault(); // kill the synthetic click + image-drag / text selection
    setOffset(applyFriction(g.startOffset + dx, g.width, g.hasPrev, g.hasNext));
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || e.pointerId !== g.pointerId) return;
      gestureRef.current = null;
      if (g.captured) {
        try {
          trackRef.current?.releasePointerCapture(g.pointerId);
        } catch {}
      }
      if (g.axis !== "x") return; // a tap / never-engaged → let the click + scroll be

      const dx = e.clientX - g.startX;
      const dt = Math.max(1, e.timeStamp - g.startTime);
      const v = dx / dt; // px/ms, signed
      const next =
        dx < 0 &&
        g.hasNext &&
        (v < -COMMIT_VELOCITY || -dx > g.width * COMMIT_RATIO);
      const prev =
        dx > 0 &&
        g.hasPrev &&
        (v > COMMIT_VELOCITY || dx > g.width * COMMIT_RATIO);

      if (next) settleTo(-g.width, 1);
      else if (prev) settleTo(g.width, -1);
      else settleTo(0, 0); // spring back
    },
    [settleTo],
  );

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || e.pointerId !== g.pointerId) return;
      gestureRef.current = null;
      if (g.captured) {
        try {
          trackRef.current?.releasePointerCapture(g.pointerId);
        } catch {}
      }
      if (g.axis === "x") settleTo(0, 0); // snap back to center
    },
    [settleTo],
  );

  // Tap the dark letterbox (the slot box itself, not the media or a control) to
  // close — but never as the click that trails a drag.
  const onBackdropClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (suppressClickRef.current) return;
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose],
  );

  function renderSlot(
    item: GridMedia | null,
    posKey: "prev" | "center" | "next",
    isCenter: boolean,
  ) {
    if (!item)
      return <div key={`empty-${posKey}`} className={SLOT_CLASS} aria-hidden />;

    return (
      <div key={item.id} className={SLOT_CLASS} onClick={onBackdropClick}>
        {item.type === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
          <img
            src={item.url}
            alt=""
            draggable={false}
            aria-hidden={!isCenter}
            className="max-h-full max-w-full rounded-md object-contain select-none [-webkit-user-drag:none]"
          />
        ) : isCenter ? (
          <video
            ref={centerVideoRef}
            data-center-media
            src={videoPosterSrc(item.url)}
            controls
            playsInline
            preload="metadata"
            onPlay={() => {
              isPlayingRef.current = true;
            }}
            onPause={() => {
              isPlayingRef.current = false;
            }}
            className="max-h-full max-w-full rounded-md bg-black select-none"
          />
        ) : (
          // Neighbor video: a muted, controls-less first-frame poster + a play badge
          // so it reads as a video the moment it peeks in mid-swipe (the center uses
          // the native controls play button instead). Never autoplays or steals the
          // swipe (pointer-events-none). Same posterized src as the center so the
          // element isn't reloaded when it becomes current. The badge overlay matches
          // the slot's padding so it lands on the media's center, not the slot's.
          <>
            <video
              src={videoPosterSrc(item.url)}
              muted
              playsInline
              preload="metadata"
              tabIndex={-1}
              aria-hidden
              className="pointer-events-none max-h-full max-w-full rounded-md bg-black select-none"
            />
            <PlayBadge size="lg" overlayClassName="px-2 pb-6" />
          </>
        )}
      </div>
    );
  }

  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/90" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">
            Media viewer
          </DialogPrimitive.Title>

          {current && (
            <>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="text-sm text-white/70 tabular-nums">
                  {index! + 1} / {items.length}
                </span>
                <div className="flex items-center gap-2">
                  {/* Save is hidden when an item carries no download url — the recovery bin
                      presigns INLINE only, so there's no original-file download from the bin. */}
                  {current.downloadUrl && (
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="bg-white/15 text-white hover:bg-white/25"
                    >
                      {/* Cross-origin force-download comes from the signed
                          content-disposition, not this attribute — it's a harmless
                          same-origin hint. */}
                      <a href={current.downloadUrl} download>
                        <Download /> Save
                      </a>
                    </Button>
                  )}
                  <DialogPrimitive.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/15 hover:text-white"
                      aria-label="Close"
                    >
                      <X />
                    </Button>
                  </DialogPrimitive.Close>
                </div>
              </div>

              {/* Stage: clips the off-screen neighbor slots; positioning context for
                  the chevrons (which sit OUTSIDE the track, so a tap on a chevron
                  never starts a swipe). */}
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {hasPrev && (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Previous"
                    onClick={() => onIndexChange(index! - 1)}
                    className="absolute top-1/2 left-1 z-10 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white sm:left-3"
                  >
                    <ChevronLeft className="size-7" />
                  </Button>
                )}

                {/* The swipe track. `touch-pan-y` lets the browser keep vertical
                    scroll/pinch; horizontal is ours once we lock + preventDefault. */}
                <div
                  ref={trackRef}
                  data-lightbox-track
                  data-dragging={dragging ? "true" : undefined}
                  className="flex h-full w-full touch-pan-y select-none"
                  style={{
                    transform: `translateX(calc(-100% + ${offset}px))`,
                    willChange: dragging ? "transform" : undefined,
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerCancel}
                  onTransitionEnd={(e) => {
                    if (e.propertyName === "transform") finishRef.current?.();
                  }}
                >
                  {renderSlot(prevItem, "prev", false)}
                  {renderSlot(current, "center", true)}
                  {renderSlot(nextItem, "next", false)}
                </div>

                {hasNext && (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    aria-label="Next"
                    onClick={() => onIndexChange(index! + 1)}
                    className="absolute top-1/2 right-1 z-10 -translate-y-1/2 text-white hover:bg-white/15 hover:text-white sm:right-3"
                  >
                    <ChevronRight className="size-7" />
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
