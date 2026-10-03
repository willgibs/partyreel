"use client";

/**
 * ★ WHAT HER PICKS HOLD, CARRIED TO THE FOOT (red-team 49's NIT): the foot's Save names its set the way the album names
 * one ("Save 15 photos & videos", crumbs-57's `setNoun`, the Save sheet's own title), but the foot stands outside the
 * album's live source, the one place that knows which picks are clips, so it said "photos" for everything. The album's
 * kinds come out through one small store a page (`createAlbumKinds`): `AlbumKindsSource`
 * (`guest-action-dock-kinds-source.tsx`), drawn inside the live source, writes them while select mode is on (the only
 * time the foot says them), and the dock divides her picks by them in the frame each pick lands (`useSaveKinds`). A
 * pick the album never named counts as a photo, as the sheet counts it.
 *
 * Its own module, apart from the source, so the dock never loads the album's live source to read it.
 */
import { useSyncExternalStore } from "react";

export type AlbumKind = "photo" | "video";

const NO_KINDS: ReadonlyMap<string, AlbumKind> = new Map();
const readNone = () => NO_KINDS;
const listenToNothing = () => () => {};

/** The album's kinds by id, as its live source last said them: one store a page, read through `useSyncExternalStore`. */
export function createAlbumKinds() {
  let kinds = NO_KINDS;
  const listeners = new Set<() => void>();
  return {
    get: (): ReadonlyMap<string, AlbumKind> => kinds,
    set(next: ReadonlyMap<string, AlbumKind>) {
      kinds = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type AlbumKinds = ReturnType<typeof createAlbumKinds>;

/** Her picks divided into photos and clips by the kinds the album said (`setNoun`'s two counts). */
export function useSaveKinds(
  store: AlbumKinds | undefined,
  picks: readonly string[],
): { photos: number; clips: number } {
  const kinds = useSyncExternalStore(
    store?.subscribe ?? listenToNothing,
    store?.get ?? readNone,
    store?.get ?? readNone,
  );
  const clips = picks.filter((id) => kinds.get(id) === "video").length;
  return { photos: picks.length - clips, clips };
}
