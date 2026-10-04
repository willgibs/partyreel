"use client";

/**
 * THE SHUTTER'S ONE PRESS (Will's `video=hold`: a press takes a photo; holding films, filling the ring to the clip's
 * length (`CAMERA_VIDEO_SECONDS`), and letting go stops it. One button and no mode).
 *
 * ★ A PHOTO FIRES ON THE RELEASE, A VIDEO ON THE HOLD. Where the album takes a video, a press held past `HOLD_MS`
 * starts filming and letting go stops it; anything shorter is a photo, taken as the finger lifts, which is how a phone's
 * own camera tells a tap from a hold. Where it takes none (Free, or the host's Videos off) every press is a photo on
 * its release, however long.
 *
 * ★ THE PRESS IS CAPTURED, so a thumb that drifts off the shutter while filming still stops the video where it lifts,
 * and a press the browser takes away (an incoming call, the phone's own prompt) ends as nothing, or keeps the video it
 * had begun (`pointercancel`).
 *
 * ★ A KEYBOARD PRESSES IT TOO: Space or Enter down and up is a press, held for a video; a key's own repeat is no
 * second press.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

/** How long a press is held before it films. */
export const HOLD_MS = 350;

/** `spent`: the camera ended the video itself while the finger is still down; its lift ends as nothing. */
type Phase = "idle" | "down" | "filming" | "spent";

export function useShutterPress({
  canFilm,
  disabled,
  onPhoto,
  onFilmStart,
  onFilmStop,
}: {
  canFilm: boolean;
  disabled: boolean;
  onPhoto: () => void;
  onFilmStart: () => void;
  /** `cancelled`: the browser took the press away rather than her letting go. */
  onFilmStop: (cancelled: boolean) => void;
}) {
  const phase = useRef<Phase>("idle");
  const timer = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const latest = useRef({
    canFilm,
    disabled,
    onPhoto,
    onFilmStart,
    onFilmStop,
  });
  useEffect(() => {
    latest.current = { canFilm, disabled, onPhoto, onFilmStart, onFilmStop };
  });

  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  // A press still pending when the camera goes must never fire into it.
  useEffect(() => clear, []);

  const begin = useCallback(() => {
    if (latest.current.disabled || phase.current !== "idle") return false;
    phase.current = "down";
    setPressed(true);
    if (latest.current.canFilm) {
      timer.current = window.setTimeout(() => {
        timer.current = null;
        if (phase.current !== "down") return;
        phase.current = "filming";
        latest.current.onFilmStart();
      }, HOLD_MS);
    }
    return true;
  }, []);

  const end = useCallback((cancelled: boolean) => {
    const was = phase.current;
    clear();
    phase.current = "idle";
    setPressed(false);
    if (was === "down" && !cancelled) latest.current.onPhoto();
    if (was === "filming") latest.current.onFilmStop(cancelled);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (!begin()) return;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // A pointer the browser no longer tracks: the press still ends on its own up or cancel.
      }
    },
    [begin],
  );
  const onPointerUp = useCallback(() => end(false), [end]);
  const onPointerCancel = useCallback(() => end(true), [end]);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (e.repeat) return;
      begin();
    },
    [begin],
  );
  const onKeyUp = useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      end(false);
    },
    [end],
  );

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      // A long press on a phone opens no menu and selects nothing.
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    },
    /** The camera ended the video itself (its length): the press that is still down ends as nothing. */
    release: useCallback(() => {
      clear();
      if (phase.current === "filming") phase.current = "spent";
    }, []),
  };
}
