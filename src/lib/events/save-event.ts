import { createClient } from "@/lib/supabase/client";

/**
 * SAVING AN EVENT TO A GUEST'S DASHBOARD, from every door that confirms them.
 *
 * Three doors confirm a guest's email on an album: the offer card under it
 * (`SaveEventButton`), the Unverified mark on their own credit and the header's
 * name menu. Each claims the guest's uploads into the account, and each promises
 * the same thing in the same words (the `save` wear: "this event stays in your
 * account"), so each also SAVES the event: a claimed upload lands the event in
 * the account's Events you joined, and only a save puts it on the dashboard,
 * where the offer card's door always put it.
 *
 * ★ THE SAVE OUTLIVES A REDIRECT. Google and a magic link leave the page and
 * come back with no code of ours running, so a door writes its intent BEFORE it
 * opens (`markPendingSave`) and the event page completes it on the way back
 * (`completePendingSave`). Taking the intent is synchronous, so however many
 * readers are mounted, exactly one completes it.
 *
 * Client-only: the browser client, with the caller's own session. `save_event`
 * is idempotent, refuses a private or deleted event, and treats the host's own
 * event as already saved.
 */

export type SaveableEvent = { eventId: string; qrToken: string };

/** What every save door says after it lands, in one set of words. */
export const SAVED_TO_DASHBOARD = "Saved to your dashboard.";
export const SAVE_FAILED = "Couldn't save this event.";

/** The intent a door leaves behind before a sign-in that may leave the page. */
export function pendingSaveKey(eventId: string): string {
  return `pr_pending_save_${eventId}`;
}

export function markPendingSave(eventId: string): void {
  try {
    localStorage.setItem(pendingSaveKey(eventId), "1");
  } catch {
    // Blocked storage: the in-page code path still saves, because it never
    // leaves the page. Only a redirect round trip loses the intent.
  }
}

/** Take the intent if it is there: true for exactly one caller. */
function takePendingSave(eventId: string): boolean {
  try {
    if (localStorage.getItem(pendingSaveKey(eventId)) !== "1") return false;
    localStorage.removeItem(pendingSaveKey(eventId));
    return true;
  } catch {
    return false;
  }
}

/** Save the event for the signed-in caller; true once it is on their dashboard. */
export async function saveEvent({
  eventId,
  qrToken,
}: SaveableEvent): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("save_event", {
    p_qr_token: qrToken,
  });
  if (error || !data) return false;
  try {
    localStorage.removeItem(pendingSaveKey(eventId));
  } catch {
    // The intent outliving a save is harmless: the save is idempotent.
  }
  return true;
}

/**
 * Finish a save a door started before a redirect sign-in, once the caller is
 * signed in. True when this call saved it (the caller says so); a failed save
 * puts the intent back, so the next visit tries again.
 */
export async function completePendingSave(
  event: SaveableEvent,
): Promise<boolean> {
  if (!takePendingSave(event.eventId)) return false;
  if (await saveEvent(event)) return true;
  markPendingSave(event.eventId);
  return false;
}
