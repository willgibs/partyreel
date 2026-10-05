/**
 * HER TRACKER, AS DATA (`guest-capture` r1, Will's `tracker=button`: a round button beside Add
 * photos opens her own batch, each row with its status, and "the button could have a little status
 * icon (like notification buttons tend to in nav) to display the item count (number only) of
 * pending items").
 *
 * Pure, so every rule is a unit test: which of her uploads are listed, where each stands, what the
 * badge counts, and where the tracker shows at all. `upload-tracker.tsx` draws it.
 *
 * ★ THREE SOURCES, EACH THE TRUTH FOR WHAT IT CAN SEE, AND NO NEW POLL:
 *   - THIS VISIT'S QUEUE, live: a file in the air is `sending`; a finished one is what the server
 *     answered at completion (`approved`, or `pending` on an event that holds uploads).
 *   - THE ALBUM'S SYNC, live (the manifest's ids): a held photograph the host approves turns up in
 *     the album, so the doorbell and the poll the album already runs carry every approval to her.
 *     And an approved one that LEAVES the album while still hers was taken down by somebody else.
 *   - HER OWN ROWS, READ ON DEMAND (`/api/guests/mine` with `statuses`: once at mount, again
 *     each time she opens the list, and again when one of hers arrives in the album): the only
 *     place a refusal can be learned, because the album's sync moves only in and out of
 *     `approved`, by design (`album_max`: a guest never learns how busy moderation is). It also
 *     brings back what an earlier visit sent.
 *
 * ★ A PHOTOGRAPH SHE REMOVED HERSELF IS NOT LISTED: it is hers to forget.
 */

import type { HerShot } from "@/lib/disposable/contact-sheet";
import { developState } from "@/lib/disposable/reveal";

export type TrackerStatus = "sending" | "waiting" | "approved" | "refused";

/**
 * ★ WHETHER HER TRACKER TELLS HER A PHOTOGRAPH WAS REFUSED: the one line that carries
 * `host-curation`'s `told=line` (a guest whose photograph was refused is told, in her own list and
 * nowhere else), worded by `voice-guest` r2's `status=approval` ("Not approved"). `false` puts back
 * `never`, as wired before the tracker: her own rows read never say refused (the route drops them),
 * and a held photograph she sent this visit keeps waiting until the visit ends.
 */
export const TRACKER_TELLS_REFUSAL = true;

/**
 * The words each status wears. ★ EVERY WAIT IS "DEVELOPING" (the-wait r1, Will's `model=time`: "one question of time
 * where there's only a small distinction between disposable and reviewed"): one held for the host and one sealed for a
 * develop time wear the same word, and only the album's clock says which (`lib/disposable/wait-words.ts`, her list's
 * head). A refusal keeps its own plain word (`voice-guest` r2, Will's `status=approval`: "A bit more clear, I don't
 * think anyone's feelings will be hurt by direct wording here since it offers clarity"), since approval reading as
 * developing must never make a photo turned down read as one still developing.
 *
 * ★ ONE STATE, ONE NAME, EVERYWHERE IT IS SAID: her rows, the badge's spoken count, the album's contact sheet
 * (`WAIT_TITLE`), the camera's own list of her shots (`SHOT_WORDS`) and the album feature page's mock (`review-switch.tsx`,
 * pinned by `mock-parity.test.ts`) all say "Developing".
 */
export const TRACKER_WORDS: Record<TrackerStatus, string> = {
  sending: "Sending…",
  waiting: "Developing",
  approved: "In the album",
  refused: "Not approved",
};

/**
 * The word a SEALED one wears (red-team 43: on an album with a develop time ahead, what she adds is in nobody's album
 * until it develops): the same "Developing" as a held one (`model=time`), kept as its own name because the camera's
 * list reads it (`SHOT_WORDS.sealed`).
 */
export const TRACKER_SEALED_WORDS = TRACKER_WORDS.waiting;

/**
 * ★ WHETHER WHAT SHE ADDS WAITS, AND FOR WHAT (red-team 43's MEDIUM: on an album with a develop time ahead, her
 * shots showed as joined and then vanished, because the page read "delayed" as the host's approval alone). It waits
 * for the host's approval (`moderation_mode`), or for the album's develop time while it is ahead (`developState`,
 * the foundation's one reading of `develops_at`: a time reached has developed, and what is added shows at once).
 * Either way nothing of hers stands in the album yet: her tracker is where it shows, and the keep never says it
 * joined. `developsAt` is the develop time while it is ahead, the stronger promise and the one said, else null.
 * Read once by the page's server, on the album's own clock, and handed down.
 */
export type UploadsWait = { waits: boolean; developsAt: string | null };

export function uploadsWait(
  event: { moderation_mode: string; develops_at?: string | null },
  nowMs: number = Date.now(),
): UploadsWait {
  const develop = developState(event.develops_at ?? null, nowMs);
  const developsAt = develop.kind === "waiting" ? develop.developsAt : null;
  return {
    waits: event.moderation_mode === "hold_for_approval" || developsAt !== null,
    developsAt,
  };
}

/** Nothing she adds waits: it is in the album the moment it lands. */
export const NOTHING_WAITS: UploadsWait = { waits: false, developsAt: null };

/** Where one of her rows stands on the server (the wire of `/api/guests/mine`'s `statuses`). */
export type OwnUploadWire = {
  id: string;
  status: "pending" | "approved" | "refused";
  /** Approved and sealed until the album develops: in nobody's album yet, hers included. */
  sealed?: boolean;
  /**
   * Her own picture of one the album cannot show her yet (held or sealed), presigned for her alone, and when she took it
   * (epoch ms): her list draws it, and the album's contact sheet lights her square at its minute.
   */
  picture?: { type: "photo" | "video"; at: number; tile: string };
};

/** One of her rows off the wire, read defensively (it crosses a process boundary): a malformed picture is dropped. */
export function ownUploadOf(value: unknown): OwnUploadWire | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string") return null;
  if (
    o.status !== "pending" &&
    o.status !== "approved" &&
    o.status !== "refused"
  )
    return null;
  const p =
    o.picture && typeof o.picture === "object"
      ? (o.picture as Record<string, unknown>)
      : null;
  const type: "photo" | "video" | null =
    p?.type === "photo" ? "photo" : p?.type === "video" ? "video" : null;
  const picture =
    p && type && typeof p.tile === "string" && typeof p.at === "number"
      ? { type, at: p.at, tile: p.tile }
      : null;
  return {
    id: o.id,
    status: o.status,
    ...(o.sealed === true ? { sealed: true } : {}),
    ...(picture ? { picture } : {}),
  };
}

/** The slice of a queue item the tracker reads. */
export type TrackerQueueItem = {
  id: string;
  status: "queued" | "uploading" | "done" | "error";
  kind: "photo" | "video";
  mediaStatus?: string;
  mediaId?: string;
};

export type TrackerRow = {
  /** Stable across the row's life: the media id once it has one, else the queue id. */
  key: string;
  mediaId: string | null;
  /** The queue item this row came from this visit (its local picture), or null. */
  queueId: string | null;
  kind: "photo" | "video" | null;
  status: TrackerStatus;
  /** Waiting for the album to develop, never for the host (`TRACKER_SEALED_WORDS`). */
  sealed?: true;
};

/**
 * Her batch, newest first: this visit's files (newest sent first), then what her own rows say about
 * anything else of hers. `album` is the manifest's ids now (live); `approvedOnce` the ids of hers
 * this device has seen in the album (so one that left it while still hers is known to have been
 * taken down); `removed` the ids she removed herself this visit.
 */
export function buildTrackerRows(input: {
  queue: readonly TrackerQueueItem[];
  own: readonly OwnUploadWire[] | null;
  album: ReadonlySet<string>;
  approvedOnce: ReadonlySet<string>;
  removed: ReadonlySet<string>;
  /**
   * The album seals what is added until it develops (a develop time ahead, `uploadsWait`): one of this visit's
   * files the server answered `approved` is sealed until then, before her rows' next read says so.
   */
  sealing?: boolean;
}): TrackerRow[] {
  const { queue, own, album, approvedOnce, removed, sealing = false } = input;
  const server = new Map((own ?? []).map((o) => [o.id, o]));
  const rows: TrackerRow[] = [];
  const seen = new Set<string>();

  const placeOf = (
    id: string,
    fallback: OwnUploadWire["status"] | null,
    sealedHere: boolean,
  ): Pick<TrackerRow, "status" | "sealed"> => {
    // The album is live and her rows' read is a moment old: an id in the album is in it.
    if (album.has(id)) return { status: "approved" };
    const wire = server.get(id);
    const said = wire?.status ?? fallback;
    // Refused on her row, or in the album once and gone from it while still hers.
    if (said === "refused" || approvedOnce.has(id))
      return { status: "refused" };
    // ★ APPROVED AND SEALED IS NOT IN THE ALBUM: it waits for the develop (her rows' read says so, or this visit's
    // file on an album that seals what is added), and is hers to take back like anything waiting.
    if (said === "approved" && (wire ? wire.sealed === true : sealedHere)) {
      return { status: "waiting", sealed: true };
    }
    if (said === "approved") return { status: "approved" };
    return { status: "waiting" };
  };

  for (let i = queue.length - 1; i >= 0; i--) {
    const item = queue[i];
    if (item.status === "error") continue; // the failure sheet's, never the tracker's
    if (item.status === "queued" || item.status === "uploading") {
      rows.push({
        key: item.id,
        mediaId: null,
        queueId: item.id,
        kind: item.kind,
        status: "sending",
      });
      continue;
    }
    const id = item.mediaId;
    if (!id || removed.has(id)) continue;
    seen.add(id);
    // A landing the queue told `sealed` (the server's own answer, `landedAs`) is approved and sealed, whatever the
    // page read of the album: it waits for the develop until her rows' next read says otherwise.
    const sealedLanding = item.mediaStatus === "sealed";
    const fallback =
      item.mediaStatus === "approved" || sealedLanding
        ? "approved"
        : item.mediaStatus === "pending"
          ? "pending"
          : null;
    rows.push({
      key: id,
      mediaId: id,
      queueId: item.id,
      kind: item.kind,
      ...placeOf(id, fallback, sealing || sealedLanding),
    });
  }

  for (const o of own ?? []) {
    if (seen.has(o.id) || removed.has(o.id)) continue;
    seen.add(o.id);
    rows.push({
      key: o.id,
      mediaId: o.id,
      queueId: null,
      kind: null,
      ...placeOf(o.id, o.status, false),
    });
  }
  // `never` (see the flag): a refusal is not hers to learn, so it is not listed at all.
  return TRACKER_TELLS_REFUSAL
    ? rows
    : rows.filter((row) => row.status !== "refused");
}

/**
 * HERS THE ALBUM HOLDS THAT THIS DEVICE HAD NOT SEEN THERE YET (`approvedOnce` grows by `ids`), and
 * whether any of them ARRIVED out of waiting (held when it finished sending, or pending on her rows
 * when they were read).
 *
 * ★ AN ARRIVAL RE-READS HER ROWS (`voice-guest` r2's carried call `refusal-read`, under
 * `held=uploads`): a host decides a pick in one go, so the moment one of hers is let in is the
 * moment to learn the one left out beside it, and the badge stops counting it without her opening
 * the list. No new poll: the album's own sync is what brings the arrival.
 */
export function newlyInAlbum(input: {
  queue: readonly TrackerQueueItem[];
  own: readonly OwnUploadWire[] | null;
  album: ReadonlySet<string>;
  approvedOnce: ReadonlySet<string>;
}): { ids: string[]; arrived: boolean } {
  const { queue, own, album, approvedOnce } = input;
  const ids: string[] = [];
  let arrived = false;
  const take = (id: string, waiting: boolean) => {
    if (!album.has(id) || approvedOnce.has(id) || ids.includes(id)) return;
    ids.push(id);
    if (waiting) arrived = true;
  };
  for (const item of queue) {
    if (item.mediaId) take(item.mediaId, item.mediaStatus === "pending");
  }
  // A sealed one turning up in the album has developed: out of waiting, like an approval.
  for (const o of own ?? [])
    take(o.id, o.status === "pending" || o.sealed === true);
  return { ids, arrived };
}

/** The badge's number: her photographs waiting, for approval or the develop (number only, never "sending"). */
export function waitingCount(rows: readonly TrackerRow[]): number {
  return rows.filter((r) => r.status === "waiting").length;
}

/**
 * Whether the tracker shows at all: only where she has something sent at an event where what she adds waits
 * (`waits`: the wait as it falls on THIS viewer, the page's `addsWaitFor` over `uploadsWait`: a guest's is the host's
 * approval or a develop ahead, the host's own only a develop ahead, since hers ride her own pair, approved; everywhere
 * else a sent photograph is simply in the album, and the album already says so), and never in the demo (nothing it
 * sends is kept, and its wait reads none).
 *
 * ★ THE HOST SEES HERS HERE TOO WHERE A DEVELOP KEEPS THEM BACK (crumbs-76): on her own guest page a develop album
 * draws nothing of what she adds, in the air or landed (the head's stack and the album both leave out what waits), so
 * with no tracker she saw nothing of hers there while her hub shows every one. She is the one viewer whose rows are
 * this visit's alone (her uploads are no guest's rows, so there is no read of them to bring an earlier visit back).
 */
export function trackerShows(input: {
  waits: boolean;
  isDemo: boolean;
  rows: readonly TrackerRow[];
}): boolean {
  return input.waits && !input.isDemo && input.rows.length > 0;
}

/**
 * HER WAITING SHOTS, FOR THE ALBUM'S CONTACT SHEET (the-wait r1, `wait=sheet`): each of hers that waits or is on its way,
 * with its picture (this device's own file while it has one, else the tile her rows' read presigned for her alone) and
 * when she took it (her rows' read; null for this visit's landing until they are read again). Never another guest's:
 * these are her own rows and her own queue.
 */
export function herShotsOf(input: {
  rows: readonly TrackerRow[];
  own: readonly OwnUploadWire[] | null;
  /** This device's own picture of a queue item, while the page holds it. */
  localUrl: (queueId: string) => string | undefined;
}): HerShot[] {
  const ownById = new Map((input.own ?? []).map((o) => [o.id, o]));
  const out: HerShot[] = [];
  for (const row of input.rows) {
    if (row.status !== "waiting" && row.status !== "sending") continue;
    const wire = row.mediaId ? ownById.get(row.mediaId) : undefined;
    const local = row.queueId ? input.localUrl(row.queueId) : undefined;
    out.push({
      key: row.mediaId ?? row.key,
      at: wire?.picture?.at ?? null,
      src: local ?? wire?.picture?.tile ?? null,
      video: row.kind === "video" || wire?.picture?.type === "video",
      sending: row.status === "sending",
    });
  }
  return out;
}
