import { NextResponse } from "next/server";
import { z } from "zod";

import {
  countApprovedMedia,
  getApprovedPhotoTeaser,
  getGuestCount,
} from "@/lib/db/queries/guest-events-admin";
import {
  ALBUM_REFUSED,
  planGuestAlbumSync,
  readGuestAlbumVersions,
  readGuestAttribution,
} from "@/lib/db/queries/album-guest";
import { guestAlbumEtag } from "@/lib/events/album-validator";
import { resolveAlbumViewer } from "@/lib/events/album-viewer.server";
import type {
  GuestFullSync,
  GuestLockedSync,
  GuestTeaserSync,
} from "@/lib/events/album-wire";
import { TEASER_LIMIT } from "@/lib/events/gallery-access";
import {
  loadGalleryReel,
  reportAlbumRefused,
} from "@/lib/events/gallery-access.server";
import { guestCookieHeaderValue } from "@/lib/guest/session-cookie";
import { toGridItems } from "@/lib/r2/grid-items";
import { presignBucketId } from "@/lib/r2/presign-bucket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * THE PAGED ALBUM'S POLL, FOR A GUEST. Body: `{ qr_token, since?, session_token? }`, where `since` is
 * the album version the client holds (none on a first load).
 *
 * WHAT IT ANSWERS, by the viewer's decision (resolved exactly as the gallery poll resolves it,
 * `resolveAlbumViewer`, so the gates are today's):
 *  - `locked` for a private, unknown or password-locked album: nothing, and no validator. Also the
 *    answer, behind the password, when the reads' own gate refuses a viewer the decision let in
 *    (album-guest.ts: a refusal is a null, never a 500);
 *  - `teaser`: today's tiny inline payload (the newest nine photographs, links and all, the album's
 *    size and the photo total), because no link route serves a viewer still at the door;
 *  - `full`: the paged album (album-sync.ts): a MANIFEST on a first load or a resync, else the DELTA
 *    since `since`, with the album's approved count read in the same snapshot and the live reel's
 *    facts.
 *
 * ★ A QUIET POLL IS ONE ROW. At full access the validator is built from the event's `album_state`
 * row and the decision (album-validator.ts), read BEFORE anything else, so a matching
 * `If-None-Match` answers a bare 304 having read one row: today's poll re-read the whole album and
 * its attribution sweep to build its ETag. The 200's ETag is recomputed from the snapshot its
 * content came from, so it can only ever claim an older version than it carries, never a newer
 * one: the worst a race costs is one redundant 200, never a stale 304.
 *
 * TODAY'S ROUTE RULES, KEPT:
 *  - no validator on the locked early return (it must never 304-validate a real payload);
 *  - ★ none while a session-cookie heal is pending: Vercel's EDGE turns a validator-matching 200
 *    into a 304 and strips its Set-Cookie, so a response the browser must receive carries no
 *    validator it could present back (the gallery poll's head comment has the measurement);
 *  - never across access levels or gates (both are hashed);
 *  - a 304 only for a client that holds an album (`since`) at full access: a first load always
 *    gets its manifest.
 *  - The guest count ("from M guests") rides a 200, read after the 304 check, never the validator.
 *
 * No request limiter, like the gallery poll it replaces: a read behind the capability, and a
 * limiter row per poll would turn a venue's phones into write load (database-security.md, "Limit
 * abuse, never volume"). The manifest's Questions carry the call.
 */
const bodySchema = z.object({
  qr_token: z.string().min(1).max(200),
  since: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  session_token: z.string().min(1).max(200).optional(),
});

const NO_STORE = "private, no-store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const { qr_token: qrToken, since = null, session_token } = parsed.data;

  const viewer = await resolveAlbumViewer(qrToken, session_token);
  if (viewer.kind === "gone") return locked(null);
  const { event, decision, isDemo, heal } = viewer;

  const headers = new Headers({ "Cache-Control": NO_STORE });
  if (heal) headers.append("Set-Cookie", guestCookieHeaderValue(heal));
  const ifNoneMatch = request.headers.get("if-none-match");

  if (decision.access === "none") return locked(decision.gate, headers);

  // Everything after the decision reads through the guarded queries: a null is the gate refusing
  // (a password album without its cookie, and not its host), which the decision should already
  // have caught. Answered locked, and reported.
  const versions = await readGuestAlbumVersions(event);
  if (!versions) return refused(event.id, headers);

  if (decision.access === "teaser") {
    const etag = guestAlbumEtag({
      eventId: event.id,
      access: "teaser",
      gate: decision.gate,
      albumMax: versions.albumMax,
      attrVersion: versions.attrVersion,
      reel: null,
      bucketId: presignBucketId(Date.now()),
    });
    if (!heal) {
      headers.set("ETag", etag);
      if (ifNoneMatch === etag)
        return new Response(null, { status: 304, headers });
    }
    const [teaser, approvedTotal, guestCount] = await Promise.all([
      getApprovedPhotoTeaser(event, TEASER_LIMIT),
      countApprovedMedia(event),
      isDemo ? Promise.resolve(undefined) : getGuestCount(event),
    ]);
    // Attribution for the nine alone, and never an address: the paged album's by-id read, where the
    // gallery swept every row of the album to name nine.
    const identities = isDemo
      ? undefined
      : ((await readGuestAttribution(
          event,
          teaser.rows.map((r) => r.id),
        )) ?? undefined);
    const items = await toGridItems(teaser.rows, event.name, identities);
    const payload: GuestTeaserSync = {
      ok: true,
      kind: "teaser",
      access: "teaser",
      gate: decision.gate,
      items,
      teaserTotal: teaser.total,
      approvedTotal,
      ...(guestCount === undefined ? {} : { guestCount }),
    };
    return NextResponse.json(payload, { headers });
  }

  // FULL: the paged album.
  const reel = await loadGalleryReel(event, "full");
  const quietEtag = guestAlbumEtag({
    eventId: event.id,
    access: "full",
    gate: null,
    albumMax: versions.albumMax,
    attrVersion: versions.attrVersion,
    reel,
  });
  if (!heal && since !== null && ifNoneMatch === quietEtag) {
    headers.set("ETag", quietEtag);
    return new Response(null, { status: 304, headers });
  }

  const plan = await planGuestAlbumSync(event, since);
  if (!plan) return refused(event.id, headers);
  if (!heal) {
    headers.set(
      "ETag",
      guestAlbumEtag({
        eventId: event.id,
        access: "full",
        gate: null,
        albumMax: plan.read.albumMax,
        attrVersion: plan.read.attrVersion,
        reel,
      }),
    );
  }
  const guestCount = isDemo ? undefined : await getGuestCount(event);
  const payload: GuestFullSync = {
    ...plan.part,
    ok: true,
    access: "full",
    gate: null,
    total: plan.read.approved,
    reel,
    ...(guestCount === undefined ? {} : { guestCount }),
  };
  return NextResponse.json(payload, { headers });
}

/** The reads refused a viewer the decision let in: locked behind the password, and reported. */
function refused(eventId: string, headers: Headers) {
  reportAlbumRefused(eventId, "sync");
  return locked(ALBUM_REFUSED.gate, headers);
}

/** A locked, private or unknown album: nothing at all, and never a validator. */
function locked(gate: GuestLockedSync["gate"], headers?: Headers) {
  const payload: GuestLockedSync = {
    ok: true,
    kind: "locked",
    access: "none",
    gate,
  };
  const out = headers ?? new Headers({ "Cache-Control": NO_STORE });
  out.delete("ETag");
  return NextResponse.json(payload, { headers: out });
}
