/**
 * THE HOST'S DOOR ACTS (event-settings r1, migration 20260929120000): set the door, let a newcomer in,
 * and put addresses on or off the invite list. Each is a SECURITY DEFINER RPC that re-checks the caller
 * hosts the event on `auth.uid()`, so each runs on the HOST'S OWN client after `getUser()` (the house
 * rule: every write re-verifies), never the admin client: a host can only ever act on an event they
 * own, whatever a client sends. A decline is a block, so it is the block's own act
 * (`mutations/event-blocks.ts`), and never here. Every answer is a jsonb, read defensively.
 */
import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

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
        message:
          "That's more addresses than one paste can take. Try fewer at a time.",
      };
    default:
      return {
        ok: false,
        code: "unknown",
        message: "That didn't go through. Please try again.",
      };
  }
}

/**
 * One of the host's acts: `call` runs the RPC on the host's own client, once `getUser()` has proved there
 * is one, and its jsonb answer comes back as `{ ok: true, ... }` or the refusal in the host's words.
 */
async function hostRpc(
  call: (
    supabase: Awaited<ReturnType<typeof createClient>>,
  ) => PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<{ ok: true; data: Record<string, unknown> } | DoorFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return UNAUTHORIZED;

  const { data, error } = await call(supabase);
  if (error) return { ...refusal("unknown"), cause: error };
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
        /** The email step was turned on with it, from off (an address gate holds it on, and the event remembers). */
        emailHeld: boolean;
        /**
         * ★ The door left a gate that had turned the email step on from off, and the database gave her names-only
         * door back with it (`events_email_held`, 20261007140000). Null where the database answers no such key (one
         * before that migration, which remembers nothing): it gave nothing back, and nothing may say it did.
         */
        emailRestored: boolean | null;
        /**
         * People waiting at the door who came in with it: everyone, as the album turned Public, or
         * those the list names, as the invite list became the door (20260929220000).
         */
        admitted: number;
      };
    }
  | DoorFailure
> {
  const result = await hostRpc((supabase) =>
    supabase.rpc("set_event_door", { p_event_id: eventId, p_door: door }),
  );
  if (!result.ok) return result;
  const restored = result.data.email_restored;
  return {
    ok: true,
    data: {
      emailHeld: result.data.email_held === true,
      emailRestored: typeof restored === "boolean" ? restored : null,
      admitted: count(result.data.admitted),
    },
  };
}

/** Let one waiting newcomer in (every waiting row of her account at the event). */
export async function letInAtDoor(
  eventId: string,
  guestId: string,
): Promise<
  { ok: true; data: { admitted: number; already: boolean } } | DoorFailure
> {
  const result = await hostRpc((supabase) =>
    supabase.rpc("let_in_at_door", {
      p_event_id: eventId,
      p_guest_id: guestId,
    }),
  );
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
  /**
   * People waiting at the door whom the list now names, and so came in (build 23's BUG-2,
   * 20260929220000): only while the list is the door. A database before that migration answers no
   * such key, which reads 0.
   */
  admitted: number;
};

/** Addresses onto the invite list (already read by the field; the database normalises and caps). */
export async function addEventInvites(
  eventId: string,
  emails: readonly string[],
): Promise<{ ok: true; data: InviteAddResult } | DoorFailure> {
  const result = await hostRpc((supabase) =>
    supabase.rpc("add_event_invites", {
      p_event_id: eventId,
      p_emails: [...emails],
    }),
  );
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
      admitted: count(d.admitted),
    },
  };
}

/** One address off the invite list; anyone it already let in stays in. */
export async function removeEventInvite(
  eventId: string,
  email: string,
): Promise<{ ok: true; data: { removed: number } } | DoorFailure> {
  const result = await hostRpc((supabase) =>
    supabase.rpc("remove_event_invite", {
      p_event_id: eventId,
      p_email: email,
    }),
  );
  if (!result.ok) return result;
  return { ok: true, data: { removed: count(result.data.removed) } };
}
