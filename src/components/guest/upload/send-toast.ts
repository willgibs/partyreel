"use client";

/**
 * THE SEND'S TOAST (guest-moments r1: Will picked `own=glow`, retiring the mark on her own photograph, with the note
 * "If we can pop up a temporary toast, whether when their uploads begin landing or the last one completes (your
 * call...), that's likely enough for them to feel confident about the upload success and go find their media in
 * the album if they'd like.").
 *
 * ★ ONCE, WHEN A SEND'S LAST FILE HAS LANDED, NEVER AT ITS START. The stack at the album's head already shows a send
 * while it runs (its picture, its bar, its x), so a word at the start would say what she is watching; the end is the
 * one moment nothing on screen says. A send is the queue's run (`use-upload-queue.ts`'s `inRun`: every file not
 * settled when it began, a second pick mid-run widening it), read here at the page, whose queue outlives the album's
 * slot (a re-gate remounts the slot mid-run, and a slot's own count of the run reads everything the visit held).
 *
 * ★ IT SAYS WHAT LANDED IN THAT ALBUM'S TRUTH, IN THE KEEP'S OWN WORDS (`keepSentLine`, one name for each fate
 * wherever it is said): where what she adds shows at once, hers "joined Maya's album", and Show yours opens the
 * album's Yours view at the album; where it waits, how it develops, as the host lets it in or with everyone's at the
 * develop time (her stack is hidden there, and the approval toast says "One of yours is in the album" as the first is
 * let in), and Show yours opens her uploads, where they wait.
 *
 * ★ ONLY WHAT LANDED, AND NEVER BESIDE THE FAILURE SHEET (crumbs-90, no-signal r1). A send with refusals keeps its
 * failure sheet, whose Retry is where an error belongs: a toast has usually gone by the time an error is read
 * (`guest-upload.tsx`'s reason for no upload toasts, which still holds for errors). And the sheet already says what
 * joined, in the same true words ("Everything else is in Maya's album.", `uploadFailureElsewhere`), so a send that
 * ends with a file of its own refused, or under a sheet still standing (a row's Retry, a heal of one of its rows),
 * is said by the sheet alone: the toast's "joined" over "2 of 3 didn't upload" was two voices at one moment, the
 * one that leaves by itself first. A send that landed nothing says nothing here either.
 *
 * ★ ONE SURFACE SAYS A LANDING. Never where another already does: the door's keep (its Sent line, live as the rest
 * land), the door's own upload step, the album's camera (its own words while it is open), or the reel's view (its
 * arrivals name her on the picture). Each is read at the moment the send ends; one that ends under it is spent.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { keepSentLine } from "@/components/guest/save-account-prompt";
import { failureSheetStands } from "@/components/guest/upload/failure-sheet";
import { reelOfAddress } from "@/lib/guest/reel-url";
import type { UploadsWait } from "@/lib/guest/upload-tracker";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

/** The toast's one id: a later send's toast takes the place of an earlier one still standing. */
export const SEND_TOAST_ID = "guest-send";

/** How long it stands: a short toast, gone by itself (sonner's own default length). */
export const SEND_TOAST_MS = 4000;

/** The press's word, on every fate: what it shows is hers wherever they are. */
export const SEND_TOAST_PRESS = "Show yours";

/** Where Show yours goes: the album's Yours view, or her uploads (where what waits stands). */
export type SendToastPlace = "album" | "uploads";

export type SendToastWords = { title: string; place: SendToastPlace | null };

/**
 * WHAT A SEND'S TOAST SAYS, pure. `landed` is the send's files that landed and are still hers; each one's own status
 * (`mediaStatus`) says where it went: `approved` is in the album, `pending` waits for the host, `sealed` for the
 * develop time. Null when nothing landed.
 *
 * A send whose files went two ways (the host turned Approve each on while it ran) says what is in the album, and her
 * uploads list the rest; one that waits wholly says how it develops, by the page's live reading of the wait (`wait`,
 * as it falls on her: `addsWaitFor`), as the keep says it.
 */
export function sendToastWords(input: {
  landed: readonly Pick<QueueItem, "kind" | "mediaStatus">[];
  wait: UploadsWait;
  /** The host's name, said in the line ("Maya's album"); null for the owner on her own album, or none set. */
  hostName: string | null;
  camera: boolean;
  /** Whether a press can show hers (never in the demo, whose photographs are nobody's). */
  pressable: boolean;
  nowMs?: number | null;
}): SendToastWords | null {
  const { landed, wait, hostName, camera, pressable } = input;
  if (landed.length === 0) return null;
  const inAlbum = landed.filter((it) => it.mediaStatus === "approved");
  const shown = inAlbum.length > 0 ? inAlbum : landed;
  const count = shown.length;
  const sent = { kinds: shown.map((it) => it.kind), camera };
  const waits = inAlbum.length === 0;
  const title = keepSentLine({
    count,
    held: waits,
    developsAt: waits ? wait.developsAt : null,
    hostName,
    sent,
    nowMs: input.nowMs,
  });
  return {
    title,
    place: pressable ? (waits ? "uploads" : "album") : null,
  };
}

const isActive = (it: QueueItem) =>
  it.status === "queued" || it.status === "uploading";

/**
 * THE SEND'S END, HEARD AT THE PAGE: the run's own files taken as it begins (the ones not already settled, so a Retry
 * counts and a file from an earlier send never does), and the toast said once as it ends, if anything of it landed and
 * no other surface is saying so.
 */
export function useSendToast({
  queue,
  removedIds,
  wait,
  hostName,
  camera,
  isDemo,
  quiet,
  onShow,
  sheetStands = failureSheetStands,
}: {
  queue: readonly QueueItem[];
  /** The media ids she took back this visit: a file she removed again is no longer what landed. */
  removedIds: ReadonlySet<string>;
  /** What she adds waits for, as it falls on her (`addsWaitFor` over the page's live reading). */
  wait: UploadsWait;
  hostName: string | null;
  /** The album's camera took them: they are her shots. */
  camera: boolean;
  isDemo: boolean;
  /**
   * Another surface is saying this landing now (the keep, the door's step, the camera): read at the send's end, and a
   * send that ends under it is spent, never said later.
   */
  quiet: boolean;
  onShow: (place: SendToastPlace) => void;
  /** Whether a failure sheet stands now, read as the send ends (`failureSheetStands`; a test hands its own). */
  sheetStands?: () => boolean;
}): void {
  const wasRunning = useRef(false);
  const before = useRef<ReadonlySet<string>>(new Set());
  // The latest of what the end reads, so the edge below fires on the queue alone.
  const latest = useRef({
    removedIds,
    wait,
    hostName,
    camera,
    isDemo,
    quiet,
    onShow,
    sheetStands,
  });
  useEffect(() => {
    latest.current = {
      removedIds,
      wait,
      hostName,
      camera,
      isDemo,
      quiet,
      onShow,
      sheetStands,
    };
  });
  useEffect(() => {
    const running = queue.some(isActive);
    const was = wasRunning.current;
    wasRunning.current = running;
    if (running && !was) {
      // The send begins: what is settled now is not its own.
      before.current = new Set(
        queue.filter((it) => !isActive(it)).map((it) => it.id),
      );
      return;
    }
    if (running || !was) return;
    const now = latest.current;
    // The reel's view names her arrival on the picture itself (read as the address stands, never a render's copy).
    if (now.quiet || reelOfAddress() !== null) return;
    // ★ THE SHEET'S MOMENT (the head note): a file of this send refused opens the failure sheet at this very edge (its
    // slot hears the same end, a render later, so it is read here off the files, never off the sheet), and a sheet
    // that already stands is the one voice for what this send landed.
    const ownFailed = queue.some(
      (it) => it.status === "error" && !before.current.has(it.id),
    );
    if (ownFailed || now.sheetStands()) return;
    const landed = queue.filter(
      (it) =>
        it.status === "done" &&
        !before.current.has(it.id) &&
        !(it.mediaId && now.removedIds.has(it.mediaId)),
    );
    const words = sendToastWords({
      landed,
      wait: now.wait,
      hostName: now.hostName,
      camera: now.camera,
      pressable: !now.isDemo,
    });
    if (!words) return;
    const place = words.place;
    // ★ EVERY FIELD ON EVERY SHOW: sonner merges a toast into the one it replaces by id, so a press left unset would
    // carry over from the send before.
    toast(words.title, {
      id: SEND_TOAST_ID,
      duration: SEND_TOAST_MS,
      action: place
        ? {
            label: SEND_TOAST_PRESS,
            onClick: () => latest.current.onShow(place),
          }
        : undefined,
    });
  }, [queue]);
}
