/**
 * THE PER-EVENT BLOCK'S READS (event-safety r1, migration 20260928120000): the host's Blocked list, and
 * the two questions the server asks for everyone else (whom does this event's guest list leave out,
 * which events hold this account); whether one browser's ticket is blocked is `event_door_standing`'s
 * (`queries/event-doors.ts`). The rule itself lives in SQL, once (`event_block_names_row` and
 * `event_block_names_account`); nothing here re-derives it. ★ A read that fails THROWS: a broken read
 * never impersonates "nobody is blocked".
 */
import "server-only";

import { seedFor } from "@/lib/avatar/seed";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import { doorOf, type Door } from "@/lib/event/door/door";
import { blockedLanding, type BlockedPerson } from "@/lib/events/event-blocks";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * The guest rows a block holds at this event, which the ONE count (`getEventGuests`) leaves out: a
 * blocked person drops off the guest list and every number, even while the host has one of their
 * photographs restored. One uuid[] from SQL, so the TypeScript side never re-derives the rule.
 */
export async function getBlockedGuestIds(
  eventId: string,
): Promise<ReadonlySet<string>> {
  const { data, error } = await createAdminClient().rpc(
    "event_blocked_guest_ids",
    { p_event_id: eventId },
  );
  if (error) throw error;
  return new Set(
    Array.isArray(data)
      ? data.filter((id): id is string => typeof id === "string")
      : [],
  );
}

/** One event that holds this account, as her own lists need it. */
export type BlockedEventForAccount = {
  /** The block is on her own account (not only the address it confirmed), so her history there is hers. */
  own: boolean;
  /** Her Guest card's place: the newest upload the block removed. */
  lastUploadAt: string | null;
  /** Her profile picker offered the event (an approved upload on a proved row). */
  profileEligible: boolean;
};

/**
 * ★ HER OWN LISTS, AS A PRIVATE ALBUM'S WOULD READ. The events a block holds this account at (by id
 * or confirmed address), which her dashboard's Guest cards and her profile picker keep and mask as
 * private, as a private album's card stays and says so: a block moves her uploads to Deleted, and a
 * card that vanished would tell her what the door hides. Keyed by event id.
 */
export async function getBlockedEventsFor(
  userId: string,
): Promise<ReadonlyMap<string, BlockedEventForAccount>> {
  const { data, error } = await createAdminClient().rpc("blocked_events_for", {
    p_user_id: userId,
  });
  if (error) throw error;
  const out = new Map<string, BlockedEventForAccount>();
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [eventId, value] of Object.entries(
      data as Record<string, unknown>,
    )) {
      const v = (value ?? {}) as Record<string, unknown>;
      out.set(eventId, {
        own: v.own === true,
        lastUploadAt:
          typeof v.last_upload_at === "string" ? v.last_upload_at : null,
        profileEligible: v.profile_eligible === true,
      });
    }
  }
  return out;
}

/** Two timestamptz strings from one database, compared as the instant they name. */
function sameInstant(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a === b || Date.parse(a) === Date.parse(b);
}

/**
 * THE HOST'S BLOCKED LIST, for the foot of the Guests room (Will, `blocked=foot`): who, since when,
 * and what Let back in could bring back.
 *
 * ★ THE CALLER HAS PROVED THE HOST (`getEvent`), AND RLS PROVES IT AGAIN: the block rows are read on
 * the host's own client, where `event_blocks_select_host` answers only their own events' rows. Only
 * the restorable count, the faces and where each one stands at the door read on the admin client,
 * over the ids those rows returned.
 *
 * ★ WHAT CAN COME BACK IS COUNTED THE WAY let_back_in COUNTS IT: a photograph still in Deleted from
 * this very removal (`removed_at` is the block's own instant), not withdrawn by its guest, not an
 * operator's takedown, not held. A held item is left out rather than counted, so the number the host
 * reads is the number the restore moves, and no number can tell a hold exists.
 *
 * ★ WHERE LET BACK IN LEAVES EACH ONE (build 23's NIT-3; crumbs-24): someone with a row past the door
 * comes back in, unless the album is Only me, which shuts even the people already in (crumbs-27: they
 * are told it stays closed until the host opens it). Anyone else is a newcomer, whatever rows of hers
 * remain, and meets the door as it stands (`blockedLanding`): her ask, if it still stands, keeps her at
 * a door the host answers; the invite list, being the door, lets in an address it names, as
 * let_back_in's own admission does (`event_door_admit_listed`, 20260929220000); a password is met like
 * anyone new (it ended her ask, 20260929230000, so no waiting row of hers is left to read). The words
 * before and after the press say which. The door is the host's own read, once, for anyone in the Blocked
 * list (the door decides every landing); the invite list too, only while it is the door and a newcomer
 * there has an address.
 */
export async function getEventBlocks(
  eventId: string,
  format: {
    since: (iso: string) => string;
    until: (iso: string) => string;
  },
): Promise<BlockedPerson[]> {
  const { supabase, user } = await getRequestAuth();
  if (!user) return [];

  // The block rows as the host reads them through RLS (the host's own events only).
  const { rows } = await readAllPages(
    "event blocks: the host's list",
    (after: string | null, limit) => {
      let q = supabase
        .from("event_blocks")
        .select(
          "id, user_id, email, guest_id, display_name, removed_media_ids, created_at",
        )
        .eq("event_id", eventId)
        .order("id", { ascending: true })
        .limit(limit);
      if (after) q = q.gt("id", after);
      return q;
    },
    (row) => row.id,
  );
  if (rows.length === 0) return [];
  // The newest block first: the one the host just made is the one they came to see.
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const admin = createAdminClient();
  const removedIds = rows.flatMap((r) => r.removed_media_ids ?? []);
  const userIds = rows.flatMap((r) => (r.user_id ? [r.user_id] : []));
  const guestIds = rows.flatMap((r) => (r.guest_id ? [r.guest_id] : []));

  const [media, profiles, byAccount, byRow] = await Promise.all([
    inChunks(
      "event blocks: what can come back",
      removedIds,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("media")
            .select(
              "id, status, removed_at, removed_by_uploader, removed_by_admin, legal_hold_at, purge_at",
            )
            .in("id", chunk)
            .eq("event_id", eventId),
          "event blocks: what can come back",
        )) ?? [],
    ),
    inChunks(
      "event blocks: faces",
      userIds,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("profiles")
            .select("id, display_name, avatar_updated_at")
            .in("id", chunk),
          "event blocks: faces",
        )) ?? [],
    ),
    // Their rows here, by the account a block names and by the row it names, for whether each waits.
    // An account holds a ticket per browser it joined from, so its rows are read whole.
    inChunks("event blocks: at the door", userIds, async (chunk) => {
      const { rows: theirs } = await readAllPages(
        "event blocks: at the door",
        (after: string | null, limit) => {
          let q = admin
            .from("guests")
            .select("id, user_id, admission")
            .eq("event_id", eventId)
            .in("user_id", chunk)
            .order("id", { ascending: true })
            .limit(limit);
          if (after) q = q.gt("id", after);
          return q;
        },
        (guest) => guest.id,
      );
      return theirs;
    }),
    inChunks(
      "event blocks: at the door",
      guestIds,
      async (chunk) =>
        (await mustQuery(
          admin
            .from("guests")
            .select("id, user_id, admission")
            .eq("event_id", eventId)
            .in("id", chunk),
          "event blocks: at the door",
        )) ?? [],
    ),
  ]);
  const mediaById = new Map(media.map((m) => [m.id, m] as const));
  const profileById = new Map(profiles.map((p) => [p.id, p] as const));

  // Where each one stood here: a row past the door (someone who was in, then blocked, keeps her 'in'
  // rows), and a row that still waits on the host.
  const standingOf = (
    row: (typeof rows)[number],
  ): { wasIn: boolean; waiting: boolean } => {
    const theirs = [
      ...byAccount.filter(
        (g) => row.user_id !== null && g.user_id === row.user_id,
      ),
      ...byRow.filter((g) => g.id === row.guest_id),
    ];
    return {
      wasIn: theirs.some((g) => g.admission === "in"),
      waiting: theirs.some((g) => g.admission === "waiting"),
    };
  };
  // The door as it stands, and whom its list names: the door for anyone in the list (a newcomer's landing
  // is the door's, and someone who was in is told when it is Only me), the list only for a newcomer at it,
  // both on the host's own client (RLS: her own event). A door that cannot be read fails closed (Only me).
  const newcomers = rows.filter((r) => !standingOf(r).wasIn);
  let door: Door = "private";
  let listed: ReadonlySet<string> = new Set();
  if (rows.length > 0) {
    const event = await mustQuery(
      supabase
        .from("events")
        .select("visibility, gate")
        .eq("id", eventId)
        .maybeSingle(),
      "event blocks: the door",
    );
    door = event ? doorOf(event.visibility, event.gate) : "private";
    const addresses = newcomers.flatMap((r) => (r.email ? [r.email] : []));
    if (door === "invite" && addresses.length > 0) {
      const onList = await inChunks(
        "event blocks: the list",
        addresses,
        async (chunk) => {
          // row-cap: (event_id, email) is unique (event_invites_event_email_key), so a chunk of addresses reads at most one row an address
          return (
            (await mustQuery(
              supabase
                .from("event_invites")
                .select("email")
                .eq("event_id", eventId)
                .in("email", chunk),
              "event blocks: the list",
            )) ?? []
          );
        },
      );
      listed = new Set(onList.map((i) => i.email));
    }
  }

  type Removed = (typeof media)[number];
  return Promise.all(
    rows.map(async (row): Promise<BlockedPerson> => {
      const standing = (row.removed_media_ids ?? [])
        .map((id) => mediaById.get(id))
        .filter(
          (m): m is Removed =>
            !!m &&
            m.status === "removed" &&
            sameInstant(m.removed_at, row.created_at) &&
            !m.removed_by_uploader &&
            !m.removed_by_admin &&
            m.legal_hold_at === null,
        );
      const firstPurge = standing
        .map((m) => m.purge_at)
        .filter((at): at is string => typeof at === "string")
        .sort()[0];
      const profile = row.user_id ? profileById.get(row.user_id) : undefined;
      // A proved person carries the address key (or, with an address that could not be one, only
      // the account); a typed name carries its row, and the name the room showed is the typed one.
      const verified =
        row.email !== null || (row.user_id !== null && row.guest_id === null);
      const profileName = profile?.display_name?.trim() || null;
      const storedName = row.display_name?.trim() || null;
      return {
        id: row.id,
        name: verified
          ? (profileName ?? storedName)
          : (storedName ?? profileName),
        verified,
        email: row.email,
        avatarUrl:
          verified && row.user_id && profile
            ? await getAvatarUrl(row.user_id, profile.avatar_updated_at)
            : null,
        seed: verified && row.user_id ? seedFor(row.user_id) : null,
        since: format.since(row.created_at),
        restorable: standing.length,
        restorableUntil: firstPurge ? format.until(firstPurge) : null,
        lands: blockedLanding({
          ...standingOf(row),
          listed: row.email !== null && listed.has(row.email),
          door,
        }),
      };
    }),
  );
}
