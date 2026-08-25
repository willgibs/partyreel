/**
 * The PUBLISH SEAM: one module the host surfaces import, so "share the reel with
 * guests" has exactly one call-site shape (the reveal's settled card, the
 * Marquee's share card and the Studio's Share all go through it).
 *
 * Collapsed at R3 integration to a re-export of the real server action (Track C's
 * build): getUser (never getSession) → the set_reel_guest_visible RPC on the USER
 * client → normalize → revalidatePath. R5's notification fan-out hooks into THAT
 * action; consumers here never change.
 */

export {
  setReelGuestVisibleAction as setReelGuestVisible,
  type ReelPublishResult,
} from "@/app/(app)/dashboard/[eventId]/actions";

/** The only copy this side owns: what to say when the call produced no result at
 *  all (a thrown action, an offline tab). No em-dashes. */
export const PUBLISH_FALLBACK_MESSAGE =
  "Couldn't update sharing. Please try again.";
