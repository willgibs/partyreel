/**
 * THE DOORS' READS (event-settings r1, migration 20260929120000): who a request is at an event's door,
 * the waiting door's check-in, and the host's own numbers, queue and invite list. The rule itself lives
 * in SQL, once (`event_door_standing`, `event_door_account_in`); nothing here re-derives it. Each answer
 * is a jsonb, read defensively.
 *
 * Every read is the service role's: the standing for the page and the guest routes after they read the
 * request's own identity (`getUser()`, the tickets it carries), the host's numbers after the caller has
 * proved the host (`getEvent`, RLS).
 */
import "server-only";

import { mustQuery } from "@/lib/db/must-query";
import { inChunks } from "@/lib/db/read-all";
import { readStanding, type DoorStanding } from "@/lib/event/door/decide";
import { createAdminClient } from "@/lib/supabase/admin";

/** Who is asking: the `getUser()` id (or none), and the tickets the request carries (shape-checked). */
export type DoorCaller = {
  userId: string | null;
  tickets: readonly string[];
};

/**
 * WHO THIS REQUEST IS AT THIS DOOR: `event_door_standing`, the account and the tickets together. The
 * generated Args type makes both optional rather than nullable (the SQL defaults are null), so a signed-out
 * caller's absent id is OMITTED here instead of sent as null.
 */
export async function readDoorStanding(
  eventId: string,
  caller: DoorCaller,
): Promise<DoorStanding> {
  const { data, error } = await createAdminClient().rpc("event_door_standing", {
    p_event_id: eventId,
    p_user_id: caller.userId ?? undefined,
    p_tickets: [...new Set(caller.tickets)],
  });
  if (error) throw error;
  return readStanding(data);
}

/**
 * THE WAITING DOOR'S CHECK-IN (about every 30 s while it is open): the standing again, and a stamp on
 * her waiting rows, so a later let-in mail can tell whether she is still at the door.
 */
export async function checkInAtDoor(
  eventId: string,
  caller: DoorCaller,
): Promise<DoorStanding> {
  const { data, error } = await createAdminClient().rpc("event_door_check_in", {
    p_event_id: eventId,
    p_user_id: caller.userId ?? undefined,
    p_tickets: [...new Set(caller.tickets)],
  });
  if (error) throw error;
  return readStanding(data);
}

/** The host's numbers for one event (the settings' consequence lines, the Guests room, the hub). */
export type DoorCounts = {
  /** People past the door: an account once, a named ticket once; never the host or a block's. */
  in: number;
  /** Of those, the ones in on a typed name alone (an email step turned on asks them to confirm one). */
  inByName: number;
  /** People waiting on the host, an account once. */
  waiting: number;
  /** Addresses on the invite list. */
  invited: number;
  /** Listed addresses that are past the door. */
  joined: number;
};

const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/** ★ THE CALLER HAS PROVED THE HOST (`getEvent`). */
export async function getDoorCounts(eventId: string): Promise<DoorCounts> {
  const { data, error } = await createAdminClient().rpc("event_door_counts", {
    p_event_id: eventId,
  });
  if (error) throw error;
  const v = (data ?? {}) as Record<string, unknown>;
  return {
    in: count(v.in),
    inByName: count(v.in_by_name),
    waiting: count(v.waiting),
    invited: count(v.invited),
    joined: count(v.joined),
  };
}

/** One newcomer waiting at the door, as the host's Guests room lists her. */
export type DoorRequest = {
  /** The waiting row Let in and Decline name. */
  guestId: string;
  /** Her account (a waiting ticket is always a confirmed account's), for her face. */
  userId: string | null;
  /** Her profile's name, or null (the room says her address instead). */
  name: string | null;
  /** The address she confirmed: the host sees a confirmed guest's address (guest-flow.md). */
  email: string | null;
  askedAt: string;
  /** Her door's last check-in, or null. */
  seenAt: string | null;
};

/** ★ THE CALLER HAS PROVED THE HOST. At most 500, oldest ask first; `total` counts them all. */
export async function getDoorQueue(
  eventId: string,
): Promise<{ total: number; people: DoorRequest[] }> {
  const { data, error } = await createAdminClient().rpc("event_door_queue", {
    p_event_id: eventId,
  });
  if (error) throw error;
  const v = (data ?? {}) as { total?: unknown; people?: unknown };
  const people = Array.isArray(v.people) ? v.people : [];
  return {
    total: count(v.total),
    people: people.flatMap((raw): DoorRequest[] => {
      const p = (raw ?? {}) as Record<string, unknown>;
      if (typeof p.guest_id !== "string" || typeof p.asked_at !== "string") {
        return [];
      }
      return [
        {
          guestId: p.guest_id,
          userId: typeof p.user_id === "string" ? p.user_id : null,
          name: typeof p.name === "string" ? p.name : null,
          email: typeof p.email === "string" ? p.email : null,
          askedAt: p.asked_at,
          seenAt: typeof p.seen_at === "string" ? p.seen_at : null,
        },
      ];
    }),
  };
}

/** One address on the invite list, as the host's Guests room lists it. */
export type InvitedAddress = {
  email: string;
  addedAt: string;
  /** She is past the door on a row that confirmed this address. */
  joined: boolean;
};

/** ★ THE CALLER HAS PROVED THE HOST. Newest first; the list is capped at 500. */
export async function getInviteList(
  eventId: string,
): Promise<InvitedAddress[]> {
  const { data, error } = await createAdminClient().rpc("event_invite_list", {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : []).flatMap((raw): InvitedAddress[] => {
    const i = (raw ?? {}) as Record<string, unknown>;
    if (typeof i.email !== "string" || typeof i.added_at !== "string")
      return [];
    return [{ email: i.email, addedAt: i.added_at, joined: i.joined === true }];
  });
}

/**
 * Who waits across a host's live events, by event id, for the places the host is already told about
 * held uploads (the dashboard's pulse, the bell) and the hub's Guests card. `hostId` is the caller's
 * own `getUser()` id.
 */
export async function getHostDoorWaiting(
  hostId: string,
): Promise<ReadonlyMap<string, number>> {
  const { data, error } = await createAdminClient().rpc("host_door_waiting", {
    p_host_id: hostId,
  });
  if (error) throw error;
  const out = new Map<string, number>();
  if (data && typeof data === "object" && !Array.isArray(data)) {
    for (const [eventId, n] of Object.entries(
      data as Record<string, unknown>,
    )) {
      if (count(n) > 0) out.set(eventId, count(n));
    }
  }
  return out;
}

/** What a door shows of the event it keeps, read past the anon read's private-album redaction. */
export type DoorEventDetails = {
  name: string;
  description: string | null;
  eventDate: string | null;
  customSlug: string | null;
  hostDisplayName: string | null;
};

/**
 * ★ THE DOOR'S OWN RE-READ. The anon album read answers a gated album as a private one (no name, no
 * metadata), which is right for anyone the door shuts; the page asks this only once the door has let
 * the request stand at it or go through (`lib/events/closed-door.server.ts` decides), and trims it to
 * what that door shows. Two indexed single-row reads on the admin client.
 */
export async function readDoorEventDetails(
  eventId: string,
): Promise<DoorEventDetails | null> {
  const admin = createAdminClient();
  const event = await mustQuery(
    admin
      .from("events")
      .select("name, description, event_date, custom_slug, host_id")
      .eq("id", eventId)
      .is("deleted_at", null)
      .maybeSingle(),
    "door: the event's details",
  );
  if (!event) return null;
  let hostDisplayName: string | null = null;
  if (event.host_id) {
    const host = await mustQuery(
      admin
        .from("profiles")
        .select("display_name")
        .eq("id", event.host_id)
        .maybeSingle(),
      "door: the host's name",
    );
    hostDisplayName = host?.display_name ?? null;
  }
  return {
    name: event.name,
    description: event.description ?? null,
    eventDate: event.event_date ?? null,
    customSlug: event.custom_slug ?? null,
    hostDisplayName,
  };
}

/**
 * ★ WHICH PRIVATE ALBUMS KEEP A GATE, for a reader that holds only the stored `visibility` (the
 * dashboard's Guest cards, the profile picker's tiles, a claim's next step). A gated album is stored
 * private (`doorOf`), and to someone already in it is the album, never the locked card Only me draws:
 * a gate stops newcomers, never the guests inside. The ids are the caller's own scoped read's; the
 * answer names each gated one's gate, and an id it leaves out is Only me.
 */
export async function readEventGates(
  eventIds: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (eventIds.length === 0) return new Map();
  const admin = createAdminClient();
  const rows = await inChunks(
    "door: the albums' gates",
    eventIds,
    async (chunk) => {
      const { data, error } = await admin
        .from("events")
        .select("id, gate")
        .in("id", chunk)
        .not("gate", "is", null);
      if (error) throw error;
      return data ?? [];
    },
  );
  const gates = new Map<string, string>();
  for (const row of rows) {
    if (row.gate) gates.set(row.id, row.gate);
  }
  return gates;
}
