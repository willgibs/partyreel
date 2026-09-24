/**
 * THE CUT CREATOR'S SEAM (reel-guest-wiring, 2026-09-24).
 *
 * A cut, which Will calls "your own clip", is made on the viewer's device by the creator the cut
 * lane builds (`src/components/reel/`). This lane leaves the one place it plugs in, and a promise:
 * no build shows a dead end. The tile's description ("Make your own clip to share") and the view's
 * "Make your own" render ONLY when a creator is registered here AND the host's plan could be read
 * (the cut's facts come from the server, `gallery-reel.ts`).
 *
 * ★ HOW THE CUT LANE PLUGS IN: point `REEL_CREATOR` at its component. That is the whole change on
 * this side. Everything the creator needs arrives as props: the album it may cut from (the live
 * provider's items, the latest presigns), the viewer's mood, what the host's plan lets a cut do,
 * `addCutToAlbum` (which puts the finished cut through the ordinary upload queue with
 * `reel_eligible = false`, so the live reel never plays a reel), and a way out.
 *
 * Why a module constant and not a prop from the page: the page is a server component, and a
 * component reference cannot cross into a client island as a prop.
 */
import type { ComponentType } from "react";

import type { CutFacts, GalleryItem } from "@/lib/events/gallery-reel";

export type ReelCreatorProps = {
  /** The album's playable items, newest presigns (read urls by id at use, never hold them). */
  items: readonly GalleryItem[];
  /** The mood the viewer is watching in, for a cut that starts where the reel is. */
  styleId: string;
  /** The event's id (seeds, and nothing else). */
  eventId: string;
  /** What the host's plan lets a cut do: video, the mark, the length cap. */
  facts: CutFacts;
  /**
   * Add the finished cut to this album, or null when this viewer cannot right now (uploads closed,
   * or a plan that takes no video): the creator then offers only saving and sharing.
   */
  addCutToAlbum: ((file: File, poster: Blob) => void) | null;
  /** Leave the creator (back to the reel). */
  onClose: () => void;
};

export type ReelCreator = ComponentType<ReelCreatorProps>;

/** The registered creator, or null: until the cut lane lands, nothing offers "Make your own". */
export const REEL_CREATOR: ReelCreator | null = null;
