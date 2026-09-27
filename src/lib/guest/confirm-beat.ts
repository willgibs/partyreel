"use client";

import { CLAIMED_TOAST } from "@/lib/guest/claim-uploads";
import { GUEST_NAME_PREFIX } from "@/lib/guest/use-stored-name";

/**
 * A CONFIRMATION ON AN ALBUM IS ONE BEAT (`guest-capture` r1, Will's `follow=card`: "needs to work
 * within any multi-claim handling"; `name=told`: the name she typed becomes her account's name at
 * once, then she is told, with a Change that changes it).
 *
 * A confirmation says up to three things: what she now keeps HERE (and the host to follow), that
 * her uploads at OTHER events came too, and the name her photographs now carry. Said by three
 * surfaces they stacked (the follow moment, the claims toast, a name toast). So they are one:
 *
 *   - when the confirmation plays the FOLLOW MOMENT (a confirm door opened here and the claim moved
 *     this album's own uploads), the moment card says all of it: the other events once, the name
 *     with its Change, the host's row. Nothing toasts.
 *   - otherwise ONE toast says what there is to say (the name told, the other events said once),
 *     with the name's Change as its action, and only once the door has closed, so it never lands
 *     on a sheet the guest is still answering.
 *
 * The page (`event-experience.tsx`) is the one place the toast is said: every door reports its
 * beat here and the page decides when (the door's own `pending`) and whether (the moment already
 * said it). The same module-singleton shape `claim-uploads.ts`'s `onClaimed` uses, because the
 * doors that confirm live on three islands (the door, the header's menu, the grid's mark).
 *
 * ★ THE NAME IS SETTLED BY THE PAGE, NOT BY THE DOOR THAT CONFIRMED. A door on another island
 * (the header's menu, the grid's mark) reports `settle: true` and the page runs `settle-name.ts`
 * before it speaks; that module reaches a Server Function, and a shared surface's own import graph
 * (the mark sits under every album grid) must never carry one into places that are not a page.
 */

export type ConfirmBeat = {
  /** The album on screen when the confirmation landed (its canonical token). */
  album: string;
  /** The name her photographs now carry, told only when she had typed one here; else null. */
  name: string | null;
  /** Claimed rows with a live upload at other events (one row an event on this device). */
  elsewhere: number;
  /** The page settles the name before it speaks (the reporter could not: `settle-name.ts`). */
  settle?: boolean;
};

const listeners = new Set<(beat: ConfirmBeat) => void>();

/** A confirmation's beat, for the album page to say once. */
export function reportConfirmBeat(beat: ConfirmBeat) {
  for (const listener of listeners) listener(beat);
}

/** The album page subscribes (one listener). Returns the unsubscribe. */
export function onConfirmBeat(
  listener: (beat: ConfirmBeat) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ── whether the last claim on an album played the follow moment ───────────────────────────── */

const momentPlayed = new Map<string, boolean>();

/**
 * The album's claim listener records, for the claim it just heard, whether the follow moment plays
 * (`use-confirm-return.ts`). It runs INSIDE the claim, before the claim's promise resolves, so a
 * door that awaited the claim reads the answer here synchronously and knows whether the moment
 * card will say its beat.
 */
export function recordMomentPlayed(album: string, played: boolean) {
  momentPlayed.set(album, played);
}

/** Whether the claim that just landed on this album played the follow moment. */
export function lastClaimPlayedMoment(album: string): boolean {
  return momentPlayed.get(album) ?? false;
}

/* ── the words ──────────────────────────────────────────────────────────────────────────────── */

/** The name told, in the board's words ("You're on as Priya."). */
export function toldNameLine(name: string): string {
  return `You're on as ${name}.`;
}

/** The other events, said once (in the moment card, or as the toast's second line). */
export const ELSEWHERE_LINE =
  "Your uploads from other events are in your account too.";

/**
 * The one toast a confirmation without a moment says, or null when it has nothing to say. The name
 * leads (it is about this album); the other events follow as its description; alone, the other
 * events keep the claim's own sentence (`CLAIMED_TOAST`), so a claim that moved uploads is worded
 * the same wherever it is said.
 */
export function confirmBeatToast(
  beat: Pick<ConfirmBeat, "name" | "elsewhere">,
): { title: string; description?: string } | null {
  if (beat.name) {
    return beat.elsewhere > 0
      ? { title: toldNameLine(beat.name), description: ELSEWHERE_LINE }
      : { title: toldNameLine(beat.name) };
  }
  return beat.elsewhere > 0 ? { title: CLAIMED_TOAST } : null;
}

/** Two beats that land before the page says either become one (the name the later's, the most
 *  events either counted). */
export function mergeConfirmBeats(
  a: ConfirmBeat | null,
  b: ConfirmBeat,
): ConfirmBeat {
  if (!a || a.album !== b.album) return b;
  return {
    album: b.album,
    name: b.name ?? a.name,
    elsewhere: Math.max(a.elsewhere, b.elsewhere),
    settle: Boolean(a.settle || b.settle) || undefined,
  };
}

/** The name this device typed at this album, read once (the per-event key a join wrote). */
export function readTypedName(qrToken: string): string | null {
  try {
    const value = localStorage.getItem(`${GUEST_NAME_PREFIX}${qrToken}`);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}
