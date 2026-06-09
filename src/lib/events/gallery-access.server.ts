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
import { toGridItems } from "@/lib/r2/grid-items";

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

/**
 * Fetch + cap + presign the gallery for a resolved access level, so the RSC and the poll are identical
 * (one source for "what media does THIS viewer get"). The full set is NEVER fetched for `teaser`;
 * `none` fetches nothing. Uploader identities resolve here (skipped for the demo, matching the page).
 */
export async function loadGalleryForAccess(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<{ items: GridMedia[]; teaserTotal: number | null }> {
  if (access === "none") return { items: [], teaserTotal: null };

  const identities = isDemoToken(event.qr_token)
    ? undefined
    : await getUploaderIdentities(event.id);

  if (access === "teaser") {
    const { rows, total } = await getApprovedPhotoTeaser(event, TEASER_LIMIT);
    return {
      items: await toGridItems(rows, event.name, identities),
      teaserTotal: total,
    };
  }

  // full
  const media: GuestMediaRow[] =
    event.visibility === "password"
      ? await getApprovedMediaForUnlock(event.id) // self-guarded by the unlock cookie
      : await getEventMediaByQrToken(event.qr_token); // anon RPC, gates on visibility='open'
  return {
    items: await toGridItems(media, event.name, identities),
    teaserTotal: null,
  };
}
