"use client";

import { useState, type MouseEvent } from "react";

import {
  ModerationGrid,
  type ModerationActions,
} from "@/components/admin/moderation-grid";
import { marketingImage } from "@/lib/constants/marketing-media";
import type { ModerationTile } from "@/lib/moderation/operator-actions";

/**
 * THE OPERATOR'S ALBUMS GRID, THE REAL ONE, OVER FOUR TILES (`moderation-grid.tsx`; /admin/albums cannot be opened on
 * localhost, so nothing automated has seen its tiles).
 *
 * The four states a tile takes: a seen photograph with its Remove, a removed one with its Restore, a seen video, and a
 * COVERED one, the worst kinds' cover (build 23's NIT-7, carried here by crumbs-21): a report of the worst kinds names
 * the item, so nothing of its picture is signed (no url of any kind), the tile draws the reports inbox's own cover and
 * opens nothing, and the viewer steps only through what is seen. Remove and Restore stay on a covered tile, since neither
 * needs a look.
 *
 * ★ THE WRITES ARE STAND-INS. Remove and Restore are the portal's writes (a Server Function behind the destructive sheet), and
 * the grid takes them as props (crumbs-78: it imports no Server Action), so the Library hands it its own: each waits a
 * round trip, as the real one does, then moves the tile in this specimen's own list and answers ok. The whole flow is
 * pressed here (the portal's sheet, the pending beat, the toast, the way back) and the project is never written. The album
 * caption's link into the portal is held: it goes nowhere. Everything else is the grid's: a tile opens the one viewer.
 */

const ALBUM = {
  eventId: "library-album-1",
  eventName: "Maya & Jay's wedding",
  hostLabel: "maya.jay@example.com",
};

function seen(id: string, image: string, over: Partial<ModerationTile> = {}) {
  const url = marketingImage(image).src;
  return {
    id,
    type: "photo" as const,
    url,
    downloadUrl: url,
    width: 1200,
    height: 1200,
    status: "approved" as const,
    ...ALBUM,
    ...over,
  } as ModerationTile;
}

const TILES: ModerationTile[] = [
  seen("library-mod-1", "wedding-golden"),
  seen("library-mod-2", "reception-hall", { status: "removed" }),
  // A video is drawn from the still its upload grabbed (its preview); the clip itself is never fetched by a tile.
  seen("library-mod-3", "party-dj", {
    type: "video",
    previewUrl: marketingImage("party-dj").src,
  }),
  // A report of the worst kinds names it: no url, no picture, and the cover says so.
  {
    id: "library-mod-4",
    type: "photo",
    status: "approved",
    covered: true,
    ...ALBUM,
  },
];

/** The album caption's link into the portal: a press on it goes nowhere in the Library. */
const HELD = "a[href]";

function hold(event: MouseEvent) {
  if ((event.target as Element | null)?.closest?.(HELD)) {
    event.preventDefault();
    event.stopPropagation();
  }
}

/** What a Server Function takes before it answers, so the pending beat is seen (the spend watch's specimen waits the same). */
const ROUND_TRIP_MS = 700;

export function ModerationGridDemo({
  mode = "feed",
}: {
  mode?: "feed" | "album";
}) {
  const [tiles, setTiles] = useState<ModerationTile[]>(TILES);

  /** A write that answers after a round trip and moves the tile in this list, never the project's. */
  const moveTo =
    (status: "removed" | "approved"): ModerationActions["removeAction"] =>
    async (id) => {
      await new Promise((resolve) => setTimeout(resolve, ROUND_TRIP_MS));
      setTiles((now) =>
        now.map((tile) =>
          tile.id === id ? ({ ...tile, status } as ModerationTile) : tile,
        ),
      );
      return { ok: true };
    };

  return (
    <div onClickCapture={hold} data-library-demo={`moderation-grid-${mode}`}>
      <ModerationGrid
        items={tiles}
        mode={mode}
        removeAction={moveTo("removed")}
        restoreAction={moveTo("approved")}
      />
    </div>
  );
}
