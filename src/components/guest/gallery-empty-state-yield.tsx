"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { HerShot } from "@/lib/disposable/contact-sheet";
import type { GuestWaiting, WaitingFacts } from "@/lib/disposable/facts";
import type { WaitClock } from "@/lib/disposable/wait-words";
import type { GalleryAccess } from "@/lib/events/gallery-access";

/**
 * WHETHER THE ALBUM'S WAIT STANDS, AND WHAT IT DRAWS: the one reading the album's wait (`AlbumWait`, over the album's
 * rows) and the album's empty state (`GalleryEmptyState`) both follow, made once by the page's source inside the
 * album's live provider (`AlbumWaitSource`, `gallery-empty-state-wait.tsx`), so the two never disagree about a frame.
 *
 * ★ ITS OWN LIGHT MODULE, ON PURPOSE: the empty state is drawn on server pages too (the Library, the lab), so what it
 * imports to yield may read only a context, never the album's live source and the guest actions behind it. Absent a
 * provider (a standalone album, the Library), nothing waits and the empty state stands.
 */

export type AlbumWaitState = {
  /** The sheet stands: the album waits (`waitStands`), and something waits or she is sending to it. */
  stands: boolean;
  /** Everyone's waiting as the album's sync counts it (the count and its minutes; never an id). */
  waiting: Pick<WaitingFacts, "count" | "minutes"> | null;
  /** Her own waiting shots (her tracker's). */
  hers: readonly HerShot[];
  /** What hers wait for here, or null where nothing waits. */
  clock: WaitClock | null;
  /**
   * The album's one rule is said in the sheet's place until the sheet stands: the album waits and she can add to it
   * here ("Uploads develop all at once at 9 am."). Once the sheet stands, its clock says it.
   */
  rule: boolean;
  /** Opens her uploads, her door to take one back. */
  onOpenHers?: () => void;
  /** The album's last laid width on this device, for the first paint's columns. */
  firstPaintWidth: number | null;
};

const AlbumWaitStateContext = createContext<AlbumWaitState | null>(null);

export const AlbumWaitStateProvider = AlbumWaitStateContext.Provider;

/** The album's wait, as its source read it; null with no source above (nothing waits). */
export function useAlbumWaitState(): AlbumWaitState | null {
  return useContext(AlbumWaitStateContext);
}

/**
 * THE ALBUM'S EMPTY STATE, YIELDING TO THE WAIT: its children (the river and its promise) stand only where the album's
 * wait does not, so an album that holds photos back reads as the sheet above it, never "The album starts with you"
 * under a guest who has just added to it.
 */
export function AlbumWaitYield({ children }: { children: ReactNode }) {
  const state = useAlbumWaitState();
  return state?.stands ? null : children;
}

/**
 * WHAT WAITS, AS THE ALBUM'S LIVE SOURCE HOLDS IT (`GalleryLiveProvider` provides it beside its own value): the access
 * the album answered at and its waiting facts (`GalleryLive.waiting`). Its own context, in this light module, so the
 * album's wait reads it without importing the live source, and a page drawn with a stand-in source reads nothing waits.
 */
export type AlbumWaiting = {
  access: GalleryAccess;
  waiting: GuestWaiting | null;
};

const AlbumWaitingContext = createContext<AlbumWaiting | null>(null);

export const AlbumWaitingProvider = AlbumWaitingContext.Provider;

export function useAlbumWaiting(): AlbumWaiting | null {
  return useContext(AlbumWaitingContext);
}
