import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { BrowserFrame } from "./browser-frame";

// Media-ready video-player frame — grayscale chrome + the dark `--gallery` player
// surface (the media-first surface the app uses). A real reel preview drops into the
// 16:9 area later. aria-hidden, purely decorative.
export function ReelFrame({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("w-full", className)}>
      <BrowserFrame className="overflow-hidden">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gallery">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-gallery shadow-lg">
              <Play className="size-6 translate-x-0.5 fill-current" />
            </span>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
            <span className="text-[10px] font-medium text-white/80">0:12</span>
            <span className="relative h-1 flex-1 rounded-full bg-white/25">
              {/* Gallery-relative, NOT bg-brand: this sits on the always-dark
                  player, where light-mode brand (ink) reads as a notch. */}
              <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gallery-foreground/90" />
            </span>
            <span className="text-[10px] font-medium text-white/80">0:48</span>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}
