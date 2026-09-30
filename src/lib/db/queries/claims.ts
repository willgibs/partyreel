/**
 * The claims review's data (the guest identity round, 2026-09-22; "guest
 * identity: name only, unconfirmed email, verified account"). A guest
 * who typed an email at a names-mode door left it unconfirmed and inert
 * (guests.pending_email); once the CALLER confirms that same address on their
 * own account, this is what tells the dashboard which of their past rows are
 * waiting to be claimed, and, once she claims one, what that event offers next.
 */
import "server-only";

import { mustCount, mustQuery } from "@/lib/db/must-query";
import { readEventGates } from "@/lib/db/queries/event-doors";
import { isBlockedEitherWay } from "@/lib/db/queries/social";
import { readAllPages } from "@/lib/db/read-all";
import { presignDownload } from "@/lib/r2/presign";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth, type RequestAuth } from "@/lib/supabase/request-auth";

/** One event's claimable rows, already grouped (see below). */
export type ClaimableEventRow = {
  eventId: string;
  eventName: string;
  /** Null for a password-gated event (the RPC withholds it, QA #40's rule). */
  eventDate: string | null;
  /** Every distinct typed name found under this address at this event
   *  (a row minted before the door required a name can contribute none). */
  names: string[];
  /** Live uploads across the group: always at least one (an event with none is not offered). */
  uploadCount: number;
  /** ISO timestamp of the newest live upload (typed nullable, as the RPC's row is). */
  lastUploadAt: string | null;
};

/** One waiting event as the claims review shows it: the row, its album's door and its previews. */
export type ClaimableEvent = ClaimableEventRow & {
  /**
   * The album's door when it is shut to strangers: its photographs stay behind it, on the card as
   * everywhere (a lock and the count, never a preview). Null for an open album.
   */
  gate: "password" | "private" | null;
  /**
   * Up to four of her own photographs there, newest first, presigned here (a raw key never leaves
   * this module): what the review's card shows so she can tell hers from someone else's. Empty for
   * a gated album, for one with nothing its album shows yet, and unless the caller asked.
   */
  previews: string[];
};

/** How many photographs a card shows (`pass=cards`, "each with its own small preview"). */
export const CARD_PREVIEWS = 4;

/**
 * Events with rows waiting for the CONFIRMED caller's own address, for the
 * dashboard's claims review. The RPC (`list_guest_rows_by_email`) is the one
 * caller: an unconfirmed session, or an account whose own email is not yet
 * proved, gets [] straight from it (defence in depth — auth.uid() plus
 * email_confirmed_at inside the function), so this never needs its own gate
 * beyond "is anyone signed in at all".
 *
 * GROUPED BY EVENT, deliberately. The same address can carry more than one
 * guest row at one event (a second device, a second visit before signing
 * in), and both `claim_guest_rows_by_email` and `disown_guest_rows_by_email`
 * act on every matching row for an event id in one call — so the review
 * offers one decision per EVENT, never one per row. Upload counts sum across
 * the group, the most recent upload timestamp wins, and every distinct typed
 * name is kept (a blank/null name, from a row minted before the door made a
 * name mandatory, contributes nothing to the list). The group's rank is its
 * best (lowest) member index, so the result keeps the RPC's own order —
 * most recently active first. Its previews are its rows' own, in that order,
 * four at most.
 *
 * ★ AND ONLY AN EVENT WITH SOMETHING TO CLAIM (guest by upload, Will 2026-09-22:
 * a person is a guest of an event only through an upload of theirs). A row with
 * no live upload makes nobody a guest, so claiming it would carry nothing and
 * releasing it would remove nothing. The RPC skips such rows since migration
 * 20260923120000; this drop is the belt, so the review is right even against a
 * database that has not taken that file yet.
 *
 * ★ READ WHOLE (the 1,000-row round, 2026-09-23): the RPC pages on its own order,
 * (last upload desc, guest id desc), and the cursor is the last row's own
 * `last_upload_at` and `guest_id` (a listed row always carries a live upload, so
 * its last upload is never null and IS the order's key). Past 1,000 rows the
 * card used to end silently; the grouping below needs every row of an event to
 * sum its uploads.
 *
 * ★ THE PREVIEWS ARE THE DASHBOARD'S ALONE (`previews: true`): the welcome page reads the same
 * list for a name to prefill, and a presign it never shows is work for nothing.
 */
export async function getMyClaimableGuestRows({
  previews = false,
}: { previews?: boolean } = {}): Promise<ClaimableEvent[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  const { rows } = await readAllPages(
    "dashboard: claimable guest rows",
    (after: { at: string; id: string } | null, limit) =>
      supabase.rpc("list_guest_rows_by_email", {
        p_after_at: after?.at,
        p_after_id: after?.id,
        p_limit: limit,
      }),
    (row) => ({ at: lastUploadAt(row), id: row.guest_id }),
  );

  type Group = {
    eventId: string;
    eventName: string;
    eventDate: string | null;
    names: Set<string>;
    uploadCount: number;
    lastUploadAt: string | null;
    gate: ClaimableEvent["gate"];
    keys: string[];
    rank: number;
  };
  const byEvent = new Map<string, Group>();

  rows.forEach((row, index) => {
    const name = row.display_name?.trim();
    const keys = previewKeysOf(row);
    const existing = byEvent.get(row.event_id);
    if (!existing) {
      byEvent.set(row.event_id, {
        eventId: row.event_id,
        eventName: row.event_name,
        eventDate: row.event_date,
        names: new Set(name ? [name] : []),
        uploadCount: row.upload_count,
        lastUploadAt: row.last_upload_at,
        gate: gateOf(row),
        keys: keys.slice(0, CARD_PREVIEWS),
        rank: index,
      });
      return;
    }
    if (name) existing.names.add(name);
    existing.uploadCount += row.upload_count;
    if (
      row.last_upload_at &&
      (!existing.lastUploadAt || row.last_upload_at > existing.lastUploadAt)
    ) {
      existing.lastUploadAt = row.last_upload_at;
    }
    // Rows come newest first, so a later row's photographs follow the earlier row's.
    for (const key of keys) {
      if (existing.keys.length >= CARD_PREVIEWS) break;
      if (!existing.keys.includes(key)) existing.keys.push(key);
    }
    existing.rank = Math.min(existing.rank, index);
  });

  const groups = [...byEvent.values()]
    .filter((g) => g.uploadCount > 0)
    .sort((a, b) => a.rank - b.rank);

  const signed = previews
    ? await presignAll(groups.flatMap((g) => (g.gate === null ? g.keys : [])))
    : new Map<string, string>();

  return groups.map((g) => ({
    eventId: g.eventId,
    eventName: g.eventName,
    eventDate: g.eventDate,
    names: [...g.names],
    uploadCount: g.uploadCount,
    lastUploadAt: g.lastUploadAt,
    gate: g.gate,
    // Belt: a gated album never shows a photograph here, whatever a row carried.
    previews:
      g.gate === null
        ? g.keys.map((key) => signed.get(key) ?? "").filter(Boolean)
        : [],
  }));
}

/**
 * A row's own approved previews (`20260927200000_claim_previews.sql`: up to four from an open album,
 * none from a gated one), empty keys dropped. The column is typed since the types were regenerated;
 * an array the answer left null still reads as no previews.
 */
function previewKeysOf(row: { preview_keys: string[] | null }): string[] {
  return (row.preview_keys ?? []).filter((k) => k.length > 0);
}

/** The album's door as the list answers it: a password or a private album is a gate, else none. */
function gateOf(row: {
  event_visibility: string | null;
}): ClaimableEvent["gate"] {
  const door = row.event_visibility;
  return door === "password" || door === "private" ? door : null;
}

/** Presigned the way the dashboard's other stills are (stable, so a re-render reuses the link). */
async function presignAll(keys: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(keys)];
  return new Map(
    await Promise.all(
      unique.map(
        async (key) =>
          [key, await presignDownload({ key, stable: true })] as const,
      ),
    ),
  );
}

/** A full page's last row is the next page's cursor, and the cursor's time is its last upload. */
function lastUploadAt(row: {
  guest_id: string;
  last_upload_at: string | null;
}): string {
  // The RPC lists only rows with a live upload, so this is never null; a null here would restart
  // the read from the top, so it fails loudly instead.
  if (!row.last_upload_at) {
    throw new Error(
      `dashboard: claimable guest rows: guest row ${row.guest_id} has no last upload to page on`,
    );
  }
  return row.last_upload_at;
}

/* ── what a claimed event offers next ───────────────────────────────────────────────────────── */

/**
 * What a claimed event offers (`identity-claims` r2, `next=both`: Open album on every claimed row,
 * and a small Follow beside it where the host has a page).
 */
export type ClaimedEventNext = {
  /** The album, or null when the host made it private (it opens for nobody, the guest included). */
  href: string | null;
  /**
   * The host to follow, or null: no public page (a host with no handle is nobody to follow), a
   * private album, herself, or a block either way (a Follow that could only silently no-op would
   * advertise the block, the profile page's own rule).
   */
  host: {
    id: string;
    slug: string;
    name: string;
    /** She already follows them: the button starts on Following. */
    following: boolean;
  } | null;
};

/**
 * The follow-up for an event she has just claimed, read AFTER the claim and only for an event she
 * is now a guest of.
 *
 * ★ THE LINK NEVER RIDES THE LIST. `list_guest_rows_by_email` hands back no album link on purpose
 * ("the album capability link must not ride a list the caller has not proved they attended"), and a
 * Not mine is exactly an event she was never at. So the link is read here, once her claim has made
 * her a guest there: a live upload on a row of her own account at that event, the test a Guest card
 * on her dashboard passes (`getMyGuestEventCards`), which already gives her this same link. An event
 * id she did not just claim, forged or not, answers null unless she is a guest there already.
 *
 * Admin reads for the reason `getHostCard` gives (`guests` is deny-all and `profiles` own-row), each
 * naming its columns: the host's id, handle and name are already public on /u/[slug] and the
 * album's byline. `auth` is the Server Function's own verified caller, handed in so the claim and
 * this read cost one getUser().
 */
export async function getClaimedEventNext(
  auth: RequestAuth,
  eventId: string,
): Promise<ClaimedEventNext | null> {
  const { supabase, user } = auth;
  if (!user) return null;
  const admin = createAdminClient();

  const [held, event] = await Promise.all([
    mustQuery(
      admin
        .from("media")
        .select("id, guests!media_guest_id_fkey!inner(user_id)")
        .eq("event_id", eventId)
        .eq("guests.user_id", user.id)
        .neq("status", "removed")
        .limit(1),
      "claims: a claimed event's upload",
    ),
    mustQuery(
      admin
        .from("events")
        .select("visibility, qr_token, host_id")
        .eq("id", eventId)
        .is("deleted_at", null)
        .maybeSingle(),
      "claims: a claimed event",
    ),
  ]);
  if ((held ?? []).length === 0 || !event) return null;

  // The album's own masking (lib/dashboard/guest-events.ts): Only me is blank and locked. A gated
  // album is stored private too, and opens for her: the claim made her row, which is in, hers.
  if (
    event.visibility === "private" &&
    !(await readEventGates([eventId])).has(eventId)
  ) {
    return { href: null, host: null };
  }
  const href = `/e/${event.qr_token}`;
  if (!event.host_id || event.host_id === user.id) return { href, host: null };

  const profile = await mustQuery(
    admin
      .from("profiles")
      .select("id, slug, display_name")
      .eq("id", event.host_id)
      .maybeSingle(),
    "claims: a claimed event's host",
  );
  const name = profile?.display_name?.trim();
  if (!profile?.slug || !name) return { href, host: null };

  const [blocked, following] = await Promise.all([
    isBlockedEitherWay(user.id, profile.id),
    mustCount(
      supabase
        .from("user_follows")
        .select("followee_id", { count: "exact", head: true })
        .eq("follower_id", user.id)
        .eq("followee_id", profile.id),
      "claims: following a claimed event's host",
    ),
  ]);
  if (blocked) return { href, host: null };
  return {
    href,
    host: {
      id: profile.id,
      slug: profile.slug,
      name,
      following: following > 0,
    },
  };
}
