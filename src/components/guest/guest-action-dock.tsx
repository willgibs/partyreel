"use client";

/**
 * WHAT STAYS ONCE THE COVER HAS SCROLLED AWAY (`event-header` r1, `stays=shutter`): one round Add at
 * the foot's centre in the album's light, Invite its twin on the left and the Highlight reel on the
 * right, and nothing else over the photographs. While her files go, the shutter's ring is their
 * progress, the count on its shoulder.
 *
 * ★ HIS TWO NOTES ARE PART OF THE PICK. "A gradient overlay from the bottom, between the album and
 * shutter/share controls, when there is more to scroll, both hinting to continue scrolling and
 * providing more contrast between the gallery and UI": the page's own ground rises from the foot
 * under the controls while more album lies below (`more`), and is gone at the album's end. "Could
 * also add another button to the right side of the shutter (similar secondary design as other side)
 * to visually balance those controls symmetrically": the right flank (`twin`) is Invite's twin, the
 * same round, so the foot mirrors the cover's three acts (Invite, Add, the reel).
 *
 * ★ IT IS THE SECOND HALF OF ONE ANSWER, NOT A SECOND PLACE FOR THE ACTIONS. The page lands on the
 * cover, whose row says Add photos in words, and this takes over the moment that row leaves the
 * screen: a guest never has to discover the shutter to find Add, she has already read the row it
 * grew out of. It carries what the row carries and never invents an action the page above does not
 * offer (no Add where the row has none: uploads closed, a teaser).
 *
 * ★ HIDDEN IS `inert`, NOT UNMOUNTED, so the cluster travels out the way it travelled in while its
 * buttons leave the tab order and the accessibility tree entirely at the top of the page. The clock
 * is the floating layer's own edge beat (`floatingClock.edge`), the fade the baseline and the travel
 * the extra (reduced motion keeps the fade and drops the 16px).
 *
 * ★ THE BOX TAKES NO POINTER, ITS CONTROLS DO (design-system.md's gotcha: a full-width overlay above a
 * gesture eats the gesture): the fade and the band are `pointer-events-none`, so a press between the
 * rounds lands on the photograph under it.
 */
import { Camera } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Shutter, type ShutterState } from "@/components/ui/shutter";
import { formatCount } from "@/lib/format/count";
import {
  type QueueItem,
  type QueueProgress,
  useRunProgress,
} from "@/lib/guest/use-upload-queue";
import { cn } from "@/lib/utils";

/** How long a landed run stands whole on the ring, its check on the face, before the shutter rests. */
const DONE_HOLD_MS = 1600;

const NO_ITEMS: readonly QueueItem[] = [];
const NO_PROGRESS: QueueProgress = { get: () => 0, subscribe: () => () => {} };

export function GuestActionDock({
  hidden,
  uploadingCount,
  onAdd,
  invite,
  tracker,
  twin,
  run,
  hues,
  more = true,
  camera = false,
}: {
  /** The cover's row is still on screen: the cluster waits, inert, off the bottom edge. */
  hidden: boolean;
  /** Files on their way, when no `run` is handed (its count then rides the shutter alone). */
  uploadingCount: number;
  /**
   * Omitted where the ROW omits Add too: uploads closed, or a teaser. The cluster carries what the
   * row carries and never invents an action the page above it does not offer.
   */
  onAdd?: () => void;
  /** Invite, as a slot (`GuestShare`, `look="round"`): the left flank. */
  invite?: ReactNode;
  /**
   * Her tracker's round button (`guest-capture` r1, `tracker=button`), beside the right flank as it
   * rides beside Add in the row. A slot, and it draws nothing where she has nothing to track.
   */
  tracker?: ReactNode;
  /** The right flank, Invite's twin: the reel's round, or the way back to the top (the page's). */
  twin?: ReactNode;
  /** The page's queue and its progress: the ring's run (`useRunProgress`). */
  run?: { items: readonly QueueItem[]; progress: QueueProgress } | null;
  /** The album's light (hue angles), the ring's colour. */
  hues?: readonly number[];
  /** More album lies below the screen: the foot's fade stands. */
  more?: boolean;
  /**
   * The album's Add opens its camera (`capture = 'camera'`, the page's `cameraAlbum`): the shutter says Take photos
   * and wears the camera on its face, as the cover's Add does. The atom's face is already its `children`.
   */
  camera?: boolean;
}) {
  const progress = useRunProgress(
    run?.items ?? NO_ITEMS,
    run?.progress ?? NO_PROGRESS,
  );
  const sending = run ? progress.sending : uploadingCount;

  // ★ A RUN THAT LANDS STANDS WHOLE FOR A BEAT, its check on the face, then the shutter rests. Only a
  // run with nothing refused: a run with failures has its sheet to say so, and a check would be half a
  // truth. The beat is taken the render the run ends (the adjust-state-during-render pattern), and let
  // go from a timer's own callback.
  const [lastSending, setLastSending] = useState(sending);
  const [done, setDone] = useState(false);
  if (sending !== lastSending) {
    setLastSending(sending);
    if (sending > 0) setDone(false);
    else if (lastSending > 0 && progress.landed > 0 && progress.failed === 0)
      setDone(true);
  }
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(false), DONE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  // Nothing to stand at the foot is nothing to draw, fade included.
  if (!onAdd && !invite) return null;

  const state: ShutterState = sending > 0 ? "sending" : done ? "done" : "idle";
  const addWords = camera ? "Take photos" : "Add photos";
  return (
    <div
      data-guest-dock=""
      data-hidden={hidden ? "" : undefined}
      // React 19 renders the boolean `inert` attribute; it takes the buttons out of the tab order AND
      // the accessibility tree, which `pointer-events-none` alone never did.
      inert={hidden}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-40",
        // The edge beat, from the contract: 300ms in, 200ms back out.
        //
        // ★ `translate`, NOT `transform`. Tailwind v4's translate utilities set the STANDALONE
        // `translate` property, so a transition naming `transform` animates nothing at all and the
        // cluster teleports (measured at 1440: computed `transform: none`, `translate: 0px 16px`).
        "transition-[translate,opacity] duration-300 ease-emphasis",
        "data-hidden:opacity-0 data-hidden:duration-200",
        "motion-safe:data-hidden:translate-y-4",
      )}
    >
      {/* THE FOOT'S FADE: the page's own ground rising over the album's last visible row while more
          album lies below, and gone at the album's end (his note). */}
      <div
        aria-hidden
        data-dock-fade=""
        data-more={more ? "" : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent",
          "opacity-0 transition-opacity duration-300 ease-emphasis data-more:opacity-100 motion-reduce:transition-none",
        )}
      />
      <div
        role="group"
        aria-label="Album actions"
        className={cn(
          "relative flex items-center justify-center gap-5",
          // Only the controls take a press; the band between them is the photograph's.
          "[&_button]:pointer-events-auto",
          // The safe area, so the cluster clears a notched phone's home indicator.
          "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        {invite}
        {onAdd && (
          <Shutter
            state={state}
            progress={run ? progress.progress : 0}
            count={sending}
            hues={hues}
            onClick={onAdd}
            aria-label={
              sending > 0
                ? `${addWords}, ${formatCount(sending)} uploading`
                : addWords
            }
          >
            {camera ? <Camera className="size-6" /> : undefined}
          </Shutter>
        )}
        {twin}
        {tracker}
      </div>
    </div>
  );
}
