import { DEFAULT_ERROR_MESSAGE } from "@/lib/errors/codes";
import { formatCount } from "@/lib/format/count";

/**
 * A FAILED CREATE, HELD WHERE SHE IS (create-wizard r4's `failed=held`, Will 2026-10-07: "State progress, feedback,
 * failure notice, and corrective actions should all be made clear here, so if something goes wrong, it doesn't feel
 * frustrating or scary. Only easily correctable"). The beat she is watching stays: its question says Create could not
 * make the event yet, the words under her code say that nothing she chose was lost and the one way to put it right, and
 * the foot is that way (Try again, or the plans where the plan's limit refused it), with Back there for a change. Never
 * a toast: a failure is said where her eyes are.
 *
 * Pure: the wizard hands over what Create answered (or that nothing answered) and the plan; the words are these.
 */

/** The beat's question while a failure is held. */
export const HELD_QUESTION = "Couldn't create it yet";

/** Said first, whatever failed: everything she chose is still in the room. */
export const HELD_KEPT =
  "Nothing was lost: your name, style and look are kept.";

/** Nothing answered (the request threw: the line dropped, or the server never replied). */
export const HELD_DROPPED = "Check your connection and try again.";

/**
 * ★ A REFUSAL THAT ONLY REPEATS THE QUESTION IS SAID AS ITS WAY OUT: the create's own catch-all answers "Couldn't create
 * the event. Please try again.", which under "Couldn't create it yet" says the failure twice, so its opening sentence
 * goes and its instruction stays. A server sentence worded otherwise stands whole (the producer's words win, as
 * `messageFor` has it), so a reworded catch-all reads twice rather than losing anything.
 */
const ONLY_THE_FAILURE = /^couldn['’]t create the event\.\s*/i;

export type HeldWay = "retry" | "upgrade";

export type Held = {
  /** The words under her code: what is kept, then why and the way to put it right. */
  line: string;
  /** The foot's one press: Try again, or the plans when the plan's event limit refused it. */
  way: HeldWay;
};

/** What Create answered when it made nothing; null when nothing answered at all. */
export type CreateRefusal = { code: string; message: string } | null;

export function heldFailure(
  refusal: CreateRefusal,
  plan: {
    planName: string;
    /** The plan's event limit; null holds every event, so a refusal there is never the plan's to lift. */
    maxEvents: number | null;
  },
): Held {
  if (refusal === null) {
    return { line: `${HELD_KEPT} ${HELD_DROPPED}`, way: "retry" };
  }
  // ★ THE LIMIT KEEPS ITS UPGRADE (the guard behind the door, `cap-door.tsx`: a slot spent in another tab, a page
  // left open for an hour). Try again cannot pass it until an event is deleted, so the foot is the plans, and the
  // number is the plan's own, never a written "one" (a stacked pass holds more).
  if (refusal.code === "limit_reached" && plan.maxEvents !== null) {
    const holds =
      plan.maxEvents === 1
        ? "one event"
        : `${formatCount(plan.maxEvents)} events`;
    return {
      line: `${HELD_KEPT} ${plan.planName} holds ${holds}. Delete an event or upgrade to add more.`,
      way: "upgrade",
    };
  }
  const said = refusal.message.trim().replace(ONLY_THE_FAILURE, "").trim();
  return {
    line: `${HELD_KEPT} ${said || DEFAULT_ERROR_MESSAGE}`,
    way: "retry",
  };
}
