"use client";

import { useEffect, useMemo, useState } from "react";

import { useGalleryLive } from "@/components/guest/gallery-live";
import {
  hueOfOklch,
  publishDoorHues,
  useAnyLampLit,
} from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";

/**
 * How far back the lamp will look for a preview that carries colour (his to overrule): build 11's
 * red-team probed a 15-photo album whose three newest items were grey clip posters, 3,072 sampled
 * pixels with none of them carrying colour, so a run of colourless previews at the album's head
 * blanked the lamp to the house five even though the rest of the album was ordinary photographs.
 * Bounded, never the whole album: `pickSpillHues` already discounts a pixel with no real chroma
 * (`sampled-palette.ts`), so widening the window just gives whichever of it DOES carry colour a
 * chance to vote, and a window with none anywhere still falls back exactly as before.
 */
const LOOKBACK = 12;

/**
 * THE LAMP'S SOURCE: the album's newest previews, within that bounded lookback (`identity-door` r2,
 * `look=lit`: "coloured from the album's three newest photos through sampled-palette"; widened past
 * a colourless run, `crumbs-3`). Mounted INSIDE the page's live provider, the one place the album's
 * items are known, and drawing nothing: it hands the hues to every lamp through `door-light.ts`,
 * wherever the lamps are (the door, her menu's card, the change and confirm sheets).
 *
 * ★ PREVIEWS, NEVER ORIGINALS (`sampled-palette.ts`'s own rule): the URL form decodes CORS-clean
 * with `no-store`, so it samples presigned R2 media, and the ~16KB preview is the only thing worth
 * fetching to read 32px of. An item with no link yet (the manifest's placeholders) is skipped, and
 * so is one with no preview; a video offers its poster preview or nothing.
 *
 * ★ SAMPLED ONLY WHILE A LAMP IS LIT, and only when the newest LOOKBACK CHANGE: the album keeps
 * arriving all night, and a light nobody is looking at is not worth a dozen previews an arrival. The
 * last sample stays published between lamps, so the next one lights in the album's colour at once.
 *
 * At a password event before its unlock no provider mounts, so nothing is sampled and every lamp
 * wears the house five (the no-media branch), as the board drew it. (What the open door SHOWS is the
 * album's own cover, `CoverPicture`, read from the page's seed and the live album as the cover is.)
 */
export function AlbumLightSampler() {
  const live = useGalleryLive();
  const lit = useAnyLampLit();
  const items = live?.items;

  // The newest LOOKBACK with a preview: ids and urls, the urls read when the ids were first seen, so
  // a link re-minted under the same photographs does not re-sample. An item with no preview (a row
  // from before previews, a video with no poster) is passed over rather than sampled from its
  // original, the full-resolution file `sampled-palette.ts` warns against.
  const newest = useMemo(() => {
    const picked: { id: string; src: string }[] = [];
    for (const item of items ?? []) {
      const src = item.previewUrl;
      if (!src) continue;
      picked.push({ id: item.id, src });
      if (picked.length === LOOKBACK) break;
    }
    return picked;
  }, [items]);
  const idsKey = newest.map((n) => n.id).join("|");

  // What to sample: frozen per set of ids (the adjust-state-during-render pattern), and only
  // requested while a lamp is lit.
  const [target, setTarget] = useState<{ key: string; srcs: string[] } | null>(
    null,
  );
  if (lit && idsKey && target?.key !== idsKey) {
    setTarget({ key: idsKey, srcs: newest.map((n) => n.src) });
  }
  const colors = useSampledPalette(target?.srcs ?? null, "dark");

  useEffect(() => {
    if (!colors) return;
    const hues = colors.map(hueOfOklch).filter((h): h is number => h !== null);
    if (hues.length >= 3) publishDoorHues(hues);
  }, [colors]);

  return null;
}
