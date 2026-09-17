import type { ReactNode } from "react";

import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { BrowserFrame } from "./browser-frame";

// Media-ready video-player frame — grayscale chrome + the dark `--gallery` player
// surface (the media-first surface the app uses). aria-hidden, purely decorative.
//
// The optional `media` slot (Track B, /reel): drop a REAL poster-first reel loop
// into the 16:9 area and the placeholder chrome (gradient, play badge, fake
// timeline) steps aside — real playback needs no painted-on transport, and a
// fake progress bar over a playing video would read as broken. Without `media`
// the original placeholder look is untouched (the /features consumers).
export function ReelFrame({
  className,
  media,
}: {
  className?: string;
  /** A poster-first loop (e.g. AmbientReelVideo) filling the player area. */
  media?: ReactNode;
}) {
  return (
    <div aria-hidden className={cn("w-full", className)}>
      <BrowserFrame className="overflow-hidden">
        {/* The player's well takes the bright edge (globals.css, [data-lit]):
            it owns its radius and has no border, so the hook has no value. */}
        <div
          data-lit=""
          className="relative aspect-video overflow-hidden rounded-xl bg-gallery"
        >
          {media ?? (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-gallery shadow-lift">
                  <Play className="size-6 translate-x-0.5 fill-current" />
                </span>
              </div>
              <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
                <span className="text-[10px] font-medium text-white/80">
                  0:12
                </span>
                <span className="relative h-1 flex-1 rounded-full bg-white/25">
                  {/* Gallery-relative, NOT bg-brand: this sits on the always-dark
                      player, where light-mode brand (ink) reads as a notch. */}
                  <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gallery-foreground/90" />
                </span>
                <span className="text-[10px] font-medium text-white/80">
                  0:48
                </span>
              </div>
            </>
          )}
        </div>
      </BrowserFrame>
    </div>
  );
}
