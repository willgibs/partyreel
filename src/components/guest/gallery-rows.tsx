"use client";

/**
 * THE GUEST ALBUM'S ROWS (the album-guest-wiring lane): the ONE grid (`MasonryColumns`) in its
 * justified, windowed layout (`layout="rows"`, `album-window.tsx`) with Will's `album-columns` round-2
 * picks: `arrival=push` (a photograph new to the rows is pushed in from its left edge while what it
 * moved glides), `steps=both` (three steps, from View's slider and from a pinch or ctrl and the
 * wheel over the album, each anchored on the photograph under it), `rhythm=double` (now and then a
 * landscape leads a row at twice the height; never at one a row, where every photograph is alone).
 *
 * ★ NEVER A SECOND COPY OF THE ALBUM. No tile box, play badge, hover row or viewer wiring of its own:
 * one `AlbumTile` serves every album grid. What lives here is what is genuinely the GUEST's: what this
 * DEVICE has sent that is not in the album yet, and a desk hover set with no moderation in it.
 *
 * ★ THE HEAD IS THE SEAM, and the whole of it is two objects: one stack for a pick in flight, led by
 * the file actually in the air, and one waiting tile per file a hold-for-approval event keeps back.
 * Each takes a square slot of its own at the album's head. ★ THE STACK SUBSCRIBES TO ITS OWN
 * PROGRESS (`useQueueProgress`): a tick re-renders the stack's bar and nothing else, never the album.
 *
 * ★ A FILE THAT DID NOT GO IS DRAWN NOWHERE (the failure sheet reads it at the run's end), and no Add
 * lives here: the album's Add is the page's (the action row, then the dock).
 */
import type { Ref } from "react";
import { Download } from "lucide-react";

import type { GridMedia } from "@/components/app/media-grid";
import {
  UploadStackTile,
  WaitingTile,
} from "@/components/guest/upload/stack-tile";
import { useLikeAction } from "@/components/likes/like-button";
import {
  MasonryColumns,
  type AlbumHandle,
  type TileAction,
} from "@/components/shared/masonry";
import {
  useQueueProgress,
  type QueueProgress,
} from "@/lib/guest/use-upload-queue";
import type { RowStep } from "@/lib/shared/album-rows";

/**
 * A FILE THIS DEVICE HAS SENT OR IS SENDING, drawn at the album's head. `url` is the object URL the
 * live gallery's own ledger owns, and `file` rides along so an undrawable one (an iPhone clip, a HEIC
 * outside Safari) can be NAMED rather than drawn as an empty black box.
 *
 * `held` is the third state, drawn as a waiting tile: the upload finished, the host has not approved
 * it, and only this device knows it exists at all.
 */
export type PendingTile = {
  queueId: string;
  url: string;
  file: File;
  kind: "photo" | "video";
  status: "queued" | "uploading" | "held";
  /** The file's progress as the queue last said it on a status change; the stack reads it live. */
  progress: number;
};

/** The stack at the album's head, reading its own file's progress as it goes. */
function LiveStackTile({
  lead,
  remaining,
  progress,
}: {
  lead: PendingTile;
  remaining: number;
  progress: QueueProgress | null;
}) {
  const live = useQueueProgress(progress, lead.queueId);
  return (
    <UploadStackTile
      file={lead.file}
      url={lead.url}
      progress={progress ? live : lead.progress}
      remaining={remaining}
    />
  );
}

export function GalleryRows({
  items,
  pending = [],
  progress = null,
  step,
  onStepChange,
  seed,
  firstPaintWidth,
  onBoxWidth,
  onWindowChange,
  onViewerNeedLinks,
  albumRef,
  shareUrl,
  onDeleteItem,
  canDelete,
  arrivedIds,
  landedIds,
  mineIds,
  onSelectMine,
  mineSelected,
}: {
  items: GridMedia[];
  /** This device's in-flight and held files, drawn FIRST, at the head. */
  pending?: PendingTile[];
  /** The queue's live progress, which the stack reads itself. */
  progress?: QueueProgress | null;
  /** The density step (photographs per row), and the gestures' answer. */
  step: RowStep;
  onStepChange: (step: RowStep) => void;
  /** The visit's seed for the rhythm's picks: the same seed, the same features, all visit long. */
  seed: number;
  /** The width the album last laid its rows at (the page's cookie), and each new one as it lands. */
  firstPaintWidth?: number | null;
  onBoxWidth?: (width: number) => void;
  /** The photographs the window mounts (their links and hearts load per window). */
  onWindowChange?: (ids: readonly string[]) => void;
  /** The viewer's link source: the photographs it is about to show. */
  onViewerNeedLinks?: (ids: readonly string[]) => void;
  albumRef?: Ref<AlbumHandle>;
  /** The event JOIN url for the viewer's Share (guest surface only). */
  shareUrl?: string;
  /** A guest's own-photograph Remove, gated per item (the viewer's Trash). */
  onDeleteItem?: (id: string) => void;
  canDelete?: (item: GridMedia) => boolean;
  /** The two arrival marks: another's photograph glows, this device's own sweeps. */
  arrivedIds?: ReadonlySet<string>;
  landedIds?: ReadonlySet<string>;
  /** THE FOURTH MARK, on a guest's own tiles: the ids, the mark's tap, and whether Yours is on. */
  mineIds?: ReadonlySet<string>;
  onSelectMine?: () => void;
  mineSelected?: boolean;
}) {
  const likeAction = useLikeAction();

  // A guest's desk row: like, and save the original once its link has landed. No moderation, ever:
  // this is somebody else's party. A phone sees neither (the grid never renders the pane below
  // `md`); both live in the viewer at every width.
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

  // ONE PICK IS ONE OBJECT: everything still flying collapses into a single stack led by the file
  // actually in the air (the queue runs one at a time). The fallback to the first of the batch covers
  // the beat between one file completing and the next one's first byte, so the stack never blinks.
  const flying = pending.filter((p) => p.status !== "held");
  const lead = flying.find((p) => p.status === "uploading") ?? flying[0];
  const held = pending.filter((p) => p.status === "held");

  return (
    <MasonryColumns
      layout="rows"
      items={items}
      stagger
      rowStep={step}
      onRowStepChange={onStepChange}
      rowRhythm="double"
      rhythmSeed={seed}
      firstPaintWidth={firstPaintWidth}
      onBoxWidth={onBoxWidth}
      onWindowChange={onWindowChange}
      onViewerNeedLinks={onViewerNeedLinks}
      albumRef={albumRef}
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
          {lead && (
            <LiveStackTile
              key={lead.queueId}
              lead={lead}
              remaining={flying.length}
              progress={progress}
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
