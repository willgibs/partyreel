"use client";

/**
 * The PUBLISH SEAM: one module the host surfaces import, so "share the reel with
 * guests" has exactly one call-site shape (the reveal's settled card, the
 * Marquee's share card and the Studio's Share all go through it).
 *
 * The signature below is Track C's FINAL contract, mirrored deliberately rather
 * than imported: the two tracks build in parallel on separate branches, and
 * reaching across branches is how you end up with a tree that only compiles after
 * a merge. So this is a local twin with a stub body.
 *
 * TODO(track-C): at integration this whole module collapses to a re-export of
 * `setReelGuestVisibleAction` (+ its `ReelPublishResult`) from
 * src/app/(app)/dashboard/[eventId]/actions.ts, which does the real work: getUser
 * (never getSession) → the set_reel_guest_visible RPC on the USER client →
 * normalize → revalidatePath. No consumer changes.
 */

/**
 * The action's result. On failure the `message` is DISPLAY-READY — the server owns
 * the wording ('empty' already reads "Add some photos to your reel first."), which
 * is why nothing on this side re-derives copy from `reason`: that would be two
 * sources for one sentence. `reason` is for BRANCHING, not for display.
 */
export type ReelPublishResult =
  | { ok: true; guestVisible: boolean }
  | {
      ok: false;
      reason: "unauthorized" | "not_found" | "empty" | "error";
      message: string;
    };

/** The only copy this side owns: what to say when the call produced no result at
 *  all (a thrown action, an offline tab). No em-dashes. */
export const PUBLISH_FALLBACK_MESSAGE =
  "Couldn't update sharing. Please try again.";

export async function setReelGuestVisible(
  eventId: string,
  visible: boolean,
): Promise<ReelPublishResult> {
  // Deliberately a THROW, not a silent {ok:true}: a stub that reported success
  // would let the optimistic UI claim the reel is live for guests when nothing was
  // written, and that lie would survive all the way into a live pass.
  void eventId;
  void visible;
  throw new Error("Reel publishing is not wired up yet (TODO(track-C)).");
}
