/**
 * THE CAMERA'S COUNT: her roll as the server last answered it, and the shots this camera took since.
 *
 * ★ THE SERVER COUNTS, THE CAMERA ONLY KEEPS UP. Her roll is the server's (`/api/guests/mine`'s `roll`: her LIVE shots
 * since the period began, `{used, cap, taken, ceiling}`, `docs/systems/disposable-mode.md`), read when the camera opens,
 * after she removes a shot and after a refusal about the roll. Between two reads the camera adds the shots it took
 * since the last one began and that the server has not refused (`pending`), so the count steps down the instant the
 * shutter fires instead of a round trip later. A read starts only while none of this camera's shots is in the air
 * (`album-camera.tsx`), so every shot older than the read is either counted by it (it landed) or refused (it never
 * will be): nothing is counted twice and nothing is missed.
 *
 * ★ THE SENTENCE IS THE SERVER'S. What the next shot would meet is `rollSpentMessage`/`ROLL_RESHOOTS_SPENT_MESSAGE`
 * (`create_media` raises the same words), so the camera's end and the presign's refusal never disagree in wording.
 *
 * ★ HER RE-SHOOTS, COUNTED WHERE SHE TAKES ONE BACK (guest-moments r1's `limit=three`): the ceiling is her roll plus 3,
 * so what a take-back can still free is the room under the ceiling past the frames her roll has left (`reshoots`). Each
 * take-back spends one: the frame it frees comes out of that room. The count she shoots by (`left`) is what she can
 * truly still take, the frames left or the room under the ceiling, whichever ends first (a host's removal frees a frame
 * the ceiling may not let her fill).
 *
 * ★ A REFUSAL ABOUT THE ROLL SPENDS IT AT ONCE (crumbs-93, red-team 58's NIT): the server's `roll_spent` is its count, and its
 * count is the truth, so the moment one lands the roll reads spent (`refused`), before the read it asks for has answered.
 * The refused shot is no pending shot of the camera's (it never counted), so without this the camera offered the very frame
 * the server had just refused as free for the half second the read took, and a press in that window met the refusal again.
 *
 * Pure, so every rule is a unit test.
 */
import {
  isRollSize,
  ROLL_RESHOOTS_SPENT_MESSAGE,
  ROLL_SHOTS,
  rollCeiling,
  rollSpentMessage,
  type RollCount,
} from "@/lib/disposable/roll";

export type RollView = {
  /** Frames on her roll. */
  cap: number;
  /** Frames spent: the server's, and this camera's shots since that it has not refused (at most `cap`). */
  used: number;
  /**
   * HER LIVE SHOTS, UNCAPPED: `used` before the roll's bound. More than `cap` only where the host made the roll smaller
   * after she shot (a roll of 1 under two of hers, red-team 56's LOW): then the counts say what she holds, never "1 of
   * 1" beside two shots, and removing one frees no frame.
   */
  held: number;
  /** Shots she can still take: the frames left, or fewer where the ceiling stops her first. */
  left: number;
  /** The frame the next shot takes (1-based); the last frame once none is left. */
  frame: number;
  /** The sentence the next shot would meet, or null while a shot is left: the roll first, then the ceiling. */
  refusal: string | null;
  /** The sentence is the ceiling's (every re-shoot spent with a frame free): removing a shot cannot free one. */
  ceilingReached: boolean;
  /** Her re-shoots left: how many more take-backs will each free a frame for another shot. */
  reshoots: number;
  /** Her re-shoots in all, the server's ceiling past her roll: "1 of your 3". */
  allowance: number;
  /** Whether removing one of her shots would free a frame: a re-shoot left, and no more held than the roll. */
  removalFrees: boolean;
};

/**
 * A roll's size as the event row names it (any count from 1 to 99, 24 unless the host named another), else the
 * product's. ★ THE HOST'S BOUNDS, NEVER THE DEFAULT: a roll of 50 reads 50 before the server's first answer lands, never
 * 24 for an instant (the old bound was the default, 20261005190000 widened it).
 */
function capOf(rollSize: number | null | undefined): number {
  return isRollSize(rollSize) ? rollSize : ROLL_SHOTS;
}

export function rollView(input: {
  /** The server's last answer, or null before one lands (or where none can: no ticket and no account yet). */
  server: RollCount | null;
  /** `events.roll_size`, read where the server has not answered. */
  rollSize: number | null | undefined;
  /** Shots this camera took since the last answer began, not refused, and still hers. */
  pending: number;
  /**
   * Shots this camera took since the last answer began, not refused, the ones she has taken back since included: the
   * ledger the ceiling counts keeps every shot she took, so a take-back frees a frame and never a re-shoot. Absent, the
   * same as `pending`.
   */
  taken?: number;
  /**
   * The server refused a shot of hers as past the roll (`roll_spent`) since the last read began, and no read has answered
   * since: her roll is spent now, whatever the last count says. Absent, false.
   */
  refused?: boolean;
}): RollView {
  const cap = input.server?.cap ?? capOf(input.rollSize);
  const pending = Math.max(0, Math.floor(input.pending));
  const takenSince = Math.max(pending, Math.floor(input.taken ?? pending));
  const counted = input.server?.used ?? 0;
  const used = input.refused ? cap : Math.min(cap, counted + pending);
  // Past the roll only by the server's own count: a shot this camera took past the roll is one the server refuses.
  const held = Math.max(counted, used);
  const taken = (input.server?.taken ?? 0) + takenSince;
  const ceiling = input.server?.ceiling ?? rollCeiling(cap);
  // The shots the ceiling still allows, removed or not.
  const room = Math.max(0, ceiling - taken);
  const spent = used >= cap;
  const ceilingReached = !spent && room === 0;
  const reshoots = Math.max(0, room - Math.max(0, cap - held));
  return {
    cap,
    used,
    held,
    left: Math.min(cap - used, room),
    frame: Math.min(cap, used + 1),
    refusal: spent
      ? rollSpentMessage(cap)
      : ceilingReached
        ? ROLL_RESHOOTS_SPENT_MESSAGE
        : null,
    ceilingReached,
    reshoots,
    allowance: Math.max(0, ceiling - cap),
    removalFrees: held <= cap && reshoots > 0,
  };
}

/**
 * THE HOST'S OWN CAMERA HAS NO ROLL: her shots ride the host's pair (`create_media_as_host`), which no roll, ceiling or
 * video bound counts. Her reel holds what she took this visit and a few fresh frames after it, so it never ends.
 */
export const HOST_FRESH_FRAMES = 8;
