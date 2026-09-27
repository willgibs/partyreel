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
 *   - HER OWN ROWS, READ ON DEMAND (`/api/guests/mine` with `statuses`: once at mount and again
 *     each time she opens the list): the only place a refusal can be learned, because the album's
 *     sync moves only in and out of `approved`, by design (`album_max`: a guest never learns how
 *     busy moderation is). It also brings back what an earlier visit sent.
 *
 * ★ A PHOTOGRAPH SHE REMOVED HERSELF IS NOT LISTED: it is hers to forget.
 */

export type TrackerStatus = "sending" | "waiting" | "approved" | "refused";

/**
 * ★ WHETHER HER TRACKER TELLS HER A PHOTOGRAPH WAS REFUSED: the one line that carries the answer to
 * `host-curation`'s open `told` ask ("Should a guest whose photograph was refused ever be told?"),
 * whose recommended answer, `line`, is exactly this tracker's "Not in the album". `false` puts back
 * `never`, as wired before the tracker: her own rows read never say refused (the route drops them),
 * and a held photograph she sent this visit keeps waiting until the visit ends.
 */
export const TRACKER_TELLS_REFUSAL = true;

/** The words each status wears. "Waiting for the host" is the album's own waiting tile's line, so
 *  one state has one name on the page; "Not in the album" is `host-curation`'s `told=line`. */
export const TRACKER_WORDS: Record<TrackerStatus, string> = {
  sending: "Sending…",
  waiting: "Waiting for the host",
  approved: "In the album",
  refused: "Not in the album",
};

/** Where one of her rows stands on the server (the wire of `/api/guests/mine`'s `statuses`). */
export type OwnUploadWire = {
  id: string;
  status: "pending" | "approved" | "refused";
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
}): TrackerRow[] {
  const { queue, own, album, approvedOnce, removed } = input;
  const server = new Map((own ?? []).map((o) => [o.id, o.status]));
  const rows: TrackerRow[] = [];
  const seen = new Set<string>();

  const statusOf = (
    id: string,
    fallback: OwnUploadWire["status"] | null,
  ): TrackerStatus => {
    // The album is live and her rows' read is a moment old: an id in the album is in it.
    if (album.has(id)) return "approved";
    const said = server.get(id) ?? fallback;
    // Refused on her row, or in the album once and gone from it while still hers.
    if (said === "refused" || approvedOnce.has(id)) return "refused";
    if (said === "approved") return "approved";
    return "waiting";
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
      status: statusOf(id, fallback),
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
      status: statusOf(o.id, o.status),
    });
  }
  // `never` (see the flag): a refusal is not hers to learn, so it is not listed at all.
  return TRACKER_TELLS_REFUSAL
    ? rows
    : rows.filter((row) => row.status !== "refused");
}

/** The badge's number: her photographs waiting for the host (number only, never "sending"). */
export function waitingCount(rows: readonly TrackerRow[]): number {
  return rows.filter((r) => r.status === "waiting").length;
}

/**
 * Whether the tracker shows at all: only where she has something sent at a MODERATED event
 * (everywhere else a sent photograph is simply in the album, and the album already says so), never
 * in the demo (nothing it sends is kept) and never for the host (whose own uploads never wait).
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
