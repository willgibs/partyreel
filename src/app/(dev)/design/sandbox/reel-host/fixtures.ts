import type { GridMedia } from "@/components/app/media-grid";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import {
  THEME_IDS,
  THEME_LABELS,
  type ThemeId,
} from "@/lib/reel/engine/themes";
import { planTake } from "@/lib/reel/live/take";

import {
  EVENT,
  GALLERY_ITEMS,
  HOST_EVENT,
  REVIEW_ITEMS,
} from "../gallery-fixtures";

/**
 * THE STAND-IN CONTENT for `reel-host`. The event and its album are
 * `sandbox/gallery-fixtures.ts`'s own pools, reused VERBATIM: one wedding,
 * eighteen approved tiles, the shared review queue. Every still is one of the
 * bootstrap images every other board reuses, so no new asset and nothing to
 * track the rights of.
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT FROM A BOARD (guest-capture's rule, carried
 * by every board since): `gallery-fixtures.ts` is not a board, so it outlives
 * any one board's ruling. `reel-screen` draws the same wedding on the same
 * engine from its OWN files for the same reason: a board's directory is deleted
 * whole at its ruling, and a sibling importing from it would break that day.
 *
 * What is added here is what THIS board's seven questions need and no other
 * board has: the reel's own take over the album, the eight moods and the hold's
 * steps, three waiting in Review, a host's own finished cut, and the counts the
 * progression is drawn at.
 */
export { EVENT, GALLERY_ITEMS, HOST_EVENT, REVIEW_ITEMS };

/** Indexed the way `buildReelProps` wants it (no second presign, no RPC). */
export const BY_ID = new Map(GALLERY_ITEMS.map((m) => [m.id, m]));

/**
 * ★ THE REEL'S OWN TAKE, NEVER THE ALBUM'S ORDER. `planTake` is the live reel's
 * pure ordering function (the quick-add brain run pass by pass, shuffled per
 * loop), so the frames and the crossfade stills on this board are the ones the
 * live reel really leads with. His `tile=crossfade` wiring takes its stills
 * from the take for the same reason: a tile that mirrored the album's newest
 * would repeat the tiles right beneath it.
 */
export const TAKE_IDS: string[] = planTake(GALLERY_ITEMS, {
  eventId: HOST_EVENT.id,
  loopIndex: 0,
});
export const TAKE: GridMedia[] = TAKE_IDS.map((id) => BY_ID.get(id)).filter(
  (m): m is GridMedia => Boolean(m),
);

/** A still a person sees: the preview, as every reel surface draws it. */
export const stillOf = (m: GridMedia): string => m.previewUrl ?? m.url;

/**
 * The living crossfade's stills (his hub note: "a more calm living thumbnail
 * behind this card version as a full background with overlay"): the take's
 * first three, dissolving slowly. Plain stills rather than engine frames, which
 * is his `tile=crossfade` pick exactly ("a slow crossfade of stills, no engine
 * on the album"); the engine's frames are the view's.
 */
export const LIVING_STILLS: string[] = TAKE.slice(0, 3).map(stillOf);

/**
 * The eight media-first moods, read off the real catalog rather than retyped
 * (a second list here would drift the day a ninth mood ships). A null
 * `events.reel_style_id` resolves to Cinematic.
 */
export const MOODS: readonly { id: ThemeId; label: string }[] = THEME_IDS.map(
  (id) => ({ id, label: THEME_LABELS[id] }),
);
export const DEFAULT_MOOD_ID: ThemeId = "classic";

/**
 * THE HOLD'S STEPS, in seconds a photograph stays on screen. His `pacing` note
 * ("Let's make 3 seconds the default, but this should be adjustable") and the
 * two boards' own options merged, exactly as `reel-guest-wiring` wires the dock:
 * reel-view's 1, 1.5 and 2.2 and reel-screen's 3.6, 5 and 7, around his 3.
 */
export const HOLD_STEPS = [1, 1.5, 2.2, 3, 3.6, 5, 7] as const;
export const DEFAULT_HOLD = 3;

/** Three waiting in Review: a slice of the shared queue, never a second one. */
export const PENDING_ITEMS: GridMedia[] = REVIEW_ITEMS.slice(0, 3);
export const WAITING = PENDING_ITEMS.length;

/** The url the code encodes, exactly as `/e/[token]` builds it. */
export const JOIN_URL = `https://partyreel.com/e/${HOST_EVENT.qr_token}`;
/** What a person reads off a screen and types, which is never the token. */
export const JOIN_LABEL = "partyreel.com/e/mia-theo";
/** The event's own code style, resolved the way the hub's code door resolves it. */
export const QR_STYLE = resolveQrPreset(HOST_EVENT.qr_style);

/** The uploader the arrival feed names: a guest the album really holds. */
export const LATEST =
  GALLERY_ITEMS.find((m) => m.uploaderName === "Theo Calder")?.uploaderName ??
  "Theo Calder";

/**
 * The live reel's minimum: his `states=nothing` note ("Could even drop the
 * minimum to 2") as `reel-guest-wiring` wires it. The progression is drawn at
 * none, one and two items for exactly this number.
 */
export const MINIMUM = 2;

/** The album the hub draws at a given count: the album's own first items. */
export const albumAt = (n: number): GridMedia[] => GALLERY_ITEMS.slice(0, n);

export const LIVE_ALBUM_COUNT = GALLERY_ITEMS.length;

/**
 * A host's own finished cut, added to the album through the ordinary upload
 * queue (the `cut` ask): a video, the host's own row, landing approved. Built
 * from a real gallery tile so its dimensions and uploader shape match the grid
 * it sits in.
 */
export const CUT_ITEM: GridMedia = {
  ...GALLERY_ITEMS[4],
  id: "cut-1",
  type: "video",
  status: "approved",
  uploaderName: EVENT.host,
  isHost: true,
  likeCount: 0,
};

/** The host's first name, the way a line the room reads would say it. */
export const HOST_FIRST = EVENT.host.split(" ")[0];
