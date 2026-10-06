"use client";

import { Play } from "lucide-react";
import { lazy, Suspense, useCallback, useState } from "react";
import { createPortal } from "react-dom";

import { AmbientReelVideo } from "@/components/marketing/sections/reel/ambient-reel-video";
import { trackAttrs } from "@/lib/analytics/events";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { requireReel } from "./inline-reel-player";

const ContainedPlayer = lazy(() => import("./sample-reel-overlay.lazy"));

/**
 * OPENING THE CONTAINED PLAYER FROM INSIDE A SECTION (`reel-story` r2
 * `play=modal`). `open(from)` mounts the lazy player; `layer` is what the
 * caller renders, anywhere in its tree.
 *
 * ★ THE LAYER PORTALS TO THE NEAREST `[data-mkt]`, NEVER TO <body> AND NEVER
 * IN PLACE. In place, it would sit inside the section's reveal wrappers, whose
 * cut entrance holds a transform (`animation-fill-mode: both`), and a
 * transformed ancestor becomes the containing block of a `fixed` layer, which
 * would then cover the section instead of the screen. <body> is outside the
 * skin wrapper, where neither the cinema room's `.dark` tokens nor the
 * `[data-mkt]` modal recipe reach. The skin wrapper has both and no transform.
 * The home hero renders the same player as a sibling of its section instead,
 * which is the same escape by hand.
 */
export function useReelPlayer(reelId: string) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const open = useCallback((from: HTMLElement) => {
    setHost(from.closest<HTMLElement>("[data-mkt]") ?? document.body);
  }, []);
  const layer = host
    ? createPortal(
        <Suspense fallback={null}>
          <ContainedPlayer reelId={reelId} onClose={() => setHost(null)} />
        </Suspense>,
        host,
      )
    : null;
  // True from the tap that opens the contained player until its onClose: the teaser loop underneath
  // reads this to stop decoding while it cannot be seen (build 11's red-team).
  return { open, layer, active: host !== null };
}

/**
 * THE TEASER'S SCREEN (`reel-story` r1 `teaser=poster`, as his note reshaped
 * it: "a custom clipped short looped video that inspires a click on the play
 * mark"): a short muted loop, playing on its own, with a play mark that opens
 * the whole film in the contained player. The loop is decoration and says so
 * (`AmbientReelVideo` is aria-hidden and keeps the loop-pause contract:
 * offscreen, a hidden tab and reduced motion all hold its poster, and so does
 * this screen's own contained player once it is up: `active` holds it too,
 * so the loop is not decoding, unseen, underneath the film it just opened);
 * the one control is the button laid over it, never a wrapper around it.
 *
 * `reelId` is the section's own film; the loop is its first seconds until a
 * short cut of its own exists. This box owns the corner and the bright edge
 * (`data-lit`), so the loop inside it carries neither.
 */
export function ReelPlayScreen({
  reelId,
  source,
  label = "Play a sample highlight reel",
  sizes = "(min-width: 768px) 768px, 100vw",
  className,
}: {
  reelId: string;
  /** The `reel_play` analytics source for this mount. */
  source: string;
  label?: string;
  sizes?: string;
  className?: string;
}) {
  const reel = requireReel(reelId);
  const { open, layer, active } = useReelPlayer(reelId);
  return (
    <>
      <div
        data-lit=""
        className={cn(
          "group relative w-full overflow-hidden rounded-xl bg-gallery",
          className,
        )}
      >
        <AmbientReelVideo reel={reel} sizes={sizes} paused={active} />
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          onClick={(e) => open(e.currentTarget)}
          {...trackAttrs("reel_play", { source })}
          className="absolute inset-0 flex items-center justify-center rounded-xl outline-none focus-halo halo-inset"
        >
          <span
            aria-hidden
            className={cn(
              "flex size-16 items-center justify-center rounded-full text-white",
              "transition-transform duration-150 ease-emphasis group-hover:scale-105 group-active:scale-[0.97] motion-reduce:transition-none",
              GLASS,
            )}
          >
            <Play
              className={cn(
                "size-6 translate-x-0.5 fill-white",
                GLASS_MARK_LIT,
              )}
            />
          </span>
        </button>
      </div>
      {layer}
    </>
  );
}
