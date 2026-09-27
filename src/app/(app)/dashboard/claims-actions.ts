"use server";

import { z } from "zod";

import {
  getClaimedEventNext,
  type ClaimedEventNext,
} from "@/lib/db/queries/claims";
import { captureError } from "@/lib/observability/sentry";
import { getRequestAuth } from "@/lib/supabase/request-auth";

/**
 * THE CLAIMS REVIEW'S TWO WRITES, ONE EVENT AT A TIME (`identity-claims` r2, Will 2026-09-27:
 * `save=once`, "a claim is added as she taps it"; `confirm=card`, "Individual, immediate handling 1
 * by 1 is likely best for claims here"). Each decision is written the moment she makes it, so an
 * unfinished review is never a batch she believes was saved: a claim is one call, a Not mine is one
 * call once its own dialog says Delete, and what she has not reached waits untouched.
 *
 * Both RPCs already take an id list and key on the CALLER'S OWN confirmed address (auth.uid() ->
 * auth.users inside them, never a client-supplied email), so a forged event id reaches nothing
 * beyond rows typed under that same address, and each call names exactly one event: a double tap
 * can never widen it to the next one.
 *
 * ★ "GONE" IS NOT A FAILURE. An answer can reach the server after the event stopped waiting (sorted
 * in another tab, the event deleted): the claim finds nothing and she is no guest there, or the
 * disown detaches nothing. The review then drops the card and says so, rather than reporting a
 * write that never happened as done or retrying one that cannot land.
 *
 * Neither revalidates: the review refreshes the page behind itself once the write has landed, so
 * the next card waits for the write alone, never for a whole dashboard render.
 */

export type ClaimEventResult =
  | { ok: true; next: ClaimedEventNext | null }
  | { ok: false; gone: boolean; message: string };

export type DisownEventResult =
  | { ok: true }
  | { ok: false; gone: boolean; message: string };

const EVENT_ID = z.uuid();

const SIGN_IN = "Sign in and try again.";
const GONE = "That event isn't waiting for you anymore.";

/**
 * Claim one event: every row typed under her confirmed address there joins her account (a Guest
 * card on the dashboard), then the follow-up she is offered for it (`next=both`), read only now
 * that she is a guest there. The follow-up is never worth the claim: a failed read returns the
 * claim as done with nothing to offer, and says so where failures are read.
 */
export async function claimEventAction(
  eventId: unknown,
): Promise<ClaimEventResult> {
  const parsed = EVENT_ID.safeParse(eventId);
  if (!parsed.success) {
    return { ok: false, gone: false, message: "That isn't an event." };
  }
  const auth = await getRequestAuth();
  if (!auth.user) return { ok: false, gone: false, message: SIGN_IN };

  const { data: claimed, error } = await auth.supabase.rpc(
    "claim_guest_rows_by_email",
    { p_event_ids: [parsed.data] },
  );
  if (error) {
    captureError("account", error, { seam: "claims_claim" });
    return {
      ok: false,
      gone: false,
      message: "Couldn't claim those photos. Please try again.",
    };
  }

  let next: ClaimedEventNext | null = null;
  try {
    next = await getClaimedEventNext(auth, parsed.data);
  } catch (readError) {
    captureError("account", readError, { seam: "claims_next" });
    // The claim landed; only the offer after it did not.
    return { ok: true, next: null };
  }
  // Nothing claimed and no guest there: this answer came after the event stopped waiting. A claim
  // that found nothing while she IS a guest there (another tab won the race) is still hers.
  if ((claimed ?? 0) === 0 && next === null) {
    return { ok: false, gone: true, message: GONE };
  }
  return { ok: true, next };
}

/**
 * Not mine, once its dialog says Delete: the uploads typed under her address at that one event are
 * removed through the uploader's own path (the host cannot restore them) and the address is
 * detached, the guest saying "that was not me" (his words, the identity round: "that's the guest
 * effectively requesting 'get rid of that'"). `disown_guest_rows_by_email` refuses an empty list by
 * design; this always names exactly one event.
 */
export async function disownEventAction(
  eventId: unknown,
): Promise<DisownEventResult> {
  const parsed = EVENT_ID.safeParse(eventId);
  if (!parsed.success) {
    return { ok: false, gone: false, message: "That isn't an event." };
  }
  const auth = await getRequestAuth();
  if (!auth.user) return { ok: false, gone: false, message: SIGN_IN };

  const { data: released, error } = await auth.supabase.rpc(
    "disown_guest_rows_by_email",
    { p_event_ids: [parsed.data] },
  );
  if (error) {
    captureError("account", error, { seam: "claims_disown" });
    return {
      ok: false,
      gone: false,
      message: "Couldn't delete those photos. Please try again.",
    };
  }
  if ((released ?? 0) === 0) return { ok: false, gone: true, message: GONE };
  return { ok: true };
}
