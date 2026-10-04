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
 * ★ THE FAIL-OPEN IS THE SERVER'S, NEVER A LOCAL SKIP. When a run ends with nothing completed and
 * every refusal is one the guest cannot fix, the step shows the server's own sentence and a primary
 * that REFRESHES. It does not set a local "skipped" flag, because the server would still answer
 * `teaser`/`upload` on the next render and the teaser's own "See all" would re-assert the sheet:
 * the guest would be walked back to the step they just left. The decision that comes back from the
 * refresh is the only thing that can open the album, and `canContribute` is what opens it.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import {
  UploadIntentBody,
  uploadIntentHeading,
} from "@/components/guest/upload/intent-sheet";
import {
  UploadFailureList,
  uploadFailureHeading,
  type UploadFailure,
} from "@/components/guest/upload/failure-sheet";
import type { Pick } from "@/components/guest/upload/review-step";
import { DoorHeading } from "@/components/guest/door/heading";
import { Button } from "@/components/ui/button";
import { classifyRefusal, type RefusalClass } from "@/lib/guest/upload-refusal";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

/** The whole run's verdict: what the step should show once nothing is queued or uploading. */
export function classifyRun(failures: readonly QueueItem[]): RefusalClass {
  // The strongest signal wins, in the order a guest can act on it.
  const classes = failures.map((f) => classifyRefusal(f.errorCode));
  if (classes.includes("verify")) return "verify";
  if (classes.includes("session")) return "session";
  if (classes.length > 0 && classes.every((c) => c === "refresh")) {
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
export function uploadBarPercent(
  it: Pick<QueueItem, "status" | "progress">,
): number {
  const floor = it.status === "done" ? 100 : 4;
  return Math.round(Math.min(100, Math.max(it.progress, floor)));
}

export function UploadStep({
  isDemo,
  requireUpload,
  albumEmpty,
  capBytes,
  acceptsVideo = true,
  queue,
  onSend,
  onRetry,
  onDismiss,
  onSkip,
  onContinueWithout,
}: {
  isDemo: boolean;
  /** The host's switch: ON there is no skip, and the ON line says so (never whose ask it is —
   *  the host goes unnamed there). */
  requireUpload: boolean;
  /** Nothing in the album yet: the line offers the first photograph instead of a queue. */
  albumEmpty: boolean;
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
   * THE RUN'S OWN "SENT" (voice-guest r1 `failed=exact`'s "the whole run in its count"): the
   * failure heading reads "N of SENT didn't upload", and `queue` can hold more than one run's
   * worth of settled files (nothing here ever prunes a `done` item). `runBaseline` is `queue`'s
   * length from the render just BEFORE this run's files were appended — captured the first time
   * `sending` goes true, one render lagged so the new files are not already counted in it — so
   * `sent = queue.length - runBaseline` is exactly this run's own total, never a prior run's
   * carried-over successes.
   *
   * ★ STARTS AT 0, NOT `queue.length`: a mount that never observed its run START (an already-
   * failed `queue` handed straight in, as a remount after `key={access}` can do, and as this
   * file's own pins do) must count everything already there as THIS run, or `sent` reads short.
   * 0 is exactly that: nothing subtracted until a LATER run's start is actually witnessed.
   *
   * ★ STATE, NOT A REF: `sent` reads it during render, and a ref's `.current` may only be read
   * inside an effect or a handler (React Compiler's own rule) — a render-time read would not
   * necessarily see a change, and would not re-render when it did.
   */
  const [runBaseline, setRunBaseline] = useState(0);
  const prevQueueLen = useRef(queue.length);
  const wasSending = useRef(false);
  useEffect(() => {
    if (sending && !wasSending.current) setRunBaseline(prevQueueLen.current);
    wasSending.current = sending;
    prevQueueLen.current = queue.length;
  }, [sending, queue.length]);
  const sent = queue.length - runBaseline;
  // The fail-open: nothing this guest can do about any of it.
  const stuck = showFailures && verdict === "refresh";

  const failureItems: UploadFailure[] = failures.map((it) => ({
    id: it.id,
    file: it.file,
    error: it.error,
    code: it.errorCode,
  }));

  if (sending) {
    return (
      <div data-upload-step="sending" className="flex flex-col gap-4 pt-1">
        {/* The step's own views change in place, so their headings reveal (the text reveal). */}
        <DoorHeading title="Sending your photos" hidden />
        <ul className="flex flex-col gap-3">
          {queue
            .filter((it) => it.status !== "error")
            .map((it) => (
              <li key={it.id} className="flex flex-col gap-1.5">
                <span className="truncate text-reading text-muted-foreground">
                  {it.file.name}
                </span>
                {/* The strip is the progress: one bar a pick, no numbers. A
                    percentage at a party is a thing to watch instead of a party. */}
                <span
                  data-upload-progress
                  className="block h-1 overflow-hidden rounded-full bg-muted"
                >
                  <span
                    className="block h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                    style={{ width: `${uploadBarPercent(it)}%` }}
                  />
                </span>
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
                ? uploadStepChooseAgain(requireUpload)
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
            {verdict !== "choose" && (
              <UploadFailureList failures={failureItems} onRetry={onRetry} />
            )}
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
              Choose other photos
            </Button>
          </>
        )}
      </div>
    );
  }

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
        title={heading.reviewing ? heading.title : "Add your photos"}
        reason={
          heading.reviewing
            ? heading.description
            : uploadStepReason({ isDemo, requireUpload, albumEmpty })
        }
      />
      <UploadIntentBody
        picks={picks}
        onPicks={setPicks}
        capBytes={capBytes}
        acceptsVideo={acceptsVideo}
        onSend={(files) => {
          setPicks([]);
          onSend(files);
        }}
        footer={
          onSkip ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onSkip}
            >
              {isDemo ? "Look around" : "Skip for now"}
            </Button>
          ) : null
        }
      />
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
 */
export function uploadStepReason(input: {
  isDemo: boolean;
  requireUpload: boolean;
  albumEmpty: boolean;
}): string {
  if (input.isDemo) {
    return "Add a photo the way a guest would. Nothing you add is saved.";
  }
  if (input.requireUpload) {
    return input.albumEmpty
      ? "Nothing here yet. Add the first photo and the album opens."
      : "The host has asked everyone to add a photo before the album opens.";
  }
  return input.albumEmpty
    ? "Nothing here yet. Add the first photo."
    : "Add one now, or look around first.";
}

/** The failure view's line when only a different file can help: the album-opens promise is the
 *  require-upload door's alone, as above. */
export function uploadStepChooseAgain(requireUpload: boolean): string {
  return requireUpload
    ? "Pick something else and the album opens."
    : "Pick something else to add.";
}
