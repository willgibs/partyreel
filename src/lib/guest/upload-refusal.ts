/**
 * WHAT A GUEST CAN DO ABOUT A FAILED UPLOAD, by its code: one home for the door's upload step, which has no
 * exit, and the album's failure sheet, which must never offer a Retry that cannot pass (build 23's NIT-2:
 * "This event accepts photos only" wore Retry). Pure, so both surfaces and their tests read one ladder.
 */
import { SESSION_OTHER_ACCOUNT } from "@/lib/guest/session-owner";

/**
 * THE REFUSAL LADDER, read once (`src/lib/errors/codes.ts` + the presign ladder). What a guest can
 * DO about a failure is a property of the code, not of the file, and the door's step has no exit,
 * so "Retry" is only ever offered where a retry could work.
 *
 *   refresh   the event's state changed under the guest and the server must be re-asked. This is
 *             the fail-open path: uploads closed, the album full, the event gone, a lock raised.
 *   session   the capability is dead. Never a Retry inside a sheet with no way out: the step goes
 *             back to the name, which mints a fresh row.
 *   verify    the host turned Require verified emails on mid-run; the email step is the way in.
 *   retry     transport, R2, a bad key, a failed completion: the same file may well go next time.
 *   choose    the file itself is the problem, so only a different file can help.
 *   roll      the album's camera has no frame left for her (`roll_spent`, crumbs-90 from no-signal r1): the
 *             server counts her shots at insert, so this very shot is refused again, and so is any other she
 *             takes. Never the file's (another file meets the same roll, so "Take another" would be false),
 *             and never a Retry: the one thing that frees a frame is taking one of hers back in the camera,
 *             which says the roll's end in its own words (`rollDoneLine`, `freeAFrameLine`).
 */
export type RefusalClass =
  | "refresh"
  | "session"
  | "verify"
  | "retry"
  | "choose"
  | "roll";

export function classifyRefusal(code: string | undefined | null): RefusalClass {
  switch (code) {
    case "uploads_closed":
    case "cap_reached":
    case "event_gone":
    case "event_deleted":
    case "unlock_required":
      return "refresh";
    case "invalid_session":
    // A ticket that was not this viewer's. The queue never leaves it on a file (the ticket goes
    // down and the file waits for a new one), so this is the ladder staying complete: the
    // capability is the problem, never the photograph.
    case SESSION_OTHER_ACCOUNT:
      return "session";
    case "verification_required":
      return "verify";
    case "video_not_allowed":
    case "unsupported_type":
    case "invalid_file":
    case "invalid_image":
    case "invalid_media":
    case "too_large":
    case "too_long":
      return "choose";
    case "roll_spent":
      return "roll";
    default:
      // `bad_key`, `complete_failed`, a code-less transport or R2 failure: worth another go.
      return "retry";
  }
}

/**
 * Whether sending the same file again could land it: every refusal but the file's own and the spent roll's. A
 * refresh-class one can pass once the host changes something (reopens uploads, frees space), so it keeps its Retry.
 */
export function retryCanPass(code: string | undefined | null): boolean {
  const kind = classifyRefusal(code);
  return kind !== "choose" && kind !== "roll";
}
