"use client";

/**
 * ONE CHANNEL BETWEEN THE HEADER AND THE PAGE.
 *
 * `GuestHeader` is a SIBLING island of `EventExperience` (the page RSC renders
 * both), so the header cannot reach the entry modal's imperative handle the way
 * the album's own Add buttons can. This is the same problem
 * `use-stored-session.ts` already solves the same way, and for the same reason it
 * gives there: a module singleton, shared across the client bundle, is the one
 * place both islands can meet without the page growing a provider for one row of
 * a dropdown menu.
 *
 * ★ IT CARRIES A REQUEST, NEVER STATE. Nothing here remembers anything: the
 * header asks for the name door, the page's shell opens it, and the modal owns
 * every bit of state involved. A second listener would simply open it twice,
 * which is why exactly one thing subscribes (`event-experience.tsx`).
 */

/**
 * ★ TWO MODES, ONE DOOR. The name is one of the door's ordered steps and nothing outside the door
 * raises it in its asking modes; what is raised from outside is only its CHANGE: `edit`, the
 * header's "Change name" row for a guest's own row (a sibling island of the sheet that answers
 * it, hence this channel), and `account`, the told name's Change for a CONFIRMED account
 * (`confirm-beat.ts`), which writes the profile's name, since a confirmed row carries none.
 */
export type NameDoorMode = "edit" | "account";

type Listener = (mode: NameDoorMode) => void;

const listeners = new Set<Listener>();

/** The header's row asks; whoever holds the entry modal answers. */
export function requestNameDoor(mode: NameDoorMode) {
  for (const listener of listeners) listener(mode);
}

/** Subscribe (the page shell). Returns the unsubscribe, for an effect's cleanup. */
export function onNameDoorRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
