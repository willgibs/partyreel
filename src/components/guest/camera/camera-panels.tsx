"use client";

/**
 * WHAT THE PICTURE SAYS WHEN THERE IS NOTHING TO FRAME: the roll's end, and a camera that could not open. Each lies
 * over the picture's own box, so the camera keeps its shape whatever it says (bible 3: nothing is a dead end; every
 * panel names the way on).
 */
import { Camera, CameraOff } from "lucide-react";
import type { ComponentProps } from "react";

import {
  BACK_TO_ALBUM,
  CAMERA_ACCESS,
  FREE_A_FRAME,
  ROLL_DONE_TITLE,
  SEE_YOUR_SHOTS,
} from "@/lib/guest/camera/words";
import { Button } from "@/components/ui/button";
import type { CameraAccess } from "@/lib/guest/camera/access";
import { cn } from "@/lib/utils";

function Panel({ children, className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center px-7 text-center",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * THE ROLL, DONE (the board's carried call `end`: "Says the roll is done and when it comes back, with her shots one tap
 * away and the album behind it; the shutter goes"). The picture stays behind it, blurred and dimmed.
 */
export function RollDonePanel({
  line,
  freeAFrame,
  onShots,
  onBack,
}: {
  /** How the roll comes back (`rollDoneLine`), or the server's own sentence for the ceiling. */
  line: string;
  /** Removing a shot can still free a frame (the ceiling is not reached). */
  freeAFrame: boolean;
  onShots: () => void;
  onBack: () => void;
}) {
  return (
    <Panel className="cam-dim" data-cam-done="">
      <p className="font-heading text-page text-white">{ROLL_DONE_TITLE}</p>
      <p className="mt-1.5 max-w-72 text-reading text-pretty text-white/75">
        {line}
      </p>
      <div className="mt-6 grid w-full max-w-72 gap-2">
        <Button type="button" variant="on-photo" size="cta" onClick={onShots}>
          {SEE_YOUR_SHOTS}
        </Button>
        <Button type="button" variant="glass" size="cta" onClick={onBack}>
          {BACK_TO_ALBUM}
        </Button>
      </div>
      {freeAFrame && (
        <p className="mt-4 text-caption text-white/55">{FREE_A_FRAME}</p>
      )}
    </Panel>
  );
}

/** A camera that is opening, or could not. */
export function AccessPanel({
  access,
  onRetry,
  onPhoneCamera,
}: {
  access: Exclude<CameraAccess, "live">;
  onRetry: () => void;
  /** The phone's own camera, through the file picker (`capture`), clicked inside this tap. */
  onPhoneCamera: () => void;
}) {
  if (access === "idle" || access === "asking") {
    return (
      <Panel data-cam-access={access}>
        <Camera className="size-7 text-white/40" aria-hidden />
        <p className="mt-3 text-reading text-white/70">
          {access === "asking" ? CAMERA_ACCESS.asking : CAMERA_ACCESS.opening}
        </p>
      </Panel>
    );
  }
  const title =
    access === "denied"
      ? CAMERA_ACCESS.deniedTitle
      : access === "busy"
        ? CAMERA_ACCESS.busyTitle
        : CAMERA_ACCESS.unavailableTitle;
  const line =
    access === "denied"
      ? CAMERA_ACCESS.deniedLine
      : access === "busy"
        ? CAMERA_ACCESS.busyLine
        : CAMERA_ACCESS.unavailableLine;
  return (
    <Panel data-cam-access={access}>
      <CameraOff className="size-7 text-white/50" aria-hidden />
      <p className="mt-3 font-heading text-subsection text-white">{title}</p>
      <p className="mt-1.5 max-w-72 text-reading text-pretty text-white/70">
        {line}
      </p>
      <div className="mt-6 grid w-full max-w-72 gap-2">
        {access !== "unavailable" && (
          <Button type="button" variant="on-photo" size="cta" onClick={onRetry}>
            {CAMERA_ACCESS.tryAgain}
          </Button>
        )}
        {access !== "busy" && (
          <Button
            type="button"
            variant={access === "unavailable" ? "on-photo" : "glass"}
            size="cta"
            onClick={onPhoneCamera}
          >
            {CAMERA_ACCESS.usePhoneCamera}
          </Button>
        )}
      </div>
    </Panel>
  );
}
