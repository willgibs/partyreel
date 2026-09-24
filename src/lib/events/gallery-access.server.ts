/**
 * Server-only data loaders for the gated gallery, paired with the pure `gallery-access.ts`. Kept
 * separate so the pure resolver stays Vitest-loadable: this file imports the admin client (which is
 * `server-only` and throws outside a react-server bundle).
 */
import "server-only";

import {
  getEventMediaByQrToken,
  type GuestEvent,
  type GuestMediaRow,
} from "@/lib/db/queries/guest-events";
import {
  countApprovedMedia,
  getApprovedMediaForUnlock,
  getApprovedPhotoTeaser,
  getLiveReelServerFacts,
  getUploaderIdentities,
} from "@/lib/db/queries/guest-events-admin";
import { getUploadGate } from "@/lib/db/queries/guest-gate";
import { isDemoToken } from "@/lib/demo";
import {
  resolveGalleryDecision,
  TEASER_LIMIT,
  type GalleryAccess,
  type GalleryDecision,
} from "@/lib/events/gallery-access";
import { galleryEtag } from "@/lib/events/gallery-fingerprint";
import {
  reelFactsFor,
  type GalleryItem,
  type GalleryReel,
} from "@/lib/events/gallery-reel";
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
  // DELIBERATE SWALLOW (fail CLOSED): this decides the OWNER BYPASS on the guest
  // album. A failed read must resolve to "not the owner" (the viewer sees the
  // guest album) rather than throw and 500 the page a guest is standing in front
  // of at a venue. Degrade, never escalate, never crash.
  // eslint-disable-next-line partyreel/no-swallowed-db-error
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * The decision, plus one fact only the upload gate knows: the album cannot take another upload
 * (the presign's own two caps, `get_upload_gate`'s `album_full`). The gate FAILS OPEN on it, which
 * is why a guest's own last removal does not close a full album; the page reads it so the
 * lightbox never warns of a closing that will not happen. False whenever it was not read.
 */
export type ViewerDecision = GalleryDecision & { albumFull: boolean };

/**
 * THE ONE SERVER ENTRY FOR "WHAT DOES THIS VIEWER GET".
 *
 * The page RSC and the gallery poll both ask this rather than each carrying the same resolution:
 * with the upload gate it is eleven lines with a service-role read in the middle, which belongs in
 * one place, not two.
 *
 * ★ IT RESOLVES TWICE, AND THE FIRST PASS IS THE CHEAP ONE. Assuming a contribution short-circuits
 * the upload clause, so the password and account gates answer with NO extra read at all: a locked
 * event, and an unconfirmed viewer of a verified-emails event, never touch `get_upload_gate`. Only
 * a viewer who would otherwise see the full album, on an event whose switch is ON and whose uploads
 * are open, costs the round trip -- and that is exactly the population the gate is about.
 *
 * ★ THE DEMO NEVER REACHES HERE (both callers short-circuit it to full), and the host is the owner,
 * whom the resolver answers first.
 *
 * ★ `albumFull` COSTS A SECOND READ FOR A GUEST WHO HAS CONTRIBUTED, AND ONLY ON REQUEST. The gate
 * reads the caps only for a viewer who has NOT contributed (the only one its fail-open decides for),
 * so for a contributor its `album_full` is always false. The page asks (`withAlbumFull`), because
 * that viewer is the one whose own last removal the lightbox warns about: an identity-less gate read
 * is exactly the album's fullness (guest-gate.ts: no identity is an answer). The poll never asks, so
 * the steady poll pays nothing new.
 */
export async function resolveViewerDecision(
  event: GuestEvent,
  ctx: {
    isOwner: boolean;
    isAuthed: boolean;
    isUnlocked: boolean;
    userId: string | null;
    sessionToken: string | null;
  },
  opts: { withAlbumFull?: boolean } = {},
): Promise<ViewerDecision> {
  const optimistic = resolveGalleryDecision(event, {
    isOwner: ctx.isOwner,
    isAuthed: ctx.isAuthed,
    isUnlocked: ctx.isUnlocked,
    hasContributed: true,
    canContribute: true,
  });

  if (
    optimistic.access !== "full" ||
    !event.require_upload_to_view ||
    !event.accepting_uploads
  ) {
    return { ...optimistic, albumFull: false };
  }

  const gate = await getUploadGate({
    eventId: event.id,
    sessionToken: ctx.sessionToken,
    userId: ctx.userId,
  });

  const decision = resolveGalleryDecision(event, {
    isOwner: ctx.isOwner,
    isAuthed: ctx.isAuthed,
    isUnlocked: ctx.isUnlocked,
    hasContributed: gate.contributed,
    // The fail-open, spelled out: uploads are open (checked above), so the only thing that can
    // make a contribution impossible is a full album -- including the read having failed.
    canContribute: !gate.albumFull,
  });

  let albumFull = gate.albumFull;
  if (gate.contributed && opts.withAlbumFull) {
    albumFull = (
      await getUploadGate({
        eventId: event.id,
        sessionToken: null,
        userId: null,
      })
    ).albumFull;
  }
  return { ...decision, albumFull };
}

/** The un-presigned gallery for one viewer: rows + attribution + the teaser count + the album's size. */
export type GalleryRows = {
  rows: GuestMediaRow[];
  identities: Map<string, UploaderIdentity> | undefined;
  teaserTotal: number | null;
  /**
   * The album's size, photos and videos: `countApprovedMedia`'s head count, read beside the rows at
   * `teaser` and `full` (null at `none`, where the locked page's own stats say it and no gallery
   * mounts). It is the header's "N photos & videos" at every level the header shows it, so it
   * rides every payload, and the ETag hashes it: a video approved behind a nine-photo teaser changes
   * neither the rows nor `teaserTotal`, and without it in the hash that poll would 304 past the
   * new number.
   */
  approvedTotal: number | null;
};

/**
 * Fetch + cap the gallery ROWS for a resolved access level (no presigning -- the poll route
 * fingerprints these first and skips presigning entirely on a 304). The full set is NEVER fetched
 * for `teaser`; `none` fetches nothing. Identities, media and the album's head count load in
 * parallel (they're independent). Identity resolution skipped for the demo, matching the page.
 */
export async function loadGalleryRowsForAccess(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<GalleryRows> {
  if (access === "none")
    return {
      rows: [],
      identities: undefined,
      teaserTotal: null,
      approvedTotal: null,
    };

  const identitiesPromise = isDemoToken(event.qr_token)
    ? Promise.resolve(undefined)
    : getUploaderIdentities(event.id);
  const approvedTotalPromise = countApprovedMedia(event);

  if (access === "teaser") {
    const [identities, teaser, approvedTotal] = await Promise.all([
      identitiesPromise,
      getApprovedPhotoTeaser(event, TEASER_LIMIT),
      approvedTotalPromise,
    ]);
    return {
      rows: teaser.rows,
      identities,
      teaserTotal: teaser.total,
      approvedTotal,
    };
  }

  // full: the whole album, each arm read in keyset pages on the album's own display order.
  const [identities, rows, approvedTotal] = await Promise.all([
    identitiesPromise,
    event.visibility === "password"
      ? getApprovedMediaForUnlock(event.id) // self-guarded by the unlock cookie
      : getEventMediaByQrToken(event.qr_token), // anon RPC, gates on visibility='open'
    approvedTotalPromise,
  ]);
  return { rows, identities, teaserTotal: null, approvedTotal };
}

/**
 * The conditional-request validator for a loaded gallery: hashes the viewer-visible content
 * (ids in order + attribution exactly as toGridItems would emit it + the album's size) + the whole
 * DECISION + the current presign bucket. MUST mirror toGridItems' identity fallbacks
 * (`?? null/false`) or a 304 could hide an attribution change. Dimensions/duration are
 * deliberately NOT hashed (write-once per id - see gallery-fingerprint.ts).
 *
 * ★ THE GATE IS IN THE HASH, NOT JUST THE LEVEL. `teaser` has two causes, and the poll carries the
 * gate to the client's step machine: two decisions that differ only in WHY must never validate each
 * other, or a guest whose gate moved from `account` to `upload` would 304 onto the wrong step.
 */
export function galleryEtagFor(
  decision: GalleryDecision,
  gallery: GalleryRows,
  reel: GalleryReel | null = null,
): string {
  return galleryEtag({
    access: decision.access,
    gate: decision.gate,
    teaserTotal: gallery.teaserTotal,
    approvedTotal: gallery.approvedTotal,
    reel,
    bucketId: presignBucketId(Date.now()),
    items: gallery.rows.map((r) => {
      const who = gallery.identities?.get(r.id);
      return {
        id: r.id,
        type: r.type,
        uploaderName: who?.displayName ?? null,
        isHost: who?.isHost ?? false,
        isVerified: who?.isVerified ?? false,
      };
    }),
  });
}

/** Presign loaded rows into render-ready items (the expensive step a 304 skips). */
export async function presignGalleryRows(
  event: GuestEvent,
  gallery: GalleryRows,
): Promise<GalleryItem[]> {
  return toGridItems(gallery.rows, event.name, gallery.identities);
}

/**
 * THE LIVE REEL'S FACTS FOR THIS VIEWER: null below full access (nothing is read at all), else the
 * host's switch and mood off the event row this request already holds, beside the platform lever
 * and the host's plan (`getLiveReelServerFacts`, cached). The page and the poll both carry the
 * result, and the ETag hashes it, so a host's switch reaches an open album on the next poll. The
 * demo is full access and reads the same way.
 */
export async function loadGalleryReel(
  event: GuestEvent,
  access: GalleryAccess,
): Promise<GalleryReel | null> {
  if (access !== "full") return null;
  const facts = await getLiveReelServerFacts(event.id);
  return reelFactsFor({
    access,
    showReel: event.show_reel,
    liveReelEnabled: facts.liveReelEnabled,
    styleId: event.reel_style_id,
    tier: facts.tier,
  });
}

/**
 * The RSC composition: rows -> etag -> presigned items in one call, so the page and the poll
 * route share one source for "what media does THIS viewer get" (the route uses the split
 * phases directly to answer 304 before presigning). Takes the whole DECISION because the ETag
 * does: the first poll after the page must be able to 304 against what the page baked in.
 */
export async function loadGalleryForAccess(
  event: GuestEvent,
  decision: GalleryDecision,
): Promise<{
  items: GalleryItem[];
  teaserTotal: number | null;
  approvedTotal: number | null;
  reel: GalleryReel | null;
  etag: string;
}> {
  const [gallery, reel] = await Promise.all([
    loadGalleryRowsForAccess(event, decision.access),
    loadGalleryReel(event, decision.access),
  ]);
  const etag = galleryEtagFor(decision, gallery, reel);
  return {
    items: await presignGalleryRows(event, gallery),
    teaserTotal: gallery.teaserTotal,
    approvedTotal: gallery.approvedTotal,
    reel,
    etag,
  };
}
