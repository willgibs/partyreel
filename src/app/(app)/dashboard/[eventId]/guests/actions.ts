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
  addEventInvites,
  letInAtDoor,
  removeEventInvite,
  type DoorFailure,
  type InviteAddResult,
} from "@/lib/db/mutations/event-doors";
import { INVITE_BATCH_MAX } from "@/lib/event/door/invite-list";
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

/**
 * Every room a block changes (the hub's counts and album, the Guests room, Review's queue) is the HUB now (event-header
 * r2, `rooms=over`: each room stands over the hub on its address), so one revalidation re-renders them all, in the
 * act's own answer: the Guests room's rows come back with it while its address names the room (`page.tsx`). The old
 * room routes only redirect, and hold nothing to refresh.
 */
function revalidateEvent(eventId: string) {
  if (!eventId) return;
  revalidatePath(`/dashboard/${eventId}`);
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
  // Left out, a lift is today's: the ask the block held stands at the door.
  letIn: z.boolean().default(false),
});

/**
 * Lift a block; `restore` brings back what the block itself removed (off unless the host says); `letIn` answers the
 * ask it held yes in the same press (host-moments r1, `let-back=straight`). `admitted` counts who came in, so the
 * words after it say what happened rather than what was asked.
 */
export async function letBackInAction(
  input: unknown,
): Promise<
  | { ok: true; restored: number; noRoom: number; admitted: number }
  | BlockActionFailure
> {
  const parsed = letBackInInput.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await letBackIn(parsed.data.blockId, {
    restore: parsed.data.restore,
    letIn: parsed.data.letIn,
  });
  if (!result.ok) return failed(result, "let_back_in");
  revalidateEvent(result.data.eventId);
  return {
    ok: true,
    restored: result.data.restored,
    noRoom: result.data.noRoom,
    admitted: result.data.admitted,
  };
}

/* ── the door (event-settings r1): who waits, and the invite list ────────────────────────────── */

function doorFailed(result: DoorFailure, action: string): BlockActionFailure {
  if (result.code === "unknown" && result.cause) {
    captureError("security", result.cause, { action });
  }
  return { ok: false, message: result.message };
}

const atTheDoor = z.object({ eventId: z.uuid(), guestId: z.uuid() });

/** Let one newcomer in: every waiting row of her account at the event opens at once. */
export async function letInAtDoorAction(
  input: unknown,
): Promise<{ ok: true; admitted: number } | BlockActionFailure> {
  const parsed = atTheDoor.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await letInAtDoor(parsed.data.eventId, parsed.data.guestId);
  if (!result.ok) return doorFailed(result, "let_in_at_door");
  revalidateEvent(parsed.data.eventId);
  return { ok: true, admitted: result.data.admitted };
}

const decline = z.object({
  eventId: z.uuid(),
  guestId: z.uuid(),
  userId: z.uuid().nullable(),
});

/**
 * ★ A DECLINE IS A BLOCK (event-safety r1, `newcomer=same`): the newcomer meets the one shut screen,
 * the block's own, and cannot keep re-asking; the host lets her back in from Blocked, or at once with
 * the toast's Undo. Her account is the target where she has one (every device at once), else the row.
 */
export async function declineAtDoorAction(
  input: unknown,
): Promise<{ ok: true; blockId: string } | BlockActionFailure> {
  const parsed = decline.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const { eventId, guestId, userId } = parsed.data;
  const result = await blockFromEvent(
    userId ? { kind: "account", eventId, userId } : { kind: "row", guestId },
    // The address gates already hold the email step on; a decline changes no switch.
    { requireVerifiedEmail: false },
  );
  if (!result.ok) return failed(result, "decline_at_door");
  revalidateEvent(eventId);
  return { ok: true, blockId: result.data.blockId };
}

const invitesAdd = z.object({
  eventId: z.uuid(),
  // What the field read out of a paste (`readAddresses`); the database normalises, dedupes and caps.
  emails: z.array(z.string().min(1).max(254)).min(1).max(INVITE_BATCH_MAX),
});

/** Addresses onto the invite list, counted by the database. */
export async function addInvitesAction(
  input: unknown,
): Promise<{ ok: true; result: InviteAddResult } | BlockActionFailure> {
  const parsed = invitesAdd.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await addEventInvites(parsed.data.eventId, parsed.data.emails);
  if (!result.ok) return doorFailed(result, "add_event_invites");
  revalidateEvent(parsed.data.eventId);
  return { ok: true, result: result.data };
}

const inviteRemove = z.object({
  eventId: z.uuid(),
  email: z.string().min(1).max(254),
});

/** One address off the list; anyone it already let in stays in. */
export async function removeInviteAction(
  input: unknown,
): Promise<{ ok: true } | BlockActionFailure> {
  const parsed = inviteRemove.safeParse(input);
  if (!parsed.success) return BAD_REQUEST;
  const result = await removeEventInvite(
    parsed.data.eventId,
    parsed.data.email,
  );
  if (!result.ok) return doorFailed(result, "remove_event_invite");
  revalidateEvent(parsed.data.eventId);
  return { ok: true };
}
