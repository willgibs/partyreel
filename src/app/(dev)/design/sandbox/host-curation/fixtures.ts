import type { GridMedia } from "@/components/app/media-grid";

import {
  BIN_ITEMS,
  EVENT,
  GALLERY_ITEMS,
  HOST_EVENT,
  REVIEW_ITEMS,
  UPLOADS_ITEMS,
} from "../gallery-fixtures";

/**
 * THE STAND-IN CONTENT for `host-curation`. The four pools are
 * `sandbox/gallery-fixtures.ts`'s, reused VERBATIM (the manifest; that module
 * held `app-vocabulary`'s fixtures until that board retired at its wiring
 * and `controls-home-wiring` lifted them out to a plain, board-less file so
 * host-curation's fixtures kept working): one wedding, one host event row,
 * the same seven pending uploads, the same eighteen-tile album and the same
 * bin, so two boards on the same desk never argue about what a queue looks
 * like. Every still is one of the fourteen bootstrap images every other
 * board reuses — no new asset and no rights to track (Will, 2026-09-17/18).
 *
 * What is added here is what this round's act needs and no other board has:
 * a SECOND batch that lands mid-visit, an album with three tiles really hidden,
 * the one upload the peek credits on the identity model, and the guest's own
 * feed without the host's like counts. `EVENTS`/`BELL`/`PENDING_TOTAL`, built
 * for the dashboard's three-events count comparison, left with `count` (the
 * desk re-cut): reel-host's merged `review` question carries that ground now.
 */
export {
  BIN_ITEMS,
  EVENT,
  GALLERY_ITEMS,
  HOST_EVENT,
  REVIEW_ITEMS,
  UPLOADS_ITEMS,
};

/** The queue as the host finds it: seven waiting, one of them a video. */
export const QUEUE: GridMedia[] = REVIEW_ITEMS;

/**
 * THREE MORE, LANDED MID-VISIT. A guest at the party uploads while the host is
 * halfway down the queue. Today nothing on the host's page is polling, so these
 * rows exist in the database and on no screen the host is looking at; the
 * `arrivals` decision is what the queue does with them.
 */
export const JUST_LANDED: GridMedia[] = [10, 11, 12].map((i) => ({
  ...GALLERY_ITEMS[i],
  id: `landed-${i}`,
  status: "pending" as const,
  likeCount: undefined,
  createdAt: "2026-08-15T21:14:00.000Z",
}));

/**
 * THE ALBUM WITH THREE HIDDEN TILES. `hidden` is the state the review "Hide"
 * lands in, so the word being judged has to be readable in BOTH places at once:
 * the queue's button, and what that button produced sitting in the album at 30
 * percent under a persistent amber Show.
 */
export const ALBUM_WITH_HIDDEN: GridMedia[] = GALLERY_ITEMS.map((m, i) =>
  i === 2 || i === 5 || i === 9 ? { ...m, status: "hidden" as const } : m,
);

/**
 * This guest's own cross-event feed, with one of hers refused by the host.
 *
 * ★ NO LIKE COUNTS. `likeCount` is host-only by construction (the host's own
 * gallery is the one surface that reads them) and the shared pool carries them
 * for the host's views, so the guest's own feed drops them here, as the shipped
 * Uploads feed never receives them (`get_my_uploads` carries none).
 */
export const MY_UPLOADS: GridMedia[] = UPLOADS_ITEMS.map((m, i) => ({
  ...m,
  likeCount: undefined,
  ...(i === 1 ? { status: "hidden" as const } : {}),
}));

/**
 * THE UPLOAD A HOST PEEKS AT, on the identity model: a guest's (a host's own
 * upload never waits in Review), who typed a name at the door and confirmed
 * nothing, so the credit is her name and the Unverified mark and the host sees
 * no address. The shared pool's matching entry is a nameless legacy row, which
 * no door mints any more; the peek is the one place on this board a name is
 * read, so the name is given here rather than in the shared pool.
 */
const PEEKED_AT = 3;
export const PEEKED: GridMedia = {
  ...QUEUE[PEEKED_AT],
  uploaderName: "Nina",
  isHost: false,
  isVerified: false,
  uploaderEmail: null,
};

/** Where the peeked upload sits in the queue, in the words the viewer's counter uses. */
export const PEEKED_POSITION = `${PEEKED_AT + 1} of ${QUEUE.length}`;
