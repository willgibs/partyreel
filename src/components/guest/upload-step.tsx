"use client";

/**
 * THE THIRD STEP: THE FIRST UPLOAD, ASKED. Once the name is in, the door asks for the guest's
 * event media as its final step: they scan the code and are asked for their photographs upfront,
 * with nothing to work out, rather than being told what Partyreel is for and left to find the
 * "Add photos" button once they reach the album.
 *
 * It renders INSIDE the entry sheet, on the intent sheet's own body (`UploadIntentBody`), so the
 * hidden inputs live inside the open dialog on both shells and Safari's synchronous `.click()`
 * still opens a picker. Nothing here owns a queue: the queue is lifted to `event-experience.tsx`
 * and shared with the album's Add, so a run started at the door keeps going after the door is gone.
 *
 * ★ ON AN ALBUM WHOSE HOST CHOSE THE CAMERA (`camera`), THE FIRST PHOTOGRAPH IS THE ALBUM'S CAMERA, NEVER THE LIBRARY
 * (crumbs-76). The album's own Add opens that camera in place of the add sheet, so the album never offers a guest her photo
 * library; this step shared the add sheet's body and offered it ("Choose from your album"), so a library photo reached the
 * roll the camera exists to keep to what was taken in the moment. There is one primary here, which opens the camera
 * (`camera.onOpen`: the door owns it, since at "A photo first" the album's own slot, which carries its camera, is not
 * mounted yet), and nothing else asks for a file.
 *
 * ★ A PICK THAT WAITS FOR THE LINE SAYS SO, IN PLACE (no-signal r1, `drop=standby`): the queue holds a dropped file
 * `queued`, standing by (`waitsForLine`), so the step stays on its sending view and that pick's bar gives way to
 * Standby's point and "Waiting for your connection"; with every pick waiting, the step's heading says it too. Nothing
 * here sends it again: the line's return does (`unsent/line.ts`).
 *
 * ★ THE FAIL-OPEN IS THE SERVER'S, NEVER A LOCAL SKIP. When a run ends with nothing completed and
 * every refusal is one the guest cannot fix, the step shows the server's own sentence and a primary
 * that REFRESHES. It does not set a local "skipped" flag, because the server would still answer
 * `teaser`/`upload` on the next render and the teaser's own "See all" would re-assert the sheet:
 * the guest would be walked back to the step they just left. The decision that comes back from the
 * refresh is the only thing that can open the album, and `canContribute` is what opens it.
 */
import { useMemo, useState } from "react";
import { Camera } from "lucide-react";

import {
  UploadIntentBody,
  uploadIntentHeading,
} from "@/components/guest/upload/intent-sheet";
import {
  UploadFailureList,
  uploadFailureChooseAgain,
  uploadFailureHeading,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import type { Pick } from "@/components/guest/upload/review-step";
import { WaitPoint } from "@/components/guest/upload/wait-point";
import { DoorHeading } from "@/components/guest/door/heading";
import { Button } from "@/components/ui/button";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { type WaitClock, waitRule } from "@/lib/disposable/wait-words";
import { classifyRefusal, type RefusalClass } from "@/lib/guest/upload-refusal";
import { waitsForLine } from "@/lib/guest/unsent/standby";
import { WAITING_FOR_CONNECTION } from "@/lib/guest/unsent/words";
import { useRunSent, type QueueItem } from "@/lib/guest/use-upload-queue";

/** The whole run's verdict: what the step should show once nothing is queued or uploading. */
export function classifyRun(failures: readonly QueueItem[]): RefusalClass {
  // The strongest signal wins, in the order a guest can act on it.
  const classes = failures.map((f) => classifyRefusal(f.errorCode));
  if (classes.includes("verify")) return "verify";
  if (classes.includes("session")) return "session";
  // A paused album is the door's fail-open as a full one is (`paused` is its own class for the album's sheet, which
  // offers no Retry; the door has no exit, and the server lets her through once uploads are closed).
  if (
    classes.length > 0 &&
    classes.every((c) => c === "refresh" || c === "paused")
  ) {
    return "refresh";
  }
  if (classes.includes("retry")) return "retry";
  return classes.length > 0 ? "choose" : "retry";
}

/**
 * ★ HOW FAR A PICK'S BAR IS FILLED, IN PERCENT: THE QUEUE'S OWN 0 TO 100 (`QueueItem.progress`, written as
 * `Math.round(fraction * 100)`), never a fraction: scaled by 100 again, a bar stands full from its first percent and
 * says nothing of the bytes going. A pick still waiting its turn shows a sliver (a bar of nothing reads as no bar at
 * all), and a landed one is whole.
 */
export function uploadBarPercent(it: {
  status: QueueItem["status"];
  progress: QueueItem["progress"];
}): number {
  const floor = it.status === "done" ? 100 : 4;
  return Math.round(Math.min(100, Math.max(it.progress, floor)));
}

export function UploadStep({
  isDemo,
  requireUpload,
  albumEmpty,
  wait = null,
  capBytes,
  acceptsVideo = true,
  queue,
  onSend,
  onRetry,
  onDismiss,
  onSkip,
  onContinueWithout,
  camera = null,
}: {
  isDemo: boolean;
  /** The host's switch: ON there is no skip, and the ON line says so (never whose ask it is —
   *  the host goes unnamed there). */
  requireUpload: boolean;
  /** Nothing in the album yet: the line offers the first photograph instead of a queue. */
  albumEmpty: boolean;
  /**
   * How uploads wait on this album (the page's `uploadsWait`, as `waitWords` reads it, the host unnamed), or null where
   * they do not: what an empty album says of itself, since photos that wait are photos nobody here can see yet.
   */
  wait?: WaitClock | null;
  capBytes?: number | null;
  /** Whether this album takes a video from a guest (the picker's own note). */
  acceptsVideo?: boolean;
  /** The lifted queue's snapshot (this step never owns one). */
  queue: readonly QueueItem[];
  onSend: (files: File[]) => void;
  onRetry: (id: string) => void;
  /** Drop these failures from the queue (choosing other photographs starts clean). */
  onDismiss: (ids: string[]) => void;
  /** OFF only: the ghost skip, once per pass. Absent ON. */
  onSkip?: () => void;
  /** The server-owned fail-open: refresh and trust the decision that comes back. */
  onContinueWithout: () => void;
  /**
   * The album's host chose the camera: the first photograph is taken with it, so the step offers that and no picker
   * (`onOpen` opens the album's camera, which the door holds). Absent on a free-upload album, which keeps the two rows.
   */
  camera?: { onOpen: () => void } | null;
}) {
  const [picks, setPicks] = useState<Pick[]>([]);
  const heading = uploadIntentHeading(picks.length);

  const sending = queue.some(
    (it) => it.status === "queued" || it.status === "uploading",
  );
  const failures = useMemo(
    () => queue.filter((it) => it.status === "error"),
    [queue],
  );
  const verdict = classifyRun(failures);
  const showFailures = !sending && failures.length > 0;

  /**
   * THE RUN'S OWN "SENT" (voice-guest r1 `failed=exact`'s "the whole run in its count"): the failure heading reads "N
   * of SENT didn't upload", and `queue` can hold more than one run's worth of settled files (nothing here ever prunes
   * a `done` item), so it is counted off the run's own files (`useRunSent`, the queue's one definition of a run),
   * never off how many items the queue holds: a Retry in place adds no item, and counted by length it read "1 of 0".
   */
  const sent = useRunSent(queue, failures);
  // The fail-open: nothing this guest can do about any of it.
  const stuck = showFailures && verdict === "refresh";

  const failureItems: UploadFailure[] = failures.map((it) => ({
    id: it.id,
    file: it.file,
    error: it.error,
    code: it.errorCode,
    cause: it.cause,
  }));

  if (sending) {
    const onItsWay = queue.filter(
      (it) => it.status === "queued" || it.status === "uploading",
    );
    // Every pick still on its way waits for the line: the step says what it waits for, never "Sending".
    const allWait = onItsWay.length > 0 && onItsWay.every(waitsForLine);
    return (
      <div data-upload-step="sending" className="flex flex-col gap-4 pt-1">
        {/* The step's own views change in place, so their headings reveal (the text reveal). */}
        <DoorHeading
          title={allWait ? WAITING_FOR_CONNECTION : "Sending your photos"}
          hidden
        />
        <ul className="flex flex-col gap-3">
          {queue
            .filter((it) => it.status !== "error")
            .map((it) => (
              <li key={it.id} className="flex flex-col gap-1.5">
                <span className="truncate text-reading text-muted-foreground">
                  {it.file.name}
                </span>
                {waitsForLine(it) ? (
                  // The bar gives way to Standby's point: a pick waiting for the line goes again from the start.
                  <span
                    data-upload-waiting=""
                    className="flex items-center gap-1.5 text-reading text-muted-foreground"
                  >
                    <WaitPoint />
                    {WAITING_FOR_CONNECTION}
                  </span>
                ) : (
                  // The strip is the progress: one bar a pick, no numbers. A percentage at a party is a thing to
                  // watch instead of a party.
                  <span
                    data-upload-progress
                    className="block h-1 overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                      style={{ width: `${uploadBarPercent(it)}%` }}
                    />
                  </span>
                )}
              </li>
            ))}
        </ul>
      </div>
    );
  }

  if (showFailures) {
    return (
      <div data-upload-step="failed" className="flex flex-col gap-4 pt-1">
        <DoorHeading
          hidden
          title={
            stuck
              ? // The server's own sentence is the heading here: "This album is full right now"
                // says more than a count of files ever could.
                (failures[0]?.error ?? "That did not go")
              : uploadFailureHeading(failures.length, sent)
          }
          reason={
            stuck
              ? undefined
              : verdict === "choose"
                ? uploadStepChooseAgain(requireUpload, camera !== null)
                : "Give it one more go."
          }
        />
        {/* THE FAILURE VIEW NEVER CARRIES THE SOFT SKIP. A guest here has tried; the way out is
            the server's, or another photograph. */}
        {stuck ? (
          <Button
            type="button"
            size="cta"
            className="w-full"
            onClick={onContinueWithout}
          >
            Continue without adding
          </Button>
        ) : (
          <>
            {/* ★ THE FILES AND THEIR REASONS STAND WHATEVER THE VERDICT (red-team 54b's LOW). Where every file was
                refused for itself the list was left out, so the step named no file and no reason, only "Pick something
                else"; the album's failure sheet names them, and so does this. The list itself offers no Retry on a file
                no retry could pass (`retryCanPass`), so "Choose other photos" stays the one way on. */}
            <UploadFailureList failures={failureItems} onRetry={onRetry} />
            <Button
              type="button"
              variant={verdict === "choose" ? "default" : "outline"}
              size="cta"
              className="w-full"
              onClick={() => {
                onDismiss(failures.map((f) => f.id));
                setPicks([]);
              }}
            >
              {camera ? "Take another photo" : "Choose other photos"}
            </Button>
          </>
        )}
      </div>
    );
  }

  // OFF only: the soft skip under the picker (or the camera's one primary).
  const skip = onSkip ? (
    <Button
      type="button"
      variant="ghost"
      className="w-full text-muted-foreground"
      onClick={onSkip}
    >
      {isDemo ? "Look around" : "Skip for now"}
    </Button>
  ) : null;

  return (
    <div data-upload-step="pick" className="flex flex-col gap-4 pt-1">
      {/* The shell carries these as its sr-only name and description, so the eye reads them here
          and a screen reader does not hear them twice (the name step's own division). */}
      {/* The step's own heading, not the album sheet's: "Add photos" is a BUTTON's words on a
          surface a guest opened; this is the door asking, so it asks for theirs. The review
          heading ("Send this one?") is shared, because that question is the same question. Keyed
          by which it is, so the review's question reveals in place when a pick comes back. */}
      <DoorHeading
        key={heading.reviewing ? "review" : "pick"}
        hidden
        title={
          heading.reviewing
            ? heading.title
            : camera
              ? "Take your photos"
              : "Add your photos"
        }
        reason={
          heading.reviewing ? (
            heading.description
          ) : wait ? (
            <WaitedReason
              isDemo={isDemo}
              requireUpload={requireUpload}
              albumEmpty={albumEmpty}
              wait={wait}
              camera={camera !== null}
            />
          ) : (
            uploadStepReason({
              isDemo,
              requireUpload,
              albumEmpty,
              camera: camera !== null,
            })
          )
        }
      />
      {camera ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="cta"
            className="w-full justify-start active:scale-[0.99] motion-reduce:active:scale-100"
            onClick={camera.onOpen}
          >
            <Camera /> Take a photo
          </Button>
          {skip}
        </div>
      ) : (
        <UploadIntentBody
          picks={picks}
          onPicks={setPicks}
          capBytes={capBytes}
          acceptsVideo={acceptsVideo}
          onSend={(files) => {
            setPicks([]);
            onSend(files);
          }}
          footer={skip}
        />
      )}
    </div>
  );
}

/**
 * The step's one sentence, which is the whole difference between the two switch states.
 *
 * ★ "THE ALBUM OPENS" BELONGS TO THE REQUIRE-UPLOAD DOOR ALONE. With the switch OFF the album is
 * already open (the step is a nudge with a skip under it), so a line promising it opens would be a
 * small lie told at the door; OFF says what is true instead: add one now, or look first.
 *
 * ★ THE HOST GOES UNNAMED HERE ("The host has asked...", never "XYZ has asked...").
 * The name step's own lede still names the host (with "the host" as its fallback) — this is the
 * ONE line on the door that deliberately never does, so no host's name is ever the reason this
 * sentence wraps or overflows a small screen.
 *
 * ★ OVER AN ALBUM THAT WAITS, THE DOOR SAYS WHAT WAITS (crumbs-72). Behind "A photo first" a newcomer stands at
 * `teaser`, where the page never reads whether photos wait (`waitingOnArrival` is a full-access read), so an album
 * showing nothing reads empty at the door whether it is, or holds photos nobody can see yet: "Nothing here yet. Add
 * the first photo" was untrue over the second. What the door does know at every level is how uploads wait on this
 * album (`wait`, the page's `uploadsWait`), true over either, and the wait's own rule is the one home for saying it
 * (`waitRule`, the contact sheet's and her tracker's). The host stays unnamed in it too.
 */
export function uploadStepReason(input: {
  isDemo: boolean;
  requireUpload: boolean;
  albumEmpty: boolean;
  /** How uploads wait on this album, where they do: said over an album that shows nothing, in place of "the first photo". */
  wait?: WaitClock | null;
  /** Her own clock, once it is known: a develop time is said in it, and the sentence reads whole without it. */
  nowMs?: number | null;
  /** The album's host chose the camera: the photograph is taken, never added (the album's own Add says Take too). */
  camera?: boolean;
}): string {
  if (input.isDemo) {
    return "Add a photo the way a guest would. Nothing you add is saved.";
  }
  const take = input.camera ? "Take" : "Add";
  if (input.requireUpload) {
    if (!input.albumEmpty) {
      return `The host has asked everyone to ${take.toLowerCase()} a photo before the album opens.`;
    }
    if (input.wait) {
      const clock: WaitClock =
        input.wait.kind === "held"
          ? { kind: "held", hostName: null }
          : input.wait;
      return `${waitRule(clock, input.nowMs ?? null)} ${take} yours and the album opens.`;
    }
    return `Nothing here yet. ${take} the first photo and the album opens.`;
  }
  return input.albumEmpty
    ? `Nothing here yet. ${take} the first photo.`
    : `${take} one now, or look around first.`;
}

/**
 * The step's sentence where an album waits, which may say a time: in her own clock, so only once hydrated
 * (`useWaitClock`). Mounted only for such an album, so a door with nothing waiting runs no clock at all.
 */
function WaitedReason(input: {
  isDemo: boolean;
  requireUpload: boolean;
  albumEmpty: boolean;
  wait: WaitClock;
  camera: boolean;
}) {
  const nowMs = useWaitClock();
  return <>{uploadStepReason({ ...input, nowMs })}</>;
}

/** The failure view's line when only a different file can help: the album-opens promise is the
 *  require-upload door's alone, as above. */
export function uploadStepChooseAgain(
  requireUpload: boolean,
  camera = false,
): string {
  if (!requireUpload) return uploadFailureChooseAgain(camera);
  return camera
    ? "Take another and the album opens."
    : "Pick something else and the album opens.";
}
