"use client";

import { Player } from "@remotion/player";
import { useMemo } from "react";

import {
  FPS,
  planReel,
  Reel,
  reelDimensions,
  type ReelProps,
} from "@/lib/reel/composition";

// The live, in-app reel — the SAME <Reel> composition the Lambda render will encode, so the preview IS
// the export (WYSIWYG). $0 + universal: nothing encodes; a shuffle (new seed in reelProps) just
// re-renders here. The <Player> (unlike <Composition>) needs duration/fps/dimensions passed explicitly, so
// we derive duration via the shared planReel + dimensions via reelDimensions(orientation) — neither can
// drift from what the encoder produces.
export function ReelPlayer({ reelProps }: { reelProps: ReelProps }) {
  const durationInFrames = useMemo(
    () => Math.max(1, planReel(reelProps).totalFrames),
    [reelProps],
  );
  const { width, height } = reelDimensions(reelProps.orientation);
  const landscape = width > height;

  return (
    // A centered frame: the reel IS the hero (no wide black side-bars). The wrapper sizes to the
    // orientation so the Player fills it exactly.
    <div
      className={`mx-auto w-full overflow-hidden rounded-xl border bg-black shadow-sm ${landscape ? "max-w-[640px]" : "max-w-[360px]"}`}
    >
      <Player
        component={Reel}
        inputProps={reelProps}
        durationInFrames={durationInFrames}
        fps={FPS}
        compositionWidth={width}
        compositionHeight={height}
        // The reel is the hero — it plays on mount (silent, so autoplay is never blocked) and loops.
        autoPlay
        loop
        controls
        style={{ width: "100%", aspectRatio: `${width} / ${height}` }}
      />
    </div>
  );
}
