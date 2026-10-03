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
 * The words each status wears (`voice-guest` r2, Will's `status=approval`: "A bit more clear, I
 * don't think anyone's feelings will be hurt by direct wording here since it offers clarity").
 * Both name the review she read about when she sent them ("The host reviews uploads before they
 * appear in the album."), so the why is the event's rule rather than a person's choice.
 *
 * ★ ONE STATE, ONE NAME, EVERYWHERE IT IS SAID: the badge's spoken count, the keep's Sent line on
 * a held event (`save-account-prompt.tsx`), the help and the album feature page's mock
 * (`review-switch.tsx`, pinned by `mock-parity.test.ts`) all say "waiting for approval".
 */
export const TRACKER_WORDS: Record<TrackerStatus, string> = {
  sending: "Sending…",
  waiting: "Waiting for approval",
  approved: "In the album",
  refused: "Not approved",
};

/**
 * The words a SEALED one wears (red-team 43): on an album with a develop time ahead, what she adds is in nobody's album
 * until it develops, so hers wait for that, never for a host. One state, one name: her row, the badge's spoken count
 * and the keep's Sent line (`save-account-prompt.tsx`) all say it.
 */
export const TRACKER_SEALED_WORDS = "Waiting to develop";

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

// The develop time as a guest reads it, in her own zone (a sheet draws it, after hydration), in the product's
// pinned language: the host's Settings says it the same way ("Develops Sat, Oct 3, 9:00 AM.").
const DEVELOPS_AT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** "Sat, Oct 3, 9:00 AM", or null for a time it cannot read. */
export function developTimeWords(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isFinite(at.getTime()) ? DEVELOPS_AT.format(at) : null;
}

/** Where one of her rows stands on the server (the wire of `/api/guests/mine`'s `statuses`). */
export type OwnUploadWire = {
  id: string;
  status: "pending" | "approved" | "refused";
  /** Approved and sealed until the album develops: in nobody's album yet, hers included. */
  sealed?: boolean;
};

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
    const fallback =
      item.mediaStatus === "approved"
        ? "approved"
        : item.mediaStatus === "pending"
          ? "pending"
          : null;
    rows.push({
      key: id,
      mediaId: id,
      queueId: item.id,
      kind: item.kind,
      ...placeOf(id, fallback, sealing),
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
 * (`moderated`: `uploadsWait`'s `waits`, the host's approval or a develop ahead; everywhere else a sent photograph is
 * simply in the album, and the album already says so), never in the demo (nothing it sends is kept) and never for
 * the host (whose own uploads never wait).
 */
export function trackerShows(input: {
  moderated: boolean;
  isDemo: boolean;
  isOwner: boolean;
  rows: readonly TrackerRow[];
}): boolean {
  return (
    input.moderated && !input.isDemo && !input.isOwner && input.rows.length > 0
  );
}
