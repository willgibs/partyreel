"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import { type Album, type Light, WEDDING_ALBUM } from "./fixtures";
import { albumKeyLight, albumVotes } from "./light";

/**
 * THE ALBUM A FRAME DRAWS, handed down by context so every part and every
 * design reads one party: the wedding by default, the rooftop where a frame
 * asks for a second party (`whole.tsx`), the lunch where a card is judged
 * with a long name. A context reaches through a frame's portal, so a page
 * drawn inside a `Frame` reads the album its frame was given.
 *
 * ★ A LIGHT IS READ FROM THE ALBUM IT LIGHTS, NEVER A CONSTANT: a design
 * asks `useAlbumLight()` for the album's three lights (every hue its
 * photographs give off, intensity-weighted) and `useAlbumKey()` for its one
 * key (Aperture's Ring), so a neon party lights its page violet where the
 * wedding lights it gold.
 */

const AlbumContext = createContext<Album>(WEDDING_ALBUM);

export function AlbumProvider({
  album,
  children,
}: {
  album: Album;
  children: ReactNode;
}) {
  return (
    <AlbumContext.Provider value={album}>{children}</AlbumContext.Provider>
  );
}

/** The album this frame draws. */
export const useAlbum = (): Album => useContext(AlbumContext);

/** The album's three lights, read from its cover's photographs: every hue, weighted by its intensity. */
export function useAlbumLight(): Light {
  const album = useAlbum();
  return useMemo(() => albumVotes(album.cover.map((s) => s.id)), [album]);
}

/** The album's one key light at three depths: the Ring's paint, the newest face's ring. */
export function useAlbumKey(): Light {
  const album = useAlbum();
  return useMemo(() => albumKeyLight(album.cover.map((s) => s.id)), [album]);
}
