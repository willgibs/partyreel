/**
 * Server-only data loaders for the gated gallery, paired with the pure `gallery-access.ts`. Kept
 * separate so the pure resolver stays Vitest-loadable: this file imports the admin client (which is
 * `server-only` and throws outside a react-server bundle).
 */
import "server-only";

import {
  firstPaintIds,
  type RowRhythm,
} from "@/components/shared/album-window-plan";
import {
  readGuestAlbum,
  readGuestAlbumMedia,
  readGuestAlbumVersions,
  readGuestAttribution,
  readGuestManifestPage,
} from "@/lib/db/queries/album-guest";
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
import { toGuestAlbumLinks } from "@/lib/events/album-guest-links";
import { planAlbumSync } from "@/lib/events/album-sync";
import { guestAlbumEtag } from "@/lib/events/album-validator";
import type { AlbumManifestPart } from "@/lib/events/album-wire";
import {
  resolveGalleryDecision,
  TEASER_LIMIT,
  type GalleryAccess,
  type GalleryDecision,
} from "@/lib/events/gallery-access";
import { reelFactsFor, type GalleryReel } from "@/lib/events/gallery-reel";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import { toGridItems } from "@/lib/r2/grid-items";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";
import type { RowStep } from "@/lib/shared/album-rows";

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
  /** The album's size, photos and videos: `countApprovedMedia`'s head count (null at `none`). */
  approvedTotal: number | null;
};

/**
 * Fetch + cap the gallery ROWS for a resolved access level, WHOLE: the one reader that needs every
 * row a viewer may have is "Download all" (`/api/export/guest`), which zips exactly what the album
 * shows this viewer. The album itself pages (`loadGallerySeed`, then links by id). The full set is
 * NEVER fetched for `teaser`; `none` fetches nothing. Identities, media and the album's head count
 * load in parallel. Identity resolution skipped for the demo.
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
    holdSec: event.reel_hold_sec,
    tier: facts.tier,
  });
}

/**
 * THE GUEST ALBUM'S SEED, FOR THE PAGE'S RENDER (the album-guest-wiring lane): exactly what the album's
 * own routes would answer this viewer's first asks with, so the client store adopts it as its first
 * sync (`gallery-seed.ts`) and the first screen paints with no round trip.
 *
 *  - `full`: the manifest's first answer, planned by the SAME function the sync route runs
 *    (`planAlbumSync` with no version: the versions and the approved count in one snapshot, then the
 *    first manifest page, read through the guest reads' own gate), its validator (the sync route's,
 *    so the first real poll can 304), and the links of exactly the photographs the first paint draws
 *    (`firstPaintIds`, the rows' own first-paint plan), minted the way the links route mints them.
 *  - `teaser`: today's tiny inline teaser (the nine newest photographs, links and names, never an
 *    address), with the teaser's rolling validator.
 *  - `locked`: nothing; a locked page mounts no album.
 *
 * ★ THE PAGE PAYS FOR A SCREEN, NOT FOR THE ALBUM. The old seed read the whole album and presigned
 * three links an item (about 2 MB for 1,145 photographs); this reads the album as light tuples and
 * presigns only the first paint's photographs. The rest arrive by id, per window, from the browser.
 */
export async function loadGallerySeed(
  event: GuestEvent,
  decision: GalleryDecision,
  firstPaint: {
    step: RowStep;
    rhythm: RowRhythm;
    seed: number;
    /** The width the album last laid its rows at (`pr_album_w`), or null cold. */
    width: number | null;
  },
): Promise<GallerySeed> {
  if (decision.access === "none") return { kind: "locked" };
  const isDemo = isDemoToken(event.qr_token);

  if (decision.access === "teaser") {
    const [versions, teaser, approvedTotal] = await Promise.all([
      readGuestAlbumVersions(event),
      getApprovedPhotoTeaser(event, TEASER_LIMIT),
      countApprovedMedia(event),
    ]);
    // Attribution for the nine alone, and never an address (the paged album's by-id read).
    const identities = isDemo
      ? undefined
      : ((await readGuestAttribution(
          event,
          teaser.rows.map((r) => r.id),
        )) ?? undefined);
    const items = await toGridItems(teaser.rows, event.name, identities);
    return {
      kind: "teaser",
      sync: {
        ok: true,
        kind: "teaser",
        access: "teaser",
        gate: decision.gate,
        items,
        teaserTotal: teaser.total,
        approvedTotal,
      },
      etag: versions
        ? guestAlbumEtag({
            eventId: event.id,
            access: "teaser",
            gate: decision.gate,
            albumMax: versions.albumMax,
            attrVersion: versions.attrVersion,
            reel: null,
            bucketId: presignBucketId(Date.now()),
          })
        : null,
    };
  }

  const reelPromise = loadGalleryReel(event, "full");
  const plan = await planAlbumSync({
    scope: "album",
    since: null,
    read: async (after, limit) => {
      const read = await readGuestAlbum(event, after, limit);
      if (!read)
        throw new Error("album: the guest read refused a full-access viewer");
      return read;
    },
    page: async (after, budget) => {
      const page = await readGuestManifestPage(event, after, budget);
      if (!page)
        throw new Error("album: the guest page refused a full-access viewer");
      return page;
    },
  });
  // No version was sent, so the plan is always a manifest (album-sync.ts, the first rule).
  const part = plan.part as AlbumManifestPart;
  const reel = await reelPromise;

  // The first paint's photographs, and only those, get their links in the render.
  const ids = firstPaintIds(
    part.entries.map(([id, width, height]) => ({ id, width, height })),
    firstPaint,
  );
  const bucket = Number(presignBucketId(Date.now()));
  const now = Date.now();
  const media =
    ids.length > 0
      ? await readGuestAlbumMedia(event, ids, { attribute: !isDemo })
      : { rows: [], identities: null };
  const links = media
    ? await toGuestAlbumLinks(media.rows, {
        eventName: event.name,
        presign: (key, downloadFilename) =>
          presignDownload({ key, stable: true, downloadFilename }),
        identities: media.identities,
      })
    : [];
  const found = new Set(links.map((l) => l[0]));

  return {
    kind: "full",
    sync: {
      ...part,
      ok: true,
      access: "full",
      gate: null,
      total: plan.read.approved,
      reel,
    },
    etag: guestAlbumEtag({
      eventId: event.id,
      access: "full",
      gate: null,
      albumMax: plan.read.albumMax,
      attrVersion: plan.read.attrVersion,
      reel,
    }),
    links: {
      ok: true,
      access: "full",
      gate: null,
      b: bucket,
      now,
      links,
      missing: ids.filter((id) => !found.has(id)),
    },
  };
}
