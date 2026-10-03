"use client";

/**
 * THE CAMERA'S PICTURE FOR AS LONG AS THE CAMERA IS SHOWING, AND NOT A MOMENT LONGER (the brief: "the camera released
 * whenever the page hides"). `active` is the camera open with its page visible: the picture is asked for when it turns
 * true and every track is stopped the moment it turns false (the phone's camera light goes out with it), and a facing
 * change or a Try again asks afresh.
 *
 * ★ THE LAST FRAME STAYS WHILE THE NEXT PICTURE IS ASKED FOR. A stopped stream leaves its video element on its last
 * frame, so turning the camera round, or coming back to the page, shows the old picture frozen until the new one
 * arrives, never a black flash; `facing` says which camera the picture is from, so the screen can soften the frozen
 * one while it waits.
 */
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  accessFromError,
  canAskCamera,
  type CameraAccess,
} from "@/lib/guest/camera/access";
import { openCamera, stopStream, type Facing } from "@/lib/guest/camera/stream";

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** Whether the page is the one on screen (a hidden tab, a locked phone, another app in front all read false). */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}

export type CameraPicture = {
  access: CameraAccess;
  stream: MediaStream | null;
  /** The camera the live picture is from (it lags `facing` while a turn is asked for). */
  facing: Facing;
};

export function useCameraStream(
  active: boolean,
  facing: Facing,
  attempt: number,
): CameraPicture {
  const [picture, setPicture] = useState<CameraPicture>({
    access: "asking",
    stream: null,
    facing,
  });

  useEffect(() => {
    if (!active) return;
    let alive = true;
    let held: MediaStream | null = null;
    if (!canAskCamera()) {
      // No camera API on this page at all: said in a microtask, so the effect sets nothing as it runs.
      void Promise.resolve().then(() => {
        if (alive) setPicture({ access: "unavailable", stream: null, facing });
      });
      return () => {
        alive = false;
      };
    }
    openCamera(facing).then(
      (stream) => {
        if (!alive) {
          stopStream(stream);
          return;
        }
        held = stream;
        setPicture({ access: "live", stream, facing });
      },
      (error: unknown) => {
        if (alive) {
          setPicture({ access: accessFromError(error), stream: null, facing });
        }
      },
    );
    return () => {
      alive = false;
      stopStream(held);
    };
  }, [active, facing, attempt]);

  return picture;
}
