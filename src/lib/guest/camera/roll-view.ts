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
 * ★ THE SENTENCE IS THE SERVER'S. What the next shot would meet is `rollSpentMessage`/`ROLL_RETAKES_SPENT_MESSAGE`
 * (`create_media` raises the same words), so the camera's end and the presign's refusal never disagree in wording.
 *
 * Pure, so every rule is a unit test.
 */
import {
  ROLL_RETAKES,
  ROLL_RETAKES_SPENT_MESSAGE,
  ROLL_SHOTS,
  rollSpentMessage,
  type RollCount,
} from "@/lib/disposable/roll";

export type RollView = {
  /** Frames on her roll. */
  cap: number;
  /** Frames spent: the server's, and this camera's shots since that it has not refused. */
  used: number;
  /** Frames left. */
  left: number;
  /** The frame the next shot takes (1-based); the last frame once none is left. */
  frame: number;
  /** The sentence the next shot would meet, or null while a frame is left: the roll first, then the ceiling. */
  refusal: string | null;
  /** The sentence is the ceiling's (every retake spent): removing a shot cannot free a frame. */
  ceilingReached: boolean;
};

/** A roll's size as the event row names it (24 unless the host named fewer), else the product's. */
function capOf(rollSize: number | null | undefined): number {
  return typeof rollSize === "number" &&
    Number.isInteger(rollSize) &&
    rollSize > 0 &&
    rollSize <= ROLL_SHOTS
    ? rollSize
    : ROLL_SHOTS;
}

export function rollView(input: {
  /** The server's last answer, or null before one lands (or where none can: no ticket and no account yet). */
  server: RollCount | null;
  /** `events.roll_size`, read where the server has not answered. */
  rollSize: number | null | undefined;
  /** Shots this camera took since the last answer began, not refused. */
  pending: number;
}): RollView {
  const cap = input.server?.cap ?? capOf(input.rollSize);
  const pending = Math.max(0, Math.floor(input.pending));
  const used = Math.min(cap, (input.server?.used ?? 0) + pending);
  const taken = (input.server?.taken ?? 0) + pending;
  const ceiling = input.server?.ceiling ?? cap * ROLL_RETAKES;
  const spent = used >= cap;
  const ceilingReached = !spent && taken >= ceiling;
  return {
    cap,
    used,
    left: cap - used,
    frame: Math.min(cap, used + 1),
    refusal: spent
      ? rollSpentMessage(cap)
      : ceilingReached
        ? ROLL_RETAKES_SPENT_MESSAGE
        : null,
    ceilingReached,
  };
}

/**
 * THE HOST'S OWN CAMERA HAS NO ROLL: her shots ride the host's pair (`create_media_as_host`), which no roll, ceiling or
 * video bound counts. Her reel holds what she took this visit and a few fresh frames after it, so it never ends.
 */
export const HOST_FRESH_FRAMES = 8;
