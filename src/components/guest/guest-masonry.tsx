"use client";

/**
 * THE MASONRY ALBUM, KEPT FOR WHAT STILL DRAWS IT: the marketing site's live album stage and the
 * lab's boards. The guest album itself left masonry for the justified, windowed rows
 * (`gallery-rows.tsx`, the album-guest-wiring lane); this stays a thin wrapper over the ONE grid, with
 * the same head seam (one stack for a pick in flight, a waiting tile per held file), so a stage that
 * draws "the guest album" still draws the product's own tile and marks.
 *
 * ★ NEVER A SECOND COPY OF THE ALBUM. No tile box, play badge, hover row or lightbox wiring of its own
 * beside `shared/masonry.tsx`: one `MediaTile` serves every album grid.
 */
import type { ReactNode } from "react";
import { Download } from "lucide-react";

import { type GridMedia } from "@/components/app/media-grid";
import type { PendingTile } from "@/components/guest/gallery-rows";
import {
  UploadStackTile,
  WaitingTile,
} from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";

// The head's file, one shape for both albums (the rows' own home).
export type { PendingTile };

export function GuestMasonry({
  items,
  pending = [],
  shareUrl,
  onDeleteItem,
  canDelete,
  arrivedIds,
  landedIds,
  prefix,
  mineIds,
  onSelectMine,
  mineSelected,
}: {
  items: GridMedia[];
  /**
   * THE SEAM: the props for a guest's own-photograph Remove (`onDeleteItem` gated per item by
   * `canDelete`; the lightbox's Trash), the arrival marks (`arrivedIds` / `landedIds` ->
   * `data-arrived` / `data-landed` on the tile box) and a slot before the first tile (`prefix`),
   * all of which pass straight through to the one grid.
   */
  onDeleteItem?: (id: string) => void;
  canDelete?: (item: GridMedia) => boolean;
  arrivedIds?: ReadonlySet<string>;
  landedIds?: ReadonlySet<string>;
  prefix?: ReactNode;
  /**
   * THE FOURTH MARK, the one on a guest's own tiles: the ids that are this
   * guest's own, the mark's tap, and whether the Yours filter is already on.
   * Straight through to the one grid, like the four above.
   */
  mineIds?: ReadonlySet<string>;
  onSelectMine?: () => void;
  mineSelected?: boolean;
  /** This device's in-flight and held files, rendered FIRST. */
  pending?: PendingTile[];
  /** The event JOIN url for the lightbox Share button (guest surface only). */
  shareUrl?: string;
}) {
  const likeAction = useLikeAction();

  // A guest's desk row: like, and save the original. No moderation, ever — this
  // is somebody else's party. A phone sees neither (the grid never renders the
  // pane below `md`); both live in the lightbox at every width.
  const tileActions = (item: GridMedia): readonly TileAction[] => {
    const like = likeAction(item);
    const out: TileAction[] = [];
    if (like) out.push(like);
    if (item.downloadUrl)
      out.push({
        id: "save",
        label: "Save",
        icon: Download,
        tone: "save",
        href: item.downloadUrl,
      });
    return out;
  };

  // ONE PICK IS ONE OBJECT: everything still flying collapses into a single
  // stack led by the file actually in the air, because the queue runs one at a
  // time and the rest are waiting their turn. The fallback to the first of the
  // batch covers the beat between one file completing and the next one's first
  // byte, so the stack never blinks out and back.
  const flying = pending.filter((p) => p.status !== "held");
  const lead = flying.find((p) => p.status === "uploading") ?? flying[0];
  const held = pending.filter((p) => p.status === "held");

  return (
    <MasonryColumns
      items={items}
      stagger
      shareUrl={shareUrl}
      onDeleteItem={onDeleteItem}
      canDelete={canDelete}
      arrivedIds={arrivedIds}
      landedIds={landedIds}
      mineIds={mineIds}
      onSelectMine={onSelectMine}
      mineSelected={mineSelected}
      tileActions={tileActions}
      prefix={
        <>
          {prefix}
          {lead && (
            <UploadStackTile
              key={lead.queueId}
              file={lead.file}
              url={lead.url}
              progress={lead.progress}
              remaining={flying.length}
            />
          )}
          {held.map((p) => (
            <WaitingTile key={p.queueId} file={p.file} url={p.url} />
          ))}
        </>
      }
    />
  );
}
