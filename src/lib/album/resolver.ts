/**
 * THE REEL'S LINK RESOLVER: what the live reel's clip source asks for a clip's links, by id, at the
 * moment it builds a window (`src/lib/reel/live/source.ts`: "a clip's url is read at the moment its
 * window is built and never held").
 *
 * Today the source reads `url` and `previewUrl` off the gallery payload's items, which carry links
 * for the whole album. On the paged album only a window's items have links, so the source is handed
 * this instead: `get(id)` for what is held now (a still's `tile`, a video window's `view`), and
 * `ensure(ids)` for the clips it is about to play, called a window ahead so a clip's links land before
 * its turn. Wiring it into `createClipSource` is a later lane's (the album surfaces); this is the seam.
 *
 * Pure: a view over the link store, which owns the fetching, the batching and the re-mint.
 */
import type { LinkStore } from "@/lib/album/links";

/** A clip's two links: the still the reel draws (`tile`) and the original a video window reads. */
export type ClipLinks = { tile: string; view: string };

export type ClipResolver = {
  get(id: string): ClipLinks | undefined;
  ensure(ids: readonly string[]): Promise<void>;
};

export function createClipResolver<Who>(links: LinkStore<Who>): ClipResolver {
  return {
    get(id) {
      const link = links.get(id);
      return link ? { tile: link.tile, view: link.view } : undefined;
    },
    ensure: (ids) => links.ensure(ids),
  };
}
