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
  planGuestAlbumSync,
  readGuestAlbumMedia,
  readGuestAlbumVersions,
  readGuestAttribution,
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
import { guestAlbumEtag } from "@/lib/events/album-validator";
import type { AlbumManifestPart } from "@/lib/events/album-wire";
import {
  resolveGalleryDecision,
  TEASER_LIMIT,
  type GalleryAccess,
  type GalleryDecision,
} from "@/lib/events/gallery-access";
import {
  liveReelAvailable,
  reelFactsFor,
  type GalleryReel,
} from "@/lib/events/gallery-reel";
import type { GallerySeed } from "@/lib/events/gallery-seed";
import { createReelItems } from "@/lib/guest/reconcile-album-items";
import { tileStills } from "@/lib/guest/reel-tile";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import { captureWarning } from "@/lib/observability/sentry";
import { toGridItems } from "@/lib/r2/grid-items";
import { presignDownload } from "@/lib/r2/presign";
import { presignBucketId } from "@/lib/r2/presign-bucket";
import type { RowStep } from "@/lib/shared/album-rows";

// The owner idea's home is `gallery-access-owner.server.ts` (so the album's reads can ask it without
// importing this module, which reads through them); its callers keep importing it from here.
export { isEventOwner } from "@/lib/events/gallery-access-owner.server";

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
 * The page RSC, the album's routes (`album-viewer.server.ts`) and the export all ask this rather than
 * each carrying the same resolution: with the upload gate it is eleven lines with a service-role
 * read in the middle, which belongs in one place.
 *
 * ★ IT RESOLVES TWICE, AND THE FIRST PASS IS THE CHEAP ONE. Assuming a contribution short-circuits
 * the upload clause, so the password and account gates answer with NO extra read at all: a locked
 * event, and an unconfirmed viewer of a verified-emails event, never touch `get_upload_gate`. Only
 * a viewer who would otherwise see the full album, on an event whose switch is ON and whose uploads
 * are open, costs the round trip -- and that is exactly the population the gate is about.
 *
 * ★ THE DEMO NEVER REACHES HERE (every caller short-circuits it to full), and the host is the owner,
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
      ? getApprovedMediaForUnlock(event.id) // self-guarded: the unlock cookie, or the host
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
 *    (`planGuestAlbumSync` with no version: through the guest reads' own gate, the versions and the
 *    approved count in one snapshot, then the first manifest page), its validator (the sync route's,
 *    so the first real poll can 304), and the links of exactly the photographs the first paint draws
 *    (`firstPaintIds`, the rows' own first-paint plan), minted the way the links route mints them.
 *  - `teaser`: today's tiny inline teaser (the nine newest photographs, links and names, never an
 *    address), with the teaser's rolling validator.
 *  - `locked`: nothing; a locked page mounts no album. Also the answer when the reads' gate refuses
 *    a viewer the decision let in, exactly as the sync route answers it.
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

  // The plan and the reel's facts read in parallel and awaited TOGETHER: one left running while the
  // other failed would reject later with nobody holding it (an unhandled rejection).
  const [plan, reel] = await Promise.all([
    planGuestAlbumSync(event, null),
    loadGalleryReel(event, "full"),
  ]);
  // ★ A REFUSAL IS LOCKED, NEVER A THROW (album-guest.ts): the page mounts no album, and the
  // disagreement between the decision and the reads is reported rather than silent.
  if (!plan) {
    reportAlbumRefused(event.id, "seed");
    return { kind: "locked" };
  }
  // No version was sent, so the plan is always a manifest (album-sync.ts, the first rule).
  const part = plan.part as AlbumManifestPart;

  // The first paint's photographs get their links in the render, and so do the Highlight reel
  // tile's stills (the reel's own first pass, `tileStills`), so the tile stands with its pictures
  // from the first byte rather than arriving late and pushing the album down.
  const ids = firstPaintIds(
    part.entries.map(([id, width, height]) => ({ id, width, height })),
    firstPaint,
  );
  const reelItems = createReelItems()(part.entries);
  if (liveReelAvailable(reel, reelItems)) {
    const have = new Set(ids);
    for (const { id } of tileStills(reelItems, { eventId: event.id }))
      if (!have.has(id)) {
        have.add(id);
        ids.push(id);
      }
  }
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

/**
 * THE SEED AS THE PAGE STREAMS IT: `loadGallerySeed`, handed to the client UN-awaited so the shell
 * paints first, with a handler attached the moment the promise exists.
 *
 * ★ WHY THE HANDLER. React attaches its own only when it serializes the prop, after every read the
 * page still awaits (the stats, the guest list, the host card). A seed that failed before then had no
 * handler at all: Node reports an unhandled rejection, and on Vercel the function exits (status 128),
 * which is how the host's own password album died in build 10's red-team. The handler only marks the
 * rejection handled: the failure still reaches `use()` and the guest error screen, and React still
 * reports it.
 */
export function streamGallerySeed(
  ...args: Parameters<typeof loadGallerySeed>
): Promise<GallerySeed> {
  const seed = loadGallerySeed(...args);
  seed.catch(() => {});
  return seed;
}

/**
 * The album's reads refused a viewer its decision let in (`teaser` or `full`): the two lines of the
 * gate disagree, which only a race or a bug can make. Whoever meets it answers locked; this makes
 * the disagreement a signal rather than a silence (the routes answered the host's own password album
 * locked without a word; only the page's crash on the same refusal showed it).
 */
export function reportAlbumRefused(
  eventId: string,
  surface: "seed" | "sync" | "media" | "manifest",
): void {
  captureWarning(
    "security",
    "album: the reads refused a viewer the decision let in",
    {
      eventId,
      surface,
    },
  );
}
