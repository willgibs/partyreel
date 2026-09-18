"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  GuestPage,
  HostPage,
  type TileId,
  tileOf,
  type Width,
  widthOf,
  windowOf,
  type Words,
  wordsOf,
} from "./pages";
import { GALLERY_WIDTH } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is a real page at a real window.
 *
 * ★ EVERY PREVIEW IS A FUNCTION OF THE BOARD'S STATE. The window is a knob all
 * four decisions share, so each picture reads `s.window`; and a decision that
 * waits on another is drawn wearing that answer, so the width is drawn at the
 * tile he picked, the words at both, and the host's page at all three. The
 * earlier decisions read the later answers too, so going back to the tile after
 * answering the width redraws it in the world he chose rather than the one the
 * board assumed.
 */
const guest = (
  s: BoardState,
  pick: { tile?: TileId; width?: Width; words?: Words },
) => (
  <GuestPage
    win={windowOf(s.window)}
    tile={pick.tile ?? tileOf(s.tile)}
    width={pick.width ?? widthOf(s.width)}
    words={pick.words ?? wordsOf(s.words)}
  />
);

const host = (s: BoardState, width: Width) => (
  <HostPage
    win={windowOf(s.window)}
    tile={tileOf(s.tile)}
    width={width}
    words={wordsOf(s.words)}
  />
);

const PREVIEWS: PreviewsFor<typeof GALLERY_WIDTH> = {
  "tile.180": (s) => guest(s, { tile: "180" }),
  "tile.240": (s) => guest(s, { tile: "240" }),
  "tile.300": (s) => guest(s, { tile: "300" }),
  "width.full": (s) => guest(s, { width: "full" }),
  "width.container": (s) => guest(s, { width: "container" }),
  "words.edge": (s) => guest(s, { words: "edge" }),
  "words.centre": (s) => guest(s, { words: "centre" }),
  "host.same": (s) => host(s, "full"),
  "host.own": (s) => host(s, "container"),
};

export function GalleryWidthBoard() {
  return <ExplorationBoard spec={GALLERY_WIDTH} previews={PREVIEWS} />;
}
