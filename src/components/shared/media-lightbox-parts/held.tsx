"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

import { filenameFor } from "@/lib/media/share-save";
import {
  browserHeldStore,
  WAITING,
  type Held,
  type HeldStore,
} from "@/lib/media/share-save-held";

import type { ViewerMedia } from "./credit";

/**
 * THE VIEWER'S HELD ORIGINALS, AS REACT READS THEM (`share-save-held.ts` is the
 * store and carries the why). The slot that draws a photograph holds its
 * original; the capsule reads the same entry, so Save and Share send the bytes
 * on screen.
 *
 * The store is the page's own (`browserHeldStore`) unless a provider hands one
 * in: a test does, with a store it drives. `null` is "this browser does not
 * hold", and every photograph is drawn and saved the plain way.
 */
export const HeldStoreContext = createContext<HeldStore | null | undefined>(
  undefined,
);

export function useHeldStore(): HeldStore | null {
  const given = useContext(HeldStoreContext);
  return given === undefined ? browserHeldStore() : given;
}

const noSubscribe = () => () => {};

/** One photograph's held state: null when nobody has asked for it (or nothing holds). */
export function useHeld(store: HeldStore | null, id: string): Held | null {
  return useSyncExternalStore(
    store ? store.subscribe : noSubscribe,
    () => (store ? store.get(id) : null),
    () => null,
  );
}

/**
 * WHETHER THE VIEWER HOLDS THIS ITEM'S ORIGINAL, rather than drawing its link.
 * A photograph with a link of its own and a preview that is not the original:
 * where the tile drew the original itself (no preview), the HTTP cache already
 * has it and the viewer's plain <img> reads it there for free, so holding it
 * would be the second download this exists to remove. A clip streams, never held.
 */
export function holdable(item: ViewerMedia): boolean {
  if (item.type !== "photo" || !item.url) return false;
  if (!item.previewUrl || item.previewUrl === item.url) return false;
  return /^https?:\/\//i.test(item.url) || item.url.startsWith("/");
}

/**
 * Hold this photograph's original while the slot draws it: high in the middle,
 * low beside it. The answer is what the slot should draw: `held` (the object
 * URL), `plain` (the link), or still on its way, which is also the answer before
 * the effect has asked: the first paint must not mount the link either.
 */
export function useHoldOriginal(
  store: HeldStore | null,
  item: ViewerMedia,
  isCenter: boolean,
): Held | null {
  const can = store !== null && holdable(item);
  const { id, url } = item;
  const name = filenameFor(item);
  const priority = isCenter ? "high" : "low";
  useEffect(() => {
    if (!can || !store) return;
    return store.want(id, url, { priority, name });
  }, [can, store, id, url, priority, name]);
  const held = useHeld(store, id);
  return can ? (held ?? WAITING) : null;
}

/** Bytes so far over the whole, or null while the whole is not known. */
export function heldFraction(held: Held | null): number | null {
  if (held?.kind !== "loading" || !held.total) return null;
  return Math.min(1, held.received / held.total);
}
