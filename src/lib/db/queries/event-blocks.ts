/**
 * THE PER-EVENT BLOCK'S READS (event-safety r1, migration 20260928120000): the host's Blocked list, and
 * the three questions the server asks for everyone else (is this browser's ticket blocked, whom does
 * this event's guest list leave out, which events hold this account). The rule itself lives in SQL,
 * once (`event_block_names_row` and `event_block_names_account`); nothing here re-derives it.
 *
 * ★ THE TYPED SEAM, UNTIL THE TYPES REGENERATE. `src/lib/db/types.ts` is generated from the live
 * schema, which gains `event_blocks` and these functions only when the Orchestrator applies the
 * migration; so the new objects are reached through `untyped()` and every answer is read defensively,
 * which compiles on either side of the regeneration. ★ AND THE RUNTIME SEAM, UNTIL THE APPLY: a missing
 * table or function (the codes below) reads as "nothing blocked", LOUDLY (captured, `blocks_schema_
 * missing`), so this lane's build runs against a database that does not have them yet, and a
 * post-apply regression still surfaces.
 */
import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { seedFor } from "@/lib/avatar/seed";
import { mustQuery } from "@/lib/db/must-query";
import { inChunks, readAllPages } from "@/lib/db/read-all";
import type { BlockedPerson } from "@/lib/events/event-blocks";
import { captureError } from "@/lib/observability/sentry";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/** The schema the migration adds, not yet in the generated types: its absence is the seam. */
const MISSING_SCHEMA_CODES = new Set([
  "42P01", // undefined table
  "42883", // undefined function
  "PGRST202", // function not in the schema cache
  "PGRST205", // table not in the schema cache
]);

/** Is this the migration not applied yet? Loud when it fires: after the apply it never should. */
export function isBlockSchemaMissing(error: unknown): boolean {
  const code = (error as { code?: string | null } | null)?.code ?? "";
  const missing = MISSING_SCHEMA_CODES.has(code);
  if (missing) {
    captureError("security", error, { seam: "blocks_schema_missing", code });
  }
  return missing;
}

type AnyClient = SupabaseClient;

/** A client that can name the migration's objects before `types.ts` knows them. */
function untyped(client: unknown): AnyClient {
  return client as AnyClient;
}

type RpcAnswer = { data: unknown; error: PostgrestError | null };

async function rpc(
  client: unknown,
  fn: string,
  args: Record<string, unknown>,
): Promise<RpcAnswer> {
  const c = untyped(client);
  return (await c.rpc(fn, args)) as RpcAnswer;
}

/**
 * ★ THE ONE-BROWSER HOLD: does any ticket this browser holds (the `pr_guest_<eventId>` cookie, a
 * write's body token) name a row a block holds at this event? The closed door asks it for every
 * request that carries a ticket, before the private branch, whether or not the album is private
 * (`lib/events/closed-door.server.ts`). Tokens are shape-guarded by the caller; none asks nothing.
 */
export async function isTicketBlocked(
  eventId: string,
  tokens: readonly string[],
): Promise<boolean> {
  if (tokens.length === 0) return false;
  const { data, error } = await rpc(
    createAdminClient(),
    "event_ticket_blocked",
    {
      p_event_id: eventId,
      p_session_tokens: [...new Set(tokens)],
    },
  );
  if (error) {
    if (isBlockSchemaMissing(error)) return false;
    throw error;
  }
  return data === true;
}

/**
 * The guest rows a block holds at this event, which the ONE count (`getEventGuests`) leaves out: a
 * blocked person drops off the guest list and every number, even while the host has one of their
 * photographs restored. One uuid[] from SQL, so the TypeScript side never re-derives the rule.
 */
export async function getBlockedGuestIds(
  eventId: string,
): Promise<ReadonlySet<string>> {
  const { data, error } = await rpc(
    createAdminClient(),
    "event_blocked_guest_ids",
    { p_event_id: eventId },
  );
  if (error) {
    if (isBlockSchemaMissing(error)) return new Set();
    throw error;
  }
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
  const { data, error } = await rpc(createAdminClient(), "blocked_events_for", {
    p_user_id: userId,
  });
  if (error) {
    if (isBlockSchemaMissing(error)) return new Map();
    throw error;
  }
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

/** A block row as the host reads it through RLS (the host's own events only). */
type BlockRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  guest_id: string | null;
  display_name: string | null;
  removed_media_ids: string[] | null;
  created_at: string;
};

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
 * the restorable count and the faces read on the admin client, over the ids those rows returned.
 *
 * ★ WHAT CAN COME BACK IS COUNTED THE WAY let_back_in COUNTS IT: a photograph still in Deleted from
 * this very removal (`removed_at` is the block's own instant), not withdrawn by its guest, not an
 * operator's takedown, not held. A held item is left out rather than counted, so the number the host
 * reads is the number the restore moves, and no number can tell a hold exists.
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

  let rows: BlockRow[];
  try {
    const read = await readAllPages(
      "event blocks: the host's list",
      (after: string | null, limit) => {
        let q = untyped(supabase)
          .from("event_blocks")
          .select(
            "id, user_id, email, guest_id, display_name, removed_media_ids, created_at",
          )
          .eq("event_id", eventId)
          .order("id", { ascending: true })
          .limit(limit);
        if (after) q = q.gt("id", after);
        return q as unknown as PromiseLike<{
          data: BlockRow[] | null;
          error: PostgrestError | null;
        }>;
      },
      (row) => row.id,
    );
    rows = read.rows;
  } catch (error) {
    if (isBlockSchemaMissing(error)) return [];
    throw error;
  }
  if (rows.length === 0) return [];
  // The newest block first: the one the host just made is the one they came to see.
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const admin = createAdminClient();
  const removedIds = rows.flatMap((r) => r.removed_media_ids ?? []);
  const userIds = rows.flatMap((r) => (r.user_id ? [r.user_id] : []));

  const [media, profiles] = await Promise.all([
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
  ]);
  const mediaById = new Map(media.map((m) => [m.id, m] as const));
  const profileById = new Map(profiles.map((p) => [p.id, p] as const));

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
      };
    }),
  );
}
