"use client";

/**
 * THE GUEST ALBUM — a thin wrapper over the ONE grid.
 *
 * ★ NEVER A SECOND COPY OF THE ALBUM. No tile box, play badge, hover row or
 * lightbox wiring of its own beside `shared/masonry.tsx` doing the same for the
 * host: two copies answering one design is how they drift, and one `MediaTile`
 * serves every album grid. What lives here is what is genuinely the GUEST's and
 * nobody else's — what this DEVICE has sent that is not in the album yet, and a
 * hover set with no moderation in it.
 *
 * ★ THE PREFIX IS THE SEAM, and the whole of it is two objects: one
 * `UploadStackTile` for a pick in flight, however many files it holds, and one
 * `WaitingTile` per file a hold-for-approval event is keeping back. Their box is
 * the landed tile's box to the pixel — the same radius, the same `data-lit` hook,
 * the same bottom margin — so a photograph does not change shape at the moment
 * it finishes uploading.
 *
 * ★ AND A FILE THAT DID NOT GO IS DRAWN NOWHERE. A refusal is read at the end of
 * the run, on the failure sheet, a surface that waits, rather than as the word
 * BROKEN written across a perfectly good photograph.
 *
 * ★ NO LANDED CHECK EITHER. A guest's own landing is the landing sweep, a pass of
 * light across the tile itself, written by the grid from `landedIds`, so this
 * file passes ids rather than rendering a badge. `renderOverlay` stays on the
 * grid for the surfaces that use it (the bin's countdown).
 *
 * ★ AND NO ADD LIVES HERE. The album's Add is the page's: the action row on
 * landing, then the dock once that row leaves the screen (guest-action-dock.tsx),
 * so this grid draws photographs and nothing that competes with them.
 */
import type { ReactNode } from "react";
import { Download } from "lucide-react";

import { type GridMedia } from "@/components/app/media-grid";
import {
  UploadStackTile,
  WaitingTile,
} from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import { MasonryColumns, type TileAction } from "@/components/shared/masonry";

/**
 * A FILE THIS DEVICE HAS SENT OR IS SENDING, rendered at the album's head.
 * `url` is the object URL the gallery's own ledger owns, and `file` rides along
 * so an undrawable one (an iPhone clip, a HEIC outside Safari) can be NAMED
 * rather than drawn as an empty black box.
 *
 * `held` is the third state, drawn as a waiting tile: the upload finished, the
 * host has not approved it, and only this device knows it exists at all.
 */
export type PendingTile = {
  queueId: string;
  url: string;
  file: File;
  kind: "photo" | "video";
  status: "queued" | "uploading" | "held";
  progress: number;
};

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
