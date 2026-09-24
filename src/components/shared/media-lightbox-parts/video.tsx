"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { Pause, Play } from "lucide-react";

import { ActionTooltip } from "@/components/shared/action-tooltip";
import { GLASS, GLASS_MARK_LIT } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * A VIDEO IN THE VIEWER (`video=auto`, Will 2026-09-24: "Video should also have
 * at least a scrubber (right word for time control UI bar?) to control the
 * video (to rewatch or skip to certain points)"). The clip plays muted and
 * looping the moment it is on screen; this is the thin transport under it:
 * play and pause, a scrubber that seeks, and the time. The browser's own bar is
 * gone, so the whole look is ours and the swipe no longer shares a strip with
 * another company's controls.
 */

/** m:ss, the way every player writes a short clip's time. */
export function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export type VideoState = {
  playing: boolean;
  muted: boolean;
  duration: number;
};

/**
 * The center clip's state, read off its own events (never polled). The viewer
 * hands in the element it bound (a callback ref's state), so a swipe to another
 * clip re-subscribes.
 */
export function useVideoState(el: HTMLVideoElement | null): VideoState {
  const [state, setState] = useState<VideoState>({
    playing: false,
    muted: true,
    duration: 0,
  });
  useEffect(() => {
    if (!el) return;
    const read = () =>
      setState({
        playing: !el.paused && !el.ended,
        muted: el.muted,
        duration: Number.isFinite(el.duration) ? el.duration : 0,
      });
    const events = [
      "play",
      "playing",
      "pause",
      "ended",
      "volumechange",
      "loadedmetadata",
      "durationchange",
    ];
    for (const e of events) el.addEventListener(e, read);
    // The first read waits a frame: a clip that is already playing or already
    // knows its length says so without an event.
    const first = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(first);
      for (const e of events) el.removeEventListener(e, read);
    };
  }, [el]);
  return state;
}

const TRANSPORT_BUTTON = cn(
  "flex size-7 shrink-0 items-center justify-center rounded-full text-white/85 outline-none",
  "transition-[color,transform] duration-150 ease-emphasis hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 active:scale-90 motion-reduce:active:scale-100",
  GLASS_MARK_LIT,
);

/**
 * THE TRANSPORT: play or pause, the scrubber, the time. Its own capsule in the
 * one material, stacked above the actions (the `pills` stack), sized to the
 * clip's own width so it reads as belonging to the picture above it.
 */
export function VideoTransport({
  videoRef,
  clipKey,
  width,
  state,
  onTogglePlay,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  clipKey: string;
  /** The clip's own width at fit, so the transport reads as belonging to it. */
  width: number | null;
  state: VideoState;
  onTogglePlay: () => void;
}) {
  const label = state.playing ? "Pause" : "Play";
  return (
    <div
      data-lightbox-transport
      style={{
        width: width
          ? `min(calc(100vw - 1.5rem), ${Math.round(Math.min(544, Math.max(260, width)))}px)`
          : undefined,
      }}
      className={cn(
        "pointer-events-auto flex h-9 w-[min(34rem,calc(100vw-1.5rem))] items-center gap-2 rounded-full pr-4 pl-1.5",
        GLASS,
      )}
    >
      <ActionTooltip label={label}>
        <button
          type="button"
          aria-label={label}
          onClick={onTogglePlay}
          className={TRANSPORT_BUTTON}
        >
          {state.playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="ml-px size-4 fill-current" />
          )}
        </button>
      </ActionTooltip>
      <Scrubber
        videoRef={videoRef}
        clipKey={clipKey}
        duration={state.duration}
        playing={state.playing}
      />
    </div>
  );
}

/**
 * THE SCRUBBER. A thin line with a generous hit area, a thumb that appears
 * under a hand or a focus, and the time beside it. Seeking pauses the clip
 * while the finger is down and picks it back up where it was going.
 *
 * ★ THE PLAYED LINE IS WRITTEN FRAME BY FRAME, NOT THROUGH REACT. `timeupdate`
 * fires about four times a second, which steps a line visibly; a rAF loop while
 * the clip plays writes one `scaleX` to one element (a composited property, so
 * the album behind never repaints), and React re-renders nothing.
 */
function Scrubber({
  videoRef,
  clipKey,
  duration,
  playing,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  clipKey: string;
  duration: number;
  playing: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const seekingRef = useRef<{ id: number; resume: boolean } | null>(null);
  const [now, setNow] = useState(0);

  const paint = useCallback(
    (t: number) => {
      const p = duration > 0 ? Math.min(1, Math.max(0, t / duration)) : 0;
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (thumbRef.current) thumbRef.current.style.left = `${p * 100}%`;
      if (timeRef.current) timeRef.current.textContent = clock(t);
    },
    [duration],
  );

  // The played line follows the clip: every frame while it plays, and once on
  // any seek or load while it does not.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      paint(el.currentTime);
      raf = requestAnimationFrame(tick);
    };
    const once = () => {
      paint(el.currentTime);
      setNow(Math.floor(el.currentTime));
    };
    once();
    if (playing && typeof requestAnimationFrame === "function")
      raf = requestAnimationFrame(tick);
    el.addEventListener("seeked", once);
    el.addEventListener("timeupdate", once);
    el.addEventListener("loadedmetadata", once);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("seeked", once);
      el.removeEventListener("timeupdate", once);
      el.removeEventListener("loadedmetadata", once);
    };
  }, [videoRef, clipKey, playing, paint]);

  const seekTo = useCallback(
    (t: number) => {
      const el = videoRef.current;
      if (!el || !(duration > 0)) return;
      const next = Math.min(duration, Math.max(0, t));
      el.currentTime = next;
      paint(next);
      setNow(Math.floor(next));
    },
    [videoRef, duration, paint],
  );

  const timeAt = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return ((clientX - rect.left) / rect.width) * duration;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !(duration > 0)) return;
    // The scrubber is its own control: nothing under it may read this as a
    // swipe, a pull down or a tap on blank space.
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    seekingRef.current = { id: e.pointerId, resume: !el.paused };
    el.pause();
    seekTo(timeAt(e.clientX));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = seekingRef.current;
    if (!s || s.id !== e.pointerId) return;
    e.stopPropagation();
    seekTo(timeAt(e.clientX));
  };
  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const s = seekingRef.current;
    if (!s || s.id !== e.pointerId) return;
    e.stopPropagation();
    seekingRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (s.resume) void videoRef.current?.play().catch(() => {});
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const el = videoRef.current;
    if (!el || !(duration > 0)) return;
    const step = Math.max(1, Math.min(5, duration / 10));
    const moves: Record<string, number> = {
      ArrowLeft: el.currentTime - step,
      ArrowDown: el.currentTime - step,
      ArrowRight: el.currentTime + step,
      ArrowUp: el.currentTime + step,
      Home: 0,
      End: duration,
    };
    if (!(e.key in moves)) return;
    // The viewer's arrows step through the album; here they step through the clip.
    e.preventDefault();
    e.stopPropagation();
    seekTo(moves[e.key]);
  };

  return (
    <>
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={now}
        aria-valuetext={`${clock(now)} of ${clock(duration)}`}
        data-lightbox-scrubber
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className="group/scrub relative flex h-full min-w-0 flex-1 cursor-pointer touch-none items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span
          aria-hidden
          className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/25"
        >
          {/* The start is inline, never `scale-x-0`: that utility sets the
              standalone `scale` property, which would multiply the `scaleX`
              the frame loop writes back to nothing. */}
          <span
            ref={fillRef}
            style={{ transform: "scaleX(0)" }}
            className="absolute inset-0 origin-left rounded-full bg-white"
          />
        </span>
        <span
          ref={thumbRef}
          aria-hidden
          data-lightbox-thumb
          className="pointer-events-none absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 ring-1 ring-black/25 transition-opacity duration-150 ease-emphasis group-hover/scrub:opacity-100 group-focus-visible/scrub:opacity-100 group-active/scrub:opacity-100"
        />
      </div>
      <span
        aria-hidden
        className={cn(
          "shrink-0 text-caption text-white/80 tabular-nums",
          GLASS_MARK_LIT,
        )}
      >
        {/* Written by `paint` on every frame; React renders only its first value. */}
        <span ref={timeRef}>0:00</span>
        <span className="text-white/45"> / {clock(duration)}</span>
      </span>
    </>
  );
}
