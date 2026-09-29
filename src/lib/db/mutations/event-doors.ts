/**
 * THE HOST'S DOOR ACTS (event-settings r1, migration 20260929120000): set the door, let a newcomer in,
 * and put addresses on or off the invite list. Each is a SECURITY DEFINER RPC that re-checks the caller
 * hosts the event on `auth.uid()`, so each runs on the HOST'S OWN client after `getUser()` (the house
 * rule: every write re-verifies), never the admin client: a host can only ever act on an event they
 * own, whatever a client sends. A decline is a block, so it is the block's own act
 * (`mutations/event-blocks.ts`), and never here.
 *
 * ★ THE TYPED SEAM: the functions are new, so they are called by name through an untyped client until
 * `types.ts` regenerates, and every answer is read defensively (queries/event-doors.ts says why). A call
 * before the migration is applied answers "not ready" in words, never a crash.
 */
import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { updateEvent } from "@/lib/db/mutations/events";
import { isDoorSchemaMissing } from "@/lib/db/queries/event-doors";
import type { Door } from "@/lib/event/door/door";
import { createClient } from "@/lib/supabase/server";

export type DoorFailure = {
  ok: false;
  code:
    | "unauthorized"
    | "not_found"
    | "no_password"
    | "blocked"
    | "too_many"
    | "not_ready"
    | "unknown";
  message: string;
  /** An `unknown` failure's own error, for the Server Function to report (Sentry stays out of db/). */
  cause?: unknown;
};

const UNAUTHORIZED: DoorFailure = {
  ok: false,
  code: "unauthorized",
  message: "Please sign in and try again.",
};

/** The RPCs' refusals, in the host's words (never a hint about another host's event). */
function refusal(reason: unknown): DoorFailure {
  switch (reason) {
    case "unauthorized":
      return UNAUTHORIZED;
    case "not_found":
    case "bad_door":
      return {
        ok: false,
        code: "not_found",
        message: "That event is no longer available.",
      };
    case "no_password":
      return {
        ok: false,
        code: "no_password",
        message: "Set a password first, then it becomes the way in.",
      };
    case "blocked":
      return {
        ok: false,
        code: "blocked",
        message: "They're in Blocked. Let them back in from there first.",
      };
    case "too_many":
      return {
        ok: false,
        code: "too_many",
        message: "That's more addresses than one paste can take. Try fewer at a time.",
      };
    default:
      return {
        ok: false,
        code: "unknown",
        message: "That didn't go through. Please try again.",
      };
  }
}

async function hostRpc(
  fn: string,
  args: Record<string, unknown>,
): Promise<{ ok: true; data: Record<string, unknown> } | DoorFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = (await (supabase as unknown as SupabaseClient).rpc(
    fn,
    args,
  )) as { data: unknown; error: PostgrestError | null };
  if (error) {
    if (isDoorSchemaMissing(error)) {
      return {
        ok: false,
        code: "not_ready",
        message: "This isn't ready yet. Please try again in a little while.",
      };
    }
    return { ...refusal("unknown"), cause: error };
  }
  const answer = (data ?? {}) as Record<string, unknown>;
  if (answer.ok !== true) return refusal(answer.reason);
  return { ok: true, data: answer };
}

const count = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;

/** The door, set: what the host's consequence line already said it would do. */
export async function setEventDoor(
  eventId: string,
  door: Door,
): Promise<
  | {
      ok: true;
      data: {
        /** The email step was turned on with it (an address gate holds it on). */
        emailHeld: boolean;
        /** People waiting at the door who came in because the album turned Public. */
        admitted: number;
      };
    }
  | DoorFailure
> {
  const result = await hostRpc("set_event_door", {
    p_event_id: eventId,
    p_door: door,
  });
  // ★ BEFORE THE DOORS' MIGRATION, TODAY'S THREE DOORS STILL MOVE: Public, a password and Only me are
  // the visibility column alone, written the way the settings always wrote it (`updateEvent`, which
  // refuses a password with no hash behind it). A gate has nowhere to live yet, so it stays "not
  // ready". Loud either way: `isDoorSchemaMissing` has already captured the miss.
  if (!result.ok && result.code === "not_ready") {
    if (door !== "open" && door !== "password" && door !== "private") {
      return result;
    }
    const today = await updateEvent(eventId, { visibility: door });
    if (!today.ok) {
      if (today.code === "unauthorized") return UNAUTHORIZED;
      return {
        ok: false,
        code: door === "password" ? "no_password" : "unknown",
        message: today.message,
      };
    }
    return { ok: true, data: { emailHeld: false, admitted: 0 } };
  }
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      emailHeld: result.data.email_held === true,
      admitted: count(result.data.admitted),
    },
  };
}

/** Let one waiting newcomer in (every waiting row of her account at the event). */
export async function letInAtDoor(
  eventId: string,
  guestId: string,
): Promise<{ ok: true; data: { admitted: number; already: boolean } } | DoorFailure> {
  const result = await hostRpc("let_in_at_door", {
    p_event_id: eventId,
    p_guest_id: guestId,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    data: {
      admitted: count(result.data.admitted),
      already: result.data.already === true,
    },
  };
}

/** What a save onto the list did, counted by the database. */
export type InviteAddResult = {
  added: number;
  already: number;
  invalid: number;
  /** Readable addresses past the list's cap, left off. */
  overCap: number;
  /** Addresses on the list now. */
  total: number;
};

/** Addresses onto the invite list (already read by the field; the database normalises and caps). */
export async function addEventInvites(
  eventId: string,
  emails: readonly string[],
): Promise<{ ok: true; data: InviteAddResult } | DoorFailure> {
  const result = await hostRpc("add_event_invites", {
    p_event_id: eventId,
    p_emails: [...emails],
  });
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      added: count(d.added),
      already: count(d.already),
      invalid: count(d.invalid),
      overCap: count(d.over_cap),
      total: count(d.total),
    },
  };
}

/** One address off the invite list; anyone it already let in stays in. */
export async function removeEventInvite(
  eventId: string,
  email: string,
): Promise<{ ok: true; data: { removed: number } } | DoorFailure> {
  const result = await hostRpc("remove_event_invite", {
    p_event_id: eventId,
    p_email: email,
  });
  if (!result.ok) return result;
  return { ok: true, data: { removed: count(result.data.removed) } };
}
