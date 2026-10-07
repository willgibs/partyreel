/**
 * A FRESH ROLL, SAID ONCE (host-moments r1's `fresh-roll=panel`): a develop time added mid-party begins a new period
 * (`events.sealed_from`, stamped by `events_reveal_stamp`), every guest's roll starts again with it, and her count would
 * jump from 5 to 24 with no word. So the first time her camera meets the new roll it says so over the finder: a fresh
 * roll, why, when it develops, and Start shooting.
 *
 * ★ HOW "THE FIRST TIME" IS KNOWN: her period against the one she last held shots on, on this device. The server's
 * roll names the period it counts in (`RollCount.period`, the gate's read, 20261007021000), and the device keeps the one
 * she last held shots on (`pr_roll:<qrToken>`). A roll answered on another period than the kept one is fresh: she had
 * shots on a roll that has since started again. The panel is spent the moment it shows (the kept period moves to the
 * new one), so it is said once and never twice; a guest who never shot here keeps nothing, so her first roll is never
 * called fresh. A device's memory is enough: a second device may say it once more, which costs nothing.
 *
 * Pure, but for the two storage calls, each of which fails quietly (a private window, storage blocked): a memory that
 * cannot be read is none, so the panel never shows from a guess.
 */

/** This device's memory of the period she last held shots on, for one album (its link's token). */
export const freshRollKey = (qrToken: string) => `pr_roll:${qrToken}`;

/** A kept period read back, or null for none (or one it cannot read). */
export function parseKeptPeriod(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const at = Number(raw);
  return Number.isSafeInteger(at) && at > 0 ? at : null;
}

/** Whether her roll is fresh: she held shots on a period, and the server now counts another. */
export function isFreshRoll(
  kept: number | null,
  period: number | null | undefined,
): boolean {
  return kept !== null && typeof period === "number" && period !== kept;
}

/**
 * Whether the device should keep this period now: she holds shots on it (the server's count, or this camera's own
 * since), or the panel has just said it. Never a period she has not shot on, so a first roll is never called fresh.
 */
export function keepsPeriod(input: {
  kept: number | null;
  period: number | null | undefined;
  held: number;
  said: boolean;
}): boolean {
  if (typeof input.period !== "number" || input.period === input.kept) {
    return false;
  }
  return input.said || input.held > 0;
}

export function readKeptPeriod(qrToken: string): number | null {
  try {
    return parseKeptPeriod(window.localStorage.getItem(freshRollKey(qrToken)));
  } catch {
    return null;
  }
}

export function keepPeriod(qrToken: string, period: number): void {
  try {
    window.localStorage.setItem(freshRollKey(qrToken), String(period));
  } catch {
    // A memory that cannot be written is a fresh roll said again on the next open: never a wrong one.
  }
}
