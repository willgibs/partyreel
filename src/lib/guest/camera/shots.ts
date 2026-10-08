/**
 * THE CAMERA'S SHOTS THIS VISIT, AND WHERE EACH STANDS: read off the page's one queue, never kept beside it.
 *
 * A shot is a File the camera made and handed to the queue (`addFiles`), so its status is the queue item holding that
 * very File (`item.file === shot.file`): the queue replaces an item on every change, and the File is the one thing
 * that travels unchanged from the shutter to the server. Before the File exists (the frame still encoding) the shot is
 * `taking`; before the queue holds it (a first shot's silent join) it is `sending`.
 *
 * ★ A SHOT WAITING FOR THE LINE IS STILL ON ITS WAY (no-signal r1, Will's `roll=taken`): its send dropped and it stands
 * by, `queued` (the queue's `waitsForLine`), so it is `sending` with `waiting` set, never `failed`, and it stays counted:
 * the shutter spent its frame the moment she pressed, sent or not, like film.
 *
 * ★ WHAT A REFUSAL MEANS TO A CAMERA (`refusalOf`): the roll's own words end the roll (`roll`), a refusal of the
 * album itself (closed, full, private, a confirmed email asked for) stops the shutter in the server's words
 * (`blocked`), a refusal of the file is that shot's alone (`file`), and anything else is a send that may go again
 * (`retry`: a dropped connection, a failed completion).
 *
 * Pure, so every rule is a unit test.
 */
import { waitsForLine } from "@/lib/guest/unsent/standby";
import type { QueueItem } from "@/lib/guest/use-upload-queue";

export type ShotKind = "photo" | "video";

/** A shot this visit's camera took. `file` is null while its frame is still being encoded. */
export type CameraShot = {
  key: string;
  kind: ShotKind;
  /** When the shutter fired (epoch ms): its minute on the reel, and its place against the roll's last read. */
  takenAt: number;
  /** A video's length in seconds, as the recorder measured it. */
  seconds?: number;
  file: File | null;
  /** A small picture of the shot (the frame the shutter caught), for her list. */
  thumb?: Blob;
  /** When she last sent it again (the camera's Retry): a shot sent again is counted again from then. */
  retriedAt?: number;
};

export type ShotStatus =
  /** Its frame is still being encoded. */
  | "taking"
  /** Queued or going up. */
  | "sending"
  /** In the album. */
  | "in"
  /** Landed, sealed until the album develops. */
  | "sealed"
  /** Landed, held for the host. */
  | "held"
  /** Refused, or the send failed. */
  | "failed";

export type ShotState = {
  status: ShotStatus;
  queueId?: string;
  mediaId?: string;
  error?: string;
  code?: string;
  /** Why the transport ended it (`QueueItem.cause`): `dropped` is the connection, which the camera says in its own line. */
  cause?: QueueItem["cause"];
  /** On its way and standing by for the line (`waitsForLine`): the reel's half-lit frame, her list's "Waiting…". */
  waiting?: true;
};

export function shotState(
  shot: Pick<CameraShot, "file">,
  queue: readonly QueueItem[],
): ShotState {
  if (!shot.file) return { status: "taking" };
  const item = queue.find((it) => it.file === shot.file);
  if (!item) return { status: "sending" };
  if (item.status === "queued" || item.status === "uploading") {
    return waitsForLine(item)
      ? { status: "sending", queueId: item.id, waiting: true }
      : { status: "sending", queueId: item.id };
  }
  if (item.status === "error") {
    return {
      status: "failed",
      queueId: item.id,
      error: item.error,
      code: item.errorCode,
      cause: item.cause,
    };
  }
  return {
    status:
      item.mediaStatus === "sealed"
        ? "sealed"
        : item.mediaStatus === "pending"
          ? "held"
          : "in",
    queueId: item.id,
    mediaId: item.mediaId,
  };
}

/** Whether a shot is still on its way (its frame encoding, or its bytes going). */
export function inFlight(state: ShotState): boolean {
  return state.status === "taking" || state.status === "sending";
}

/** What a refused shot means to the camera (the head note). */
export type RefusalKind = "roll" | "blocked" | "file" | "retry";

const BLOCKING = new Set([
  "uploads_closed",
  "cap_reached",
  "event_gone",
  "event_deleted",
  "unlock_required",
  "unauthorized",
  "verification_required",
  "invalid_session",
  "session_other_account",
]);

const THE_FILE = new Set([
  "video_not_allowed",
  "unsupported_type",
  "invalid_file",
  "invalid_image",
  "invalid_media",
  "too_large",
  "too_long",
]);

export function refusalOf(code: string | undefined | null): RefusalKind {
  if (code === "roll_spent") return "roll";
  if (code && BLOCKING.has(code)) return "blocked";
  if (code && THE_FILE.has(code)) return "file";
  return "retry";
}

/**
 * How many of this camera's shots the roll's last read could not have counted: taken since it began, and not
 * refused. (A read only begins while nothing is in the air, so an older shot was counted or refused.) ★ A SHOT WAITING
 * FOR THE LINE COUNTS (`roll=taken`): it is on its way, never refused, so its frame is spent from the press.
 */
export function pendingSince(
  shots: readonly { shot: CameraShot; state: ShotState }[],
  readFrom: number,
): number {
  return shots.filter(
    ({ shot, state }) =>
      (shot.retriedAt ?? shot.takenAt) >= readFrom && state.status !== "failed",
  ).length;
}
