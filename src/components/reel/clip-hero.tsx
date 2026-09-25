"use client";

import { useEffect, useRef } from "react";
import { Pause, Play } from "lucide-react";

import { CLIP_STILL_FRAME } from "@/lib/reel/clip-encode";
import { makingWords } from "@/lib/reel/clip-words";
import type { ReelProps } from "@/lib/reel/engine/reel-types";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import { ClipCanvas } from "./clip-canvas";
import { ROOM_FOCUS, ROOM_PRESS } from "./clip-room";

/**
 * THE CLIP ITSELF, AT THE SIZE ITS BOX GIVES IT: playing while she chooses, stacked and counting
 * while it is drawn, and the file itself once it exists.
 */

/** The clip while she chooses: the engine's own frames, with play and pause beside it. */
export function ClipHero({
  props,
  playing,
  onTogglePlay,
  maxDim,
  compact,
  making,
}: {
  props: ReelProps;
  playing: boolean;
  onTogglePlay: () => void;
  maxDim: number;
  /** A clip in a hand: the stack's count steps down a size so it holds one line. */
  compact?: boolean;
  /** The export's minute (`wait=stack`): the frame stacks, counts and offers Cancel. */
  making?: {
    left: number;
    total: number;
    paused: boolean;
    onCancel: () => void;
  };
}) {
  const empty = props.clips.length === 0;
  return (
    <div
      data-clip-hero={making ? "making" : "playing"}
      className="relative size-full"
    >
      {making ? <StackEdges /> : null}
      <div className="relative size-full overflow-hidden rounded-xl bg-[oklch(0.16_0_0)] ring-1 ring-white/10">
        {empty ? (
          <div className="flex size-full items-center justify-center px-6 text-center text-caption text-white/45">
            Pick a moment to start your clip
          </div>
        ) : (
          <ClipCanvas
            props={props}
            playing={playing && !making}
            frame={CLIP_STILL_FRAME}
            maxDim={maxDim}
            label={
              making
                ? "Your clip, being drawn"
                : playing
                  ? "Your clip, playing"
                  : "Your clip, paused"
            }
          />
        )}
        {making ? (
          <MakingStack {...making} compact={compact} />
        ) : empty ? null : (
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause the clip" : "Play the clip"}
            className={cn(
              "absolute bottom-2.5 left-2.5 flex size-9 items-center justify-center rounded-full text-white",
              GLASS,
              ROOM_FOCUS,
              ROOM_PRESS,
            )}
          >
            {playing ? (
              <Pause className="size-3.5 fill-white" aria-hidden />
            ) : (
              <Play className="ml-0.5 size-3.5 fill-white" aria-hidden />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Two edges peeking above the frame, BEHIND it: the frame stays opaque and a scrim does the
 * dimming, or the edges would show through the photograph as two grey bars across its top.
 */
function StackEdges() {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-x-5 -top-3 h-6 rounded-t-xl bg-white/[0.09]"
      />
      <span
        aria-hidden
        className="absolute inset-x-2.5 -top-1.5 h-6 rounded-t-xl bg-white/[0.16]"
      />
    </>
  );
}

function MakingStack({
  left,
  total,
  paused,
  onCancel,
  compact,
}: {
  left: number;
  total: number;
  paused: boolean;
  onCancel: () => void;
  compact?: boolean;
}) {
  const words = makingWords({ left, total, paused });
  return (
    <div
      data-clip-progress="stack"
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-center",
        compact ? "px-3" : "px-5",
      )}
    >
      <p
        className="font-heading text-subsection text-white tabular-nums"
        role="status"
        aria-live="polite"
      >
        {compact ? (
          // A clip in a hand is too narrow for the line: the figure over its unit, one each.
          <>
            <span className="block">{words.figure}</span>{" "}
            <span className="block text-caption font-medium text-white/80">
              {words.unit}
            </span>
          </>
        ) : (
          words.count
        )}
      </p>
      <p className="max-w-[24ch] text-caption text-white/65">{words.line}</p>
      <button
        type="button"
        onClick={onCancel}
        className={cn(
          "mt-1 flex h-8 items-center rounded-full border border-white/25 px-3.5 text-caption font-medium text-white/85 hover:text-white",
          ROOM_FOCUS,
          ROOM_PRESS,
        )}
      >
        Cancel
      </button>
    </div>
  );
}

/**
 * THE FILE ITSELF on the finish: the encoded mp4, looping silently (a clip has no sound track), so
 * what she shares is what she sees. Reduced motion holds its first frame with the controls up.
 */
export function FinishedClip({
  file,
  reduced,
}: {
  file: File;
  reduced: boolean;
}) {
  // The file's address lives exactly as long as this video shows it: made and handed to the element
  // together, revoked together (a render never holds one that a cleanup has already let go).
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const url = URL.createObjectURL(file);
    video.src = url;
    return () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
    };
  }, [file]);
  return (
    <div
      data-clip-hero="finished"
      className="relative size-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10"
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        controls={reduced}
        aria-label="Your finished clip"
        className="size-full object-contain"
      />
    </div>
  );
}
