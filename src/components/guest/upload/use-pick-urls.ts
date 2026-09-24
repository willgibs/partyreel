"use client";

/**
 * ONE OWNER PER OBJECT URL, and it is never the element that draws it.
 *
 * ★ THE BUG THIS EXISTS TO KILL IS INVISIBLE IN PRODUCTION AND LOUD IN DEV.
 * A component that mints its URL in a `useState` initializer and revokes it in
 * an effect's cleanup is correct exactly once: under React's development
 * StrictMode the tree mounts, runs effects, unmounts (the cleanup REVOKES) and
 * mounts again with the same state — so the second mount paints a URL that has
 * already been revoked, every `<img>` fires `onError`, and every preview on the
 * add sheet draws the named stand-in instead of the photograph. Dev-only still
 * matters: local dev is a review surface as much as the alias is.
 *
 * So the ledger lives OUTSIDE the elements, in a ref, with the mint and the
 * revoke in the same effect: a StrictMode cleanup empties it and the re-run
 * fills it again, which is the whole of being safe there. It is the same shape
 * `live-gallery.tsx` already keeps for uploads in flight, for the same reason;
 * the two are separate ledgers on purpose, because one revoke must never blank
 * another surface's picture.
 */
import { useEffect, useRef, useState } from "react";

export function usePickUrls(
  picks: readonly { id: string; file: File }[],
): ReadonlyMap<string, string> {
  const ledger = useRef(new Map<string, string>());
  // The render-facing mirror: minting is a side effect, so it lives in the
  // effect and render reads only this. A tile waits one frame for its URL,
  // which is invisible (its box is already drawn).
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    const map = ledger.current;
    const live = new Set(picks.map((p) => p.id));
    let changed = false;
    for (const { id, file } of picks) {
      if (!map.has(id)) {
        map.set(id, URL.createObjectURL(file));
        changed = true;
      }
    }
    for (const [id, url] of map) {
      if (!live.has(id)) {
        URL.revokeObjectURL(url);
        map.delete(id);
        changed = true;
      }
    }
    if (changed) setUrls(new Map(map));
  }, [picks]);

  // Everything goes with the surface.
  useEffect(() => {
    const map = ledger.current;
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
      map.clear();
    };
  }, []);

  return urls;
}
