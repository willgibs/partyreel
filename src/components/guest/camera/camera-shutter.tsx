"use client";

/**
 * THE CAMERA'S SHUTTER: white, round, the one thing she presses (the board's `dm-shutter`, kept). A press is a photo,
 * a hold a video where the album takes one (`use-shutter-press.ts`); while a video rolls its face turns the recording
 * red and a red ring fills round it to the clip's length (`filmingProgress`, `clock.ts`), so the limit is read at the
 * thumb.
 *
 * ★ ITS RING IS DRAWN FROM THE CLOCK, NEVER AN ANIMATION'S TIMELINE. The ring is information (how long is left), so
 * under reduced motion it still fills, step by step as the clock ticks, where a CSS animation of the clip's length
 * would be clamped to its end by the global guard and read "full" from the first frame.
 *
 * ★ ITS FOCUS IS THE HOUSE'S HALO, ITS PRESS ITS OWN (identity r4): the keyboard's mark is every control's (`focus-halo`),
 * but a press here is a camera's, the face sinking and turning red to film, which says more than a control's give.
 */
import type { Ref } from "react";

const R = 44;
const CIRCUMFERENCE = 2 * Math.PI * R;

type ShutterHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => void;
  onContextMenu: (e: { preventDefault: () => void }) => void;
};

export function CameraShutter({
  ref,
  handlers,
  pressed,
  filming,
  progress,
  disabled,
  label,
  describedBy,
}: {
  ref?: Ref<HTMLButtonElement>;
  handlers: ShutterHandlers;
  pressed: boolean;
  filming: boolean;
  /** The video's share of its length, while one rolls. */
  progress: number | null;
  disabled: boolean;
  label: string;
  describedBy?: string;
}) {
  const p = progress === null ? 0 : Math.min(1, Math.max(0, progress));
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      data-cam-shutter=""
      data-pressed={pressed ? "" : undefined}
      data-filming={filming ? "" : undefined}
      className="cam-shutter focus-halo"
      {...handlers}
    >
      <svg aria-hidden viewBox="0 0 96 96" className="cam-shutter-ring">
        {filming && (
          <circle
            cx="48"
            cy="48"
            r={R}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="cam-shutter-progress"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - p)}
            transform="rotate(-90 48 48)"
          />
        )}
      </svg>
      <span aria-hidden className="cam-shutter-face" />
    </button>
  );
}
