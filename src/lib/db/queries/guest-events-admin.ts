/**
 * Admin-read path for PASSWORD-protected events. The anon media RPCs gate on
 * `visibility = 'open'`, so a password event's media never flows through them; once
 * the guest proves the password (the signed unlock cookie), the server reads the
 * media via the service-role admin client (which bypasses the gate).
 *
 * SELF-GUARDED: the unlock-cookie check lives INSIDE this privileged path (not just
 * upstream of it), so a careless caller can't pass an arbitrary event id and dump a
 * locked album. Returns [] unless THIS request holds a valid unlock cookie for the
 * event, or is its host (`isRequestOwner`, the album reads' own owner check: the host
 * never meets the password door, so never holds the cookie). Mirrors the blessed
 * admin-from-guest-page pattern (mutations/analytics.ts `recordLinkHit`), but reads
 * media, so it carries its own gate.
 *
 * Only ever call this for a `password` event that resolved via the normal RPC; never
 * for `open` (use the anon RPC) or `private` (stays locked).
 */
import "server-only";

import { cache } from "react";

import { seedFor } from "@/lib/avatar/seed";
import { toBillingTier, type Tier } from "@/lib/constants/tiers";
import { mustQuery, QueryFailedError } from "@/lib/db/must-query";
import {
  albumCursorOf,
  olderThan,
  type AlbumCursor,
  type GuestEvent,
  type GuestMediaRow,
} from "@/lib/db/queries/guest-events";
import { getEventGuests } from "@/lib/db/queries/social";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { guestCount } from "@/lib/events/event-guests";
import { holdsDoorPass } from "@/lib/event/door/pass.server";
import { isRequestOwner } from "@/lib/events/gallery-access-owner.server";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { nowIso, unsealedFilter } from "@/lib/disposable/seal";
import { captureWarning } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import {
  resolveUploaderIdentity,
  type UploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";

/**
 * The UNLOCKED password album: every approved item, NEWEST FIRST in the open album's exact order
 * (`created_at desc, id desc`), read whole in keyset pages (one unbounded read would hand an album
 * past a thousand items only its newest 1,000). The cursor is `olderThan`, the table twin of the
 * open album RPC's own, so the two arms of `loadGalleryRowsForAccess` can never page or order an
 * album differently.
 */
export async function getApprovedMediaForUnlock(
  event: Pick<GuestEvent, "id" | "doorPass">,
): Promise<GuestMediaRow[]> {
  const eventId = event.id;
  // ★ THE DOOR'S PASS (the doors, event-settings r1): a gated album's guest, and a password album's
  // guest already in with no unlock cookie, read what the door let them through to.
  if (
    !holdsDoorPass(event) &&
    !(await isUnlocked(eventId)) &&
    !(await isRequestOwner(eventId))
  )
    return [];

  const admin = createAdminClient();
  // ★ THE SEAL (the develop): a sealed shot is no guest's until it develops (`lib/disposable/seal.ts`). One clock
  // for the whole walk, so a page boundary never straddles a develop time.
  const now = nowIso();
  const { rows } = await readAllPages(
    "unlocked album: media",
    (after: AlbumCursor | null, limit) => {
      let page = admin
        .from("media")
        .select(
          "id, type, original_key, preview_key, width, height, duration_seconds, reel_eligible, created_at",
        )
        .eq("event_id", eventId)
        .eq("status", "approved")
        .or(unsealedFilter(now))
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (after) page = page.or(olderThan(after));
      return page;
    },
    albumCursorOf,
  );
  return rows.map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    preview_key: m.preview_key,
    width: m.width,
    height: m.height,
    duration_seconds: m.duration_seconds,
    reel_eligible: m.reel_eligible,
    created_at: m.created_at,
  }));
}

/**
 * ★ WHETHER THIS REQUEST IS PAST THE ALBUM'S LOCK, the one posture every read here that shows more than the
 * entry tease keeps: an open album, a password album this request has unlocked (the signed cookie), or an album
 * whose door let it through (its pass, the doors: a guest past a gate who still owes the email step sees what a
 * password album's unlocked guest sees; without one a gated album reads as private). Anything else, a locked
 * password album and a private one, is shut, and a careless caller can never get a locked album's contents.
 */
async function pastTheLock(
  event: Pick<GuestEvent, "id" | "visibility" | "doorPass">,
): Promise<boolean> {
  if (holdsDoorPass(event)) return true;
  if (event.visibility === "password") return isUnlocked(event.id);
  return event.visibility === "open";
}

/**
 * Server-capped TEASER for the gated gallery: the newest `limit` approved PHOTOS plus the TOTAL count
 * of approved photos (for the "+N more" affordance), in ONE round trip via PostgREST `count: "exact"`.
 *
 * SELF-GUARDED by visibility, mirroring getApprovedMediaForUnlock: a password event requires the
 * unlock cookie (so a careless caller can't dump a locked album's teaser), an open event's photos are
 * already public, and anything else (private) returns nothing. The teaser is a strict SUBSET of what
 * the viewer could otherwise see, so it leaks strictly less.
 */
export async function getApprovedPhotoTeaser(
  event: Pick<GuestEvent, "id" | "visibility" | "doorPass">,
  limit: number,
): Promise<{ rows: GuestMediaRow[]; total: number }> {
  if (!(await pastTheLock(event))) return { rows: [], total: 0 };

  const { data, count, error } = await createAdminClient()
    .from("media")
    .select(
      "id, type, original_key, preview_key, width, height, duration_seconds, reel_eligible, created_at",
      { count: "exact" },
    )
    .eq("event_id", event.id)
    .eq("status", "approved")
    .eq("type", "photo")
    // ★ The seal: the teaser is a strict subset of the album, so no sealed shot either.
    .or(unsealedFilter(nowIso()))
    // The album's own order, id as the tiebreak: two photographs sharing a timestamp must not
    // trade places between polls, or the ETag (which hashes the ids in order) would roll for
    // nothing and hand the teaser a full payload it already holds.
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return {
    rows: (data ?? []).map((m) => ({
      id: m.id,
      type: m.type,
      original_key: m.original_key,
      preview_key: m.preview_key,
      width: m.width,
      height: m.height,
      duration_seconds: m.duration_seconds,
      reel_eligible: m.reel_eligible,
      created_at: m.created_at,
    })),
    total: count ?? 0,
  };
}

/**
 * THE ALBUM'S SIZE: a HEAD count of its approved items, photos and videos, never the length of a
 * list (read-all.ts, rule 2). The header's "N photos & videos" reads it at every access level:
 * the page's stats seed it, and every gallery payload (the render's and each poll's 200) carries it
 * again (`loadGalleryRowsForAccess`), so it stays exact and live even where the loaded items are the
 * nine-photo teaser. Same visibility posture as the stats: an open or a password event (the locked
 * page's count tease), never a private one.
 */
export async function countApprovedMedia(
  event: Pick<GuestEvent, "id" | "visibility" | "door" | "doorPass">,
): Promise<number> {
  if (!countsVisible(event)) return 0;
  return approvedCount(event.id);
}

/**
 * Request-scoped (`cache()`, keyed on the id string): the page asks twice in one render (its stats
 * and its gallery payload), and one answer means the header's seed and the gallery's first report
 * can never say two numbers. Outside a render (the poll route) it is a plain call.
 */
const approvedCount = cache(async function approvedCount(
  eventId: string,
): Promise<number> {
  // ★ THE SEAL: the album's size is what a guest may see, the count `album_changes_since` answers in its snapshot
  // (waiting rows are said apart, as a number, by the sync's `waiting`), or every poll would heal forever.
  const { count, error } = await createAdminClient()
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "approved")
    .or(unsealedFilter(nowIso()));
  if (error) throw new QueryFailedError("guest album: approved count", error);
  return count ?? 0;
});

/** What an album holds by kind: the two add up to its size. */
export type AlbumKinds = { photos: number; videos: number };

/**
 * Header stats for the guest page: the approved media count and how many GUESTS it came from
 * ("N photos & videos from M guests"). ★ M is THE ONE COUNT (a guest is anyone who uploaded, even
 * one photo), `getEventGuests` in queries/social.ts, the same function the
 * host's hub reads, so the album and the hub can never say two numbers for one party: a confirmed
 * guest once per person, a named unconfirmed one once per row, never the host and never a nameless
 * row. NUMBERS ONLY ever leave this function (no identities).
 *
 * The total is `countApprovedMedia`, a HEAD count, so an album past PostgREST's row cap still says
 * its real size.
 *
 * ★ `kinds` IS WHAT THE ALBUM HOLDS BY KIND, so the cover's count names it from the first byte
 * ("12 photos", "3 videos") instead of both nouns until the live album has told (crumbs-74;
 * `albumCountWords` words both from one function, so the first paint and the live source agree).
 * It costs ONE more head count, of the videos, in the round the page already waits on (the total
 * is already counted, so one more names both kinds), and photos are what the total holds besides
 * them: the two always add up to the total the header shows, and the total stays the one
 * request-scoped answer the gallery payload shares. Never a list, never a per-row scan. The two
 * heads are not one snapshot, so a video count past the total (an approval landed between them) is
 * no answer: `kinds` is then null, and so is a failed read (reported, never the page's failure:
 * the words are cosmetic, and both nouns are what the cover always said).
 *
 * Visibility posture: open events are public; a LOCKED password event still gets counts — that's
 * the entry tease ("N photos are waiting" over the ghosted river; cardinality only, zero
 * media URLs pre-unlock). Private never reaches here (the page early-returns), but returns zeros
 * defensively. ★ The tease is a NAME and a SIZE, and the kinds are more than that, so they ride
 * only where this request is past the lock (`pastTheLock`): a locked page's payload carries the
 * count alone, as it always has.
 */
export async function getGalleryStats(
  event: Pick<GuestEvent, "id" | "visibility" | "door" | "doorPass">,
): Promise<{
  approvedTotal: number;
  guestCount: number;
  kinds: AlbumKinds | null;
}> {
  if (!countsVisible(event)) {
    return { approvedTotal: 0, guestCount: 0, kinds: null };
  }
  const [approvedTotal, guests, videos] = await Promise.all([
    countApprovedMedia(event),
    getGuestCount(event),
    countApprovedVideos(event),
  ]);
  return {
    approvedTotal,
    guestCount: guests,
    // Photos are what the total holds besides the videos; a video count past the total is no answer.
    kinds:
      videos === null || videos > approvedTotal
        ? null
        : { photos: approvedTotal - videos, videos },
  };
}

/**
 * The album's VIDEOS, a HEAD count on the very predicate the total counts (approved, unsealed), or null where this
 * request is not past the lock or the read failed. SELF-GUARDED, and never a throw: the words it feeds are cosmetic.
 * Only the first paint asks (`getGalleryStats`): the poll's payload carries the total alone, so the steady poll's
 * one head count is untouched.
 */
async function countApprovedVideos(
  event: Pick<GuestEvent, "id" | "visibility" | "doorPass">,
): Promise<number | null> {
  if (!(await pastTheLock(event))) return null;
  const { count, error } = await createAdminClient()
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .eq("status", "approved")
    .eq("type", "video")
    // ★ THE SEAL, as the total's own head count has it: the kinds name exactly the items the total counts.
    .or(unsealedFilter(nowIso()));
  if (error) {
    captureWarning("media", "guest album: the kinds could not be counted", {
      eventId: event.id,
      code: error.code,
    });
    return null;
  }
  return count ?? 0;
}

/**
 * M alone, for the gallery poll (guest-flow.md, "Stats"): the header's guest count moves when a
 * guest's first upload lands, and only the server can say whether that upload made a NEW guest (a
 * returning contributor would be counted twice by any client arithmetic). The poll asks for it
 * after its 304 check, so the steady poll never pays for it. Same visibility posture and the same
 * ONE COUNT as the header's stats above.
 */
export async function getGuestCount(
  event: Pick<GuestEvent, "id" | "visibility" | "door" | "doorPass">,
): Promise<number> {
  if (!countsVisible(event)) return 0;
  return guestCount(await getEventGuests(event.id));
}

/**
 * Counts are for an open or a password event (the entry tease), never a private one; and, since the
 * doors (event-settings r1), for anyone the door let through (its pass), and for a newcomer standing
 * at a door she can ask at (letting each person in, an invite list), whose welcome says how much is
 * inside the way a password album's does. A closed door and Only me count nothing for a newcomer:
 * she meets the shut screen, which says nothing about the album.
 */
function countsVisible(
  event: Pick<GuestEvent, "id" | "visibility" | "door" | "doorPass">,
): boolean {
  if (event.visibility === "open" || event.visibility === "password") {
    return true;
  }
  return (
    holdsDoorPass(event) || event.door === "approve" || event.door === "invite"
  );
}

/**
 * The host's avatar URL + seeded colour for an event's "Hosted by" byline, or null if the event has
 * no host. Server-only admin read (the guest page has no JWT): resolve events.host_id once, then the
 * host's profiles.avatar_updated_at (→ getAvatarUrl; a null marker → no photo) alongside `seedFor`
 * (→ the byline's Avatar, its colour seeded per account without the raw host id ever reaching the
 * client). The anon get_event_by_qr_token RPC never returns host_id as a separate field, and it
 * never reaches the browser itself — it appears only inside the avatar's stable public Storage URL
 * PATH (avatars/<host_id>/avatar.webp, a non-PII UUID embedded in a URL like any object id) and
 * hashed, one-way, inside `seed`. Callers gate the byline itself on a set host name (it hides
 * without one), but the seed/avatar pair is resolved whenever a host exists: an unnamed event never
 * shows the byline, but a NAMED one always gets its host's colour, photo or not.
 */
export async function getHostAvatarSeed(
  eventId: string,
): Promise<{ avatarUrl: string | null; seed: string } | null> {
  const admin = createAdminClient();
  const ev = await mustQuery(
    admin.from("events").select("host_id").eq("id", eventId).maybeSingle(),
    "guest page: event host_id",
  );
  if (!ev?.host_id) return null;

  const prof = await mustQuery(
    admin
      .from("profiles")
      .select("avatar_updated_at")
      .eq("id", ev.host_id)
      .maybeSingle(),
    "guest page: host avatar marker",
  );
  return {
    avatarUrl: await getAvatarUrl(ev.host_id, prof?.avatar_updated_at ?? null),
    seed: seedFor(ev.host_id),
  };
}

/**
 * Per-media uploader identity for an event, keyed by media id, for attribution. A server-only
 * ADMIN read because `profiles` is own-row-RLS (`profiles_select_own`) -> a host's normal client
 * can't read guests' names; the admin client is REQUIRED (mirrors getHostAvatarSeed). Returns the
 * full identity INCLUDING email; the GUEST call sites must copy only name/isHost/isVerified onto the
 * client (never email). The host's name (for host uploads), then every media row with the
 * uploader's guest + profile, read WHOLE through `readAllPages` in keyset pages on `id` (an album
 * past a thousand items would otherwise lose the identities of everything past the first page; an
 * offset would skip a row removed mid-read). The CASE logic is the pure resolveUploaderIdentity().
 */
export async function getUploaderIdentities(
  eventId: string,
): Promise<Map<string, UploaderIdentity>> {
  const admin = createAdminClient();

  // The host's display name — attributed to host uploads (media.guest_id IS NULL). One read.
  // mustQuery, not a swallow: a failed read here would silently re-attribute the
  // HOST's own uploads to "Anonymous" — a wrong answer rendered as a fact.
  let hostName: string | null = null;
  const ev = await mustQuery(
    admin.from("events").select("host_id").eq("id", eventId).maybeSingle(),
    "attribution: event host_id",
  );
  if (ev?.host_id) {
    const hp = await mustQuery(
      admin
        .from("profiles")
        .select("display_name")
        .eq("id", ev.host_id)
        .maybeSingle(),
      "attribution: host display name",
    );
    hostName = hp?.display_name ?? null;
  }

  // Every media row for the event with the uploader's guest + linked profile, read whole. A page
  // shorter than it asked for is the last one (read-all.ts owns why that holds). ★ A sealed shot's uploader is credited
  // at develop, not before (the develop): its row is left out like every guest-path read leaves it out.
  const now = nowIso();
  const { rows } = await readAllPages(
    "attribution: media uploaders",
    (after: string | null, limit) => {
      let page = admin
        .from("media")
        .select(
          // display_name + verified_at (migration 20260921150000) are what the one precedence rule
          // reads. They are NOT granted to `authenticated` (guests SELECT is column-scoped), which
          // is exactly why this read is on the admin client.
          "id, guest_id, guests!media_guest_id_fkey(user_id, email, display_name, verified_at, profiles!guests_user_id_fkey(display_name))",
        )
        .eq("event_id", eventId)
        .or(unsealedFilter(now))
        .order("id", { ascending: true })
        .limit(limit);
      if (after !== null) page = page.gt("id", after);
      // The embeds' shape is UploaderRow's (the one precedence rule reads it); replace, never
      // merge, the inferred row, whose nested embed inference is not the contract.
      return page.overrideTypes<
        Array<UploaderRow & { id: string }>,
        { merge: false }
      >();
    },
    (row) => row.id,
  );

  const map = new Map<string, UploaderIdentity>();
  for (const row of rows)
    map.set(row.id, resolveUploaderIdentity(row, hostName));
  return map;
}

/**
 * THE TWO SERVER-ONLY FACTS BEHIND THE LIVE REEL: the platform lever (`ops_flags.live_reel_enabled`)
 * and the host's plan (which decides what the clip creator may do, `clipFactsForTier`). Both are
 * deny-all or host-private, so the admin client reads them; only the derived booleans and one
 * number ever reach a guest (`gallery-reel.ts`).
 *
 * ★ CACHED FOR HALF A MINUTE, PER EVENT, PER PROCESS. The gallery poll asks on every call (the facts
 * ride the ETag, so a host's upgrade or an operator's lever reaches an open album on the next poll),
 * and a venue of phones polling is exactly the load that should not cost two admin reads apiece.
 * Neither fact moves more than a few times a lifetime; thirty seconds of staleness is invisible. The
 * host's own switch and mood are NOT cached: they ride `get_event_by_qr_token`, read fresh.
 *
 * ★ EACH FAILURE HAS ITS OWN HONEST ANSWER, NEVER A GUESS. The lever fails OPEN (a flaky read must
 * not take the reel off every album; render-service.ts's own kill switch reads the same way). The
 * plan fails to `null`, which drops the creator and keeps the reel: guessing "free" would stamp the
 * mark on a paying host's clips, guessing paid would lift it off a free one. Both are reported.
 */
export type LiveReelServerFacts = {
  liveReelEnabled: boolean;
  tier: Tier | null;
};

const REEL_FACTS_TTL_MS = 30_000;
const REEL_FACTS_MAX = 500;
const reelFactsCache = new Map<
  string,
  { at: number; value: LiveReelServerFacts }
>();

export async function getLiveReelServerFacts(
  eventId: string,
): Promise<LiveReelServerFacts> {
  const now = Date.now();
  const hit = reelFactsCache.get(eventId);
  if (hit && now - hit.at < REEL_FACTS_TTL_MS) return hit.value;

  const admin = createAdminClient();
  const [flag, event] = await Promise.all([
    admin
      .from("ops_flags")
      .select("enabled")
      .eq("key", "live_reel_enabled")
      .maybeSingle(),
    admin.from("events").select("host_id").eq("id", eventId).maybeSingle(),
  ]);

  let liveReelEnabled = true;
  if (flag.error) {
    captureWarning("reel", "live reel: the platform lever could not be read", {
      eventId,
      code: flag.error.code,
    });
  } else {
    // A genuinely absent row reads as the seeded default (on).
    liveReelEnabled = flag.data?.enabled ?? true;
  }

  let tier: Tier | null = null;
  if (event.error || !event.data?.host_id) {
    if (event.error) {
      captureWarning("reel", "live reel: the event's host could not be read", {
        eventId,
        code: event.error.code,
      });
    }
  } else {
    const profile = await admin
      .from("profiles")
      .select("tier")
      .eq("id", event.data.host_id)
      .maybeSingle();
    if (profile.error || !profile.data) {
      captureWarning("reel", "live reel: the host's plan could not be read", {
        eventId,
        code: profile.error?.code ?? "missing",
      });
    } else {
      tier = toBillingTier(profile.data.tier);
    }
  }

  const value = { liveReelEnabled, tier };
  // A failed read is not remembered: the next poll asks again rather than serving a guess for the
  // whole TTL.
  if (!flag.error && tier !== null) {
    if (reelFactsCache.size >= REEL_FACTS_MAX) {
      const oldest = reelFactsCache.keys().next().value;
      if (oldest !== undefined) reelFactsCache.delete(oldest);
    }
    reelFactsCache.set(eventId, { at: now, value });
  }
  return value;
}

/** Test seam: the per-process cache above, emptied. */
export function resetLiveReelServerFactsCache(): void {
  reelFactsCache.clear();
}

/**
 * ★ HER OWN SEALED SHOTS, FOR HER OWN DOWNLOAD (the develop: "her own sealed shots are in her own download", the
 * lane's call, Will's to overrule). The guest export's Yours set is what she can see narrowed to what is hers; her own
 * sealed shots are hers to see (her waiting room draws them), so the export adds exactly these: of the ids the SERVER
 * found hers (`ownMediaIds`, never a request's list), the approved ones still sealed. Never anybody else's, and never in
 * the album's own zip, which is what the album shows. Read in chunks (`inChunks`, the 1,000-row round).
 */
export async function readOwnSealedMedia(
  eventId: string,
  ownIds: readonly string[],
): Promise<GuestMediaRow[]> {
  if (ownIds.length === 0) return [];
  const admin = createAdminClient();
  const now = nowIso();
  const rows = await inChunks(
    "guest export: her own sealed shots",
    ownIds,
    async (chunk) =>
      (await mustQuery(
        admin
          .from("media")
          .select(
            "id, type, original_key, preview_key, width, height, duration_seconds, reel_eligible, created_at",
          )
          .eq("event_id", eventId)
          .eq("status", "approved")
          // The predicate's other half: sealed now (the filter column is the seam's until the types regenerate).
          .filter("sealed_until", "gt", now)
          .in("id", chunk),
        "guest export: her own sealed shots",
      )) ?? [],
  );
  return rows.map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    preview_key: m.preview_key,
    width: m.width,
    height: m.height,
    duration_seconds: m.duration_seconds,
    reel_eligible: m.reel_eligible,
    created_at: m.created_at,
  }));
}

/**
 * ONE PHOTOGRAPH, FOR ITS OWN LINK CARD: `/e/<token>?photo=<id>` pasted into a chat unfurls as that
 * photograph, on an album anyone with the link may open whole.
 *
 * SELF-GUARDED like every read here: an OPEN event only (a password or private event's media never
 * leaves through a card), and the row must be APPROVED, UNSEALED and belong to THIS event, so an unknown,
 * held, hidden, sealed or foreign id answers null and the caller keeps the event's own card, with no sign
 * the item exists. The caller also requires that an anonymous viewer would see the whole album (no
 * email or upload gate), which this cannot know. Keys stay here; only the caller's presign leaves.
 */
export async function getOpenAlbumItemForCard(
  event: Pick<GuestEvent, "id" | "visibility">,
  mediaId: string,
): Promise<{
  type: "photo" | "video";
  originalKey: string;
  previewKey: string | null;
  width: number | null;
  height: number | null;
} | null> {
  if (event.visibility !== "open") return null;
  // ★ The seal: a sealed shot unfurls as nothing, the event's own card, exactly as an unknown id does.
  const { data, error } = await createAdminClient()
    .from("media")
    .select("type, original_key, preview_key, width, height")
    .eq("id", mediaId)
    .eq("event_id", event.id)
    .eq("status", "approved")
    .or(unsealedFilter(nowIso()))
    .maybeSingle();
  // A failed read degrades to the event's own card (a link preview is cosmetic), reported.
  if (error) {
    captureWarning("media", "photo card: the item could not be read", {
      code: error.code,
    });
    return null;
  }
  if (!data) return null;
  return {
    type: data.type,
    originalKey: data.original_key,
    previewKey: data.preview_key,
    width: data.width,
    height: data.height,
  };
}
