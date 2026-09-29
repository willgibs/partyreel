/**
 * THE PER-EVENT BLOCK'S TWO ACTS (event-safety r1, migration 20260928120000): block_from_event, with
 * its preview, and let_back_in, with its restore. Both are SECURITY DEFINER RPCs that re-check the
 * caller is the event's host on `auth.uid()`, so they run on the HOST'S OWN client after `getUser()`
 * (the house rule: every write re-verifies), never the admin client: a host can only ever act on an
 * event they own, whatever a client sends.
 *
 * ★ THE TYPED SEAM: the two functions are new, so they are called by name through an untyped client
 * until `types.ts` regenerates, and every answer is read defensively (queries/event-blocks.ts says
 * why). A call before the migration is applied answers "not ready" in words, never a crash.
 */
import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { isBlockSchemaMissing } from "@/lib/db/queries/event-blocks";
import {
  blockTargetParams,
  type BlockPreview,
  type BlockTarget,
} from "@/lib/events/event-blocks";
import { createClient } from "@/lib/supabase/server";

export type BlockFailure = {
  ok: false;
  code: "unauthorized" | "not_found" | "not_a_guest" | "unknown";
  message: string;
  /** An `unknown` failure's own error, for the Server Function to report (Sentry stays out of db/). */
  cause?: unknown;
};

const UNAUTHORIZED: BlockFailure = {
  ok: false,
  code: "unauthorized",
  message: "Please sign in and try again.",
};

/** The RPCs' refusals, in the host's words (never a hint about another host's event). */
function refusal(reason: unknown): BlockFailure {
  switch (reason) {
    case "unauthorized":
      return UNAUTHORIZED;
    case "not_a_guest":
      return {
        ok: false,
        code: "not_a_guest",
        message: "Only a guest who added photos can be blocked.",
      };
    case "not_found":
    case "bad_target":
      return {
        ok: false,
        code: "not_found",
        message: "That person or event is no longer available.",
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
): Promise<{ ok: true; data: Record<string, unknown> } | BlockFailure> {
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
    if (isBlockSchemaMissing(error)) {
      return {
        ok: false,
        code: "unknown",
        message:
          "Blocking isn't ready yet. Please try again in a little while.",
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

/** What the act would do, from the act itself (its preview writes and locks nothing). */
export async function previewBlock(
  target: BlockTarget,
): Promise<{ ok: true; data: BlockPreview } | BlockFailure> {
  const result = await hostRpc("block_from_event", {
    ...blockTargetParams(target),
    p_preview: true,
  });
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      eventId: typeof d.event_id === "string" ? d.event_id : "",
      label: typeof d.label === "string" ? d.label : null,
      verified: d.verified === true,
      uploads: count(d.uploads),
      namesOnly: d.names_only === true,
      already: d.already === true,
    },
  };
}

/** Put one person out of one event, with their uploads (and, on a names-only album, the switch on). */
export async function blockFromEvent(
  target: BlockTarget,
  options: { requireVerifiedEmail: boolean },
): Promise<
  | {
      ok: true;
      data: {
        eventId: string;
        blockId: string;
        removed: number;
        already: boolean;
      };
    }
  | BlockFailure
> {
  const result = await hostRpc("block_from_event", {
    ...blockTargetParams(target),
    p_require_verified_email: options.requireVerifiedEmail,
  });
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      eventId: typeof d.event_id === "string" ? d.event_id : "",
      blockId: typeof d.block_id === "string" ? d.block_id : "",
      removed: count(d.removed),
      already: d.already === true,
    },
  };
}

/** Lift a block; with `restore`, bring back what the block itself removed (Will's switch, off by default). */
export async function letBackIn(
  blockId: string,
  options: { restore: boolean },
): Promise<
  | {
      ok: true;
      data: { eventId: string; restored: number; noRoom: number };
    }
  | BlockFailure
> {
  const result = await hostRpc("let_back_in", {
    p_block_id: blockId,
    p_restore: options.restore,
  });
  if (!result.ok) return result;
  const d = result.data;
  return {
    ok: true,
    data: {
      eventId: typeof d.event_id === "string" ? d.event_id : "",
      restored: count(d.restored),
      noRoom: count(d.no_room),
    },
  };
}
