"use client";

/**
 * The PUBLISH moment, as a persistent card under the poster (ADR-0022 d.1: the
 * moment is mandated LOUD, one tap, default OFF).
 *
 * Two faces, one card. OFF is a violet call to action with the honest line about
 * who can see the reel; ON is a settled confirmation with a one-tap Unshare. The
 * flip to ON fires ONE bloom ([data-rxp-share][data-state="on"]) — the
 * occasional-frequency tier, not a celebration every time the host looks at it.
 *
 * The STATE lives in useReelPublish, not in the card, because three surfaces have
 * to agree on it: this card, the section's status chip, and the reveal's settled
 * "Share with guests" (all on the host event page). The Studio route mounts its
 * own instance for its own Share button.
 *
 * Optimistic + revert: the flip lands instantly and rolls back if the action
 * refuses, because the truthful state matters more than the animation. Refusals
 * speak in the shared copy family (publishRefusalMessage), so "add some photos
 * first" reads identically here, in the reveal and in the Studio.
 */

import { Check, Share2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  PUBLISH_FALLBACK_MESSAGE,
  setReelGuestVisible,
  type ReelPublishResult,
} from "./publish-action";

export type ReelPublishController = {
  shared: boolean;
  pending: boolean;
  flip: (next: boolean) => void;
};

export function useReelPublish(
  eventId: string,
  /** Current highlight_reels.guest_visible. Track C wires the real value through;
   *  until then the host page passes false (the DB default). */
  initialShared: boolean,
): ReelPublishController {
  const [shared, setShared] = useState(initialShared);
  const [pending, startTransition] = useTransition();

  const flip = useCallback(
    (next: boolean) => {
      if (pending || next === shared) return;
      setShared(next); // optimistic: the UI is the feedback, so it moves on the tap
      startTransition(async () => {
        let result: ReelPublishResult;
        try {
          result = await setReelGuestVisible(eventId, next);
        } catch {
          result = {
            ok: false,
            reason: "error",
            message: PUBLISH_FALLBACK_MESSAGE,
          };
        }
        if (!result.ok) {
          // Revert to the truth, and use the SERVER's wording (it is display-ready,
          // so 'empty' already says "Add some photos to your reel first.").
          setShared(!next);
          toast.error(result.message || PUBLISH_FALLBACK_MESSAGE);
          return;
        }
        // Trust the server's echo over our optimistic guess: an unpublish that
        // lands as a no-op should leave the card telling the truth.
        setShared(result.guestVisible);
        toast.success(
          result.guestVisible
            ? "Your reel is live for guests."
            : "Your reel is private again.",
        );
      });
    },
    [eventId, pending, shared],
  );

  return { shared, pending, flip };
}

/** The Draft / Shared status chip (guest_visible defaults OFF, ADR-0022 ruling 1).
 *  Lives IN the panel, never in FeedSectionHeader: that header is ratified as a
 *  locked-height label row, and an extra chip would reintroduce the bounce. */
export function ReelStatusChip({ shared }: { shared: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-medium",
        shared
          ? "bg-reel text-white"
          : "border border-border text-muted-foreground",
      )}
    >
      {shared ? <Check className="size-2.5" aria-hidden /> : null}
      {shared ? "Shared with guests" : "Draft, only you"}
    </span>
  );
}

export function ReelShareCard({
  publish,
  className,
}: {
  publish: ReelPublishController;
  className?: string;
}) {
  const { shared, pending, flip } = publish;
  return (
    <div
      data-rxp-share
      data-state={shared ? "on" : "off"}
      className={cn("rounded-lg border border-border p-3", className)}
    >
      {!shared ? (
        // data-rxp-swap is scoped to the STATE TRANSITION: this node only mounts
        // when the card flips, never at first paint (@starting-style fires there
        // too, and an entrance on load would read as a glitch).
        <div key="off" data-rxp-swap>
          <button
            type="button"
            onClick={() => flip(true)}
            disabled={pending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white outline-none transition-transform duration-150 ease-emphasis active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 motion-reduce:active:scale-100"
          >
            <Share2 className="size-4" aria-hidden />
            Share with guests
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Only you can see it until you share
          </p>
        </div>
      ) : (
        <div key="on" data-rxp-swap className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-reel text-white"
          >
            <Check className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium">Live for your guests</p>
            <p className="text-[11px] text-muted-foreground">
              On the album page, ready to watch
            </p>
          </div>
          <button
            type="button"
            onClick={() => flip(false)}
            disabled={pending}
            className="shrink-0 rounded text-[11px] font-medium text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            Unshare
          </button>
        </div>
      )}
    </div>
  );
}
