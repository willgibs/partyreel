import type { GridMedia } from "@/components/app/media-grid";
import type { HostEvent } from "@/lib/db/queries/events";
import { THEME_IDS, THEME_LABELS, type ThemeId } from "@/lib/reel/engine/themes";

import {
  EVENT,
  GALLERY_ITEMS,
  HOST_EVENT,
  REVIEW_ITEMS,
} from "../gallery-fixtures";

/**
 * THE STAND-IN CONTENT for `reel-host`. The event and its album are
 * `sandbox/gallery-fixtures.ts`'s own pools, reused VERBATIM (the manifest;
 * host-curation's own precedent): one wedding, eighteen approved tiles, the
 * same seven-deep review queue. Every still is one of the fourteen bootstrap
 * images every other board reuses, so no new asset and nothing to track the
 * rights of (Will, 2026-09-17/18).
 *
 * ★ A SEPARATE FILE, NOT AN IMPORT FROM A BOARD (guest-capture's rule,
 * carried by every board since): `sandbox/gallery-fixtures.ts` is not a
 * board (registry.ts only requires a `spec.ts` to register, and this file has
 * none), so it outlives any one board's ruling and is the right thing to
 * import from directly, unlike a sibling board's own `fixtures.ts`.
 *
 * What is added here is what THIS round's six questions need and no other
 * board has: the two columns the reel round's expand migration adds to
 * `events` (`show_reel`, `reel_style_id`), the eight-mood catalog read off
 * the real engine rather than retyped, a host's own finished cut, and the
 * three-waiting queue the brief's own words name.
 */
export { EVENT, GALLERY_ITEMS, HOST_EVENT, REVIEW_ITEMS };

/**
 * The two columns section A of the approved plan adds to `events`
 * (`<ts>_live_reel_expand.sql`): not on `HostEvent` yet on this tree, so the
 * board wears its own small extension rather than waiting on the migration
 * lane. `reel_style_id: null` is the shipped default meaning "the default
 * mood"; `show_reel` defaults true (the off switch, `switch=default-on`,
 * decided, not asked).
 */
export type ReelHostEvent = HostEvent & {
  show_reel: boolean;
  reel_style_id: string | null;
};

export const REEL_EVENT: ReelHostEvent = {
  ...HOST_EVENT,
  show_reel: true,
  reel_style_id: null,
};

/**
 * The eight media-first moods, read off the real catalog rather than
 * retyped (a second list here would drift the day a ninth mood ships).
 * `DEFAULT_MOOD_ID` is what a null `reel_style_id` resolves to.
 */
export const MOODS: readonly { id: ThemeId; label: string }[] = THEME_IDS.map(
  (id) => ({ id, label: THEME_LABELS[id] }),
);
export const DEFAULT_MOOD_ID: ThemeId = "classic";

/** A flavor swatch per mood, decorative only (never the real grade): enough
 *  for a reviewer to tell eight tiles apart at a glance. */
export const MOOD_SWATCH: Record<ThemeId, string> = {
  classic: "linear-gradient(135deg, #3a3a3a, #101010)",
  warm: "linear-gradient(135deg, #d99a52, #4a2c12)",
  punchy: "linear-gradient(135deg, #ff5d7a, #ff9d3d)",
  kinetic: "linear-gradient(135deg, #4fd1ff, #1c2ee0)",
  editorial: "linear-gradient(135deg, #cfcfcf, #4b4b4b)",
  golden: "linear-gradient(135deg, #ffb15e, #a13a5e)",
  mono: "linear-gradient(135deg, #e8e8e8, #050505)",
  dreamy: "linear-gradient(135deg, #f3c6e8, #9db8ec)",
};

/** The reel's own pool: every visible item in the album, poster-first for
 *  the frame a still scene paints. */
export const REEL_POOL: GridMedia[] = GALLERY_ITEMS;
export const REEL_POSTER = REEL_POOL[2]?.url ?? REEL_POOL[0].url;

/** Three waiting in Review, the brief's own number ("3 waiting won't play"):
 *  a slice of the shared queue, so this board never invents a second one
 *  host-curation's own board does not also see. */
export const PENDING_ITEMS: GridMedia[] = REVIEW_ITEMS.slice(0, 3);

/**
 * A host's own finished cut, added to the album through the ordinary upload
 * queue (the `cut` ask): a video, the host's own row, landing approved. Built
 * from a real gallery tile so its dimensions and uploader shape match the
 * grid it sits in, rather than a hand-typed row that could drift from what
 * `GridMedia` actually needs.
 */
export const CUT_ITEM: GridMedia = {
  ...GALLERY_ITEMS[4],
  id: "cut-1",
  type: "video",
  status: "approved",
  uploaderName: EVENT.host,
  isHost: true,
  isAnonymous: false,
  likeCount: 0,
};

/** The `pulse` ask's threshold pair: one album short of the line, one past
 *  it, so the "three or more" rule is judged rather than asserted. */
export const SMALL_ALBUM_COUNT = 2;
export const LIVE_ALBUM_COUNT = GALLERY_ITEMS.length;
