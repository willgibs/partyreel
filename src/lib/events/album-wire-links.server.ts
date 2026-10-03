/**
 * A GUEST'S LINKS, MINTED BY ID: the one home for the links route's answer (`/api/album/guest/media`) and the links a
 * delta carries for its new items (`/api/album/guest/sync`, album-calm), so the two can never mint differently (a
 * different presign is a different URL, and a tile the browser already holds would load again).
 *
 *  - The bucket (`b`) and the server's clock (`now`) are read BEFORE minting: a bucket that rolls mid-request only
 *    makes a link outlive the client's estimate, never die before it.
 *  - The rows come through the reads' own gate (`readGuestAlbumMedia`): approved, unsealed and this album's, so an id
 *    that is held, sealed, removed, hidden or another album's mints nothing, and the caller says which were found.
 *  - Three STABLE presigns an item and a name with no address (`toGuestAlbumLinks`); the demo names nobody.
 *
 * Null when the reads' gate refuses the viewer (a password album without its cookie): the caller answers that.
 */
import "server-only";

import { readGuestAlbumMedia } from "@/lib/db/queries/album-guest";
import type { GuestEvent } from "@/lib/db/queries/guest-events";
import { toGuestAlbumLinks } from "@/lib/events/album-guest-links";
import type { AlbumCarriedLinks } from "@/lib/events/album-wire";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";

export type MintedGuestLinks = AlbumCarriedLinks & {
  /** The asked ids the gated read found; every other one is `missing` to the links route. */
  found: ReadonlySet<string>;
};

export async function mintGuestAlbumLinks(
  event: Pick<GuestEvent, "id" | "name" | "visibility" | "doorPass">,
  ids: readonly string[],
  opts: { isDemo: boolean },
): Promise<MintedGuestLinks | null> {
  const b = Number(presignBucketId(Date.now()));
  const now = Date.now();
  const read = await readGuestAlbumMedia(event, ids, {
    attribute: !opts.isDemo,
  });
  if (!read) return null;
  const links = await toGuestAlbumLinks(read.rows, {
    eventName: event.name,
    presign: (key, downloadFilename) =>
      presignDownload({ key, stable: true, downloadFilename }),
    identities: read.identities,
  });
  return { b, now, links, found: new Set(read.rows.map((r) => r.id)) };
}
