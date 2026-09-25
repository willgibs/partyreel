"use client";

/**
 * The PUBLISH moment, as a persistent card under the poster (guest-flow.md: the
 * moment is LOUD, one tap, default OFF).
 *
 * Two faces, one card. OFF is a violet call to action with the honest line about
 * who can see the reel; ON is a settled confirmation with a one-tap Unshare.
 *
 * ★ A SHARED REEL RESTS LIT (Will, 2026-09-17: the bloom is "a one-shot that
 * decays to a base, never to nothing, so the object stays lit afterwards"). The
 * flip to ON used to fire a flat violet ring that rode out of the card and decayed
 * to nothing, and it fired again on every load of an already-shared reel, because
 * a CSS animation keyed on an attribute runs at first paint. The card now takes
 * the house light instead (publish-light.tsx): it pools under the card for as long
 * as the reel is shared, it swells once for the tap that shared it, and it goes
 * dark on Unshare. On a light ground there is no coloured light at all (fenced
 * in globals.css), so the check and the words carry the moment.
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
import { ShareCardPublishLight } from "./publish-light";

export type ReelPublishController = {
  shared: boolean;
  /**
   * True when the CURRENT shared state came from a Share tap on this page, and
   * false when it came from the server at load or from an Unshare the server
   * refused. It is the whole difference between the publish light's two entrances
   * (publish-light.tsx): the tap earns the swell, every other road to "shared"
   * only rests lit. Without it the swell would replay on every open of a reel
   * shared last week, which is the celebration-on-load the old keyframe had.
   */
  sharedHere: boolean;
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
  const [sharedHere, setSharedHere] = useState(false);
  const [pending, startTransition] = useTransition();

  const flip = useCallback(
    (next: boolean) => {
      if (pending || next === shared) return;
      setShared(next); // optimistic: the UI is the feedback, so it moves on the tap
      setSharedHere(next); // set with it, in one render, so the light mounts already knowing
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
          // Neither revert is a share that happened here: a refused Share is not
          // shared at all, and a refused Unshare is a reel that was shared before
          // this tap. So the light that comes back rests, it never celebrates.
          setSharedHere(false);
          toast.error(result.message || PUBLISH_FALLBACK_MESSAGE);
          return;
        }
        // Trust the server's echo over our optimistic guess: an unpublish that
        // lands as a no-op should leave the card telling the truth.
        setShared(result.guestVisible);
        if (result.guestVisible !== next) setSharedHere(false);
        toast.success(
          result.guestVisible
            ? "Your reel is live for guests."
            : "Your reel is private again.",
        );
      });
    },
    [eventId, pending, shared],
  );

  return { shared, sharedHere, pending, flip };
}

/** The Draft / Shared status chip (guest_visible defaults OFF; see guest-flow.md).
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
  const { shared, sharedHere, pending, flip } = publish;
  return (
    // The light's positioned wrapper (SectionLight's pattern): the lamp comes
    // FIRST and the card after it, positioned, so the light stays behind the card
    // by DOM order with no z-index anywhere. `isolate` keeps that stack local to
    // the card, whatever the feed around it does. Never `overflow-hidden` here: it
    // would cut the pool to a straight edge (glow-placement.test.ts).
    <div className={cn("relative isolate", className)}>
      <ShareCardPublishLight shared={shared} sharedHere={sharedHere} />
      {/* ★ bg-card IS LOAD-BEARING. The card was a bare outline, and an outline
          cannot be lit from behind: the light would show THROUGH it, under the
          words, as a fill. Opaque, the card is an object with light under it. On a
          light ground --card is the page's own value, so nothing changes there;
          on dark it is the raised surface the host's upload card already wears
          beside it (host-upload.tsx). data-rxp-share / data-state is the card's
          state hook (no CSS reads it since the violet keyframe left). */}
      <div
        data-rxp-share
        data-state={shared ? "on" : "off"}
        className="relative rounded-lg border border-border bg-card p-3"
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
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-action)] bg-reel text-sm font-medium text-white transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:opacity-70 motion-reduce:active:scale-100"
            >
              <Share2 className="size-4" aria-hidden />
              Share with guests
            </button>
            <p className="mt-2 text-center text-caption text-muted-foreground">
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
              <p className="text-caption text-muted-foreground">
                On the album page, ready to watch
              </p>
            </div>
            <button
              type="button"
              onClick={() => flip(false)}
              disabled={pending}
              className="shrink-0 rounded text-caption font-medium text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
            >
              Unshare
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
