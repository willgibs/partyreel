/**
 * THE HIGHLIGHT REEL TILE'S STILLS.
 *
 * The tile is a slow crossfade of STILLS, which keeps its design in hand and calmer than a fast,
 * distracting miniature reel (and puts no engine on the album, nothing blocking its first paint). The
 * stills are the REEL'S OWN TAKE (`planTake`, the order the reel itself opens on), never the album's
 * newest, so the tile's images stay distinct from the album's: the newest are exactly the tiles right
 * beneath the tile, and a crossfade of them would read as the album repeating itself.
 *
 * ★ ONLY THE TAKE'S FIRST PASS IS PLANNED (`passes: 1`). Six stills are the head of the take, and a
 * cut-short take is exactly the whole one's head ("yours first" included), so walking the rest of a
 * big album to throw it away would be all cost and no picture.
 *
 * ★ ALWAYS SIX SLOTS. The crossfade is one CSS keyframe shared by six images, each phase-shifted into
 * its own sixth of the cycle (live-reel.css). An album of two therefore cycles its two stills three
 * times round rather than leaving four sixths of the cycle blank.
 *
 * ★ PREVIEWS ONLY. `stillUrlFor` is a photograph's small WebP preview (the original only as the
 * pre-preview fallback) and a video's poster; never the raw original of a video, which an <img>
 * cannot draw. Urls are read from the items handed in, so the caller hands the LATEST payload. On the
 * paged album an item carries no link until its id is asked for (src/lib/album/resolver.ts), so a
 * slot's `url` is EMPTY for a playable item (`drawable`) whose link has not landed yet: the slot is
 * still the take's, and the caller resolves it by id. Leaving it out instead would hide the very ids
 * the caller needs to ask for.
 *
 * Pure: no DOM, no React.
 */
import {
  isReelEligible,
  stillUrlFor,
  type LiveMediaItem,
} from "@/lib/reel/live/items";
import { planTake } from "@/lib/reel/live/take";

export const TILE_SLOTS = 6;

export type TileStill = { id: string; url: string };

/** The six stills the tile crossfades, from the reel's own take. Empty when nothing can play. */
export function tileStills(
  items: readonly LiveMediaItem[],
  opts: { eventId: string; ownIds?: ReadonlySet<string> | null },
): TileStill[] {
  const byId = new Map<string, LiveMediaItem>();
  for (const item of items) if (!byId.has(item.id)) byId.set(item.id, item);
  const head = planTake(items, {
    eventId: opts.eventId,
    loopIndex: 0,
    ownIds: opts.ownIds ?? null,
    passes: 1,
  });
  const picks: TileStill[] = [];
  for (const id of head.slice(0, TILE_SLOTS)) {
    const item = byId.get(id);
    // Every id the take places is playable; the url is the still if its link is in hand.
    if (item) picks.push({ id, url: stillUrlFor(item) });
  }
  if (picks.length === 0) return [];
  const slots: TileStill[] = [];
  for (let i = 0; i < TILE_SLOTS; i++) slots.push(picks[i % picks.length]);
  return slots;
}

/**
 * A stable key for WHICH items could play, so the tile recomputes its stills only when the album's
 * playable membership changes (an arrival, a departure), never on the half-hourly presign roll that
 * hands every item a new url object, nor when a paged album's link lands. Playable is the reel's own
 * rule (`isReelEligible`): a manifest item that is `drawable` plays before its link arrives.
 */
export function playableSignature(items: readonly LiveMediaItem[]): string {
  return items
    .filter(isReelEligible)
    .map((item) => item.id)
    .sort()
    .join(",");
}
