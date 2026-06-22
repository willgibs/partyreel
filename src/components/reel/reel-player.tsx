"use client";

import { Player } from "@remotion/player";
import { useMemo } from "react";

import {
  FPS,
  layoutReel,
  Reel,
  REEL_HEIGHT,
  REEL_WIDTH,
  type ReelProps,
} from "@/lib/reel/composition";

// The live, in-app reel — the SAME <Reel> composition the Lambda render will encode, so the preview IS
// the export (WYSIWYG). $0 + universal: nothing encodes; a shuffle (new seed in reelProps) just
// re-renders here. The <Player> (unlike <Composition>) needs duration/fps/dimensions passed explicitly,
// so we derive duration from the shared layoutReel — it can never drift from what the encoder produces.
export function ReelPlayer({ reelProps }: { reelProps: ReelProps }) {
  const durationInFrames = useMemo(
    () => Math.max(1, Math.round(layoutReel(reelProps).totalSec * FPS)),
    [reelProps],
  );

  return (
    // A centered phone-frame: the 9:16 reel IS the hero (no wide black side-bars in the wide column).
    // The wrapper is the frame, so the Player fills it exactly.
    <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border bg-black shadow-sm">
      <Player
        component={Reel}
        inputProps={reelProps}
        durationInFrames={durationInFrames}
        fps={FPS}
        compositionWidth={REEL_WIDTH}
        compositionHeight={REEL_HEIGHT}
        // The reel is the hero — it plays on mount (silent, so autoplay is never blocked) and loops.
        autoPlay
        loop
        controls
        style={{ width: "100%", aspectRatio: `${REEL_WIDTH} / ${REEL_HEIGHT}` }}
      />
    </div>
  );
}
