"use client";

/**
 * WHAT THE PICTURE SAYS WHEN THERE IS NOTHING TO FRAME: the roll's end, a fresh roll, her newest shot pressed on the
 * reel, and a camera that could not open. Each lies over the picture's own box, so the camera keeps its shape whatever
 * it says (bible 3: nothing is a dead end; every panel names the way on), and each is the roll's end's one shape: a
 * title or a picture, a line, its keys.
 */
import { Camera, CameraOff, Play } from "lucide-react";
import { type ComponentProps, type Ref, useId } from "react";

import {
  BACK_TO_ALBUM,
  CAMERA_ACCESS,
  FREE_A_FRAME,
  FRESH_ROLL_TITLE,
  ROLL_DONE_TITLE,
  SEE_YOUR_SHOTS,
  START_SHOOTING,
  TAKE_BACK,
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
  freeLine = FREE_A_FRAME,
  onShots,
  onBack,
}: {
  /** How the roll comes back (`rollDoneLine`), and, once they are spent, that her re-shoots are used. */
  line: string;
  /** Removing a shot can still free a frame (a re-shoot is left). */
  freeAFrame: boolean;
  /** What the way on says while it can: how many re-shoots are left (`freeAFrameLine`). */
  freeLine?: string;
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
        <p className="mt-4 text-caption text-pretty text-white/55">
          {freeLine}
        </p>
      )}
    </Panel>
  );
}

/**
 * A FRESH ROLL (host-moments r1's `fresh-roll=panel`: "A fresh roll is good news; said once, over the picture, it reads
 * as a gift instead of a glitch"): the first time her camera meets a roll that started again (a develop time added
 * mid-party), the roll's end's shape says it over the finder, why and when it develops, with one key on. The shutter
 * waits for it ("One press before her first shot").
 */
export function FreshRollPanel({
  line,
  onStart,
  startRef,
}: {
  /** Why her roll started again, and when it develops (`freshRollLine`). */
  line: string;
  onStart: () => void;
  startRef?: Ref<HTMLButtonElement>;
}) {
  const titleId = useId();
  const lineId = useId();
  return (
    <Panel
      className="cam-dim cam-over"
      data-cam-fresh=""
      role="group"
      aria-labelledby={titleId}
    >
      <p id={titleId} className="font-heading text-page text-white">
        {FRESH_ROLL_TITLE}
      </p>
      <p
        id={lineId}
        className="mt-1.5 max-w-72 text-reading text-pretty text-white/75"
      >
        {line}
      </p>
      <div className="mt-6 grid w-full max-w-72 gap-2">
        {/* The key takes the focus as the panel stands, so it carries the news to a screen reader. */}
        <Button
          ref={startRef}
          type="button"
          variant="on-photo"
          size="cta"
          onClick={onStart}
          aria-describedby={`${titleId} ${lineId}`}
        >
          {START_SHOOTING}
        </Button>
      </div>
    </Panel>
  );
}

/** Where her newest shot stands as the sheet holds it. */
export type TakeBackState = "sending" | "ready" | "working" | "failed";

/**
 * HER NEWEST SHOT, PRESSED ON THE REEL (guest-moments r1's `where=reel`): the shot fills the picture's box under the
 * roll's end's dim, with Take it back and Keep it in its keys and what taking it back does to her re-shoots under them.
 * Two keys, never one press, since a mis-press on the reel must not delete (the board's carried BM1); Your shots keeps
 * its X with no question. A shot still on its way waits for its landing, said, before it can be taken back.
 */
export function TakeBackPanel({
  src,
  video,
  state,
  line,
  onTake,
  onKeep,
  keepRef,
}: {
  /** Her own picture of it (the frame the shutter froze, a video's poster). */
  src: string | undefined;
  /** A video's whole seconds, where it is one. */
  video?: number;
  state: TakeBackState;
  /** What taking it back does (`takeBackLine`). */
  line: string;
  onTake: () => void;
  onKeep: () => void;
  keepRef?: Ref<HTMLButtonElement>;
}) {
  const lineId = useId();
  const said =
    state === "sending"
      ? TAKE_BACK.sending
      : state === "failed"
        ? TAKE_BACK.failed
        : line;
  return (
    <Panel
      className="cam-dim cam-over"
      data-cam-take-back={state}
      role="group"
      aria-label={TAKE_BACK.newest}
    >
      <div className="cam-take-back-pic">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- her own device's picture of the shot, a blob URL
          <img src={src} alt="" draggable={false} />
        ) : null}
        {video !== undefined && (
          <span className="cam-shot-kind">
            <Play className="size-2.5 fill-current" aria-hidden />
            {`${video}s`}
          </span>
        )}
      </div>
      <div className="mt-5 grid w-full max-w-72 gap-2">
        <Button
          type="button"
          variant="on-photo"
          size="cta"
          onClick={onTake}
          disabled={state === "sending"}
          working={state === "working"}
          workingLabel={TAKE_BACK.taking}
          aria-describedby={lineId}
        >
          {TAKE_BACK.take}
        </Button>
        {/* The safe key takes the focus as the sheet opens, so it carries what taking it back would do. */}
        <Button
          ref={keepRef}
          type="button"
          variant="glass"
          size="cta"
          onClick={onKeep}
          disabled={state === "working"}
          aria-describedby={lineId}
        >
          {TAKE_BACK.keep}
        </Button>
      </div>
      <p
        id={lineId}
        aria-live="polite"
        className="mt-4 max-w-72 text-caption text-pretty text-white/55"
      >
        {said}
      </p>
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
