"use client";

import { BodyCamera } from "./cam-body";
import { ReelCamera } from "./cam-reel";
import type { CameraId, CamProps } from "./cam-shared";
import { Viewfinder } from "./cam-viewfinder";
import { WrapperCamera } from "./cam-wrapper";

/**
 * THE FOUR CAMERAS, one door: every decision after the first draws in the
 * camera Will picked (a staged decision is drawn in the world it waits on),
 * so a caller names the camera and the phase and nothing else.
 */
export function Camera({ id, ...p }: CamProps & { id: CameraId }) {
  if (id === "body") return <BodyCamera {...p} />;
  if (id === "reel") return <ReelCamera {...p} />;
  if (id === "wrapper") return <WrapperCamera {...p} />;
  return <Viewfinder {...p} />;
}

export const CAMERA_IDS: readonly CameraId[] = [
  "viewfinder",
  "body",
  "reel",
  "wrapper",
];

export const cameraOf = (v: unknown): CameraId =>
  CAMERA_IDS.includes(v as CameraId) ? (v as CameraId) : "reel";
