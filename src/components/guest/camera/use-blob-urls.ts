"use client";

/**
 * THE CAMERA'S OWN PICTURES OF HER SHOTS, ONE OWNER PER OBJECT URL: the small picture each shot froze on (`thumb`),
 * minted and revoked in one effect, never by the element that draws it (`upload/use-pick-urls.ts` says why: a URL
 * minted in render and revoked in a cleanup is painted revoked on StrictMode's remount). A separate ledger from the
 * album's and the add sheet's, so no revoke of theirs can blank a picture of hers.
 */
import { useEffect, useRef, useState } from "react";

export function useBlobUrls(
  entries: readonly { id: string; blob: Blob }[],
): ReadonlyMap<string, string> {
  const ledger = useRef(new Map<string, { blob: Blob; url: string }>());
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(
    () => new Map(),
  );

  useEffect(() => {
    const map = ledger.current;
    const live = new Map(entries.map((e) => [e.id, e.blob]));
    let changed = false;
    for (const [id, blob] of live) {
      const held = map.get(id);
      if (held?.blob === blob) continue;
      if (held) URL.revokeObjectURL(held.url);
      map.set(id, { blob, url: URL.createObjectURL(blob) });
      changed = true;
    }
    for (const [id, held] of map) {
      if (live.has(id)) continue;
      URL.revokeObjectURL(held.url);
      map.delete(id);
      changed = true;
    }
    if (changed) {
      setUrls(new Map([...map].map(([id, held]) => [id, held.url])));
    }
  }, [entries]);

  // Everything goes with the camera.
  useEffect(() => {
    const map = ledger.current;
    return () => {
      for (const held of map.values()) URL.revokeObjectURL(held.url);
      map.clear();
    };
  }, []);

  return urls;
}
