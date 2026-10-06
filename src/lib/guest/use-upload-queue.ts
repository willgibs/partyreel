"use client";

/**
 * THE GUEST UPLOAD QUEUE: one-file-at-a-time uploads (robust on flaky mobile
 * connections), per-item progress patching, the just-in-time SILENT join
 * (no prompts - account-required events are gated at the page level), the
 * pending-files stash, demo simulation, and retry. `event-experience.tsx`
 * owns it, so the door's upload step and the album's `GuestUpload` both read
 * one snapshot.
 *
 * ★ WHAT WAITS GOES AS ONE BURST (compute-uploads, the compute model's lever 4): a run takes the files waiting
 * (`takeBurst`: up to 20, and 1 GiB) and sends them with one presign and as few completes as their landing allows
 * (`uploadBurst`), the bytes still one file at a time; the camera's shots and a second pick join the next burst. A
 * file stays `queued` until its bytes go (`uploading`: the file in the air, which the album's stack shows), and
 * waits `queued` at 100 once they are up, until it is recorded with its siblings (`done`). The session's three
 * refusals below are read once the burst is over, for every file of it they reached. The next burst begins on the
 * last one's bytes, its complete held for the last one's answer (`Flight`, uploads-bursts), and a Retry all goes back
 * as one burst (`retry`).
 *
 * ★ A FILE IN FLIGHT CAN BE STOPPED, ONE AT A TIME (`stop`, upload-cancel: E6 for uploads). Each file of a burst carries
 * a stop of its own (`BurstFile.signal`), so the burst's other files go on and are recorded together as ever. A stopped
 * file is NOT a failure: the uploader settles it `cause: "cancelled"` and it leaves the queue (nothing for the failure
 * sheet, the shutter's ring or her uploads to count, and nothing recorded, so the meter counts nothing), and `stop`
 * hands back the way to send it again. One not yet in a burst (waiting for the next, for a door, for a ticket) leaves
 * at once. Too late once its complete is asked: it lands, and `stop` says so by handing back nothing, AT ONCE (a press
 * that waited for the landing left its question standing, unchanged, for as long as the complete took, so it read as
 * unheard).
 *
 * ★ THE ALBUM'S OWNER IS NEVER HER OWN GUEST (`ownerEventId`, crumbs-29's
 * Deferred). Her Add on her own album's guest page went through the guest
 * pair, minting her a guest row at her own door, and `create_guest` never
 * counts the host as in: at a door that holds newcomers her upload never went
 * (approve minted her a waiting ticket her picks waited on for good, invite
 * refused "Ask the host to let you in.", closed and Only me "This event is
 * private."). Her files go through the host's own pair instead, as the hub's
 * Add and the reel's Add to event do (`clip-add.ts`): `create_media_as_host`,
 * approved (she is the moderator), metered on her storage, credited as the
 * host, with no ticket, no join and no door. The same queue, so the album's
 * tile, progress and failure sheet are the ones a guest's files wear.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";

import { joinEvent, type JoinedGuest } from "@/lib/guest/join";
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";
import { dropGuestTicket } from "@/lib/guest/use-stored-session";
import { useHealLostAnswers } from "@/lib/guest/use-upload-queue.heal";
import { HOST_CLIP_ENDPOINTS } from "@/lib/reel/clip-add";
import { takeBurst } from "@/lib/upload/burst";
import type { StopResult } from "@/lib/upload/stop-upload";
import {
  UPLOAD_WORDS,
  uploadBurst,
  type UploadCause,
  type UploadOutcome,
} from "@/lib/upload/uploader";

/**
 * The three refusal codes this queue reads by name. Everything else is a file's
 * own problem and belongs to the failure sheet; these three are the SESSION's.
 *
 *   `verification_required`: the host turned Require verified emails on under a
 *   name-only ticket, which invalidates every file still waiting behind it.
 *
 *   `session_other_account` (`SESSION_OTHER_ACCOUNT`): the ticket this device
 *   kept is not the viewer's: an account's row the viewer is not, or (crumbs-26)
 *   a name-only row while the viewer is signed in that the claim left as another
 *   guest's, on a shared phone. The ticket goes down and the viewer joins as
 *   themselves, and the file is NOT failed: it waits and goes up on the new
 *   ticket, so no photograph is lost and none is credited to the ticket's owner.
 *
 *   `invalid_session` (`DEAD_TICKET`): the ticket this device kept names no row
 *   any more. A waiting ticket's door became a password (its ask ended with the
 *   door, migration 20260929230000), so the phone that asked holds a token the
 *   server no longer knows. It goes down the same way and the viewer joins afresh
 *   past the door as it stands now (after the unlock, `create_guest` mints her in).
 *
 * A JOIN THAT LANDS WAITING (`admission: "waiting"`, crumbs-27) is the ASK, not a
 * ticket: where the host lets each guest in, a confirmed newcomer's join mints a
 * row the door holds until the host answers, and a file sent on it is refused
 * "This event is private." (a waiting ticket reads as a private album's). So the
 * queue never sends on it and never fails a file for it: the files wait `queued`,
 * the door has her (`onDoorNeeded`: the page refreshes onto the held door, which
 * reads the cookie the join set), and the run resumes when `doorOpen` says she is
 * through.
 */
const VERIFICATION_REQUIRED = "verification_required";
const DEAD_TICKET = "invalid_session";

/** A guest's upload pair: the ticket in the body (`session_token`), every guest gate re-checked per file. */
const GUEST_ENDPOINTS = {
  presign: "/api/r2/presign-upload",
  complete: "/api/r2/complete-upload",
} as const;

/** Where a file goes and as whom: a guest's pair on her ticket, or the host's on her event (the head note). */
type UploadRoute = Pick<
  Parameters<typeof uploadBurst>[0],
  "endpoints" | "identity"
>;

/** The three refusals that are the session's, never the file's (the note above): read once a burst is over. */
const isSessionRefusal = (outcome: UploadOutcome) =>
  !outcome.ok &&
  (outcome.code === SESSION_OTHER_ACCOUNT ||
    outcome.code === DEAD_TICKET ||
    outcome.code === VERIFICATION_REQUIRED);

export type QueueItemStatus = "queued" | "uploading" | "done" | "error";

export type QueueItem = {
  id: string;
  file: File;
  /** Derived at enqueue from the MIME type, so a pending tile can wear the
   *  video badge before the server confirms anything. */
  kind: "photo" | "video";
  status: QueueItemStatus;
  /** A PERCENT, 0 to 100, never a fraction: the bytes' own `Math.round(fraction * 100)`, as every bar reads it. */
  progress: number;
  mediaStatus?: string;
  /**
   * The row this file became, once it exists. Her uploads need it for the ONE
   * case where a finished upload still has somewhere to go: a HELD file
   * (`mediaStatus === "pending"`) waits in her tracker until the host decides,
   * and the only way to know it was let in is to see this id arrive in the
   * poll's own list (and her own rows, read by id, say the rest).
   */
  mediaId?: string;
  error?: string;
  /**
   * THE REFUSAL'S OWN CODE, kept beside its sentence: the server's, or the uploader's for a file it refused
   * itself before any request (a wrong type, a file over its ceiling: `uploader.ts`'s `prepare` tags them at
   * the source). The album's failure sheet needs only the words, but the door's upload step has no exit,
   * so what a guest can DO about a refusal has to be derivable: `uploads_closed` and `cap_reached` open the
   * album (the fail-open), `invalid_session` goes back to the name, and only the rest may offer a Retry.
   * Absent for a transport failure, which `classifyRefusal` reads as "worth another go". The queue carries
   * the code it is told and never makes one up.
   */
  errorCode?: string;
  /**
   * ★ WHY THE TRANSPORT ENDED IT, beside the sentence (`UploadOutcome.cause`): `dropped` is the connection (the same
   * file goes again once the line is back) and `cancelled` is her own stop (nothing is wrong; such a file leaves the
   * queue, `stop`, so no item stays `error` with it). Absent for a refusal
   * (an answer that was an error: the server's own code is `errorCode`) and for a local validation. A surface that draws
   * a dropped connection apart from a refusal (the failure sheet, the camera) reads this and never the message, whose
   * words are free to change.
   */
  cause?: UploadCause;
  /**
   * A CUT the on-device creator is adding to the album: the row is written `reel_eligible = false`,
   * so the live reel never plays a reel. Absent for every other file. It rides the queue like any
   * upload (one at a time, the silent join, retry, the failure sheet), because a clip added to the
   * album IS an upload like any other (guest-flow.md).
   */
  reelEligible?: false;
  /** The clip's poster, drawn by its creator: the album's preview for it (uploader.ts). A camera video's first frame. */
  poster?: Blob;
  /**
   * When the album's camera took it (epoch ms): its shots are canvas JPEGs with no Exif, so this is the capture time the
   * complete claims for them (`BurstFile.takenAt`, crumbs-85); a file that states its own keeps its own.
   */
  takenAt?: number;
};

/**
 * What a caller may hand the queue with its files (`addFiles`): a camera video's first frame, as its poster, and when
 * the camera took it.
 */
export type FileExtra = Pick<QueueItem, "poster" | "takenAt">;

/**
 * ★ THE STATUS A LANDING IS TOLD AS: the server's own, except an approved row SEALED until its album develops (any
 * album with a develop time ahead: a camera's shot or a free upload, the door's first photograph included), which is
 * `sealed` (build 43's red-team, the upload half). The completion says `sealed` as the write did (`create_media`'s
 * answer, `server-pipeline.ts`); an approved landing is otherwise drawn into the album at once for this device
 * (`notifyUploaded`), and a sealed one stood there for her alone, counted in the album's number, until a reload took
 * it away, as if the roll had developed. `sealed` is no album status: nothing draws it, her tracker keeps it as it
 * keeps a held one (`upload-tracker.ts`), and the album's sync brings it when the album develops. A held row stays
 * `pending`, sealed or not: the host decides it first.
 */
export function landedAs(status: string, sealed: boolean | undefined): string {
  return status === "approved" && sealed === true ? "sealed" : status;
}

/**
 * ★ A PROGRESS TICK IS NOT A QUEUE CHANGE. The uploader reports progress about once a frame, and the
 * queue lives in `event-experience.tsx`, the page's whole shell: a progress tick written into `items`
 * re-rendered the shell, the live gallery's provider, the reel and the album, sixty times a second
 * for as long as a guest's twelve photographs took to go. So a tick goes HERE, a tiny store outside
 * React state, and `items` changes only when an item's status does (its `progress` field is the value
 * at that moment: 0 as it starts, 100 when it lands). What draws a bar subscribes to its own item's
 * progress (`useQueueProgress`), so a tick re-renders one bar and nothing else.
 */
export type QueueProgress = {
  /** An item's progress, 0-100 (0 for one this store has not heard of). */
  get(id: string): number;
  subscribe(listener: () => void): () => void;
  /**
   * ★ THE STOP RIDES THE STORE THE STACK ALREADY READS (upload-cancel). The page hands the album's head this one object
   * (`uploadProgress`), and the head is the one place that asks the queue anything of a file, so the x needs no prop
   * through the three files between the queue and the stack. Absent on a store that is only a reading (a test's, the
   * Library's). Resolves with the way to send the file again once it is cancelled, or null when it was too late
   * (`useUploadQueue`'s `stop`, which this is).
   */
  stop?(id: string): Promise<StopResult>;
};

type WritableQueueProgress = QueueProgress & {
  set(id: string, value: number): void;
  /** The queue's live `stop`, bound once per render of it (its closure changes with the page's callbacks). */
  bindStop(stop: (id: string) => Promise<StopResult>): void;
};

function createQueueProgress(): WritableQueueProgress {
  const values = new Map<string, number>();
  const listeners = new Set<() => void>();
  // Nothing is stoppable until the queue binds its own: a store only read answers "too late" to a stop.
  let stopper: ((id: string) => Promise<StopResult>) | undefined;
  return {
    stop: (id) => stopper?.(id) ?? Promise.resolve(null),
    bindStop(next) {
      stopper = next;
    },
    get: (id) => values.get(id) ?? 0,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(id, value) {
      if (values.get(id) === value) return;
      values.set(id, value);
      for (const listener of listeners) listener();
    },
  };
}

/** One item's live progress, subscribed: a tick re-renders the caller and nothing else. */
export function useQueueProgress(
  progress: QueueProgress | null | undefined,
  id: string | null | undefined,
): number {
  const subscribe = useCallback(
    (onChange: () => void) =>
      progress && id ? progress.subscribe(onChange) : () => {},
    [progress, id],
  );
  const read = () => (progress && id ? progress.get(id) : 0);
  return useSyncExternalStore(subscribe, read, read);
}

/**
 * The queue with every item's live progress folded in, but ONLY while `live` is true: the one caller
 * whose bars read `progress` off the items themselves (the door's upload step, which draws a bar a
 * pick) re-renders per tick while it is on screen, and nothing re-renders for a tick otherwise.
 */
export function useLiveQueue(
  items: readonly QueueItem[],
  progress: QueueProgress,
  live: boolean,
): readonly QueueItem[] {
  const subscribe = useCallback(
    (onChange: () => void) => (live ? progress.subscribe(onChange) : () => {}),
    [progress, live],
  );
  // A string snapshot, so an unchanged tick reads as unchanged (a fresh array per read would loop).
  const key = useSyncExternalStore(
    subscribe,
    () =>
      live
        ? items
            .map((it) =>
              it.status === "uploading" ? progress.get(it.id) : it.progress,
            )
            .join(",")
        : "",
    () => "",
  );
  return useMemo(
    () =>
      live && key
        ? items.map((it) =>
            it.status === "uploading"
              ? { ...it, progress: progress.get(it.id) }
              : it,
          )
        : items,
    // `key` stands for every item's live progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, live, key],
  );
}

/** One run of hers, as the shutter's ring reads it (`useRunProgress`). */
export type RunProgress = {
  /** Files of the run still on their way (queued or going up). */
  sending: number;
  /** How far the run has gone, 0 to 1: a landed or refused file whole, a going one its own share. */
  progress: number;
  /** Files of the run that landed, and that were refused. */
  landed: number;
  failed: number;
};

const isActive = (it: QueueItem) =>
  it.status === "queued" || it.status === "uploading";

/** Whether a file is the run's: not already finished when the run began, or going again (a Retry). */
const inRun = (it: QueueItem, before: ReadonlySet<string>) =>
  isActive(it) || !before.has(it.id);

/** The run's progress over its files, read off the queue and the progress store at this moment. */
export function runProgressOf(
  items: readonly QueueItem[],
  progress: QueueProgress,
  before: ReadonlySet<string>,
): RunProgress {
  let sending = 0;
  let landed = 0;
  let failed = 0;
  let total = 0;
  let gone = 0;
  for (const it of items) {
    if (!inRun(it, before)) continue;
    total += 1;
    if (it.status === "done") {
      landed += 1;
      gone += 1;
    } else if (it.status === "error") {
      failed += 1;
      gone += 1;
    } else {
      sending += 1;
      // Its own share: the file in the air as far as it has gone, one whose bytes are up whole while it waits to be
      // recorded with its burst (`queued` at 100), one still waiting nothing (the store holds 0 for it).
      gone += progress.get(it.id) / 100;
    }
  }
  // Rounded to a thousandth, so a tick that moves nothing the ring can draw re-renders nothing.
  const fraction = total > 0 ? Math.round((gone / total) * 1000) / 1000 : 0;
  return { sending, progress: fraction, landed, failed };
}

const NOTHING_BEFORE: ReadonlySet<string> = new Set();
const noProgressSubscription = () => () => {};

/**
 * ★ THE RUN, AS ONE NUMBER (`event-header` r1, `stays=shutter`: "while hers send, its ring is their
 * progress"). A DERIVED SELECTOR, ADDITIVE TO THE QUEUE: it reads the snapshot the page already holds
 * and the progress store beside it, and the queue's own API does not move (twelve files import it).
 *
 * A RUN begins the moment something is on its way where nothing was, and takes in every file added
 * while it goes (a second pick mid-run widens the ring's whole rather than starting a new one); its
 * files are every one not already finished when it began, and any going again (a Retry). It ends when
 * nothing is queued or going up, and the next pick starts a new one.
 *
 * ★ A TICK RE-RENDERS ONLY THE CALLER, and only while a run goes: the progress store is subscribed to
 * while something is on its way, and the snapshot is a rounded number, so the page's shell never
 * renders for a tick (`QueueProgress`'s own rule). Call it where the ring is drawn, never in the shell.
 */
export function useRunProgress(
  items: readonly QueueItem[],
  progress: QueueProgress,
): RunProgress {
  const running = items.some(isActive);
  // The ids already finished when this run began, taken the render the run starts (the sanctioned
  // adjust-state-during-render pattern), and kept after it ends so the ring can stand whole.
  const [before, setBefore] = useState<ReadonlySet<string> | null>(null);
  const [wasRunning, setWasRunning] = useState(false);
  if (running !== wasRunning) {
    setWasRunning(running);
    if (running) {
      setBefore(
        new Set(items.filter((it) => !isActive(it)).map((it) => it.id)),
      );
    }
  }
  const baseline = before ?? NOTHING_BEFORE;
  const subscribe = useCallback(
    (onChange: () => void) =>
      running ? progress.subscribe(onChange) : noProgressSubscription(),
    [progress, running],
  );
  const fraction = useSyncExternalStore(
    subscribe,
    () => runProgressOf(items, progress, baseline).progress,
    () => 0,
  );
  // The counts move with the items alone (a status change); the fraction is read above, per tick.
  const counts = useMemo(
    () => runProgressOf(items, progress, baseline),
    [items, progress, baseline],
  );
  if (before === null) {
    return { sending: counts.sending, progress: 0, landed: 0, failed: 0 };
  }
  return { ...counts, progress: fraction };
}

/**
 * ★ THE RUN'S OWN FILES, COUNTED FOR A FAILURE'S HEADING ("N of SENT didn't upload", `failure-sheet.tsx`). The whole
 * run: every file `inRun` (not already settled when the run began, or going again: a Retry), and any failure the
 * heading lists that is not among them, so what is listed is always part of what is counted and a heading never
 * reads "2 of 1". Counted off the items by their ids, never by how many the queue held (a Retry adds no item: counted
 * by length, "1 of 1 didn't upload" read "1 of 0" once it failed again).
 */
export function runSentOf(
  items: readonly QueueItem[],
  before: ReadonlySet<string>,
  listed: readonly Pick<QueueItem, "id">[],
): number {
  const alsoListed = new Set(listed.map((it) => it.id));
  return items.filter((it) => inRun(it, before) || alsoListed.has(it.id))
    .length;
}

/**
 * How many of the run's files have landed (`done`): the rest a failure's sheet may say is in the album is only what has.
 * A file settled before the run began is not the run's, however it ended.
 */
export function runLandedOf(
  items: readonly QueueItem[],
  before: ReadonlySet<string>,
): number {
  return items.filter((it) => it.status === "done" && inRun(it, before)).length;
}

/** The run's own files, counted for a failure's heading (`useRunCounts` says what a run is). */
export function useRunSent(
  items: readonly QueueItem[],
  listed: readonly Pick<QueueItem, "id">[],
): number {
  return useRunCounts(items, listed).sent;
}

/**
 * ★ THE RUN'S OWN COUNT, FOR WHOEVER HEADS A FAILURE WITH IT (the album's slot and the door's step: both read the
 * page's one queue, and either may be the one standing when a run ends). The ids already settled when the run began,
 * taken in the render where something goes where nothing was (the sanctioned adjust-state-during-render pattern, as
 * `useRunProgress` takes its own: an effect would count the new files in their own baseline); `runSentOf` and
 * `runLandedOf` do the rest, off the one baseline, so the heading's whole and the files of it that landed (which the
 * sheet reads before it says anything of the rest in the album) always speak of the same files.
 *
 * ★ A RUN THAT BEGINS WITH FAILURES STILL LISTED IS THEIR GO CONTINUING, not a new one: one of three Retried while the
 * sheet stands over the other two sends a file of the same go, and the whole it counts stays what it was ("2 of 3"
 * before and after), so a heading never changes its meaning under her thumb. A run that begins with nothing listed (a
 * Retry of all of them, or the next pick) is a go of its own, whose files are the ones going.
 *
 * ★ A MOUNT MID-RUN COUNTS EVERYTHING HELD, where `useRunProgress` leaves out what settled before it mounted: this
 * never saw the run begin (the slot mounts under `key={access}` with the door's run already going), so nothing may be
 * taken for outside it, and the heading reads the whole run it ends with.
 */
export function useRunCounts(
  items: readonly QueueItem[],
  listed: readonly Pick<QueueItem, "id">[],
): { sent: number; landed: number } {
  const running = items.some(isActive);
  const [before, setBefore] = useState<ReadonlySet<string>>(NOTHING_BEFORE);
  const [wasRunning, setWasRunning] = useState(running);
  if (running !== wasRunning) {
    setWasRunning(running);
    if (running && listed.length === 0) {
      setBefore(
        new Set(items.filter((it) => !isActive(it)).map((it) => it.id)),
      );
    }
  }
  return {
    sent: runSentOf(items, before, listed),
    landed: runLandedOf(items, before),
  };
}

export type UploadedItem = {
  mediaId: string;
  /** The queue item that produced this upload - lets the gallery re-key its
   *  optimistic blob URL from queue id to media id with zero flicker. */
  queueId: string;
  file: File;
  kind: "photo" | "video";
  /**
   * create_media status: 'approved' (live) or 'pending' (hold_for_approval), or 'sealed' for an approved row its
   * album keeps until it develops (`landedAs`), which nothing draws.
   */
  status: string;
};

// Demo mode: fake an upload (a brief progress ramp) and return a synthetic
// "approved" outcome. Nothing hits the network - the gallery renders the local
// file via the optimistic-tile path, and the synthetic id never appears in the
// poll, so it survives until refresh. No presign / R2 PUT / create_media.
async function simulateUpload(
  file: File,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadOutcome> {
  for (const fraction of [0.3, 0.6, 0.85, 1]) {
    await new Promise((resolve) => setTimeout(resolve, 120));
    // Hers: the demo says what a real upload does (`uploader.ts`), so the stop is rehearsed too.
    if (signal?.aborted) return cancelledOutcome();
    onProgress(fraction);
  }
  return {
    ok: true,
    status: "approved",
    mediaId: crypto.randomUUID(),
    kind: file.type.startsWith("video/") ? "video" : "photo",
  };
}

/** What a stopped file is told as, in the transport's own words (`uploader.ts`: a cancel is never a drop). */
const cancelledOutcome = (): UploadOutcome => ({
  ok: false,
  message: UPLOAD_WORDS.cancelled,
  cause: "cancelled",
});

/** The demo's burst: each file faked in turn (`simulateUpload`), told as `uploadBurst` tells a real one. */
async function simulateBurst(
  files: Parameters<typeof uploadBurst>[0]["files"],
  onOutcome: (index: number, outcome: UploadOutcome) => void,
): Promise<UploadOutcome[]> {
  const out: UploadOutcome[] = [];
  for (const [i, one] of files.entries()) {
    let outcome: UploadOutcome;
    if (one.signal?.aborted) {
      outcome = cancelledOutcome();
    } else {
      one.onSending?.();
      outcome = await simulateUpload(
        one.file,
        (f) => one.onProgress?.(f),
        one.signal,
      );
    }
    out.push(outcome);
    onOutcome(i, outcome);
  }
  return out;
}

/*
 * ★ THE NEXT BURST GOES ON THE LAST ONE'S BYTES (uploads-bursts). A burst's files are up long before its complete
 * answers (a round trip, a burst's records one after another on the server), and the runner awaited the burst whole,
 * so at every boundary (past 20 files, 1 GiB, or a pick made while a burst went) the line sat idle for that round
 * trip before the next burst's first file was even prepared. Now a burst is a FLIGHT: the next one is taken and begun
 * the moment the last one's bytes are up (`onSendDone`), its preparing, presign and bytes overlapping the last
 * complete, and at most two are in play.
 * ★ THE COMPLETES STAY IN ORDER: the next burst's complete waits for the last one's answer (`recordAfter`), so
 * `create_media*` meets this queue's completes one after another, as it always has. What the overlap moves is the
 * presign: it judges (the meter's month and room, the camera's roll) without the last burst's files, which are not yet
 * recorded, as a presign always has for a sibling device. Those judgments are the presign's early word and fail open;
 * the complete re-judges each file on what is recorded and refuses in the same words (`cap-words.ts`, `roll_spent`),
 * so a file the boundary let through is refused at its complete, onto the failure sheet with its files, never counted.
 * ★ A SESSION'S REFUSAL STILL ENDS WHAT WENT ON ITS TICKET: one already told (every presign of a burst has answered
 * by its bytes' end) begins nothing more on it, and one its complete brings late takes the flight begun on the same
 * ticket with it, read as one (`afterSessionRefusal`).
 */
type Flight = {
  burst: QueueItem[];
  /** Each file's outcome as it is known, once (`settle`). */
  told: Map<string, UploadOutcome>;
  /** Every file of it told. Never rejects. */
  whole: Promise<void>;
  /** Its bytes are up (or never will be), or it is whole. */
  bytesUp: Promise<void>;
};
/** A flight's files the session refused (the head note's three), read once each is told. */
const spentOf = (flight: Flight) =>
  flight.burst.filter((it) => {
    const outcome = flight.told.get(it.id);
    return outcome !== undefined && isSessionRefusal(outcome);
  });

/** One picked file as the queue holds it: waiting its turn. */
function queueItem(
  file: File,
  extra: Pick<QueueItem, "reelEligible" | "poster" | "takenAt"> = {},
): QueueItem {
  return {
    id: crypto.randomUUID(),
    file,
    kind: file.type.startsWith("video/") ? "video" : "photo",
    status: "queued",
    progress: 0,
    ...extra,
  };
}

export function useUploadQueue({
  qrToken,
  sessionToken,
  onSession,
  onUploaded,
  isDemo,
  isVerified = false,
  doorOpen = true,
  ownerEventId = null,
  onVerificationRequired,
  onDoorNeeded,
}: {
  qrToken: string;
  sessionToken: string | null;
  onSession: (token: string | null) => void;
  onUploaded: (item: UploadedItem) => void;
  /** Demo event: simulate uploads client-side, persist nothing. */
  isDemo: boolean;
  /**
   * The viewer holds a CONFIRMED account. It decides what a lost ticket costs:
   * a signed-in guest re-joins silently (their own uid mints their own row and
   * the run carries on), a name-only guest or a signed-out visitor cannot. For a
   * mid-run `verification_required` the run then ends and the page re-gates; for
   * a `session_other_account` the files wait for the door (`onDoorNeeded`).
   */
  isVerified?: boolean;
  /**
   * The page's door lets this viewer through to the album (its access is not `none`), which is
   * true whenever she can see the album and false while a door holds her (the held door, the
   * ask). Files held for the door (`onDoorNeeded`, a join that landed waiting) resume the moment
   * it turns true again, on a fresh chain of joins: she was let in, so the join asks nobody.
   */
  doorOpen?: boolean;
  /**
   * The album is the viewer's own (the page's server-side owner answer, `isRequestOwner`): its
   * event id, and every file goes through the host's own pair with no ticket (the head note).
   * Null for everyone else. The routes decide again: the host's pair re-verifies the owner.
   */
  ownerEventId?: string | null;
  /**
   * The host turned Require verified emails ON mid-visit; the session is spent.
   * `hadQueuedFiles` tells the caller whether the failure sheet is about to
   * open for THIS refusal (a mid-run flip: `true`) or whether nothing was ever
   * queued (`joinSilently`'s own refusal: `false`, no sheet incoming) — the one
   * fact a caller cannot infer safely from its own React state at the instant
   * this fires (the refresh waits for the failure sheet: see
   * event-experience.tsx's own note for why that matters).
   */
  onVerificationRequired?: (message: string, hadQueuedFiles: boolean) => void;
  /**
   * Files are waiting and this device holds no ticket the queue can mint on its
   * own: the viewer is signed out, or signed in without a confirmed email, so
   * only the door can name them (a name in names mode, the email step in
   * verified mode). The caller re-resolves who is here (the page refreshes, so a
   * sign-out in another tab is seen too) and the door opens; the files stay
   * `queued` and go up the moment its join hands a ticket down through
   * `sessionToken`. Nothing is failed and nothing opens a failure sheet: from
   * the guest's side the door simply asks their name.
   *
   * ★ `ticketDown`, WHEN A TICKET IS STILL GOING DOWN (crumbs-29): the queue calls this BEFORE it puts
   * somebody else's ticket down, because the ticket takes its name with it and a door that re-read the
   * phone without it drew the name step for the seconds the page's refresh took to say who is really
   * here (a phone the host blocked: the shut screen). The caller holds its door from this call and
   * refreshes once `ticketDown` settles, so the refresh never reads the cookie the ticket is leaving.
   */
  onDoorNeeded?: (ticketDown?: Promise<void>) => void;
}) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [progress] = useState(createQueueProgress);
  // Ref mirror so the sequential queue runner reads current state synchronously.
  const itemsRef = useRef<QueueItem[]>([]);
  const processingRef = useRef(false);
  /* A run asked for while one goes, said to the one going (`runQueue`): it may be waiting on the last burst's complete
     with nothing begun, and what was just queued is the next burst's now, not after that answer. */
  const wakeRef = useRef<(() => void) | null>(null);
  /* ★ EACH FILE OF A BURST'S STOP, by queue id, from the burst's start until the file is told (`stop` aborts it), and
     the burst it is in play with (two may be: the next goes on the last one's bytes, `Flight`), and
     who is waiting to hear what a stop came to (`true`: it was cancelled; `false`: it was too late and landed or
     failed as it would have). */
  const stopsRef = useRef(
    new Map<string, { stop: AbortController; burst: readonly string[] }>(),
  );
  const asksRef = useRef(new Map<string, (cancelled: boolean) => void>());
  // The session can flip null→token WHILE mounted (just-in-time join), so the
  // queue reads a ref, not the prop, to avoid a stale closure.
  const sessionRef = useRef(sessionToken);
  useEffect(() => {
    sessionRef.current = sessionToken;
  }, [sessionToken]);
  // Files picked before a session exists — uploaded once the session is created (each with what it was handed).
  const pendingFilesRef = useRef<{ file: File; extra: FileExtra }[]>([]);
  // The same stash for a clip (it carries its poster and its reel flag with it).
  const pendingClipsRef = useRef<{ file: File; poster: Blob }[]>([]);
  // One silent re-join per run at most: a signed-in guest whose row predates the
  // host's flip gets a fresh, verified row and carries on. Without the guard a
  // route that keeps refusing would have this loop minting rows forever.
  const rejoinedRef = useRef(false);
  /* The same guard for a ticket that was not the viewer's (see `acquireTicket`):
     one silent join per chain of refusals, spent until a file actually lands or
     the guest presses Retry, so a server that kept refusing the row it had just
     minted could never turn this loop into a row factory. */
  const silentJoinSpentRef = useRef(false);
  const isVerifiedRef = useRef(isVerified);
  useEffect(() => {
    isVerifiedRef.current = isVerified;
  }, [isVerified]);
  /* ★ NOTHING GOES UP WHILE A DOOR HOLDS HER (`locked-door` r2, Will's `wait=pick`: "Nothing leaves your
     phone until Maya lets you in"). The held door lets her choose what she will add while she waits,
     and her ticket there is a waiting one the routes refuse in the private album's words, so a run is
     never started on it: the picks wait `queued`, and the door's opening starts them (the flip below). */
  const doorOpenRef = useRef(doorOpen);
  useEffect(() => {
    doorOpenRef.current = doorOpen;
  }, [doorOpen]);

  const sync = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = useCallback(
    (id: string, p: Partial<QueueItem>) => {
      if (p.progress !== undefined) progress.set(id, p.progress);
      // A tick alone never reaches `items` (see `QueueProgress`).
      const keys = Object.keys(p);
      if (keys.length === 1 && keys[0] === "progress") return;
      sync(itemsRef.current.map((it) => (it.id === id ? { ...it, ...p } : it)));
    },
    [sync, progress],
  );

  /**
   * Fail everything still waiting, in place, with one sentence (a join that
   * nobody at the door could fix: offline, a rate limit, a dead link). The
   * failure sheet opens once over the lot, and its Retry comes back through
   * `retry`, which gives the silent join another chance.
   */
  const failWaiting = useCallback(
    (message: string, code?: string) => {
      sync(
        itemsRef.current.map((it) =>
          it.status === "queued"
            ? {
                ...it,
                status: "error" as const,
                progress: 0,
                error: message,
                errorCode: code,
              }
            : it,
        ),
      );
    },
    [sync],
  );

  /**
   * A JOIN'S TICKET, IF THE DOOR PASSED IT: the ticket to send on, or null when the door holds her.
   * ★ A JOIN THAT LANDED WAITING IS THE ASK, NOT A TICKET (crumbs-27): the host has not let her in, so
   * anything sent on it is refused "This event is private." and would fail a file that is fine. It is
   * adopted by nobody here: the door reads the cookie the join set, and the ticket the files go up on
   * is the one her join is handed once she is let in (`doorOpen`). The files stay as they are.
   */
  const takeJoin = useCallback(
    (guest: JoinedGuest): string | null => {
      if (guest.admission === "waiting") {
        // Whatever ticket the queue still held is spent (a join is only asked for when it is), so it is
        // let go of: the files must not go up on it when she is let in.
        if (sessionRef.current !== null) {
          sessionRef.current = null;
          onSession(null);
        }
        onDoorNeeded?.();
        return null;
      }
      sessionRef.current = guest.sessionToken;
      onSession(guest.sessionToken);
      return guest.sessionToken;
    },
    [onSession, onDoorNeeded],
  );

  /* ──────────────────────────────────────────────────────────────────────────
     A RUN WITH FILES WAITING AND NO TICKET.

     The ticket went down under the run (a `session_other_account` below, or a
     Retry after one), so the viewer joins again AS WHOEVER IS HOLDING THE PHONE
     NOW, which the server decides, never the ticket.

     ★ A CONFIRMED ACCOUNT JOINS SILENTLY: `create_guest` mints its own row from
     its own uid, and the run carries on as if nothing happened, because nothing
     about THEM changed. Once per chain (`silentJoinSpentRef`).

     ★ ANYONE ELSE MEETS THE DOOR: a signed-out visitor or an unconfirmed account
     has no identity the queue can mint on its own (a name in names mode, a
     proved email in verified mode), so `onDoorNeeded` hands them to it and the
     files wait, `queued`, for the ticket its join hands down. A 422 from the
     silent join means the page thought this viewer was confirmed and the server
     does not (a sign-out in another tab): the door is the answer there too.

     ★ AND SO IS A JOIN THAT LANDS WAITING (`takeJoin`): the page thought she was
     through and the door says the host has not let her in, so the files wait for
     the door instead of going up on a ticket it will refuse.

     Returns the new ticket, or null when this run stops here.
     ────────────────────────────────────────────────────────────────────────── */
  /** Whether a run with no ticket can mint its own (`acquireTicket`), or only the door can. */
  const joinsSilently = useCallback(
    () => isDemo || (isVerifiedRef.current && !silentJoinSpentRef.current),
    [isDemo],
  );

  const acquireTicket = useCallback(async (): Promise<string | null> => {
    if (isDemo) {
      // The demo mints nothing and never loses its ticket; this is a belt.
      sessionRef.current = "demo";
      onSession("demo");
      return "demo";
    }
    if (joinsSilently()) {
      silentJoinSpentRef.current = true;
      const joined = await joinEvent({ qrToken });
      if (joined.ok) return takeJoin(joined.guest);
      if (
        joined.refusal.kind !== "name_required" &&
        joined.refusal.kind !== "verification_required"
      ) {
        failWaiting(joined.refusal.message, joined.refusal.kind);
        return null;
      }
    }
    onDoorNeeded?.();
    return null;
  }, [
    isDemo,
    qrToken,
    onSession,
    onDoorNeeded,
    failWaiting,
    takeJoin,
    joinsSilently,
  ]);

  /**
   * The bursts a session's refusal ended (one, or the last with the one begun on its ticket: `runQueue`), read once
   * they are whole: whether the run goes round again (`continue`) or ends here (`break`).
   */
  const afterSessionRefusal = useCallback(
    async (ended: readonly Flight[]): Promise<"continue" | "break"> => {
      const spent = ended.flatMap(spentOf);
      // The first session refusal decides the branch, for every file of them the session cost.
      const first = ended
        .map((flight) => flight.told.get(spent[0]!.id))
        .find((outcome) => outcome !== undefined) as Extract<
        UploadOutcome,
        { ok: false }
      >;
      const requeue = () => {
        for (const it of spent) patch(it.id, { status: "queued", progress: 0 });
      };
      /* ──────────────────────────────────────────────────────────────────
         SOMEBODY ELSE'S TICKET.

         This device kept a ticket whose row belongs to an account, and the
         viewer is not that account (signed out, or signed in as someone
         else), or a name-only ticket while the viewer is signed in that the
         claim left as another guest's (crumbs-26: on a shared phone her
         photos went up under the typed name of whoever held it before her):
         the routes refuse it (lib/guest/session-owner.ts), at presign or,
         when a sign-in or a sign-out overtook a presign, at completion. The
         ticket is put down (the token, the name and address flag beside it,
         the cookie) and the burst's files it cost go back in the queue rather
         than into the failure sheet; the next pass finds no ticket and
         `acquireTicket` joins as the viewer the server says this is. So
         nothing is lost and nothing is credited to the ticket's owner, and a
         guest who is signed in never learns it happened.

         ★ A DEAD TICKET IS PUT DOWN THE SAME WAY (`invalid_session`): a token
         whose row is gone (an ask the door's move to a password ended) can
         never work again, and "refresh and rejoin" could not help, since a
         refresh keeps the stored token. The silent join is still once per
         chain, so a join that minted another dead ticket (it cannot) would
         end at the door, never in a loop.

         ★ AND WHEN ONLY THE DOOR CAN NAME WHOEVER IS HERE, THE DOOR IS TOLD
         FIRST (crumbs-29). The ticket takes its name with it, and a page
         rendered for the ticket's owner then drew its name step from the
         phone alone, for the 2 to 4 s its refresh took to find a viewer the
         host had blocked (build 30: the name step before "This album is
         private"). So the page hears it before anything goes down, holds
         its door, and re-reads who is here once the ticket is down
         (`ticketDown`); the files wait for the door's ticket.
         ────────────────────────────────────────────────────────────────── */
      if (first.code === SESSION_OTHER_ACCOUNT || first.code === DEAD_TICKET) {
        sessionRef.current = null;
        requeue();
        if (!joinsSilently()) {
          let down = () => {};
          onDoorNeeded?.(
            new Promise<void>((resolve) => {
              down = resolve;
            }),
          );
          onSession(null);
          await dropGuestTicket(qrToken);
          down();
          return "break";
        }
        onSession(null);
        await dropGuestTicket(qrToken);
        return "continue";
      }
      /* ──────────────────────────────────────────────────────────────────
         THE FLIP, MID-RUN.

         A host can turn Require verified emails ON while a guest is halfway
         through twelve files. The route answers 403 `verification_required`,
         and the difference this branch draws is between one refused FILE and
         a spent SESSION: if the session is spent, every file still queued
         behind this burst will be refused for the same reason, and letting the
         loop discover that twelve times over means twelve identical lines in
         the failure sheet and twelve pointless round trips.

         ★ A SIGNED-IN GUEST SIMPLY RE-JOINS. Their row predates the flip, but
         their uid is confirmed, so `create_guest` mints a verified one and the
         run continues on the new token — the guest never learns any of this
         happened, which is right, because nothing about THEM changed.

         ★ A NAME-ONLY GUEST CANNOT, AND KEEPS HER TICKET (crumbs-43). The rest
         of the run is failed in place with the server's own sentence, so the
         failure sheet opens once, lists everything that did not go, and says
         the same true thing about all of it; the page then re-gates (the door
         asks for her email, and the album's Add is not hers until it opens).
         The ticket stays: her row is still hers, and only the switch stands
         in front of it. This used to put the session down, and every road
         back then minted a second row under the same name (one person twice
         in the guest list, ROADMAP): the host turning the switch off again
         sent her next Add through a fresh join, and a confirmation could not
         claim photographs whose ticket the device no longer held. Kept, the
         next Add after the switch goes off rides the same row, and the
         confirmation's claim takes it (`whose_ticket`'s rules, untouched).
         Every upload asks the switch again (`get_upload_context`), so a kept
         ticket can never send past it.
         ────────────────────────────────────────────────────────────────── */
      if (isVerifiedRef.current && !rejoinedRef.current) {
        rejoinedRef.current = true;
        const rejoined = await joinEvent({ qrToken });
        if (rejoined.ok) {
          const ticket = takeJoin(rejoined.guest);
          // Re-queue the files this refusal cost; go round again on the new ticket, or, with the
          // door holding her (the join landed waiting), wait for it.
          requeue();
          if (ticket === null) return "break";
          return "continue";
        }
      }
      const cost = new Set(spent.map((it) => it.id));
      const refused = itemsRef.current.map((it) =>
        cost.has(it.id) || it.status === "queued"
          ? {
              ...it,
              status: "error" as const,
              progress: 0,
              error: first.message,
              errorCode: first.code,
            }
          : it,
      );
      sync(refused);
      onVerificationRequired?.(first.message, true);
      return "break";
    },
    [
      patch,
      sync,
      onSession,
      onDoorNeeded,
      onVerificationRequired,
      joinsSilently,
      takeJoin,
      qrToken,
    ],
  );

  /** One burst on its way: each file's stop made, each told once, and every file the burst never told failed in place. */
  const fly = useCallback(
    (burst: QueueItem[], route: UploadRoute, after: Flight | null): Flight => {
      // Each file's stop, made before anything is awaited: a press from here on finds it (`stop`), with the burst it
      // is in play with.
      const ids = burst.map((it) => it.id);
      for (const it of burst)
        stopsRef.current.set(it.id, {
          stop: new AbortController(),
          burst: ids,
        });
      /** Each file's outcome as it is known, once: a landing drawn at once, a file's own refusal in its sheet. */
      const told = new Map<string, UploadOutcome>();
      const settle = (it: QueueItem, outcome: UploadOutcome) => {
        if (told.has(it.id)) return;
        told.set(it.id, outcome);
        // Told: there is nothing left to stop, and whoever asked what their stop came to hears it.
        stopsRef.current.delete(it.id);
        const asked = asksRef.current.get(it.id);
        asksRef.current.delete(it.id);
        if (!outcome.ok && outcome.cause === "cancelled") {
          // ★ HER STOP IS NO FAILURE: the file leaves the queue, so the failure sheet, the shutter's ring and her
          // uploads never count it, and nothing was recorded (`stop` hands back the way to send it again).
          sync(itemsRef.current.filter((q) => q.id !== it.id));
          asked?.(true);
          return;
        }
        asked?.(false);
        if (outcome.ok) {
          // A file landed on this ticket: any later refusal is a new chain.
          silentJoinSpentRef.current = false;
          // A row the album keeps until it develops lands as `sealed` (`landedAs`), drawn nowhere.
          const landed = landedAs(outcome.status, outcome.sealed);
          patch(it.id, {
            status: "done",
            progress: 100,
            mediaStatus: landed,
            mediaId: outcome.mediaId,
          });
          onUploaded({
            mediaId: outcome.mediaId,
            queueId: it.id,
            file: it.file,
            kind: outcome.kind,
            status: landed,
          });
          return;
        }
        // The session's three wait for the burst's end (`afterSessionRefusal`); everything else is this file's own.
        if (isSessionRefusal(outcome)) return;
        patch(it.id, {
          status: "error",
          progress: 0,
          error: outcome.message,
          // The refusal's own code, the server's or the uploader's for a file it refused itself (`errorCode`).
          errorCode: outcome.code,
          cause: outcome.cause,
        });
      };
      const files = burst.map((it) => ({
        file: it.file,
        reelEligible: it.reelEligible,
        poster: it.poster,
        takenAt: it.takenAt,
        // Its bytes go: it is the file in the air (the album's stack follows it).
        onSending: () => patch(it.id, { status: "uploading", progress: 0 }),
        onProgress: (f: number) =>
          patch(it.id, { progress: Math.round(f * 100) }),
        // Its bytes are up: it waits, whole, to be recorded with its burst.
        onSent: () => patch(it.id, { status: "queued", progress: 100 }),
        // Its own stop (`stop`): it alone ends, its siblings go on.
        signal: stopsRef.current.get(it.id)!.stop.signal,
      }));
      let sendDone = () => {};
      const bytesUp = new Promise<void>((resolve) => {
        sendDone = resolve;
      });
      const whole = (async () => {
        // BELT AND BRACES with uploadBurst's never-reject contract. If anything
        // ever DOES reject here, the throw would escape the runner's loop: the
        // burst's files would be left with no error and no retry affordance,
        // and every file still queued behind them would be silently abandoned.
        // One file's failure must only ever fail THAT file: a file the burst
        // never told is failed in place, and every other keeps what it was told.
        try {
          if (isDemo) {
            await simulateBurst(files, (i, o) => settle(burst[i]!, o));
          } else {
            await uploadBurst({
              files,
              ...route,
              onOutcome: (i, o) => settle(burst[i]!, o),
              onSendDone: sendDone,
              recordAfter: after?.whole,
            });
          }
        } catch (e) {
          console.error("upload queue: unexpected failure", e);
        }
        for (const it of burst) {
          settle(it, {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          });
        }
      })();
      void whole.then(sendDone);
      return { burst, told, whole, bytesUp };
    },
    [patch, sync, onUploaded, isDemo],
  );

  // What waits goes as one burst (the head note), its bytes one file at a time — robust on flaky mobile connections.
  const runQueue = useCallback(async () => {
    if (processingRef.current) {
      wakeRef.current?.();
      return;
    }
    processingRef.current = true;
    /** The next burst, taken and begun, or null when nothing goes now (the door, no ticket, nothing waiting). */
    const begin = async (after: Flight | null): Promise<Flight | null> => {
      // The owner never meets a door; anyone else waits for hers to open (the note above).
      if (!ownerEventId && !doorOpenRef.current) return null;
      // A file in flight holds its stop until it is told, and one up waits `queued` at 100: never taken twice.
      const waiting = () =>
        itemsRef.current.filter(
          (it) => it.status === "queued" && !stopsRef.current.has(it.id),
        );
      if (waiting().length === 0) return null;
      /* ★ THE TICKET IS READ PER BURST, NEVER ONCE PER RUN. Both re-joins
         below swap it mid-run, and the burst after a swap must go up on the NEW
         one. (Read once at the top, the verified re-join after a mid-run flip
         would re-send the refused files on the SPENT ticket and fail the run it
         exists to save.) */
      // The owner sends as the host, on no ticket at all (the head note); anyone else on the ticket.
      const token = ownerEventId
        ? null
        : (sessionRef.current ?? (await acquireTicket()));
      const route: UploadRoute | null = ownerEventId
        ? {
            endpoints: HOST_CLIP_ENDPOINTS,
            identity: { event_id: ownerEventId },
          }
        : token
          ? { endpoints: GUEST_ENDPOINTS, identity: { session_token: token } }
          : null;
      if (!route) return null;
      // The burst is taken AFTER the ticket: a join may have failed what waited, or the door taken it.
      const burst = takeBurst(waiting(), (it) => it.file.size);
      if (burst.length === 0) return null;
      return fly(burst, route, after);
    };
    try {
      let last: Flight | null = null;
      for (;;) {
        // The next burst begins on the last one's bytes, never on a ticket the session already refused (the note above).
        const next: Flight | null =
          last && spentOf(last).length > 0 ? null : await begin(last);
        if (next) await next.bytesUp;
        if (!last) {
          if (!next) break;
          last = next;
          continue;
        }
        if (!next) {
          // ★ NOTHING TO BEGIN YET, SO THE LAST ANSWER IS AWAITED, OR A PICK MADE MEANWHILE (`wakeRef`): its bytes are up,
          // so what she adds now goes at once, as the next burst.
          let woken = () => {};
          const wake = new Promise<boolean>((resolve) => {
            woken = () => resolve(true);
          });
          wakeRef.current = woken;
          const wokenFirst = await Promise.race([
            last.whole.then(() => false),
            wake,
          ]);
          wakeRef.current = null;
          if (wokenFirst) continue;
        }
        await last.whole;
        const ended = [last];
        last = next;
        if (spentOf(ended[0]!).length === 0) continue;
        // A refusal its complete brought late: the flight begun on the same ticket ends with it, read as one.
        if (next) {
          await next.whole;
          ended.push(next);
          last = null;
        }
        if ((await afterSessionRefusal(ended)) === "break") break;
      }
    } finally {
      processingRef.current = false;
    }
  }, [acquireTicket, afterSessionRefusal, fly, ownerEventId]);

  /* ★ AND THE RUN RESUMES WHEN A TICKET ARRIVES FROM THE DOOR. Files left
     `queued` for `onDoorNeeded` wait for exactly one thing: the name step's join
     (or the email step's confirmation) handing a fresh ticket down through
     `sessionToken`. That is the moment to carry on. Keyed on the ticket alone,
     through a ref to the live runner, so a re-render never starts a run; the
     runner's own guard makes a second call a no-op. */
  const runQueueRef = useRef(runQueue);
  useEffect(() => {
    runQueueRef.current = runQueue;
  }, [runQueue]);
  useEffect(() => {
    if (!sessionToken) return;
    if (!itemsRef.current.some((it) => it.status === "queued")) return;
    void runQueueRef.current();
  }, [sessionToken]);

  /* ★ AND WHEN THE DOOR LETS HER THROUGH. Files held for a join that landed waiting have no ticket to
     wait for (the queue adopted none), so the moment the page's door opens again is the one that resumes
     them, on a fresh chain of joins: she was let in, so this join asks nobody and mints her ticket. Only
     the flip counts (the door was shut, now it is not); a page that mounts with its door open, or
     stays so, starts nothing. (The one case with no flip: the host answers before the refresh lands, so
     the page never shows the held door. The files then wait for her next Add, which runs them first.) */
  const doorWasOpenRef = useRef(doorOpen);
  useEffect(() => {
    const wasOpen = doorWasOpenRef.current;
    doorWasOpenRef.current = doorOpen;
    if (!doorOpen || wasOpen) return;
    if (!itemsRef.current.some((it) => it.status === "queued")) return;
    silentJoinSpentRef.current = false;
    void runQueueRef.current();
  }, [doorOpen]);

  const enqueue = useCallback(
    (
      files: File[],
      extra: Pick<QueueItem, "reelEligible" | "poster" | "takenAt"> = {},
    ) => {
      sync([
        ...itemsRef.current,
        ...files.map((file) => queueItem(file, extra)),
      ]);
      void runQueue();
    },
    [runQueue, sync],
  );

  const handleJoined = useCallback(
    (token: string) => {
      onSession(token);
      sessionRef.current = token; // runQueue (called below) sees it immediately
      const stashed = pendingFilesRef.current;
      pendingFilesRef.current = [];
      if (stashed.length) {
        sync([
          ...itemsRef.current,
          ...stashed.map(({ file, extra }) => queueItem(file, extra)),
        ]);
        void runQueue();
      }
      const clips = pendingClipsRef.current;
      pendingClipsRef.current = [];
      for (const clip of clips) {
        enqueue([clip.file], { reelEligible: false, poster: clip.poster });
      }
    },
    [onSession, enqueue, runQueue, sync],
  );

  /**
   * A FIRST ADD THAT ONLY THE DOOR CAN ANSWER: her picks (a clip included) join the queue as they are,
   * `queued`, never sent and never failed, and the door has her (`onDoorNeeded`). They go up on the ticket
   * the door hands down (`sessionToken`), or when it lets her through (`doorOpen`).
   */
  const holdPicksForDoor = useCallback(() => {
    const files = pendingFilesRef.current;
    const clips = pendingClipsRef.current;
    pendingFilesRef.current = [];
    pendingClipsRef.current = [];
    sync([
      ...itemsRef.current,
      ...files.map(({ file, extra }) => queueItem(file, extra)),
      ...clips.map((clip) =>
        queueItem(clip.file, { reelEligible: false, poster: clip.poster }),
      ),
    ]);
    onDoorNeeded?.();
  }, [onDoorNeeded, sync]);

  /**
   * ★ HER CHOICE AT THE HELD DOOR (`locked-door` r2, Will's `wait=pick`: "adds a lot of value to the
   * waiting door"): what she picked while the host decides, held here as `queued` and sent the moment the
   * door lets her through (the flip above), never before (the runner's door guard). A new choice replaces
   * the last one (her Change), so what is held is always exactly what the door shows her. A copy waits on
   * the device for a reload or a closed tab (`door/wait-picks-store.ts`, the door's own).
   */
  const holdAtDoor = useCallback(
    (files: File[]) => {
      sync([
        ...itemsRef.current.filter((it) => it.status !== "queued"),
        ...files.map((file) => queueItem(file)),
      ]);
    },
    [sync],
  );

  /**
   * THE SILENT JOIN, AND IT STAYS NAMELESS.
   *
   * This is the path for the two people who never meet the name door: a
   * SIGNED-IN guest (their profile name is the identity, and `create_guest`
   * nulls a typed name on a confirmed session anyway) and a guest whose device
   * already holds a session. A name-only guest reaches `joinEvent` through the
   * DOOR instead (`guest-name-step.tsx`), which is the only place the name is
   * typed. So no name is passed here, deliberately, and `joinEvent` exists so
   * both callers speak to the route through one shape.
   *
   * The JOIN's own failure toasts, and it is the only upload toast: nothing
   * was ever queued, so there is no failure sheet to carry it.
   *
   * ★ UNLESS THE DOOR CAN ANSWER IT (crumbs-29). A join refused `name_required`
   * means the page took this viewer for a confirmed account and the server does
   * not: a page rendered while a sign-out was still in flight skipped the name
   * step, and Send then toasted "Enter a name." over an upload step with no field
   * to type one in, until a reload. Her picks wait `queued` and the door has her,
   * as `acquireTicket` hands the same refusal over: the page re-reads who is
   * here, the door asks her name, and its join hands down the ticket they go on.
   */
  /* ★ ONE JOIN IN FLIGHT, AND IT TAKES EVERYTHING STASHED BEHIND IT (the camera's shots). A camera hands the queue a
     shot a press, so a signed-in guest's second shot can arrive while her first one's join is still out: that shot
     joins the stash, and the join that lands takes the whole stash, where a second join would mint a second ticket
     and a stash written over would lose the first shot. */
  const joiningRef = useRef(false);
  const joinSilently = useCallback(async () => {
    if (isDemo) {
      handleJoined("demo");
      return;
    }
    if (joiningRef.current) return;
    joiningRef.current = true;
    let joined: Awaited<ReturnType<typeof joinEvent>>;
    try {
      joined = await joinEvent({ qrToken });
    } finally {
      joiningRef.current = false;
    }
    if (!joined.ok) {
      if (joined.refusal.kind === "name_required") {
        holdPicksForDoor();
        return;
      }
      pendingFilesRef.current = [];
      pendingClipsRef.current = [];
      if (joined.refusal.kind === "verification_required") {
        // The host requires a confirmed email and this device cannot satisfy
        // it. The gate says that far better than a toast can. Nothing was ever
        // queued, so there is no failure sheet standing between here and the
        // gate: the refresh this raises is honest right away.
        onVerificationRequired?.(joined.refusal.message, false);
        return;
      }
      toast.error("Couldn't start uploading", {
        description: joined.refusal.message,
      });
      return;
    }
    if (joined.guest.admission === "waiting") {
      // ★ THE JOIN WAS THE ASK (see `takeJoin`): nothing runs on a ticket the door will refuse, and her
      // picks go up when she is let in.
      holdPicksForDoor();
      return;
    }
    handleJoined(joined.guest.sessionToken);
  }, [isDemo, qrToken, handleJoined, holdPicksForDoor, onVerificationRequired]);

  /**
   * Her files into the queue. `extra` rides each of them (`FileExtra`): a camera video's poster. Additive: every caller
   * before the camera hands files alone.
   */
  const addFiles = useCallback(
    (files: File[], extra: FileExtra = {}) => {
      // The owner needs no ticket to go (the head note); anyone else with one goes on it.
      if (ownerEventId || sessionRef.current) {
        enqueue(files, extra);
        return;
      }
      // No session yet → silent join (account-required events are gated at the page), the stash growing while it is out.
      pendingFilesRef.current = [
        ...pendingFilesRef.current,
        ...files.map((file) => ({ file, extra })),
      ];
      void joinSilently();
    },
    [enqueue, joinSilently, ownerEventId],
  );

  /**
   * ★ THE CLIP'S SEAM: `addClipToAlbum(file, poster)` for the on-device creator. The clip goes through
   * the ORDINARY queue, one at a time behind whatever else is going, with the same join, retry and
   * failure sheet as a photograph; the only differences are that its row is written
   * `reel_eligible = false` (the live reel never plays a reel) and that its album preview is the
   * poster the creator drew. A clip is a video, so `create_media`'s paid-only video gate decides
   * whether this album takes one; the creator reads the same fact (`ClipFacts`) first.
   */
  const addClip = useCallback(
    (file: File, poster: Blob) => {
      if (ownerEventId || sessionRef.current) {
        enqueue([file], { reelEligible: false, poster });
        return;
      }
      pendingClipsRef.current = [...pendingClipsRef.current, { file, poster }];
      void joinSilently();
    },
    [enqueue, joinSilently, ownerEventId],
  );

  /**
   * Reset an errored item and re-run the queue. A Retry is the guest's own
   * fresh try, so it also gives the silent join back (a network blip may be
   * what spent it). With no ticket on the device the run joins as the viewer
   * first (`acquireTicket`); "Retry all" lands here once per file, and the
   * runner's own guard keeps that to ONE join.
   *
   * ★ RETRY ALL IS ONE BURST (uploads-bursts). The sheet's Retry all calls this once a file, in one tick, and each
   * call ran the queue at once, which took its burst before the next file was queued: a dropped burst of five came
   * back as a burst of one and a burst of four, two completes where one would do. So each call queues its file and the
   * run is asked ONCE, after the tick's calls are all in (`runSoon`), and the files go back as the one burst they were.
   * A single Retry is the same act a tick on. The sheet still closes in that tick, and its `dismiss` finds every file
   * it retried already `queued` (its status gate).
   */
  const runSoonRef = useRef(false);
  const runSoon = useCallback(() => {
    if (runSoonRef.current) return;
    runSoonRef.current = true;
    queueMicrotask(() => {
      runSoonRef.current = false;
      void runQueueRef.current();
    });
  }, []);
  const retry = useCallback(
    (id: string) => {
      silentJoinSpentRef.current = false;
      patch(id, {
        status: "queued",
        progress: 0,
        error: undefined,
        errorCode: undefined,
        cause: undefined,
      });
      runSoon();
    },
    [patch, runSoon],
  );

  /**
   * ★ A LOST ANSWER IS ASKED AGAIN FOR HER (`use-upload-queue.heal.ts`): the files that failed as a dropped connection
   * with their complete kept (the row may stand: the album may already show the photograph) go again the way her Retry
   * sends them, which asks that very complete and nothing else, so a row the server wrote lands now and one it did not is
   * written. Not her Retry in one thing: it never gives the silent join back (`silentJoinSpentRef`), so a ticket that
   * keeps being refused can never turn this into a row factory. Nothing is asked of a demo, a door that holds her
   * (`doorOpenRef`) or a device with no ticket: the join is not this to make.
   */
  const healLost = useCallback(
    (ids: string[]) => {
      if (isDemo || !doorOpenRef.current) return;
      if (!(ownerEventId || sessionRef.current)) return;
      const lost = new Set(ids);
      sync(
        itemsRef.current.map((it) =>
          lost.has(it.id) && it.status === "error"
            ? {
                ...it,
                status: "queued" as const,
                progress: 0,
                error: undefined,
                errorCode: undefined,
                cause: undefined,
              }
            : it,
        ),
      );
      void runQueue();
    },
    [isDemo, ownerEventId, runQueue, sync],
  );
  useHealLostAnswers(items, healLost);

  /**
   * Drop the named ERRORED items from the queue for good (the failure sheet's
   * "Not now" and its own close): a dismissed failure is gone. Without this it
   * would sit in `items` forever: the sheet's own list is a live filter over
   * `items`, so the NEXT run's end would see the same old error still there
   * and reopen on it (refuse `notes.txt`, Not now, and a clean twelve-file run
   * would still end on "1 file did not go - notes.txt").
   * ★ Status-gated, not id-alone: `retryAll` re-queues each listed id (flips
   * it to "queued" via `patch`, synchronously through the `itemsRef` mirror)
   * and THEN closes the sheet, which is the same `dismiss` call reaching the
   * very ids it just retried. Checking the LIVE status here (not the status
   * implied by the id being on the list) means a retried item already reads
   * "queued" by the time this runs and survives; only an id still sitting at
   * "error" is actually dropped.
   */
  const dismiss = useCallback(
    (ids: readonly string[]) => {
      if (ids.length === 0) return;
      const dismissed = new Set(ids);
      sync(
        itemsRef.current.filter(
          (it) => !(dismissed.has(it.id) && it.status === "error"),
        ),
      );
    },
    [sync],
  );

  /**
   * ★ STOP ONE FILE (upload-cancel, E6): the album's x, asked of her already (`stop-upload.ts`). Resolves with the way to
   * send the file again once it is cancelled (it has left the queue, no failure and nothing counted), or null when it was
   * too late (its complete was asked, so it landed or failed as it would have: the album and the failure sheet say so).
   * A file in a burst is stopped through its own signal and its siblings carry on; one still waiting for a burst has
   * started nothing and simply leaves.
   *
   * ★ TOO LATE IS ANSWERED AT ONCE, NOT AT THE LANDING (red-team 54): the question her press answers is on screen until
   * `stop` resolves, so a late press that waited for the complete (4 s on one photo, 8 s on five) left it standing
   * unchanged and read as unheard. The complete is asked the moment a burst has nothing left to send (the uploader's
   * `sendDone`: every file of it up), after which an abort is ignored and its answer stands, so a file whose bytes are up
   * with no sibling still going is past stopping and says so now, aborting nothing (the file lands exactly as it would
   * have). A file whose bytes are up while a sibling still goes only waits for it (`BURST_RECORD_WAIT_MS`): nothing is
   * asked yet, so the stop still takes it back.
   */
  const stop = useCallback(
    (id: string): Promise<StopResult> => {
      const it = itemsRef.current.find((q) => q.id === id);
      if (!it || !isActive(it)) return Promise.resolve(null);
      /** As a Retry does: her own fresh try, so the silent join is given back too. */
      const again: StopResult = () => {
        silentJoinSpentRef.current = false;
        enqueue([it.file], {
          reelEligible: it.reelEligible,
          poster: it.poster,
          takenAt: it.takenAt,
        });
      };
      const own = stopsRef.current.get(id);
      if (!own) {
        sync(itemsRef.current.filter((q) => q.id !== id));
        return Promise.resolve(again);
      }
      // Every file of its burst not yet told holds a stop of its own, so these are its burst still in play: all of
      // them up (`queued` at 100, which `onSent` sets) is the uploader's `sendDone`, its complete asked, being asked,
      // or waiting only for the last burst's answer (`recordAfter`). Its OWN burst's: the next one going on its bytes
      // (`Flight`) takes nothing back for it.
      const inPlay = itemsRef.current.filter(
        (q) => own.burst.includes(q.id) && stopsRef.current.has(q.id),
      );
      if (inPlay.every((q) => q.status === "queued" && q.progress === 100))
        return Promise.resolve(null);
      return new Promise<StopResult>((resolve) => {
        asksRef.current.set(id, (cancelled) =>
          resolve(cancelled ? again : null),
        );
        own.stop.abort();
      });
    },
    [enqueue, sync],
  );

  // The store the album's stack reads carries this stop (`QueueProgress.stop`): always the live one.
  useEffect(() => {
    progress.bindStop(stop);
  }, [progress, stop]);

  return {
    items,
    progress: progress as QueueProgress,
    addFiles,
    addClip,
    holdAtDoor,
    retry,
    dismiss,
    stop,
  };
}
