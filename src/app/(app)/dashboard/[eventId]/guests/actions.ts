"use server";

/**
 * THE PER-EVENT BLOCK'S SERVER FUNCTIONS (event-safety r1): the confirm's preview, the block itself,
 * and letting someone back in. Each is a public endpoint taking raw client values, so each parses
 * them here (`blockTargetSchema`, a uuid, a boolean) before anything runs, and the mutations re-verify
 * the host (`getUser()`, then the RPC's own `auth.uid()` ownership check): a host can only ever act
 * on an event they own, whatever a client sends.
 *
 * ★ THE WORDS ARE THE MUTATIONS'. A refusal travels as its message, in the host's words (never a hint
 * about another host's event); only an `unknown` one is a bug, and that alone is captured.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  blockFromEvent,
  letBackIn,
  previewBlock,
  type BlockFailure,
} from "@/lib/db/mutations/event-blocks";
import {
  blockTargetSchema,
  type BlockPreview,
} from "@/lib/events/event-blocks";
import { captureError } from "@/lib/observability/sentry";

export type BlockActionFailure = { ok: false; message: string };

const BAD_REQUEST: BlockActionFailure = {
  ok: false,
  message: "That didn't go through. Please try again.",
};

function failed(result: BlockFailure, action: string): BlockActionFailure {
  if (result.code === "unknown" && result.cause) {
    captureError("security", result.cause, { action });
  }
  return { ok: false, message: result.message };
}

/** Every room a block changes: the hub's counts and album, the Guests room, Review's queue. */
function revalidateEvent(eventId: string) {
  if (!eventId) return;
  revalidatePath(`/dashboard/${eventId}`);
  revalidatePath(`/dashboard/${eventId}/guests`);
  revalidatePath(`/dashboard/${eventId}/review`);
}

/** What pressing Block would do, from the act itself: the confirm's name, count and offer. */
export async function previewBlockAction(
  target: unknown,
): Promise<{ ok: true; preview: BlockPreview } | BlockActionFailure> {
  const parsed = blockTargetSchema.safeParse(target);
  if (!parsed.success) return BAD_REQUEST;
  const result = await previewBlock(parsed.data);
  if (!result.ok) return failed(result, "block_preview");
  return { ok: true, preview: result.data };
}

const blockOptions = z.object({ requireVerifiedEmail: z.boolean() });

/** Put the person out of the event, with their uploads (and the names-only switch, when asked). */
export async function blockFromEventAction(
  target: unknown,
  options: unknown,
): Promise<
  { ok: true; removed: number; already: boolean } | BlockActionFailure
> {
  const parsedTarget = blockTargetSchema.safeParse(target);
  const parsedOptions = blockOptions.safeParse(options);
  if (!parsedTarget.success || !parsedOptions.success) return BAD_REQUEST;
  const result = await blockFromEvent(parsedTarget.data, parsedOptions.data);
  if (!result.ok) return failed(result, "block_from_event");
  revalidateEvent(result.data.eventId);
  return {
    ok: true,
    removed: result.data.removed,
    already: result.data.already,
  };
}

const letBackInInput = z.object({
  blockId: z.uuid(),
  restore: z.boolean(),
});

/** Lift a block; `restore` brings back what the block itself removed (off unless the host says). */
export async function letBackInAction(
  input: unknown,
): Promise<
  { ok: true; restored: number; noRoom: number } | BlockActionFailure
> {
  const parsed = letBackInInput.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await letBackIn(parsed.data.blockId, {
    restore: parsed.data.restore,
  });
  if (!result.ok) return failed(result, "let_back_in");
  revalidateEvent(result.data.eventId);
  return {
    ok: true,
    restored: result.data.restored,
    noRoom: result.data.noRoom,
  };
}
