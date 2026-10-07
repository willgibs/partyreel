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
 *
 * ★ ONE DOOR, ONE REQUEST. The name is one of the door's ordered steps and nothing outside the door
 * raises it in its asking modes; what is raised from outside is only its CHANGE, the header's
 * "Change name" row for a guest's own row (a sibling island of the sheet that answers it, hence
 * this channel). A confirmed account changes the name it was told by its own small form
 * (`confirm-beat-name.tsx`), never this door.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** The header's row asks; whoever holds the entry modal answers. */
export function requestNameDoor() {
  for (const listener of listeners) listener();
}

/** Subscribe (the page shell). Returns the unsubscribe, for an effect's cleanup. */
export function onNameDoorRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
