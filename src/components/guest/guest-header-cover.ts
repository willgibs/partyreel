"use client";

import { useSyncExternalStore } from "react";

/**
 * WHETHER THE ALBUM'S COVER STANDS UNDER THE GUEST'S HEADER RIGHT NOW (`event-header` r1's carried
 * call `header`, taken: "over the cover the guest's header stands on the photograph in white with no
 * rule; elsewhere it is today's").
 *
 * ★ A MODULE STORE, BECAUSE THE TWO ARE SIBLING ISLANDS. The header is the page's (`page.tsx` draws it
 * above the album, and `/u/[slug]` and the shut door wear it too); the cover is the album's
 * (`event-experience.tsx`). Neither can hand the other a prop, so the album says here when its cover
 * is under the header, the shape `name-door.ts` and `door-light.ts` use for the same reason.
 *
 * ★ THE SERVER'S WORD UNTIL THE ALBUM'S. The page knows at render whether a cover is drawn at all (a
 * door that is the page draws none), and that word stands for the first paint and the hydration; the
 * album's word then moves it as the page does: the door's stage arriving over the album (the header
 * goes back to paper over a paper door), or the demo's pinned header taking the paper the moment the
 * page moves.
 */
let under: boolean | null = null;
const listeners = new Set<() => void>();

/** The album's word: its cover is (true) or is not (false) under the header; null hands it back to the page. */
export function publishCoverUnderHeader(next: boolean | null) {
  if (next === under) return;
  under = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const read = () => under;
const serverRead = () => null;

/** Whether the header stands on the cover: the album's word once it has one, the page's until then. */
export function useCoverUnderHeader(pageWord: boolean): boolean {
  return useSyncExternalStore(subscribe, read, serverRead) ?? pageWord;
}
