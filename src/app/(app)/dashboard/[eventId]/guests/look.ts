/**
 * A PERSON'S PHOTOGRAPHS AS A CARD DRAWS THEM (guests-room r1, `card=standing`): the answer the look's two Server
 * Functions hand a card (`look-actions.ts`), and the one pure step that turns a page of their rows and the album's own
 * links into the items a tile and the viewer draw.
 *
 * ★ TWO MAPPERS, BECAUSE TWO SIDES: the host's links carry the uploader's PROVED address (the host's own who tuple,
 * `album-host-links.ts`), and the album's carry none by construction (`GuestWhoTuple` has no slot for one), so the
 * album's mapper cannot put an address on an item even by mistake (look.test.ts reads it). Each names its fields
 * rather than spreading the tuple.
 *
 * Pure and isomorphic: the actions, the card and the tests import it.
 */
import type { GridMedia } from "@/components/app/media-grid";
import type { LookCursor } from "@/lib/db/queries/guest-look";
import {
  faceFromTuple,
  WHO_VERIFIED,
  type AlbumLinkTuple,
  type GuestWhoTuple,
  type HostWhoTuple,
} from "@/lib/events/album-wire";

export type { LookCursor };

/** One row of theirs before its links: what the page read says of it. */
export type LookRowFacts = {
  id: string;
  type: "photo" | "video";
  width: number | null;
  height: number | null;
  duration: number | null;
};

/** What a look's read answers a card: how many the album shows of theirs by kind, a page of them, and the next. */
export type LookAnswer =
  | {
      ok: true;
      photos: number;
      videos: number;
      items: GridMedia[];
      next: LookCursor | null;
    }
  | { ok: false };

/** The answer a look's read gives anything it will not or cannot answer: no detail, so it tells nothing. */
export const NO_LOOK: LookAnswer = { ok: false };

/** A card's strip: four of their photographs, the newest. */
export const STRIP = 4;

/** A page of the panel See all opens (`guest-list.tsx`'s own page of names). */
export const LOOK_PAGE = 24;

/** The parts every item shares, from the row the page read and the link minted for it. */
function base(
  row: LookRowFacts,
  link: readonly [string, string, string | null, string, unknown],
): GridMedia {
  const [, tile, view, download] = link;
  return {
    id: row.id,
    type: row.type,
    // The original, for the viewer; the tile's small preview only where the item has one (a `view` of its own:
    // album-wire.ts says an item without a preview hands its original as the tile and no view).
    url: view ?? tile,
    previewUrl: view !== null ? tile : null,
    downloadUrl: download,
    // Only what the album shows is on a card (guest-look.ts), so every item is approved by construction.
    status: "approved",
    isHost: false,
    width: row.width,
    height: row.height,
    durationSeconds: row.duration,
  };
}

/** Rows in the page's order, each with its link where the minter found it (a row it dropped is no item). */
function joined<L extends { 0: string }>(
  rows: readonly LookRowFacts[],
  links: readonly L[],
): [LookRowFacts, L][] {
  const byId = new Map(links.map((l) => [l[0], l] as const));
  return rows.flatMap((row) => {
    const link = byId.get(row.id);
    return link ? [[row, link] as [LookRowFacts, L]] : [];
  });
}

/** The HOST's items: her credit's address beside the name (the host's who tuple), and each item's like count. */
export function hostLookItems(
  rows: readonly LookRowFacts[],
  links: readonly AlbumLinkTuple<HostWhoTuple>[],
  likes: Readonly<Record<string, number>> = {},
): GridMedia[] {
  return joined(rows, links).map(([row, link]) => {
    const who = link[4];
    return {
      ...base(row, link),
      uploaderName: who ? who[0] : null,
      isVerified: who ? (who[1] & WHO_VERIFIED) !== 0 : false,
      uploaderEmail: who ? who[2] : null,
      uploaderFace: faceFromTuple(who?.[3]),
      likeCount: likes[row.id] ?? 0,
    };
  });
}

/** The ALBUM's items: a name, its mark and a face where the album shows one, never an address (it has no slot). */
export function albumLookItems(
  rows: readonly LookRowFacts[],
  links: readonly AlbumLinkTuple<GuestWhoTuple>[],
): GridMedia[] {
  return joined(rows, links).map(([row, link]) => {
    const who = link[4];
    return {
      ...base(row, link),
      uploaderName: who ? who[0] : null,
      isVerified: who ? (who[1] & WHO_VERIFIED) !== 0 : false,
      uploaderFace: faceFromTuple(who?.[2]),
    };
  });
}
