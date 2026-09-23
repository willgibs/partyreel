"use client";

/**
 * THE THIRD STEP: THE FIRST UPLOAD, ASKED (Will, 2026-09-21, "the door as three steps", verbatim:
 * "It's a big miss that after we ask for the name in the new welcome flow, we aren't actively
 * prompting for users to upload their event media as the final third step. This is a big 'don't
 * make me think' win where they scan the code and effectively get asked for their media upfront,
 * rather than us telling them about Partyreel's purpose but passively waiting for them to find the
 * 'Add photos' button once they get in the album.").
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
import { useMemo, useState } from "react";

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
import { Button } from "@/components/ui/button";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

/**
 * THE REFUSAL LADDER, read once (`src/lib/errors/codes.ts` + the presign ladder). What a guest can
 * DO about a failure is a property of the code, not of the file, and the door's step has no exit,
 * so "Retry" is only ever offered where a retry could work.
 *
 *   refresh   the event's state changed under the guest and the server must be re-asked. This is
 *             the fail-open path: uploads closed, the album full, the event gone, a lock raised.
 *   session   the capability is dead. Never a Retry inside a sheet with no way out: the step goes
 *             back to the name, which mints a fresh row.
 *   verify    the host turned Require verified emails on mid-run; the email step is the way in.
 *   retry     transport, R2, a bad key, a failed completion: the same file may well go next time.
 *   choose    the file itself is the problem, so only a different file can help.
 */
export type RefusalClass = "refresh" | "session" | "verify" | "retry" | "choose";

export function classifyRefusal(code: string | undefined): RefusalClass {
  switch (code) {
    case "uploads_closed":
    case "cap_reached":
    case "event_gone":
    case "event_deleted":
    case "unlock_required":
      return "refresh";
    case "invalid_session":
      return "session";
    case "verification_required":
      return "verify";
    case "video_not_allowed":
    case "unsupported_type":
    case "invalid_file":
    case "invalid_image":
    case "invalid_media":
    case "too_large":
    case "too_long":
      return "choose";
    default:
      // `bad_key`, `complete_failed`, a code-less transport or R2 failure: worth another go.
      return "retry";
  }
}

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

export function UploadStep({
  isDemo,
  requireUpload,
  albumEmpty,
  capBytes,
  queue,
  onSend,
  onRetry,
  onDismiss,
  onSkip,
  onContinueWithout,
}: {
  isDemo: boolean;
  /** The host's switch: ON there is no skip, and the ON line says so (never whose ask it is —
   *  the host goes unnamed there, "the door's first look", 2026-09-21). */
  requireUpload: boolean;
  /** Nothing in the album yet: the line offers the first photograph instead of a queue. */
  albumEmpty: boolean;
  capBytes?: number | null;
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
  // The fail-open: nothing this guest can do about any of it.
  const stuck = showFailures && verdict === "refresh";

  const failureItems: UploadFailure[] = failures.map((it) => ({
    id: it.id,
    file: it.file,
    error: it.error,
  }));

  if (sending) {
    return (
      <div data-upload-step="sending" className="flex flex-col gap-4 pt-1">
        <div aria-hidden>
          <p className="font-heading text-page text-balance">
            Sending your photos
          </p>
        </div>
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
                    style={{
                      width: `${Math.round(Math.max(it.progress, it.status === "done" ? 1 : 0.04) * 100)}%`,
                    }}
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
        <div aria-hidden>
          <p className="font-heading text-page text-balance">
            {stuck
              ? // The server's own sentence is the heading here: "This album is full right now"
                // says more than a count of files ever could.
                (failures[0]?.error ?? "That did not go")
              : uploadFailureHeading(failures.length)}
          </p>
          {!stuck && (
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              {verdict === "choose"
                ? uploadStepChooseAgain(requireUpload)
                : "Give it one more go."}
            </p>
          )}
        </div>
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
      <div aria-hidden>
        {/* The step's own heading, not the album sheet's: "Add photos" is a BUTTON's words on a
            surface a guest opened; this is the door asking, so it asks for theirs. The review
            heading ("Send this one?") is shared, because that question is the same question. */}
        <p className="font-heading text-page text-balance">
          {heading.reviewing ? heading.title : "Add your photos"}
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {heading.reviewing ? heading.description : uploadStepReason({ isDemo, requireUpload, albumEmpty })}
        </p>
      </div>
      <UploadIntentBody
        picks={picks}
        onPicks={setPicks}
        capBytes={capBytes}
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
 * ★ THE HOST GOES UNNAMED HERE (Will, 2026-09-21, "the door's first look", overruling a
 * `door-steps` call that named the host: "Instead of naming the host in the 'XYZ has asked...',
 * let's simply say 'The host has asked...' to account for long host names breaking good design.").
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
