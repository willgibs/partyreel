import type { BinMedia } from "@/components/app/recently-deleted-grid";
import type { GridMedia } from "@/components/app/media-grid";
import type { HostEvent } from "@/lib/db/queries/events";
import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * ONE STAND-IN EVENT, AND ITS FOUR MEDIA POOLS (the gallery, the review
 * queue, the bin, the cross-event Uploads feed), shared by every board that
 * needs a believable album rather than its own invented one.
 *
 * ★ NOT A BOARD. This is a plain file directly under `sandbox/`, never a
 * directory with a `spec.ts` (`registry.test.ts`'s own scan only requires
 * registration for a directory that has one), so no board owns its
 * lifecycle: it outlives any one board's ruling. Extracted from
 * `app-vocabulary/fixtures.ts` when that board retired at its wiring
 * (`controls-home-wiring`, `app-vocabulary` r2, 2026-09-20) — `host-curation`
 * was already reusing these six pools verbatim, so the board's own
 * retirement (its directory going with it, `registry.ts`'s own rule) would
 * otherwise have taken host-curation's fixtures down with it.
 *
 * Every image is one of the fourteen bootstrap stills every other board
 * already reuses (`MARKETING_IMAGES`) — no new asset, no rights to track
 * (Will, 2026-09-17/18). A tile's declared width/height is free to vary from
 * the still's own pixels (`MediaTile` is `object-cover`), so the masonry
 * gets the natural mix of shapes a real album has without needing eighteen
 * different source photographs.
 *
 * ★ COPY IS PLACEHOLDER, JUDGED FOR SIZE AND WRAPPING ONLY: the event name
 * and description run to the length a real one does, so a caption or a
 * header wraps the way it will in production.
 */

export const EVENT = {
  name: "Mia & Theo's Wedding",
  host: "Mia Calder",
  date: "2026-08-15",
  guests: 34,
  photos: 214,
  description:
    "Everything from the day, in one place. Add whatever you took, whenever you get to it, and we'll keep adding ours. There's no app to install and nothing to sign up for.",
} as const;

/** The full DB row `UploadsSection` reads (`HostEvent`), for a REAL `FormProvider`
 *  rather than a copy of its markup — the confirm-switch decision wraps the
 *  shipped component byte for byte. Values mirror the schema's own defaults
 *  (`validation/event.ts`) so the fixture can never drift from what a real row
 *  looks like. */
export const HOST_EVENT: HostEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  host_id: "22222222-2222-4222-8222-222222222222",
  name: EVENT.name,
  description: EVENT.description,
  event_date: EVENT.date,
  visibility: "open",
  accepting_uploads: true,
  allow_anonymous_uploads: false,
  require_verified_email: true, // the identity reshape's twin (the legacy flag's opposite), patched at wave 0's merge
  max_upload_bytes: null,
  moderation_mode: "hold_for_approval",
  qr_style: "classic",
  custom_slug: null,
  deleted_at: null,
  purge_at: null,
  qr_token: "33333333333333333333333333333333",
  show_guest_list: true,
  display_in_profile: true,
  created_at: "2026-08-01T12:00:00.000Z",
  updated_at: "2026-09-18T12:00:00.000Z",
  has_password: false,
};

/** width/height pairs the gallery cycles through, so the masonry mixes
 *  portrait, square and landscape the way a real party album does. */
const RATIOS: readonly [number, number][] = [
  [4, 5],
  [1, 1],
  [3, 4],
  [4, 3],
  [16, 10],
  [3, 2],
  [2, 3],
  [5, 4],
  [1, 1],
  [4, 5],
];

const UPLOADERS = [
  { key: "host", name: "Mia Calder", isHost: true, isAnonymous: false },
  { key: "g1", name: "Ruby N.", isHost: false, isAnonymous: false },
  { key: "g2", name: null, isHost: false, isAnonymous: true },
  { key: "g3", name: "Theo Calder", isHost: false, isAnonymous: false },
] as const;

function media(
  i: number,
  overrides: Partial<GridMedia> = {},
): GridMedia {
  const img = MARKETING_IMAGES[i % MARKETING_IMAGES.length];
  const [w, h] = RATIOS[i % RATIOS.length];
  const uploader = UPLOADERS[i % UPLOADERS.length];
  return {
    id: `media-${i}`,
    type: "photo",
    url: img.src,
    previewUrl: img.src,
    downloadUrl: img.src,
    status: "approved",
    width: w,
    height: h,
    uploaderName: uploader.name,
    isHost: uploader.isHost,
    isAnonymous: uploader.isAnonymous,
    likeCount: i % 5 === 0 ? 3 : i % 3 === 0 ? 1 : 0,
    createdAt: "2026-08-15T18:00:00.000Z",
    uploaderKey: uploader.key,
    ...overrides,
  };
}

/** The event page's Gallery / the guest album: approved, mixed uploaders. */
export const GALLERY_ITEMS: GridMedia[] = Array.from({ length: 18 }, (_, i) =>
  media(i, { id: `gallery-${i}` }),
);

/** The Review queue: pending, a couple flagged as video so the peek/select
 *  grammar has something worth judging before it approves. */
export const REVIEW_ITEMS: GridMedia[] = Array.from({ length: 7 }, (_, i) =>
  media(i + 3, {
    id: `review-${i}`,
    status: "pending",
    type: i === 2 ? "video" : "photo",
    likeCount: undefined,
  }),
);

/** The "Recently deleted" bin: a countdown per item, no downloadUrl (the bin
 *  never offers the original file). */
export const BIN_ITEMS: BinMedia[] = Array.from({ length: 6 }, (_, i) => ({
  ...media(i + 6, { id: `bin-${i}`, downloadUrl: undefined }),
  countdownDays: 30 - i * 4,
}));

/** The personal cross-event Uploads feed: items carry their OWN event context
 *  (two different events), which is what makes it a third gallery rather than
 *  a second copy of the album. */
export const UPLOADS_ITEMS: GridMedia[] = Array.from({ length: 10 }, (_, i) =>
  media(i + 1, {
    id: `uploads-${i}`,
    eventName: i % 2 === 0 ? EVENT.name : "Ruby's 30th",
    eventDateLabel: i % 2 === 0 ? "15 Aug 2026" : "2 Jul 2026",
    eventQrToken: i % 2 === 0 ? HOST_EVENT.qr_token : "44444444444444444444444444444444",
  }),
);
