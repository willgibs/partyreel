/**
 * A PERSON'S PHOTOGRAPHS IN ONE ALBUM, AND WHAT THE GUESTS ROOM SAYS OF EACH (guests-room r1: `rows=list`, a count
 * at every guest's row and who added most first; `card=standing`, four of their photographs and See all in the card
 * every name opens). The one home for both reads, kept apart from `social.ts` on purpose: that module answers WHO is a
 * guest (the one count), and this one only what a person the list already holds has added.
 *
 * ★ WHAT A CARD SHOWS IS WHAT THE ALBUM SHOWS: approved and visible (the seal's own predicate, `unsealedFilter`), on
 * the host's card as on a guest's. A held upload waits in Review, a hidden one is the host's own choice, a sealed one
 * develops later, and none of them is a photograph the album shows, so none is counted or drawn here. The host's own
 * album covers a sealed shot too (her hub's veil), so the card never lifts one for her either.
 *
 * ★ A PERSON IS NAMED THE WAY BLOCK NAMES ONE (`BlockTarget`'s three ways): a confirmed guest's account (every proved
 * ticket of theirs here, one person however many phones), a typed name's own ticket (two people who typed "Sam" are
 * two people, the list's rule), or whoever sent one photograph (the host's credit, where the database decides who sent
 * it, so no id or address rides a credit to get here). `resolveLookRows` turns each into the person's tickets.
 *
 * ★ `guests` HAS NO CLIENT GRANT, SO ITS ROWS ARE THE SERVICE ROLE'S, AND EVERY READ HERE STANDS BEHIND A GATE: the
 * host's reads prove the host themselves (the signed-in user IS the event's host, read again here rather than trusted
 * from a caller, as `getConfirmedGuestAddresses` does), and read her album's rows on her own RLS client
 * (`media_host_all`); the album's read stands behind its Server Function's `resolveAlbumViewer` (the album's own
 * capability gate, at `full`), and the links it hands out are minted through the album's own gated minter, which
 * drops any id the album would not show this viewer.
 *
 * ★ EVERY LIST IS READ WHOLE, EVERY COUNT COUNTED, EVERY ID LIST CHUNKED (read-all.ts): a party's tickets and its
 * album page past PostgREST's 1,000-row cut, and a person's tickets ride `inChunks` (one chunk in every real case:
 * a ticket per phone they joined from).
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getBlockedGuestIds } from "@/lib/db/queries/event-blocks";
import { olderThan } from "@/lib/db/queries/guest-events";
import { getBlockedAmong } from "@/lib/db/queries/social";
import { mustCount, mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import type { Database } from "@/lib/db/types";
import { nowIso, unsealedFilter } from "@/lib/disposable/seal";
import { timestampToMicros } from "@/lib/events/album-wire";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRequestAuth } from "@/lib/supabase/request-auth";

type Client = SupabaseClient<Database>;

/** Whose photographs, as a surface knows them (the block's own three ways, with the event an account needs). */
export type LookWho =
  | { kind: "account"; userId: string }
  | { kind: "row"; guestId: string }
  | { kind: "media"; mediaId: string };

/** Where a page of a person's photographs resumes: the last one's own `(created_at, id)`, the album's order. */
export type LookCursor = { at: string; id: string };

/** One photograph of theirs, as a card or its panel draws it before its links are minted. */
export type LookRow = {
  id: string;
  type: "photo" | "video";
  width: number | null;
  height: number | null;
  duration: number | null;
  createdAt: string;
};

/** A page of a person's photographs: how many the album shows of theirs, by kind, and the page newest first. */
export type LookPage = {
  photos: number;
  videos: number;
  rows: LookRow[];
  next: LookCursor | null;
};

/** What the Guests room says of one person beside their name: what they added and when the first landed. */
export type GuestAdded = {
  photos: number;
  videos: number;
  /** When their first approved, visible upload landed (an ISO timestamp): they are in since then. */
  firstAt: string;
};

/** People past the door with nothing in the album yet (`readHostGuestFacts`). */
export type QuietPeople = {
  /** Confirmed guests, once per person (their account ids). */
  accounts: string[];
  /** Named, unconfirmed tickets, once per ticket. */
  rows: { guestId: string; name: string }[];
};

export type HostGuestFacts = {
  /** By the id the guest list keys a person on: an account's id, or a typed name's ticket. */
  added: Map<string, GuestAdded>;
  quiet: QuietPeople;
};

const NOTHING: HostGuestFacts = {
  added: new Map(),
  quiet: { accounts: [], rows: [] },
};

/**
 * The event's host, if the signed-in user is that host (a live event, never a deleted one), else null. Read on the
 * service role, because every read after it is too: a caller that forgot its own gate gets nothing.
 */
async function provenHost(eventId: string): Promise<string | null> {
  const { user } = await getRequestAuth();
  if (!user) return null;
  const event = await mustQuery(
    createAdminClient()
      .from("events")
      .select("host_id")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle(),
    "guest look: the host",
  );
  return event && event.host_id === user.id ? event.host_id : null;
}

/**
 * ★ WHAT THE GUESTS ROOM SAYS OF EVERY PERSON, FOR ITS HOST ALONE: each listed person's approved, visible uploads
 * (the count at their row, who added most leading the list, and "In since" on their card), and the people past the
 * door with nothing in the album yet, whom the guest list (the one count's people) never names: someone let in at the
 * door, or who joined and has added nothing the album shows.
 *
 * Proves the host itself (`provenHost`): anyone else gets nothing, and `guests` is never read. The tickets are the
 * service role's (their four columns, never an address or a token); the album's rows are the host's own RLS read.
 * A person is grouped as the one count groups them (`resolveEventGuests`): a proved ticket by its account, any other
 * by itself; the host's own tickets and the ones a block holds are no one's here.
 */
export async function readHostGuestFacts(
  eventId: string,
): Promise<HostGuestFacts> {
  const hostId = await provenHost(eventId);
  if (!hostId) return NOTHING;
  const { supabase } = await getRequestAuth();
  const admin = createAdminClient();
  const now = nowIso();
  const [tickets, approved, blocked] = await Promise.all([
    readAllPages(
      "guest look: tickets",
      (after: string | null, limit) => {
        let q = admin
          .from("guests")
          .select("id, user_id, verified_at, admission, display_name")
          .eq("event_id", eventId)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (row) => row.id,
    ),
    readAllPages(
      "guest look: what the album shows",
      (after: string | null, limit) => {
        let q = supabase
          .from("media")
          .select("id, guest_id, type, created_at")
          .eq("event_id", eventId)
          .eq("status", "approved")
          .or(unsealedFilter(now))
          .not("guest_id", "is", null)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (row) => row.id,
    ),
    getBlockedGuestIds(eventId),
  ]);

  // Whose each ticket is: a proved ticket is its account's, any other its own; the host's and a blocked one, nobody's.
  const personOf = new Map<string, string>();
  const provedAccounts = new Set<string>();
  for (const t of tickets.rows) {
    if (blocked.has(t.id) || (t.user_id !== null && t.user_id === hostId))
      continue;
    if (t.verified_at !== null && t.user_id !== null) {
      personOf.set(t.id, t.user_id);
      provedAccounts.add(t.user_id);
    } else personOf.set(t.id, t.id);
  }

  const added = new Map<string, GuestAdded>();
  for (const m of approved.rows) {
    const person = m.guest_id ? personOf.get(m.guest_id) : undefined;
    if (!person) continue;
    const held = added.get(person) ?? {
      photos: 0,
      videos: 0,
      firstAt: m.created_at,
    };
    if (m.type === "video") held.videos += 1;
    else held.photos += 1;
    if (timestampToMicros(m.created_at) < timestampToMicros(held.firstAt))
      held.firstAt = m.created_at;
    added.set(person, held);
  }

  // Past the door with nothing the album shows: an account once, a named typed ticket once (a nameless one names
  // nobody, and a typed ticket of someone proved here is that person's, already counted by their account).
  const accounts = new Set<string>();
  const rows: QuietPeople["rows"] = [];
  for (const t of tickets.rows) {
    if (t.admission !== "in") continue;
    const person = personOf.get(t.id);
    if (!person || added.has(person)) continue;
    if (person !== t.id) {
      accounts.add(person);
      continue;
    }
    if (t.user_id !== null && provedAccounts.has(t.user_id)) continue;
    const name = t.display_name?.trim();
    if (name) rows.push({ guestId: t.id, name });
  }
  return { added, quiet: { accounts: [...accounts], rows } };
}

/** A quiet account's public card: the four columns a profile card is (`social.ts`' allow-list), and no fifth. */
export type QuietCard = {
  id: string;
  displayName: string | null;
  slug: string | null;
  avatarMarker: string | null;
};

/**
 * THE CARDS OF THE QUIET ACCOUNTS, for the room's fold of people in with nothing added yet: the public-by-existence
 * card fields (profiles-social.md) for ids the host's own proved read just handed out, never any other. ★ THE SAME
 * FOUR COLUMNS AS THE GUEST LIST'S CARDS (`social.ts`' `getProfileCards`, which is that module's own): `profiles`
 * carries the account's email, tier and storage beside them, and guest-look.test.ts pins the SELECT to exactly these.
 */
export async function readQuietCards(
  ids: readonly string[],
): Promise<QuietCard[]> {
  const admin = createAdminClient();
  const rows = await inChunks(
    "guest look: quiet cards",
    ids,
    async (chunk) =>
      (await mustQuery(
        admin
          .from("profiles")
          .select("id, display_name, slug, avatar_updated_at")
          .in("id", chunk),
        "guest look: quiet cards",
      )) ?? [],
  );
  return rows.map((p) => ({
    id: p.id,
    displayName: p.display_name,
    slug: p.slug,
    avatarMarker: p.avatar_updated_at,
  }));
}

/**
 * THE HOST'S OWN RELATIONS AMONG THE PEOPLE HER ROOM LISTS, for the Follow her card offers (`card=standing`: "Follow
 * and their page kept quiet"): whom she follows (her own follows, RLS, asked only about these ids), and whom a block
 * parts from her either way (`getBlockedAmong`: a yes or no for ids she already holds, never which side). A Follow is
 * offered only where it could land, as the album's list offers it.
 */
export async function readHostRelations(ids: readonly string[]): Promise<{
  following: string[];
  barred: string[];
}> {
  const { supabase, user } = await getRequestAuth();
  if (!user || ids.length === 0) return { following: [], barred: [] };
  const [follows, barred] = await Promise.all([
    inChunks("guest look: whom she follows", ids, async (chunk) => {
      // row-cap: (follower_id, followee_id) is the primary key, so a chunk of followees reads at most one row a followee
      return (
        (await mustQuery(
          supabase
            .from("user_follows")
            .select("followee_id")
            .eq("follower_id", user.id)
            .in("followee_id", chunk),
          "guest look: whom she follows",
        )) ?? []
      );
    }),
    getBlockedAmong(user.id, ids),
  ]);
  return {
    following: follows.map((f) => f.followee_id),
    barred: [...barred],
  };
}

/**
 * THE PERSON'S TICKETS AT THIS EVENT, from the way a surface names them (`LookWho`), or null where they are nobody's
 * here (no ticket of theirs, the host's own, or a photograph the host sent through her own door). The service role's
 * read, behind its caller's gate. A typed ticket that was proved since is its account's, so it widens to every proved
 * ticket of theirs, as the list counts them.
 */
export async function resolveLookRows(
  eventId: string,
  who: LookWho,
  hostId: string | null,
): Promise<string[] | null> {
  const admin = createAdminClient();
  const accountRows = async (userId: string): Promise<string[] | null> => {
    if (userId === hostId) return null;
    const { rows } = await readAllPages(
      "guest look: their tickets",
      (after: string | null, limit) => {
        let q = admin
          .from("guests")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .not("verified_at", "is", null)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q;
      },
      (row) => row.id,
    );
    return rows.length > 0 ? rows.map((r) => r.id) : null;
  };
  const ticketRows = async (guestId: string): Promise<string[] | null> => {
    const ticket = await mustQuery(
      admin
        .from("guests")
        .select("id, user_id, verified_at")
        .eq("id", guestId)
        .eq("event_id", eventId)
        .maybeSingle(),
      "guest look: the ticket",
    );
    if (!ticket) return null;
    if (ticket.user_id !== null && ticket.user_id === hostId) return null;
    if (ticket.verified_at !== null && ticket.user_id !== null)
      return accountRows(ticket.user_id);
    return [ticket.id];
  };

  switch (who.kind) {
    case "account":
      return accountRows(who.userId);
    case "row":
      return ticketRows(who.guestId);
    case "media": {
      const sent = await mustQuery(
        admin
          .from("media")
          .select("guest_id")
          .eq("id", who.mediaId)
          .eq("event_id", eventId)
          .maybeSingle(),
        "guest look: the photograph's sender",
      );
      return sent?.guest_id ? ticketRows(sent.guest_id) : null;
    }
  }
}

/**
 * A PAGE OF A PERSON'S PHOTOGRAPHS, NEWEST FIRST (the album's own order, `(created_at desc, id desc)`), after
 * `after`, and how many of each kind the album shows of theirs. `media` is the caller's client: the host's RLS one
 * (her album, `media_host_all`), or the service role behind the album's gate. A page reads `limit + 1` a ticket chunk
 * to know whether another follows, and the chunks merge in that order, so a person on many phones pages as one.
 */
export async function readLookPage(
  media: Client,
  eventId: string,
  rows: readonly string[],
  page: { after: LookCursor | null; limit: number },
): Promise<LookPage> {
  const now = nowIso();
  const shown = () =>
    media
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "approved")
      .or(unsealedFilter(now));
  const [photos, videos, found] = await Promise.all([
    inChunks("guest look: their photos", rows, async (chunk) => [
      await mustCount(
        shown().eq("type", "photo").in("guest_id", chunk),
        "guest look: their photos",
      ),
    ]),
    inChunks("guest look: their videos", rows, async (chunk) => [
      await mustCount(
        shown().eq("type", "video").in("guest_id", chunk),
        "guest look: their videos",
      ),
    ]),
    inChunks("guest look: a page of theirs", rows, async (chunk) => {
      let q = media
        .from("media")
        .select("id, type, width, height, duration_seconds, created_at")
        .eq("event_id", eventId)
        .eq("status", "approved")
        .or(unsealedFilter(now))
        .in("guest_id", chunk)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(page.limit + 1);
      if (page.after) q = q.or(olderThan(page.after));
      return (await mustQuery(q, "guest look: a page of theirs")) ?? [];
    }),
  ]);
  const ordered = found.sort((a, b) => {
    const at =
      timestampToMicros(b.created_at) - timestampToMicros(a.created_at);
    if (at !== 0) return at;
    return a.id === b.id ? 0 : a.id < b.id ? 1 : -1;
  });
  const taken = ordered.slice(0, page.limit);
  const last = taken.at(-1);
  return {
    photos: photos.reduce((sum, n) => sum + n, 0),
    videos: videos.reduce((sum, n) => sum + n, 0),
    rows: taken.map((m) => ({
      id: m.id,
      type: m.type,
      width: m.width,
      height: m.height,
      duration: m.duration_seconds,
      createdAt: m.created_at,
    })),
    next:
      ordered.length > page.limit && last
        ? { at: last.created_at, id: last.id }
        : null,
  };
}

/**
 * THE HOST'S LOOK AT ONE PERSON: the event the way names it (an account names none, so it comes with one; a ticket
 * and a photograph name their own), proved hers, then a page of what the album shows of theirs on her own RLS read.
 * Null where the event is not hers, or the person is nobody's here.
 */
export async function readHostLook(
  target:
    | { kind: "account"; eventId: string; userId: string }
    | { kind: "row"; guestId: string }
    | { kind: "media"; mediaId: string },
  page: { after: LookCursor | null; limit: number },
): Promise<(LookPage & { eventId: string }) | null> {
  const admin = createAdminClient();
  let eventId: string | null = null;
  if (target.kind === "account") eventId = target.eventId;
  else if (target.kind === "row") {
    const ticket = await mustQuery(
      admin
        .from("guests")
        .select("event_id")
        .eq("id", target.guestId)
        .maybeSingle(),
      "guest look: the ticket's event",
    );
    eventId = ticket?.event_id ?? null;
  } else {
    const sent = await mustQuery(
      admin
        .from("media")
        .select("event_id")
        .eq("id", target.mediaId)
        .maybeSingle(),
      "guest look: the photograph's event",
    );
    eventId = sent?.event_id ?? null;
  }
  if (!eventId) return null;
  const hostId = await provenHost(eventId);
  if (!hostId) return null;
  const who: LookWho =
    target.kind === "account"
      ? { kind: "account", userId: target.userId }
      : target;
  const rows = await resolveLookRows(eventId, who, hostId);
  if (!rows) return null;
  const { supabase } = await getRequestAuth();
  return { eventId, ...(await readLookPage(supabase, eventId, rows, page)) };
}

/**
 * THE ALBUM'S LOOK AT ONE OF ITS GUESTS, for a viewer its caller let in whole (`resolveAlbumViewer`, `full`, never the
 * demo, which lists nobody): their tickets, then a page of what the album shows of theirs, both on the service role
 * behind that gate (the links are minted through the album's own gated minter after it). The host is nobody's guest
 * here, and a photograph names no one on this side (the credit's look is the host's alone). Null where the person is
 * nobody's here.
 */
export async function readAlbumLook(
  eventId: string,
  who: Exclude<LookWho, { kind: "media" }>,
  page: { after: LookCursor | null; limit: number },
): Promise<LookPage | null> {
  const admin = createAdminClient();
  // The host's id stays on the server (the album's event carries none): read here, only to leave her out.
  const event = await mustQuery(
    admin
      .from("events")
      .select("host_id")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle(),
    "guest look: the album's host",
  );
  if (!event) return null;
  const rows = await resolveLookRows(eventId, who, event.host_id);
  if (!rows) return null;
  return readLookPage(admin, eventId, rows, page);
}
