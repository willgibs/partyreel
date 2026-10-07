"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Ref } from "react";
import { Sparkles } from "lucide-react";

import { ClaimHandlePrompt } from "@/components/guest/claim-handle-prompt";
import type { UploadsWord } from "@/components/guest/event-experience-open";
import { addsWaitFor } from "@/components/guest/event-experience-wait";
import type { FollowMomentHost } from "@/components/guest/follow-moment-card";
import { UploadFailureSheet } from "@/components/guest/upload/failure-sheet";
import { UploadIntentSheet } from "@/components/guest/upload/intent-sheet";
import { ChromeLink } from "@/components/marketing/chrome/chrome-link";
import { Button } from "@/components/ui/button";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { useRollAhead } from "@/lib/guest/camera/own-shots";
import { waitsForLine } from "@/lib/guest/unsent/standby";
import {
  uploadsWait as uploadsWaitOf,
  type UploadsWait,
} from "@/lib/guest/upload-tracker";
import { useStoredSession } from "@/lib/guest/use-stored-session";
// The queue MACHINE lives in `event-experience.tsx`; only its types, and the run's own count, are read
// here.
import {
  useRunCounts,
  type FileExtra,
  type QueueItem,
} from "@/lib/guest/use-upload-queue";

export type { UploadedItem } from "@/lib/guest/use-upload-queue";

/**
 * ★ THE ALBUM'S CAMERA IS ITS OWN CHUNK, fetched only on an album whose host chose it (`capture = 'camera'`), and
 * fetched as the album mounts rather than at the press, so Add opens it at once (`loadCamera`). A free-upload album
 * never downloads a byte of it.
 */
const loadCamera = () => import("@/components/guest/camera/album-camera");

const AlbumCamera = lazy(() =>
  loadCamera().then((m) => ({ default: m.AlbumCamera })),
);

/**
 * ★ THE FAILURES THE QUEUE ALREADY HELD WHEN THIS SLOT MOUNTED WITH NOTHING RUNNING, which it never saw happen
 * (crumbs-47). The slot stands only at full access, so a gate takes it down and the page's queue outlives it: a
 * file refused while it was gone, or refused again as a Retry went up while the page re-gated, is still an error
 * when the slot mounts afresh, and was reported by whoever stood there (the door's own step) or by nobody.
 * They are held by the ITEM, never its id: the queue replaces an item on every change, so one sent again and
 * refused again is a new object and is the run's own.
 *
 * A slot that mounts MID-RUN carries nothing: the run it joins is the door's, handed over when its first file
 * landed, and what failed before the handoff is this slot's to report when it ends (the door's step hides its
 * failures while a run is going).
 */
function carriedFailures(items: readonly QueueItem[]): ReadonlySet<QueueItem> {
  const running = items.some(
    (it) => it.status === "queued" || it.status === "uploading",
  );
  return new Set(running ? [] : items.filter((it) => it.status === "error"));
}

export type GuestUploadHandle = {
  /**
   * Open the ADD SHEET (the row's Add, the dock's Add, the empty album's CTA),
   * never the phone's own chooser directly: the intent sheet puts our surface
   * in front of it, so every Add affordance opens the same two named acts.
   * ★ On an album whose host chose the camera (`capture = 'camera'`), every Add
   * opens the album's own camera instead (`components/guest/camera/`): one Add
   * entry, so the cover's white Add and the shutter reach it alike.
   */
  openAdd: () => void;
  /** Reset an errored queue item and re-run (the failure sheet's Retry). */
  retry: (id: string) => void;
};

/**
 * The upload ENGINE, and the two SHEETS the act speaks through.
 *
 * The queue machine lives in `useUploadQueue`; the visible upload UI lives in
 * the GALLERY (the stack at the album's head) and, wherever what she adds waits
 * (held for the host, or sealed for a develop), in her uploads from the press
 * (the tracker's badge and list). This owns both ends of the act:
 *
 * ★ THE FRONT: one tap opens `UploadIntentSheet` — take a photo, or choose
 * from your album — and the picker returns INTO that sheet as a review step, so
 * a guest previews what they picked and an accidental pick is one tap from gone
 * before anything is sent. Files reach `addFiles` only once the guest has said
 * Send.
 *
 * ★ THE BACK: nothing interrupts while the files go, and when the RUN ENDS with
 * anything refused, `UploadFailureSheet` opens itself once with a line and a
 * Retry per file. No error toasts: an error toast has usually gone by the time
 * it is read. ★ RESHAPED (album-moments-wiring): this said "No upload toasts".
 * What landed is told now, once, as the run ends, by the page's send toast
 * (`upload/send-toast.ts`, guest-moments r1's `own=glow`, which took the mark
 * off her own photograph): the reason that expired was that a held upload's
 * badge already said it, which a send of six into an album that shows them at
 * once never had. The reason kept is the errors': they stay in this sheet.
 *
 * Joining is just-in-time and SILENT (account-required events are gated at
 * the PAGE level; a signed-in uploader sets a display name first).
 * `onQueueChange` mirrors every queue snapshot upward for the tile subscribers.
 *
 * ★ THE ALBUM'S CAMERA (disposable-mode r3, `camera=timeline`): on an album
 * whose host chose it, the front is the camera instead of the intent sheet,
 * and every shot reaches `addFiles` the moment it is taken, so the back is the
 * same: the queue, the album's stack and this failure sheet, which waits while
 * the camera covers the screen and opens on what failed once it closes.
 */
export function GuestUpload({
  ref,
  event,
  qrToken,
  queue,
  onAddFiles,
  onRetry,
  onDismiss,
  suppressFailures = false,
  onFailuresClosed,
  isDemo,
  host,
  moment = false,
  elsewhere = 0,
  onAccountRenamed,
  removedIds,
  capBytes = null,
  isOwner = false,
  onOwnRemoved,
  onCameraOpenChange,
  uploadsWait,
  uploadsWord,
  onAskUploadsWord,
}: {
  ref?: Ref<GuestUploadHandle>;
  event: GuestEvent;
  qrToken: string;
  /**
   * ★ THE QUEUE IS THE PAGE'S. Created here, it would exist only at full access, inside the
   * album: the door's third step asks for the first photograph BEFORE either, and the run it
   * starts has to outlive the door. `event-experience.tsx` owns it and both surfaces read it. This
   * component keeps the album's two sheets and what follows an upload.
   */
  queue: readonly QueueItem[];
  /** The queue's `addFiles`: the camera hands each shot with its `FileExtra` (its poster, its develop time). */
  onAddFiles: (files: File[], extra?: FileExtra) => void;
  onRetry: (id: string) => void;
  onDismiss: (ids: string[]) => void;
  /** The door is showing this run's failures, or its keep stands in front of the album; one run
   *  never gets two surfaces, so the failure sheet waits. */
  suppressFailures?: boolean;
  /** The failure sheet closed: the page flushes any deferred re-gate (its own note explains). */
  onFailuresClosed?: () => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
  /** The event's host as a public card, for the capture flow's follow moment. */
  host?: FollowMomentHost | null;
  /**
   * A confirmation from this album just claimed its uploads (the page's
   * `useConfirmReturn`): the slot stands up the follow moment even when
   * nothing was uploaded this visit, which is exactly a Google or magic-link
   * return.
   */
  moment?: boolean;
  /** The same claim's rows at other events, which the moment says once. */
  elsewhere?: number;
  /** The told name was changed in the moment's own line (the page trues up the credits). */
  onAccountRenamed?: (displayName: string) => void;
  /**
   * The media ids this visit's own removals took back out of the album (the
   * page keeps them). A finished upload that was removed again is not "on this
   * album" any more, so the slot's count leaves it out.
   */
  removedIds?: ReadonlySet<string>;
  /**
   * The per-file cap this viewer's uploads meet, for the Add sheet's terms line (`upload-terms.ts`): the host's own
   * (`events.max_upload_bytes`) for a guest, null for the host on her own album (her uploads ride the host's pair,
   * which the cap exempts) and where the host set none. The page decides it, as it decides who is the owner.
   */
  capBytes?: number | null;
  /**
   * The album's own host (the page's owner answer): her shots ride the host's pair, which no roll counts, so her camera
   * keeps no roll. Absent, the camera counts a roll for her as for a guest (her shots never use it up on the server).
   */
  isOwner?: boolean;
  /** One of hers was taken back inside the camera (the page's own-removal handler, as her tracker's Remove calls it). */
  onOwnRemoved?: (mediaId: string, remaining: number) => void;
  /**
   * The camera opened or closed: the page holds what would rise over it while she shoots (the door's keep, which her
   * first landed shot makes due) until she closes it.
   */
  onCameraOpenChange?: (open: boolean) => void;
  /**
   * Whether what is added here waits, and for what: the page's live reading of the album (`useLiveUploadsWait`, red-team
   * 44), so the line below, the camera's develop and the failure sheet's words (as they fall on this viewer,
   * `addsWaitFor`) all end with the develop, with no reload. Absent (standalone), the event's own reading at render.
   */
  uploadsWait?: UploadsWait;
  /**
   * Whether the album takes uploads, as the page hears it from the album's sync (`useLiveUploadsWord`, guest-requests):
   * the camera asks a closed album again once it says open, never by itself. Absent, the camera asks on its cadence.
   */
  uploadsWord?: UploadsWord;
  /** Ask the album for its word on uploads afresh (the camera's, over a closed refusal the page's word said was open). */
  onAskUploadsWord?: () => void;
}) {
  const items = queue;
  const [addOpen, setAddOpen] = useState(false);
  const camera = event.capture === "camera";
  // The camera mounts at its first opening and stays (its shots and roll outlive a close); `openedAt` is the press's.
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraOpenedAt, setCameraOpenedAt] = useState<number | null>(null);
  useImperativeHandle(ref, () => ({
    openAdd: () => {
      if (!camera) {
        setAddOpen(true);
        return;
      }
      setCameraOpenedAt(Date.now());
      setCameraOpen(true);
      onCameraOpenChange?.(true);
    },
    retry: onRetry,
  }));
  // The camera's code, fetched as a camera album mounts, so its Add opens it with nothing left to download.
  useEffect(() => {
    if (camera) void loadCamera();
  }, [camera]);
  // ★ AND HER ROLL, READ AS THE ALBUM OPENS (no-signal r1, `roll=taken`): a camera first opened in a dead zone counts
  // from this, never from the roll's size over shots an earlier visit spent (`useRollAhead`'s note).
  const [sessionToken] = useStoredSession(qrToken);
  const ahead = useRollAhead({
    enabled: camera && !isOwner && !isDemo,
    qrToken,
    sessionToken,
    queue: items,
  });
  // A slot that goes with the camera open (a re-gate) closes it for the page too, so nothing is held for it.
  const cameraOpenNow = useRef({ open: cameraOpen, tell: onCameraOpenChange });
  useEffect(() => {
    cameraOpenNow.current = { open: cameraOpen, tell: onCameraOpenChange };
  });
  const closeCameraForPage = useCallback(() => {
    if (cameraOpenNow.current.open) cameraOpenNow.current.tell?.(false);
  }, []);
  useEffect(() => closeCameraForPage, [closeCameraForPage]);

  /* ────────────────────────────────────────────────────────────────────────
     THE END OF A RUN, which is the only moment the failure sheet opens on.

     A run is over when nothing is queued and nothing is uploading — not when
     one file resolves, because the queue runs ONE at a time and a refusal in
     the middle of twelve must not interrupt the other eleven. The EDGE is what
     opens the sheet (running -> not running), so a guest who dismissed it is
     never shown it again by an unrelated re-render, and a Retry that starts the
     queue again earns a fresh one when that run ends.

     ★ AND IT OPENS ON WHAT FAILED IN FRONT OF THIS SLOT, never on any error the
     queue happens to hold (crumbs-47): a failure carried in from before the slot
     mounted (`carriedFailures`) is not this run's, so a clean run after a gate
     never reopens the OLD sheet, with its Retry for a file the host's switch
     refused an hour ago.

     ★ A FILE STANDING BY FOR THE LINE IS NOT GOING (no-signal r1, `drop=standby`):
     it waits, said where it stands (the stack, her uploads), and the line may not
     come back for an hour, so a refusal of a file of its own (too large, a type)
     beside it is said once nothing is going up, as at any run's end, never held
     behind the wait. The sheet lists only the refusal: a wait is never a failure.
     ──────────────────────────────────────────────────────────────────────── */
  const [failuresOpen, setFailuresOpen] = useState(false);
  const wasRunning = useRef(false);
  const [carried] = useState(() => carriedFailures(items));
  const failures = items.filter(
    (it) => it.status === "error" && !carried.has(it),
  );
  /**
   * ★ THE HEADING'S "SENT" IS THE RUN'S OWN FILES (`useRunCounts`), never how many items the queue holds beyond a
   * baseline: a Retry adds no item, so counted by length a failure that failed again read "1 of 0", and so did a slot
   * mounted mid-run (this one can mount under `key={access}` with the door's run already going). The count lives with
   * the queue's own definition of a run (`inRun`), and the door's step reads the same one. `landed` is how many of those
   * are in the album: the sheet says nothing of the rest until every file it does not list is.
   */
  const { sent: sentThisRun, landed: landedThisRun } = useRunCounts(
    items,
    failures,
  );
  useEffect(() => {
    const running = items.some(
      (it) =>
        (it.status === "queued" || it.status === "uploading") &&
        !waitsForLine(it),
    );
    if (
      wasRunning.current &&
      !running &&
      items.some((it) => it.status === "error" && !carried.has(it))
    ) {
      setFailuresOpen(true);
    }
    wasRunning.current = running;
  }, [items, carried]);
  // ★ NEVER OVER THE CAMERA: it says what did not go in its own words while it is open, and the sheet opens on the
  // same failures the moment it closes (the run's edge already set `failuresOpen`).
  const sheetOpen =
    failuresOpen && failures.length > 0 && !suppressFailures && !cameraOpen;
  /**
   * ★ THE SLOT GOING AWAY IS A CLOSE TOO (crumbs-47). A gate takes the slot down (`event-experience.tsx`
   * mounts it only at full access), sheet and all, with no `onOpenChange(false)` for `closeFailures` to
   * dismiss through; the failures it was listing stayed in the queue, unseen, for the next run's end to
   * resurface. What the open sheet lists is kept in a ref for the one moment it cannot say so itself (read in
   * the cleanup, never in render), and goes the way every other close sends it. `onFailuresClosed` is not
   * called: the page re-gated by its own refresh, which is why the slot is going.
   */
  const listed = useRef<string[]>([]);
  const dismissListed = useRef(onDismiss);
  useEffect(() => {
    listed.current = sheetOpen ? failures.map((it) => it.id) : [];
    dismissListed.current = onDismiss;
  });
  useEffect(
    () => () => {
      if (listed.current.length > 0) dismissListed.current(listed.current);
    },
    [],
  );
  /**
   * "Not now" AND every other way the sheet closes (backdrop, Escape, the X)
   * all funnel through this one `onOpenChange` — Retry-all closes through it
   * too, right after re-queuing the same ids, which is exactly why `onDismiss`
   * itself re-checks each id's LIVE status rather than trusting the list: a
   * retried id already reads "queued" by the time this runs, so it survives.
   * Closing without ever touching Retry drops every listed failure for good,
   * so the next run's end judges itself only by what is STILL in the queue: a
   * dismissed failure never re-opens the sheet.
   */
  const closeFailures = (open: boolean) => {
    if (!open) {
      onDismiss(failures.map((it) => it.id));
      // The deferred re-gate, exactly once, exactly when there is nothing left to read: Retry /
      // Retry all reach this same close (the sheet calls onOpenChange(false) right after
      // re-queuing), which is what carries Retry into the join's own refusal and so into the
      // gate rather than a dead stall — never a second, earlier fire.
      onFailuresClosed?.();
    }
    setFailuresOpen(open);
  };

  // What this visit added that is STILL in the album: a finished upload the guest removed again
  // leaves the count, and the slot unmounts once nothing of theirs from this visit is left (unless
  // a confirmation's follow moment holds it up on its own).
  const doneCount = items.filter(
    (it) =>
      it.status === "done" && !(it.mediaId && removedIds?.has(it.mediaId)),
  ).length;
  /* ★ "DELAYED" IS APPROVE-EACH OR A DEVELOP TIME AHEAD (build 43's red-team, the upload half), read off the page's
     live reading (`uploadsWait`, the foundation's own reading of the develop time behind it), never the review switch
     alone: on an album that develops later what she adds waits out of sight as a held upload does (the queue tells it
     `sealed`, her tracker keeps it), and the camera and the failure sheet hear it the moment the album develops
     (red-team 44). The album's rule itself is the wait's line now, said in the sheet's place until the sheet stands
     (`AlbumWait`, `gallery-empty-state-wait.tsx`): the slot said it beside the sheet, which said it again. */
  const wait = uploadsWait ?? uploadsWaitOf(event);
  const developsAt = wait.developsAt;
  // The camera hears the same develop: its words and its reveal end with it (a time reached reads as developed).
  const cameraEvent = useMemo(
    () =>
      event.develops_at === developsAt
        ? event
        : { ...event, develops_at: developsAt },
    [event, developsAt],
  );
  const hostName = event.host_display_name ?? "the host";

  return (
    <div className="space-y-4">
      {camera ? (
        cameraOpenedAt !== null && (
          // Its own black stands at once while the camera's code arrives (only ever before the preload has).
          <Suspense
            fallback={
              cameraOpen ? (
                <div aria-hidden className="fixed inset-0 z-50 bg-black" />
              ) : null
            }
          >
            <AlbumCamera
              open={cameraOpen}
              openedAt={cameraOpenedAt}
              ahead={ahead}
              onOpenChange={(next) => {
                setCameraOpen(next);
                onCameraOpenChange?.(next);
              }}
              event={cameraEvent}
              qrToken={qrToken}
              queue={queue}
              onAddFiles={onAddFiles}
              onRetry={onRetry}
              removedIds={removedIds}
              isOwner={isOwner}
              isDemo={isDemo}
              onOwnRemoved={onOwnRemoved}
              // The album's own word on uploads: a closed album is asked again once it says open, never by itself.
              uploadsWord={uploadsWord}
              onAskUploadsWord={onAskUploadsWord}
            />
          </Suspense>
        )
      ) : (
        <UploadIntentSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          hostName={hostName}
          onSend={onAddFiles}
          capBytes={capBytes}
          acceptsVideo={event.accepts_video}
        />
      )}
      <UploadFailureSheet
        open={sheetOpen}
        onOpenChange={closeFailures}
        failures={failures.map((it) => ({
          id: it.id,
          file: it.file,
          error: it.error,
          code: it.errorCode,
          cause: it.cause,
        }))}
        sent={sentThisRun}
        landed={landedThisRun}
        hostName={hostName}
        waits={addsWaitFor({ uploadsWait: wait, isOwner, isDemo })}
        camera={camera}
        onRetry={onRetry}
      />

      {/* The post-upload slot, one card at a time. ClaimHandlePrompt resolves
          the viewer and decides: a guest who has just CONFIRMED gets the follow
          moment, signed in without a handle gets the claim line, and everyone
          else gets nothing (a signed-out guest's ask to keep is the door's own
          last screen now, `guest-capture` r1). Shown once a guest has
          contributed this visit, or the moment a confirmation from this album
          claimed their uploads; never in the demo. */}
      {(doneCount > 0 || moment) && !isDemo && (
        <ClaimHandlePrompt
          doneCount={doneCount}
          qrToken={qrToken}
          host={host}
          moment={moment}
          elsewhere={elsewhere}
          onAccountRenamed={onAccountRenamed}
        />
      )}
    </div>
  );
}

/**
 * THE TURN CARD: the demo's upload is the one a guest makes, then one card tells
 * the visitor that this is what their guests would see, and how to get one.
 * The sentence the demo's simulated upload would otherwise end without — the
 * demo's ONE piece of proof, and the moment a visitor is likeliest to become a
 * host, for the cost of one card. Rendered by event-experience.tsx directly above
 * the album's first tile (the photograph the visitor just added, the album
 * being newest-first), never here in the upload panel's own column: see its
 * own comment for why the position is the point.
 */
export function TurnCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-reading font-medium">
            That is what your guests would see.
          </p>
          <p className="mt-0.5 text-working text-muted-foreground">
            On your own event it would be in the album for good.
          </p>
        </div>
      </div>
      <Button className="shrink-0" asChild>
        {/* On intent, never on sight (guest-requests): the card stands in view over her photograph, where a plain
            link would fetch the home and its sheets for a press only some visitors make (`chrome-link.tsx`). */}
        <ChromeLink href="/" prefetchOnIntent>
          Start your own
        </ChromeLink>
      </Button>
    </div>
  );
}
