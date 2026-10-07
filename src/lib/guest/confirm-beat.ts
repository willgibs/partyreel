"use client";

import {
  TOLD_NAME_COOKIE,
  toldNameFrom,
} from "@/app/(auth)/adopt-door-name-told";
import { formatCount } from "@/lib/format/count";
import { CLAIMED_TOAST } from "@/lib/guest/claim-uploads";
import { GUEST_NAME_PREFIX } from "@/lib/guest/use-stored-name";

/**
 * A CONFIRMATION ON AN ALBUM IS ONE BEAT (`guest-capture` r1, Will's `follow=card`: "needs to work
 * within any multi-claim handling"; `name=told`: the name she typed becomes her account's name at
 * once, then she is told, with a Change that changes it).
 *
 * A confirmation says up to three things: what she now keeps HERE (and the host to follow), what
 * became of OTHER events (her uploads there came too; photos typed under her email elsewhere wait on
 * her dashboard), and the name her photographs now carry. Said by three surfaces they stacked (the
 * follow moment, the claims toast, a name toast). So they are one:
 *
 *   - when the confirmation plays the FOLLOW MOMENT (a confirm door opened here and the claim moved
 *     this album's own uploads), the moment card says all of it: the other events once, in one line
 *     (`otherEventsLine`), the name with its Change, the host's row. Nothing toasts.
 *   - otherwise ONE toast says what there is to say (the name told, the other events said once),
 *     with the name's Change as its action, and only once the door has closed, so it never lands
 *     on a sheet the guest is still answering. The toast never speaks of the events waiting under
 *     her email: it is said wherever no moment plays, which is every confirmation before her first
 *     upload here (`identity-claims` r3: "Don't want too many complications around this,
 *     especially prior to upload"), and her dashboard's banner holds them.
 *   - ★ and when the claim left THIS album's photos for the address typed with them (typed under her
 *     name here, then another address confirmed: `claimLeftForAnotherAddress`), the toast says where
 *     they are and how to keep them, and tells no name: the told name waits for a claim that moves
 *     her photos here (crumbs-24, shared-claims' second Question).
 *
 * ★ A CONFIRMATION BY THE EMAILED LINK IS THE SAME BEAT (crumbs-88): the link leaves the page, so the callback adopts the
 * name typed at the door on the server (`adopt-door-name.ts`) and the album she lands on is a fresh load that heard none of
 * it. The callback leaves the name her photographs now carry in a short-lived cookie bound to that album
 * (`adopt-door-name-told.ts`), `takeToldName` spends it on the album's mount, and the mount reports the beat with it
 * (`use-confirm-return.ts`), so she is told the name and offered its Change, as the in-page confirm does.
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

/** Her uploads at other events, which the claim carried into her account, without a stop. */
const ELSEWHERE_WORDS =
  "Your uploads from other events are in your account too";

/** The other events, said once (in the moment card, or as the toast's second line). */
export const ELSEWHERE_LINE = `${ELSEWHERE_WORDS}.`;

/**
 * THE OTHER EVENTS, IN THE MOMENT CARD'S ONE LINE (`identity-claims` r3, Will's `pointer=line`, as
 * his note shapes it: "Simply acknowledging the existence of other events and allowing that to be
 * handled back on the dashboard later is enough"). Two different facts can be about other events
 * once she confirms, and the card says both in one line, so it never says "other events" twice:
 *
 *   - `elsewhere`: this device's uploads at other events, which the claim just carried into her
 *     account (done, and `ELSEWHERE_LINE` alone, as the toast says it);
 *   - `waiting`: other events whose photos were added under her email and that no claim moved,
 *     waiting in her dashboard's claims review (the banner's own list, counted on the server by
 *     `confirm-beat-action.ts`, never this album).
 *
 * ★ IT ACKNOWLEDGES AND NEVER LEADS OUT: the waiting events are on her dashboard whenever she
 * likes, in the words his `line` tile showed ("4 more events have photos waiting on your
 * dashboard"), and nothing in the line is pressable ("Events should feel mostly self-contained for
 * the benefit of the host receiving guest uploads"; the tile's "Review all 4" is what his note
 * dropped). Null when there is nothing to say.
 */
export function otherEventsLine({
  elsewhere,
  waiting,
}: {
  elsewhere: number;
  waiting: number;
}): string | null {
  if (waiting <= 0) return elsewhere > 0 ? ELSEWHERE_LINE : null;
  const events =
    waiting === 1
      ? "another event has"
      : `${formatCount(waiting)} more events have`;
  const line = `${events} photos waiting on your dashboard, whenever you like.`;
  if (elsewhere > 0) return `${ELSEWHERE_WORDS}, and ${line}`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/**
 * ★ PHOTOS HERE LEFT FOR ANOTHER ADDRESS: where they are (with the address typed under her name, which
 * the phone never holds, so the words never name it) and the one way to keep them. Counted, one said in
 * the singular. "Photos" as the claims review counts them, videos included.
 */
export function leftForAddressWords(uploads: number): {
  title: string;
  description: string;
} {
  const one = uploads === 1;
  return {
    title: one
      ? "Your photo here was added with another email."
      : `Your ${formatCount(uploads)} photos here were added with another email.`,
    description: one
      ? "It stays with the email you added with your name. Sign in with that email to keep it."
      : "They stay with the email you added with your name. Sign in with that email to keep them.",
  };
}

/** Her uploads at other events beside photos here that did not move: "too" would claim these did. */
const ELSEWHERE_ALONE = "Your uploads from other events are in your account.";

/**
 * The one toast a confirmation without a moment says, or null when it has nothing to say. Photos here
 * left for another address lead, and then the name is not told; else the name leads (it is about this
 * album); the other events follow as its description; alone, the other events keep the claim's own
 * sentence (`CLAIMED_TOAST`), so a claim that moved uploads is worded the same wherever it is said.
 */
export function confirmBeatToast(
  beat: Pick<ConfirmBeat, "name" | "elsewhere"> & {
    /** This album's live uploads the claim left for the address typed with them. */
    left?: number;
  },
): { title: string; description?: string } | null {
  if (beat.left && beat.left > 0) {
    const words = leftForAddressWords(beat.left);
    return {
      title: words.title,
      description:
        beat.elsewhere > 0
          ? `${words.description} ${ELSEWHERE_ALONE}`
          : words.description,
    };
  }
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

/**
 * ★ THE NAME A TAPPED LINK ADOPTED FOR THIS ALBUM, TAKEN ONCE (crumbs-88): what the callback left in its cookie for the
 * album it landed on, or null (no cookie, one left for another album, one that fails the name's own check). The read spends
 * it, so a reload says nothing more; a cookie for another album is left to its own two minutes. Storage that throws is no name.
 */
export function takeToldName(qrToken: string): string | null {
  try {
    const raw = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${TOLD_NAME_COOKIE}=`))
      ?.slice(TOLD_NAME_COOKIE.length + 1);
    const name = toldNameFrom(raw, qrToken);
    if (name) {
      document.cookie = `${TOLD_NAME_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
    return name;
  } catch {
    return null;
  }
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
