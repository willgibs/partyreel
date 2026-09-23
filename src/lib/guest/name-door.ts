"use client";

/**
 * ONE CHANNEL BETWEEN THE HEADER AND THE PAGE (the identity reshape, 2026-09-21).
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
 * ★ "edit" IS THE ONLY MODE LEFT (the door as three steps, 2026-09-21). The join mode existed
 * because the name was asked at the first Add, from three different affordances; the name is one
 * of the door's ordered steps now and nothing outside the door raises it. The channel stays,
 * because the header's "Change name" row is still a sibling island of the sheet that answers it.
 */
export type NameDoorMode = "edit";

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
