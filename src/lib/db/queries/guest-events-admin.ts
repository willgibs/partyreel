/**
 * Admin-read path for PASSWORD-protected events. The anon media RPCs gate on
 * `visibility = 'open'`, so a password event's media never flows through them; once
 * the guest proves the password (the signed unlock cookie), the server reads the
 * media via the service-role admin client (which bypasses the gate).
 *
 * SELF-GUARDED: the unlock-cookie check lives INSIDE this privileged path (not just
 * upstream of it), so a careless caller can't pass an arbitrary event id and dump a
 * locked album. Returns [] unless THIS request holds a valid unlock cookie for the
 * event. Mirrors the blessed admin-from-guest-page pattern (mutations/analytics.ts
 * `recordLinkHit`), but reads media, so it carries its own gate.
 *
 * Only ever call this for a `password` event that resolved via the normal RPC; never
 * for `open` (use the anon RPC) or `private` (stays locked).
 */
import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import { mustQuery } from "@/lib/db/must-query";
import type { GuestEvent, GuestMediaRow } from "@/lib/db/queries/guest-events";
import { getEventGuests } from "@/lib/db/queries/social";
import { guestCount } from "@/lib/events/event-guests";
import { isUnlocked } from "@/lib/events/unlock-cookie";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import {
  resolveUploaderIdentity,
  type UploaderIdentity,
  type UploaderRow,
} from "@/lib/media/uploader-identity";

export async function getApprovedMediaForUnlock(
  eventId: string,
): Promise<GuestMediaRow[]> {
  if (!(await isUnlocked(eventId))) return [];

  const { data, error } = await createAdminClient()
    .from("media")
    .select("id, type, original_key, preview_key, width, height, duration_seconds")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((m) => ({
    id: m.id,
    type: m.type,
    original_key: m.original_key,
    preview_key: m.preview_key,
    width: m.width,
    height: m.height,
    duration_seconds: m.duration_seconds,
  }));
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
  event: Pick<GuestEvent, "id" | "visibility">,
  limit: number,
): Promise<{ rows: GuestMediaRow[]; total: number }> {
  if (event.visibility === "password") {
    if (!(await isUnlocked(event.id))) return { rows: [], total: 0 };
  } else if (event.visibility !== "open") {
    return { rows: [], total: 0 };
  }

  const { data, count, error } = await createAdminClient()
    .from("media")
    .select("id, type, original_key, preview_key, width, height, duration_seconds", {
      count: "exact",
    })
    .eq("event_id", event.id)
    .eq("status", "approved")
    .eq("type", "photo")
    .order("created_at", { ascending: false })
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
    })),
    total: count ?? 0,
  };
}

/**
 * Header stats for the guest page: the approved media count and how many GUESTS it came from
 * ("N photos & videos from M guests"). ★ M is THE ONE COUNT (guest by upload, Will 2026-09-22:
 * "Uploaded 1 photo? You're a guest."), `getEventGuests` in queries/social.ts, the same function the
 * host's hub reads, so the album and the hub can never say two numbers for one party: a confirmed
 * guest once per person, a named unconfirmed one once per row, never the host and never a nameless
 * row. The host is no longer "one of the guests" here, which the old per-row count made them.
 * NUMBERS ONLY ever leave this function (no identities).
 *
 * The total is a HEAD count (`count: "exact"`), so an album past PostgREST's row cap still says its
 * real size.
 *
 * Visibility posture: open events are public; a LOCKED password event still gets counts — that's
 * the ratified entry tease ("N photos are waiting" over the ghosted river; cardinality only, zero
 * media URLs pre-unlock). Private never reaches here (the page early-returns), but returns zeros
 * defensively.
 */
export async function getGalleryStats(
  event: Pick<GuestEvent, "id" | "visibility">,
): Promise<{ approvedTotal: number; guestCount: number }> {
  if (!countsVisible(event)) return { approvedTotal: 0, guestCount: 0 };
  const [total, guests] = await Promise.all([
    createAdminClient()
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "approved"),
    getGuestCount(event),
  ]);
  if (total.error) throw total.error;
  return { approvedTotal: total.count ?? 0, guestCount: guests };
}

/**
 * M alone, for the gallery poll (guest-flow.md, "Stats"): the header's guest count moves when a
 * guest's first upload lands, and only the server can say whether that upload made a NEW guest (a
 * returning contributor would be counted twice by any client arithmetic). The poll asks for it
 * after its 304 check, so the steady poll never pays for it. Same visibility posture and the same
 * ONE COUNT as the header's stats above.
 */
export async function getGuestCount(
  event: Pick<GuestEvent, "id" | "visibility">,
): Promise<number> {
  if (!countsVisible(event)) return 0;
  return guestCount(await getEventGuests(event.id));
}

/** Counts are for an open or a password event (the entry tease); never a private one. */
function countsVisible(event: Pick<GuestEvent, "visibility">): boolean {
  return event.visibility === "open" || event.visibility === "password";
}

/**
 * The host's avatar URL + seeded colour for an event's "Hosted by" byline, or null if the event has
 * no host. Server-only admin read (the guest page has no JWT): resolve events.host_id once, then the
 * host's profiles.avatar_updated_at (→ getAvatarUrl; a null marker → no photo) alongside `seedFor`
 * (→ the Avatar the byline now folds onto, the sixth batch, `seed=account`:
 * demo-wiring, "never the raw host id on the client"). The anon get_event_by_qr_token RPC stays
 * UNCHANGED (no contract change): host_id is never returned as a separate field, and never reaches
 * the browser itself — it appears only inside the avatar's stable public Storage URL PATH
 * (avatars/<host_id>/avatar.webp, a non-PII UUID embedded in a URL like any object id) and hashed,
 * one-way, inside `seed`. Callers gate the byline itself on a set host name (it hides without one),
 * but the seed/avatar pair is resolved whenever a host exists, matching `the-crowd=full`: an unnamed
 * event never shows the byline, but a NAMED one always gets its host's colour, photo or not.
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
 * PostgREST answers at most `max_rows` rows per request (1000 on this project), silently, so a read
 * that can outgrow one page walks KEYSET pages ordered by id (storage.ts's shape): an offset would
 * skip a row whenever one is removed mid-read, and the first page asks for the exact count so the
 * common album (under a thousand items) is ONE round trip. Exported for the paging test.
 */
export const IDENTITY_PAGE = 1000;

/**
 * Per-media uploader identity for an event, keyed by media id (Phase 2 attribution). A server-only
 * ADMIN read because `profiles` is own-row-RLS (`profiles_select_own`) -> a host's normal client
 * can't read guests' names; the admin client is REQUIRED (mirrors getHostAvatarSeed). Returns the
 * full identity INCLUDING email; the GUEST call sites must copy only name/isHost/isVerified onto the
 * client (never email). The host's name (for host uploads), then every media row with the
 * uploader's guest + profile, read to exhaustion in keyset pages (an album past a thousand items
 * would otherwise lose the identities of everything past the first page). The CASE logic is the
 * pure resolveUploaderIdentity().
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

  // Every media row for the event with the uploader's guest + linked profile, in keyset pages. The
  // loop never trusts a page's length against the page size (PostgREST clamps to its own max_rows,
  // so a short page is not proof of the last one): it stops at the first page's count or at an
  // empty page, whichever comes first.
  const map = new Map<string, UploaderIdentity>();
  let total: number | null = null;
  let lastId: string | null = null;
  for (;;) {
    let query = admin
      .from("media")
      .select(
        // The identity reshape (20260921150000): display_name + verified_at are what the one
        // precedence rule reads. They are NOT granted to `authenticated` (guests SELECT is
        // column-scoped, QA #41), which is exactly why this read is on the admin client.
        "id, guest_id, guests!media_guest_id_fkey(user_id, email, display_name, verified_at, profiles!guests_user_id_fkey(display_name))",
        lastId === null ? { count: "exact" } : undefined,
      )
      .eq("event_id", eventId)
      .order("id", { ascending: true })
      .limit(IDENTITY_PAGE);
    if (lastId !== null) query = query.gt("id", lastId);
    const { data, error, count } = await query;
    if (error) throw error;
    if (lastId === null) total = count ?? null;

    const rows = (data ?? []) as unknown as Array<UploaderRow & { id: string }>;
    if (rows.length === 0) break;
    for (const row of rows) map.set(row.id, resolveUploaderIdentity(row, hostName));
    lastId = rows[rows.length - 1].id;
    if (total !== null && map.size >= total) break;
  }
  return map;
}
