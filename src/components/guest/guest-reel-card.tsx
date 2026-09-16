"use client";

/**
 * THE GUEST REEL CARD — the reel's face on /e/, and the door to the watch overlay (R3, guest-flow.md).
 *
 * The card IS the host's poster card (components/reel/poster-card): same frame, same gradient, same
 * name treatment, same violet meta line. That continuity is the product point ("what the host made is
 * what the guest meets"), so this file adds only what the guest side needs on top of it:
 *
 *   - the whole-card BUTTON (PosterCard is deliberately click-free; interactivity is the caller's)
 *   - the cover still in its `media` slot (no canvas engine on the album's first paint)
 *   - the modal shell around the overlay: the portal, the scroll lock, Escape, and the Suspense hold
 *   - the lazy boundary: the overlay (and through it the whole engine) loads on the FIRST TAP only
 *
 * Placement is the CALLER's decision, not this component's: EventExperience mounts it under the action
 * block while uploads are open, and above the header once they close (the ruled lifecycle promotion),
 * carrying its own data-reveal index there.
 */

import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import type { GalleryPayload } from "@/components/guest/live-gallery";
import {
  PosterCard,
  PosterCardChip,
  formatReelDuration,
  formatReelMeta,
} from "@/components/reel/poster-card";
// The label source, not a local copy: the catalog is pure data (no remotion, no canvas) and one style
// label everywhere beats a guest-side lookup table that can drift from the host's picker.
import { resolveStyleEntry } from "@/lib/reel/engine/style-registry";
import type { GuestReelPayload } from "@/lib/reel/guest-reel-payload";
import { cn } from "@/lib/utils";

// Code split (the EntryModalLazy precedent): the overlay reaches the canvas engine, the asset loader
// and buildReelProps. A guest who scrolls the album and never taps the card must not pay for any of
// it, so it lands in its own chunk fetched on the first tap.
const GuestReelOverlayLazy = lazy(() =>
  import("@/components/guest/guest-reel-overlay").then((m) => ({
    default: m.GuestReelOverlay,
  })),
);

/** The portal host as an external store: the same hydration-safe read the host reveal uses. */
const subscribeNever = () => () => {};
const getPortalHost = () => document.body;
const getNoPortalHost = () => null;

export function GuestReelCard({
  payload,
  eventName,
  joinUrl,
  qrToken,
  galleryPromise,
  variant,
}: {
  payload: GuestReelPayload;
  eventName: string;
  joinUrl: string;
  qrToken: string;
  /** The album's gallery load, threaded straight through to the overlay (one resolution, see there). */
  galleryPromise: Promise<GalleryPayload>;
  /** `inline` = mid-event, under the action block. `hero` = the keepsake album's opening statement. */
  variant: "inline" | "hero";
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // The overlay must not inherit a transformed ancestor (`position: fixed` is CONTAINED by one, and
  // the card sits inside a [data-reveal] element that transforms on entrance) and must out-stack the
  // floating Add pill (z-40). Both are free at document.body.
  const portalEl = useSyncExternalStore(
    subscribeNever,
    getPortalHost,
    getNoPortalHost,
  );

  // The overlay owns the viewport while it is up: lock the album behind it, and let Escape out (the
  // on-screen close lives in the overlay itself, but the key must work during the Suspense hold too).
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const meta = formatReelMeta({
    durationLabel: formatReelDuration(payload.lengthSeconds),
    styleLabel: resolveStyleEntry(payload.styleId).label,
    momentCount: payload.orderedIds.length,
  });

  const hero = variant === "hero";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Watch the reel from ${eventName}`}
        className="block w-full text-left transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <PosterCard
          eventName={eventName}
          meta={meta}
          chip={<PosterCardChip />}
          playBadge
          nameClassName={hero ? "text-2xl" : undefined}
          media={<ReelCoverStill coverUrl={payload.coverUrl} />}
        />
      </button>

      {open && portalEl
        ? createPortal(
            // The stage is up the instant the tap lands: the hold below is the SAME cinema dark the
            // overlay paints, showing the cover, so a slow chunk fetch reads as the reel arriving
            // rather than as a stalled tap.
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`The reel from ${eventName}`}
              className="fixed inset-x-0 top-0 z-50 h-dvh overflow-hidden"
            >
              <Suspense
                fallback={<ReelStageHold coverUrl={payload.coverUrl} />}
              >
                <GuestReelOverlayLazy
                  payload={payload}
                  eventName={eventName}
                  joinUrl={joinUrl}
                  qrToken={qrToken}
                  galleryPromise={galleryPromise}
                  onClose={close}
                />
              </Suspense>
            </div>,
            portalEl,
          )
        : null}
    </>
  );
}

/**
 * The card's face: the cover's presigned preview, or a styled frame when the presign degraded (the
 * cover is cosmetic by design, see getGuestReelContext). 4:5 either way, so the card never shifts.
 */
function ReelCoverStill({ coverUrl }: { coverUrl: string | null }) {
  if (!coverUrl) {
    return (
      <div
        aria-hidden
        className="aspect-[4/5] w-full bg-[linear-gradient(160deg,oklch(0.32_0.09_300)_0%,oklch(0.16_0.03_300)_60%,oklch(0.12_0_0)_100%)]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, short-lived
    <img
      src={coverUrl}
      alt=""
      className="aspect-[4/5] w-full object-cover"
      // The card can sit above the fold on the keepsake album, so let the browser prioritize it
      // normally rather than deferring a hero image.
      decoding="async"
    />
  );
}

/** The pre-resolve hold: cinema dark plus the cover, at the screen's own footprint. */
function ReelStageHold({ coverUrl }: { coverUrl: string | null }) {
  return (
    <div className="absolute inset-0 z-20 bg-[oklch(0.09_0_0)]">
      <div className="absolute inset-x-0 top-1/2 mx-auto w-full max-w-[min(360px,47dvh)] -translate-y-1/2 px-2">
        <div
          className={cn(
            "aspect-[9/16] w-full overflow-hidden rounded-xl bg-white/5",
            "flex items-center justify-center",
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, short-lived
            <img
              src={coverUrl}
              alt=""
              className="size-full scale-[0.42] object-cover opacity-80"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
