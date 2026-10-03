/**
 * THE HUB'S COVER, WHICH PHOTOGRAPHS (`event-header` r1, `host=shared`): Maya's hub wears the album's
 * own head, so its cover is the same photographs her guests' cover dissolves through. Pure, and read on
 * both sides: the page picks the first paint's stills on the server from what it already read (the
 * reel's face and the first window's links), and the head follows the album live from the same rule.
 *
 *  - While the reel plays, its own opening stills (`readHubReel`'s take, the stills the Reel card
 *    dissolves through), which are the guest cover's first pass too.
 *  - Otherwise (the reel off, or a photograph short of starting), the album's newest photographs a
 *    guest can see: approved, never hidden or waiting in Review, never a clip (a reel's own poster is
 *    not the party), and only with a still to draw.
 */
import type { HeadStill } from "@/components/guest/event-experience-head";
import {
  ENTRY_HIDDEN,
  ENTRY_PENDING,
  ENTRY_PREVIEW,
  ENTRY_REEL,
  ENTRY_VIDEO,
  type ManifestEntry,
} from "@/lib/events/album-wire";

/** How many photographs the hub's cover dissolves through: the album cover's own six. */
export const HUB_COVER_SLOTS = 6;

/** Whether a guest's cover could show this entry: approved, no clip, something to draw. */
export function isCoverEntry(e: ManifestEntry): boolean {
  const flags = e[3];
  if (flags & (ENTRY_HIDDEN | ENTRY_PENDING)) return false;
  // A clip's flag is the one bit that says "the reel never plays it".
  if (!(flags & ENTRY_REEL)) return false;
  // A video draws only its poster, which exists only with a preview.
  if (flags & ENTRY_VIDEO && !(flags & ENTRY_PREVIEW)) return false;
  return true;
}

/** The newest cover entries whose still is in hand (`tileOf`), newest first, at most six. */
export function newestCoverStills(
  entries: readonly ManifestEntry[],
  tileOf: (id: string) => string | null | undefined,
): HeadStill[] {
  const out: HeadStill[] = [];
  for (const e of entries) {
    if (!isCoverEntry(e)) continue;
    const tile = tileOf(e[0]);
    if (!tile) continue;
    out.push({ id: e[0], tile });
    if (out.length === HUB_COVER_SLOTS) break;
  }
  return out;
}

/** The reel's opening stills as the cover draws them: `readHubReel`'s two lists, side by side. */
export function reelCoverStills(reel: {
  stills: readonly string[];
  stillIds: readonly string[];
}): HeadStill[] {
  const out: HeadStill[] = [];
  reel.stillIds.forEach((id, i) => {
    const tile = reel.stills[i];
    if (tile) out.push({ id, tile });
  });
  return out;
}
