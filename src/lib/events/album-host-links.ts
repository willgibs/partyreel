/**
 * THE HOST'S LINKS BY ID: the guest's three presigns (`album-guest-links.ts`), plus the one thing
 * only the host sees, the uploader's PROVED email (resolveUploaderIdentity returns an address only
 * for a verified guest, never a typed or pending one). The paged album's twin of the host gallery's
 * mapper (`lib/event/gallery-items.ts`), and like it the only builder that carries an address.
 */
import type { AlbumKeyRow } from "@/lib/db/queries/album-guest";
import type { AlbumPresigner } from "@/lib/events/album-guest-links";
import {
  WHO_HOST,
  WHO_VERIFIED,
  type AlbumLinkTuple,
  type HostWhoTuple,
} from "@/lib/events/album-wire";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";

/** The host's attribution tuple: the name, the two flags and the proved address. */
export function hostWho(who: UploaderIdentity): HostWhoTuple {
  const flags =
    (who.isHost ? WHO_HOST : 0) | (who.isVerified ? WHO_VERIFIED : 0);
  return [who.displayName, flags, who.email];
}

export async function toHostAlbumLinks(
  rows: readonly AlbumKeyRow[],
  opts: {
    eventName: string;
    presign: AlbumPresigner;
    identities: ReadonlyMap<string, UploaderIdentity>;
  },
): Promise<AlbumLinkTuple<HostWhoTuple>[]> {
  return Promise.all(
    rows.map(async (m) => {
      const [view, download, preview] = await Promise.all([
        opts.presign(m.original_key),
        opts.presign(
          m.original_key,
          buildDownloadFilename({
            eventName: opts.eventName,
            key: m.original_key,
            type: m.type,
          }),
        ),
        m.preview_key ? opts.presign(m.preview_key) : Promise.resolve(null),
      ]);
      const who = opts.identities.get(m.id);
      const link: AlbumLinkTuple<HostWhoTuple> = [
        m.id,
        preview ?? view,
        preview ? view : null,
        download,
        who ? hostWho(who) : null,
      ];
      return link;
    }),
  );
}
