"use client";

/**
 * THE ALBUM'S KINDS, SAID TO THE FOOT (red-team 49's NIT; the store and why: `guest-action-dock-kinds.ts`). Drawn by the
 * page inside the album's live source, the one place that knows which items are clips, it writes them into the page's
 * store while select mode is on, the only time the foot's Save says them, and draws nothing.
 */
import { useEffect } from "react";

import { useGalleryLive } from "@/components/guest/gallery-live";
import type { AlbumKinds } from "@/components/guest/guest-action-dock-kinds";
import { useGuestSelect } from "@/components/guest/live-gallery-select";

/** Says the album's kinds while select mode is on, and nothing otherwise (no read of the album until she selects). */
export function AlbumKindsSource({ store }: { store: AlbumKinds }) {
  const { active } = useGuestSelect();
  return active ? <KindsWhileSelecting store={store} /> : null;
}

function KindsWhileSelecting({ store }: { store: AlbumKinds }) {
  const items = useGalleryLive()?.items;
  useEffect(() => {
    store.set(new Map((items ?? []).map((item) => [item.id, item.type])));
  }, [items, store]);
  return null;
}
