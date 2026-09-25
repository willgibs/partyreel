/**
 * THE GUEST'S LINKS BY ID: a window's rows as `AlbumLinkTuple`s, the paged album's twin of
 * `toGridItems` (grid-items.ts), the guest-facing builder the gallery payload uses.
 *
 * Three presigns an item, all STABLE inside the current 30-minute bucket (presign-bucket.ts), so a
 * re-mint inside a bucket is byte-identical and the browser's image cache holds across windows:
 *   - `tile`: the small WebP preview, or the original when the row has none;
 *   - `view`: the inline original, sent as null when it IS the tile (no preview), since the client
 *     reads `view ?? tile`;
 *   - `download`: the original as an attachment, under the event's friendly filename.
 *
 * ★ A NAME AND TWO FLAGS, NEVER AN ADDRESS. Attribution is copied field by field (the name, whether
 * the host uploaded it, whether an email was proved), never spread, so the day `UploaderIdentity`
 * grows a field this tuple does not grow with it. The guest path never even reads `guests.email`
 * (`readAlbumAttribution` with `withEmail: false`); `grid-items.email-safety.test.ts` reads this file
 * and refuses every spelling of an address in it.
 *
 * Pure: the presigner is handed in (the route passes `presignDownload`), so this runs in the node
 * test project.
 */
import type { AlbumKeyRow } from "@/lib/db/queries/album-guest";
import {
  WHO_HOST,
  WHO_VERIFIED,
  type AlbumLinkTuple,
  type GuestWhoTuple,
} from "@/lib/events/album-wire";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";

/** A stable presign of one key; with a filename, the attachment variant. */
export type AlbumPresigner = (
  key: string,
  downloadFilename?: string,
) => Promise<string>;

/** The guest's attribution tuple: the name and two flags, copied by name. */
export function guestWho(who: UploaderIdentity): GuestWhoTuple {
  const flags =
    (who.isHost ? WHO_HOST : 0) | (who.isVerified ? WHO_VERIFIED : 0);
  return [who.displayName, flags];
}

export async function toGuestAlbumLinks(
  rows: readonly AlbumKeyRow[],
  opts: {
    eventName: string;
    presign: AlbumPresigner;
    /** Null names nobody (the demo). An id missing from the map gets no attribution. */
    identities: ReadonlyMap<string, UploaderIdentity> | null;
  },
): Promise<AlbumLinkTuple<GuestWhoTuple>[]> {
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
      const who = opts.identities?.get(m.id);
      const link: AlbumLinkTuple<GuestWhoTuple> = [
        m.id,
        preview ?? view,
        preview ? view : null,
        download,
        who ? guestWho(who) : null,
      ];
      return link;
    }),
  );
}
