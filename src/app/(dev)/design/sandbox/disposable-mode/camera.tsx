"use client";

import type { CameraId, CamProps } from "./cam-shared";
import { ReelCamera } from "./cam-reel";
import { RimCamera } from "./cam-rim";
import { ScrollCamera } from "./cam-scroll";
import { ShutterCamera } from "./cam-shutter";
import { TimelineCamera } from "./cam-timeline";
import { Viewfinder } from "./cam-viewfinder";

/**
 * THE SIX CAMERAS, one door: the two Will carried (the album's own camera and
 * the camera on a reel) and two branches of each. Every decision after the
 * first draws in the camera he picked (a staged decision is drawn in the
 * world it waits on), so a caller names the camera and the phase and nothing
 * else.
 */
export function Camera({ id, ...p }: CamProps & { id: CameraId }) {
  if (id === "shutter") return <ShutterCamera {...p} />;
  if (id === "rim") return <RimCamera {...p} />;
  if (id === "reel") return <ReelCamera {...p} />;
  if (id === "timeline") return <TimelineCamera {...p} />;
  if (id === "scroll") return <ScrollCamera {...p} />;
  return <Viewfinder {...p} />;
}

export const CAMERA_IDS: readonly CameraId[] = [
  "viewfinder",
  "shutter",
  "rim",
  "reel",
  "timeline",
  "scroll",
];

/** The camera the board's state names, or the recommendation's. */
export const cameraOf = (v: unknown, fallback: CameraId): CameraId =>
  CAMERA_IDS.includes(v as CameraId) ? (v as CameraId) : fallback;
