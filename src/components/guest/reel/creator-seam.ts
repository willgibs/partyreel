/**
 * THE CLIP CREATOR'S SEAM.
 *
 * A clip ("your own clip" to a viewer) is made on the viewer's device by the creator in
 * `src/components/reel/clip-creator.tsx`. This is the one place it plugs in, and a promise: no build
 * shows a dead end. The tile's line ("Make your own clip to share") and the view's "Make your own"
 * render ONLY when a creator is registered here AND the host's plan could be read (the clip's facts
 * come from the server, `gallery-reel.ts`).
 *
 * ★ REGISTERED LAZILY, SO THE ALBUM CARRIES NONE OF IT. The creator reaches the whole canvas engine;
 * the album page imports this module (the tile reads whether a creator exists), so the component is
 * a `React.lazy` over one import promise, which the view also warms on intent (`preloadReelCreator`,
 * a pointer over Make your own). Nobody who never opens the creator downloads it.
 *
 * Everything the creator needs arrives as props: the album it may clip from (the live provider's
 * items, the latest presigns), the viewer's mood, what the host's plan lets a clip do,
 * `addClipToAlbum` (which puts a guest's finished clip through the ordinary upload queue with
 * `reel_eligible = false`, so the live reel never plays a reel), who is making it, and a way out.
 *
 * Why a module constant and not a prop from the page: the page is a server component, and a
 * component reference cannot cross into a client island as a prop.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import type { ClipFacts, GalleryItem } from "@/lib/events/gallery-reel";

export type ReelCreatorProps = {
  /** The album's playable items, newest presigns (read urls by id at use, never hold them). */
  items: readonly GalleryItem[];
  /** The mood the viewer is watching in, for a clip that starts where the reel is. */
  styleId: string;
  /** The event's id (seeds, the host's add, and nothing else). */
  eventId: string;
  /** The event's name: the room leads with it (a guest surface belongs to the host's event). */
  eventName: string;
  /** What the host's plan lets a clip do: video, the mark, the length cap. */
  facts: ClipFacts;
  /**
   * Add a guest's finished clip to this album, or null when this viewer cannot right now (uploads
   * closed): the creator then offers only saving and sharing. The owner never uses it: her clip goes
   * through the host's own upload route, whenever her plan takes video.
   */
  addClipToAlbum: ((file: File, poster: Blob) => void) | null;
  /**
   * The event's owner is making it: her Add to event goes through the host's route (approved,
   * metered on her storage), her hidden photographs show in the pool as "Hidden · Show", and her
   * free mark's line offers the upgrade.
   */
  isOwner: boolean;
  /** The album holds guests' uploads for the host's review, which a guest's Add to event says. */
  moderated: boolean;
  /** This device's own uploads (a guest's Only mine). */
  ownIds: ReadonlySet<string> | null;
  /** Leave the creator (back to the reel). */
  onClose: () => void;
};

export type ReelCreator =
  | ComponentType<ReelCreatorProps>
  | LazyExoticComponent<ComponentType<ReelCreatorProps>>;

let creatorChunk: Promise<
  typeof import("@/components/reel/clip-creator")
> | null = null;
const loadCreator = () =>
  (creatorChunk ??= import("@/components/reel/clip-creator"));

/** Warm the creator's chunk on intent, so the tap that opens it opens it at once. */
export function preloadReelCreator(): void {
  void loadCreator();
}

/** The registered creator, or null: while it is null, nothing offers "Make your own". */
export const REEL_CREATOR: ReelCreator | null = lazy(() =>
  loadCreator().then((m) => ({ default: m.ClipCreator })),
);
