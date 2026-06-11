/**
 * Server-only data loaders for the gated gallery, paired with the pure `gallery-access.ts`. Kept
 * separate so the pure resolver stays Vitest-loadable: this file imports the admin client (which is
 * `server-only` and throws outside a react-server bundle).
 */
import "server-only";

import type { GridMedia } from "@/components/app/media-grid";
import {
  getEventMediaByQrToken,
  type GuestEvent,
  type GuestMediaRow,
} from "@/lib/db/queries/guest-events";
import {
  getApprovedMediaForUnlock,
  getApprovedPhotoTeaser,
  getUploaderIdentities,
} from "@/lib/db/queries/guest-events-admin";
import { isDemoToken } from "@/lib/demo";
import { TEASER_LIMIT, type GalleryAccess } from "@/lib/events/gallery-access";
import { galleryEtag } from "@/lib/events/gallery-fingerprint";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import { toGridItems } from "@/lib/r2/grid-items";
import { presignBucketId } from "@/lib/r2/presign-bucket";

// The exact type `createClient()` resolves to, with no top-level import (so generic arity can never
// drift from the real server client).
type ServerSupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

/**
 * Is `userId` the host of this event? The owner bypass for the gallery gate.
 *
 * Matches `host_id = userId` EXPLICITLY rather than relying on the `events` SELECT RLS policy alone
 * (which also permits reading any `open` event, so an id-only select would wrongly treat any signed-in
 * viewer as the owner). With the host_id filter the RLS-scoped read returns a row ONLY for the real
 * host. Reuses the caller's RLS-scoped client; run only when a user is present.
 */
export async function isEventOwner(
  eventId: string,
  userId: string,
  supabase: ServerSupabaseClient,
): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** The un-presigned gallery for one viewer: rows + attribution + the teaser count. */
export type GalleryRows = {
  rows: GuestMediaRow[];
  identities: Map<string, UploaderIdentity> | undefined;
  teaserTotal: number | null;
};

/**
 * Fetch + cap the gallery ROWS for a resolved access level (no presigning -- the poll route
 * fingerprints these first and skips presigning entirely on a 304). The full set is NEVER fetched
 * for `teaser`; `none` fetches nothing. Identities + media load in parallel (they're independent;
 * this was sequential pre-Phase-3). Identity resolution skipped for the demo, matching the page.
 */
export async function loadGalleryRowsForAccess(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<GalleryRows> {
  if (access === "none")
    return { rows: [], identities: undefined, teaserTotal: null };

  const identitiesPromise = isDemoToken(event.qr_token)
    ? Promise.resolve(undefined)
    : getUploaderIdentities(event.id);

  if (access === "teaser") {
    const [identities, teaser] = await Promise.all([
      identitiesPromise,
      getApprovedPhotoTeaser(event, TEASER_LIMIT),
    ]);
    return { rows: teaser.rows, identities, teaserTotal: teaser.total };
  }

  // full
  const [identities, rows] = await Promise.all([
    identitiesPromise,
    event.visibility === "password"
      ? getApprovedMediaForUnlock(event.id) // self-guarded by the unlock cookie
      : getEventMediaByQrToken(event.qr_token), // anon RPC, gates on visibility='open'
  ]);
  return { rows, identities, teaserTotal: null };
}

/**
 * The conditional-request validator for a loaded gallery: hashes the viewer-visible content
 * (ids in order + attribution exactly as toGridItems would emit it) + the access level +
 * the current presign bucket. MUST mirror toGridItems' identity fallbacks (`?? null/false`)
 * or a 304 could hide an attribution change.
 */
export function galleryEtagFor(
  access: GalleryAccess,
  gallery: GalleryRows,
): string {
  return galleryEtag({
    access,
    teaserTotal: gallery.teaserTotal,
    bucketId: presignBucketId(Date.now()),
    items: gallery.rows.map((r) => {
      const who = gallery.identities?.get(r.id);
      return {
        id: r.id,
        type: r.type,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        isAnonymous: who?.isAnonymous ?? false,
      };
    }),
  });
}

/** Presign loaded rows into render-ready GridMedia (the expensive step a 304 skips). */
export async function presignGalleryRows(
  event: GuestEvent,
  gallery: GalleryRows,
): Promise<GridMedia[]> {
  return toGridItems(gallery.rows, event.name, gallery.identities);
}

/**
 * The RSC composition: rows -> etag -> presigned items in one call, so the page and the poll
 * route share one source for "what media does THIS viewer get" (the route uses the split
 * phases directly to answer 304 before presigning).
 */
export async function loadGalleryForAccess(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<{ items: GridMedia[]; teaserTotal: number | null; etag: string }> {
  const gallery = await loadGalleryRowsForAccess(event, access);
  const etag = galleryEtagFor(access, gallery);
  return {
    items: await presignGalleryRows(event, gallery),
    teaserTotal: gallery.teaserTotal,
    etag,
  };
}
