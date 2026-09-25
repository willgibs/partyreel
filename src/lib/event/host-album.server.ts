/**
 * THE HUB'S ALBUM, THE SERVER'S HALF: the seed the page embeds and the Highlight reel card read off
 * the manifest. The host's links answer has its own one builder (`host-links.server.ts`, which the
 * links route calls too); the pure half is `hub-album.ts`.
 *
 * ★ EVERY READ HERE RUNS AFTER ITS CALLER'S OWN CHECK. The page and the routes re-verify the session
 * (`getUser()`, never the cookie alone) and read the event through RLS (`getEvent`), which is the
 * ownership check; the manifest and the rows are read on that same RLS-scoped client, and the two
 * service-role reads (the change log's versions and the like counts) take only that event's id.
 */
import "server-only";

import { randomInt } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { readHostManifestPage } from "@/lib/db/queries/album-host";
import { readAlbumChanges } from "@/lib/db/queries/album-state";
import { readMediaLikeCounts } from "@/lib/db/queries/likes";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import {
  hubReel,
  REEL_MINIMUM,
  spreadSample,
  TAKE_POOL,
  isPlayableEntry,
  type HubReel,
} from "@/lib/event/reel-progress";
import type { HubAlbumSeed } from "@/lib/event/hub-album";
import { planAlbumSync, type AlbumRead } from "@/lib/events/album-sync";
import { hostAlbumEtag } from "@/lib/events/album-validator";
import {
  ALBUM_MANIFEST_PAGE,
  entryId,
  type AlbumManifestPart,
  type HostAlbumLinksBody,
  type ManifestEntry,
} from "@/lib/events/album-wire";
import type { LiveMediaItem } from "@/lib/reel/live/items";
import { presignDownload } from "@/lib/r2/presign";

type Client = SupabaseClient<Database>;

/** The host's first-load plan: the manifest's first page and the snapshot its version came from. */
export type HubManifestPlan = {
  part: AlbumManifestPart;
  read: AlbumRead;
};

/**
 * THE HOST'S FIRST LOAD, PLANNED AS THE HOST'S POLL PLANS IT (`planAlbumSync`, the same planner the
 * sync route runs, over the same reads): the version and the counts read first in one snapshot, then
 * the manifest's first page on the host's RLS client.
 */
export async function planHubManifest(
  supabase: Client,
  eventId: string,
): Promise<HubManifestPlan> {
  const plan = await planAlbumSync({
    scope: "host",
    since: null,
    read: (after, limit) => readAlbumChanges(eventId, "host", after, limit),
    page: (after, budget) =>
      readHostManifestPage(supabase, eventId, after, budget),
  });
  // A first load always plans a manifest (album-sync.ts, the first rule).
  return { part: plan.part as AlbumManifestPart, read: plan.read };
}

/**
 * THE SEED: the plan as the host's sync route would answer it (its body and its validator, so the
 * store's next poll is a 304 when nothing moved) and the first window's links.
 */
export function seedFrom(
  eventId: string,
  plan: HubManifestPlan,
  links: HostAlbumLinksBody,
): HubAlbumSeed {
  return {
    eventId,
    sync: {
      ...plan.part,
      ok: true,
      counts: {
        album: plan.read.approved + (plan.read.hidden ?? 0),
        pending: plan.read.pending ?? 0,
      },
    },
    etag: hostAlbumEtag({
      eventId,
      version: plan.read.version,
      attrVersion: plan.read.attrVersion,
    }),
    links,
  };
}

/**
 * THE VISIT'S SEED FOR THE ROWS' RHYTHM (`album-columns` r2, `rhythm=double`): which photographs lead
 * a taller row now and then, dealt per visit ("Another visit deals a new one, which is what a guest
 * coming back would see", the board's own words) and held for it. Dealt on the server, so the first
 * paint and the hydrated rows pick the same photographs.
 */
export function dealVisitSeed(): number {
  return randomInt(1, 1_000_000);
}

/**
 * The rest of a manifest past its first page (an album past `ALBUM_MANIFEST_PAGE` items), so a read
 * that must see the whole album (the reel's spread) does. The client pages it for itself.
 */
export async function readRestOfManifest(
  supabase: Client,
  eventId: string,
  first: Pick<AlbumManifestPart, "entries" | "next">,
): Promise<ManifestEntry[]> {
  const entries = [...first.entries];
  let next = first.next;
  while (next) {
    const page = await readHostManifestPage(
      supabase,
      eventId,
      next,
      ALBUM_MANIFEST_PAGE,
    );
    entries.push(...page.entries);
    next = page.next;
  }
  return entries;
}

/**
 * THE HIGHLIGHT REEL'S CARD, READ OFF THE MANIFEST. `hubReel` plans it exactly as before (the state,
 * the pips, and at one item that item's still, once live the reel's own opening stills from a take
 * over a spread of the whole album); what changed is what it is handed. It used to be the whole
 * album, presigned. Now the manifest's flags say which items can play (`isPlayableEntry`, the guest's
 * own rule), the spread (`TAKE_POOL`) is read for its quick-add signals alone (who uploaded, when,
 * how liked), and only the four stills the card shows are presigned.
 *
 * ★ THE KEYS NEVER LEAVE THIS FUNCTION. The take reads a still only to know one exists, so the pool's
 * items carry their object keys where a url would go, and the answer carries only presigned stills.
 */
export async function readHubReel(
  supabase: Client,
  event: { id: string; showReel: boolean },
  entries: readonly ManifestEntry[],
  liveReelEnabled: boolean,
): Promise<HubReel> {
  const playable = entries.filter(isPlayableEntry);
  // The pool spans the album as `hubReel` would sample it: the state and the pips hold as long as it
  // keeps at least two items, which a spread of two or more always does.
  const pool = spreadSample(playable, TAKE_POOL).map(entryId);
  if (!event.showReel || !liveReelEnabled || pool.length === 0) {
    const face = hubReel({
      eventId: event.id,
      showReel: event.showReel,
      liveReelEnabled,
      items: [],
    });
    return {
      ...face,
      have: Math.min(playable.length, REEL_MINIMUM),
      stills: [],
      stillIds: [],
    };
  }
  const live = pool.length >= REEL_MINIMUM;
  const ask = live ? pool : pool.slice(0, 1);
  const [rows, likes] = await Promise.all([
    readReelRows(supabase, event.id, ask),
    live ? readMediaLikeCounts(event.id, ask) : Promise.resolve(new Map()),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const items: LiveMediaItem[] = ask.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    return [
      {
        id: r.id,
        type: r.type,
        // The keys stand where urls would: `hubReel` only asks whether a still exists.
        url: r.original_key,
        previewUrl: r.preview_key,
        width: r.width,
        height: r.height,
        durationSeconds: r.duration_seconds,
        status: "approved" as const,
        createdAt: r.created_at,
        // A null guest_id is the host's own upload (the contributor count's rule).
        uploaderKey: r.guest_id ?? "host",
        likeCount: likes.get(r.id) ?? 0,
        reelEligible: true,
      },
    ];
  });
  const face = hubReel({
    eventId: event.id,
    showReel: event.showReel,
    liveReelEnabled,
    items,
  });
  const stills = await Promise.all(
    face.stillIds.map((id) => {
      const r = byId.get(id)!;
      return presignDownload({
        key: r.preview_key ?? r.original_key,
        stable: true,
      });
    }),
  );
  return { ...face, have: Math.min(playable.length, REEL_MINIMUM), stills };
}

/** The pool's rows: what the take reads (who, when) and the keys its stills are presigned from. */
function readReelRows(supabase: Client, eventId: string, ids: string[]) {
  return inChunks(
    "hub: reel pool",
    ids,
    async (chunk) =>
      (await mustQuery(
        supabase
          .from("media")
          .select(
            "id, type, guest_id, original_key, preview_key, width, height, duration_seconds, created_at",
          )
          .eq("event_id", eventId)
          .eq("status", "approved")
          .in("id", chunk),
        "hub: reel pool",
      )) ?? [],
  );
}
