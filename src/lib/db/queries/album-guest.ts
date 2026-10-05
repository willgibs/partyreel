/**
 * THE GUEST'S PAGED ALBUM READS: the versions, the plan (a manifest or a delta), the manifest pages
 * and the rows behind a window's links. The service role reads them (the change log is deny-all, and
 * a password album's media never flows through the anon RPC), so each one CARRIES ITS OWN GATE rather
 * than trusting its caller: an open album reads; a password album reads for a request holding its
 * signed unlock cookie, or for its OWNER (the host never meets the password door, so never holds the
 * cookie); anything else (private, deleted, unknown) reads nothing and answers null.
 *
 * The routes and the page decide first (get_event_by_qr_token, then resolveViewerDecision: only
 * `teaser` and `full` reach here), so this gate is the second line, there so a careless caller can
 * never hand an arbitrary event id to a service-role read and dump a locked album. Its idea of the
 * owner is theirs (`isRequestOwner`: `getUser()`, then the explicit `host_id` match), so the two lines
 * agree on who the host is.
 *
 * ★ A REFUSAL IS A NULL, NEVER AN EXCEPTION. A caller answers it as locked. The one refusal that
 * threw (the plan's, when this gate was cookie-only) took down the host's own password album: the
 * page let the owner in, this gate refused them, and the throw escaped the page's un-awaited seed.
 *
 * Every read is the album's approved items only, in its own order `(created_at desc, id desc)`, the
 * keyset `olderThan` shares with the gallery's two arms.
 */
import "server-only";

import {
  albumCursorOf,
  olderThan,
  type AlbumCursor as RowCursor,
  type GuestEvent,
} from "@/lib/db/queries/guest-events";
import {
  readAlbumAttribution,
  readAlbumVersions,
  readGuestAlbumChanges,
  type AlbumVersions,
} from "@/lib/db/queries/album-state";
import { inChunks, readAllPages, type PageResult } from "@/lib/db/read-all";
import { mustQuery } from "@/lib/db/must-query";
import type { Tables } from "@/lib/db/types";
import {
  planAlbumSync,
  type ManifestPage,
  type Plan,
} from "@/lib/events/album-sync";
import {
  microsToTimestamp,
  timestampToMicros,
  toManifestEntry,
  type AlbumCursor,
} from "@/lib/events/album-wire";
import { NOTHING_WAITING, type WaitingFacts } from "@/lib/disposable/facts";
import { nowIso, unsealedFilter } from "@/lib/disposable/seal";
import { holdsDoorPass } from "@/lib/event/door/pass.server";
import { isRequestOwner } from "@/lib/events/gallery-access-owner.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { withUploaderFaces } from "@/lib/media/uploader-faces";
import type { UploaderIdentity } from "@/lib/media/uploader-identity";
import { createAdminClient } from "@/lib/supabase/admin";

type AlbumEvent = Pick<GuestEvent, "id" | "visibility" | "doorPass">;

/** An item behind a window's links: its keys (which never leave the server) and its type. */
export type AlbumKeyRow = {
  id: string;
  type: "photo" | "video";
  original_key: string;
  preview_key: string | null;
};

/**
 * What a refused read's caller answers: the album locked behind its password, exactly the decision a
 * viewer without the cookie gets. Only the password clause below ever refuses a caller (an open
 * album always reads, and a private or unknown one never reaches a read).
 */
export const ALBUM_REFUSED = { access: "none", gate: "password" } as const;

/**
 * THE GATE every read here carries: open reads; password reads with the unlock cookie or for the
 * event's owner; anything else, nothing. The cookie is asked first, so an unlocked guest never pays
 * an auth read, and past the viewer decision only the host ever reaches the owner check.
 */
async function albumReadable(event: AlbumEvent): Promise<boolean> {
  if (event.visibility === "open") return true;
  // ★ THE DOOR'S PASS (the doors, event-settings r1): a gated album (stored private, with its gate)
  // reads for a request its door let through, and a password album for a guest already in who holds
  // no unlock cookie. The pass is the door's own object, issued per request after
  // `event_door_standing` said so (`lib/event/door/pass.server.ts`), never a shape a caller can build.
  if (holdsDoorPass(event)) return true;
  if (event.visibility !== "password") return false;
  return (await isUnlocked(event.id)) || isRequestOwner(event.id);
}

/** The versions behind a guest's validator: one row. Null past the gate. */
export async function readGuestAlbumVersions(
  event: AlbumEvent,
): Promise<AlbumVersions | null> {
  if (!(await albumReadable(event))) return null;
  return readAlbumVersions(event.id);
}

/** A guest plan, and what waits (held and sealed rows, as numbers) read in its snapshot. */
export type GuestPlan = Plan & { waiting: WaitingFacts };

/**
 * THE GUEST ALBUM'S PLAN (`album-sync.ts`): what a client holding `since` is sent, a manifest or a
 * delta, with the snapshot it was read from. Null past the gate. The sync route and the page's seed
 * both plan here, so both answer one refusal the same way.
 *
 * ★ ONE GATE FOR THE WHOLE PLAN, asked before its first read: the plan's reads (the snapshot, then a
 * manifest's first page) are one answer, and a gate asked between them could refuse the second after
 * letting the first through, with nothing left to answer but an exception.
 *
 * ★ WHAT WAITS RIDES THE SNAPSHOT (the develop, 20261002200000): the plan reads `album_changes_since` exactly once, and
 * its `waiting` facts come back from that read, so the count a waiting room says is the album at the version beside it.
 */
export async function planGuestAlbumSync(
  event: AlbumEvent,
  since: number | null,
): Promise<GuestPlan | null> {
  if (!(await albumReadable(event))) return null;
  let waiting: WaitingFacts = NOTHING_WAITING;
  const plan = await planAlbumSync({
    scope: "album",
    since,
    read: async (after, limit) => {
      const answer = await readGuestAlbumChanges(event.id, after, limit);
      waiting = answer.waiting;
      return answer.read;
    },
    page: (after, budget) => manifestPage(event.id, after, budget),
  });
  return { ...plan, waiting };
}

/**
 * One manifest page: up to `budget` approved items after `after` (null: from the newest), read whole
 * in keyset pages of 1,000 (read-all.ts), and the cursor the next page resumes from, null once the
 * album is exhausted. Null past the gate.
 */
export async function readGuestManifestPage(
  event: AlbumEvent,
  after: AlbumCursor | null,
  budget: number,
): Promise<ManifestPage | null> {
  if (!(await albumReadable(event))) return null;
  return manifestPage(event.id, after, budget);
}

/**
 * A manifest row: its entry's columns (`toManifestEntry`), the capture time with them (Will's X7). ★ THE TYPED SEAM,
 * UNTIL THE TYPES REGENERATE (migration 20261005200000): a typed select naming `captured_at`, which the generated media
 * row does not hold yet, types every row as an error, so the page states its row (a cast, nothing at run time); with
 * the regeneration it is the generated row's own `Pick`, and the cast can go.
 */
type ManifestRow = Pick<
  Tables<"media">,
  | "id"
  | "type"
  | "width"
  | "height"
  | "duration_seconds"
  | "preview_key"
  | "reel_eligible"
  | "created_at"
> & { captured_at: string | null };

/** A manifest page's read, behind a gate its callers already asked. */
async function manifestPage(
  eventId: string,
  after: AlbumCursor | null,
  budget: number,
): Promise<ManifestPage> {
  const admin = createAdminClient();
  // ★ THE SEAL (the develop, 20261002200000): what a guest may see, by the one predicate's app half (`lib/disposable/seal.ts`),
  // on one clock for the whole page so its keyset never straddles a develop time. The cursor's own `.or()` is a second
  // logic tree beside it, which PostgREST ANDs.
  const now = nowIso();
  const page = await readAllPages(
    "album: guest manifest",
    (cursor: RowCursor | null, limit) => {
      let q = admin
        .from("media")
        .select(
          "id, type, width, height, duration_seconds, preview_key, reel_eligible, created_at, captured_at",
        )
        .eq("event_id", eventId)
        .eq("status", "approved")
        .or(unsealedFilter(now))
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (cursor) q = q.or(olderThan(cursor));
      return q as unknown as PromiseLike<PageResult<ManifestRow>>;
    },
    albumCursorOf,
    {
      budget,
      after: after ? { at: microsToTimestamp(after[0]), id: after[1] } : null,
    },
  );
  return {
    // The preview key is read only to say whether one exists; the key itself never leaves.
    entries: page.rows.map((m) =>
      toManifestEntry(
        {
          id: m.id,
          type: m.type,
          width: m.width,
          height: m.height,
          duration_seconds: m.duration_seconds,
          has_preview: m.preview_key !== null,
          reel_eligible: m.reel_eligible,
          created_at: m.created_at,
          captured_at: m.captured_at,
        },
        "album",
      ),
    ),
    next:
      page.more && page.after
        ? [timestampToMicros(page.after.at), page.after.id]
        : null,
  };
}

/**
 * The rows behind a window's links: each asked id that is APPROVED, UNSEALED and in THIS album, with its keys,
 * and who uploaded it (by the one precedence rule, with no address: the guest path never reads one),
 * with the face a guest may see beside the name (`uploader-faces.ts`: the album's own Guests-list face
 * and a door to a published page, never a blocked person's). An id that is unknown, gone, held, hidden
 * or another album's is simply absent, and the route reports it `missing`. `attribute: false` (the demo,
 * which names nobody) skips the attribution read. Null past the gate.
 */
export async function readGuestAlbumMedia(
  event: AlbumEvent,
  ids: readonly string[],
  opts: { attribute: boolean },
): Promise<{
  rows: AlbumKeyRow[];
  identities: Map<string, UploaderIdentity> | null;
} | null> {
  if (!(await albumReadable(event))) return null;
  const admin = createAdminClient();
  const now = nowIso();
  const [rows, identities] = await Promise.all([
    inChunks(
      "album: guest links",
      ids,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("media")
            .select("id, type, original_key, preview_key")
            .eq("event_id", event.id)
            .eq("status", "approved")
            // ★ The seal: a sealed id is `missing`, exactly as an unknown one is (the links route never says which).
            .or(unsealedFilter(now))
            .in("id", chunk),
          "album: guest links",
        )) ?? [],
    ),
    opts.attribute
      ? readAlbumAttribution(event.id, ids, { withEmail: false }).then(
          (named) => withUploaderFaces(event.id, named, "guest"),
        )
      : Promise.resolve(null),
  ]);
  return { rows, identities };
}

/**
 * Who uploaded each of these items, with no address, for rows a caller already read through a gate
 * of its own (the teaser's nine photographs, `getApprovedPhotoTeaser`). Null past this gate too.
 * ★ No face: the album shows no Guests list at its teaser, so a face here would be one it does not.
 */
export async function readGuestAttribution(
  event: AlbumEvent,
  ids: readonly string[],
): Promise<Map<string, UploaderIdentity> | null> {
  if (!(await albumReadable(event))) return null;
  return readAlbumAttribution(event.id, ids, { withEmail: false });
}
