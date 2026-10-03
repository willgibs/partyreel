"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * HER CHOICE AT THE HELD DOOR, KEPT ON THE DEVICE (door-reveal; ROADMAP's line from `door-wiring`: "the held
 * door's chosen photos live in the open tab alone (a `File` is the page's); keep them in IndexedDB so a reload or
 * a closed tab keeps her choice, and drop the door's 'Keep this tab open.' with it").
 *
 * What she picks while the host decides (`wait-picks.tsx`) is held by the page's one queue (`holdAtDoor`), which
 * lives in the tab. A copy of the files waits here too, in this browser's IndexedDB, so the held door that comes
 * back after a reload, a closed tab or tomorrow's let-in mail puts her choice back in the queue, and it goes in the
 * moment she is let in, as if she had never left.
 *
 * ★ HER OWN, AND ONLY HERS. Each choice is filed under the album and the account that made it (the waiting door
 * is a confirmed account's), so a phone passed to someone else never hands them her photographs: a choice that is
 * not this account's is put down unread. It is put down too the moment it has done its job (she is let in, the door
 * moved, she switched address) and after `KEEP_DAYS` whatever happens.
 *
 * ★ NEVER IN THE WAY. A browser with no IndexedDB, a private window, a full disk: every call answers quietly
 * (`false`, `null`) and the choice simply lives in the tab, as it did, the door saying so.
 */

const DB_NAME = "partyreel-door";
const STORE = "held-picks";

/** How long a choice may wait for its door: a let-in can come days later (the banked let-in mail). */
export const KEEP_DAYS = 14;

type KeptFile = {
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
};
type Kept = { album: string; owner: string; at: number; files: KeptFile[] };

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE, { keyPath: "album" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** One request in one transaction, answered or `null`; the database closed after. */
async function run<T>(
  mode: IDBTransactionMode,
  act: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const req = act(tx.objectStore(STORE));
      let value: T | null = null;
      req.onsuccess = () => {
        value = req.result;
      };
      tx.oncomplete = () => {
        db.close();
        resolve(value ?? (mode === "readwrite" ? (true as T) : null));
      };
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
      tx.onabort = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

/** Keep her choice for this album, replacing the last (a Change is a new choice). True once it is kept. */
export async function keepHeldPicks(
  album: string,
  owner: string,
  files: readonly File[],
): Promise<boolean> {
  if (!owner || files.length === 0) return false;
  const kept: Kept = {
    album,
    owner,
    at: Date.now(),
    files: files.map((file) => ({
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      blob: file,
    })),
  };
  return (await run("readwrite", (store) => store.put(kept))) !== null;
}

/**
 * Her choice for this album, if this account made it and it has not waited too long; anything else filed here
 * (another account's, an old one) is put down unread.
 */
export async function readHeldPicks(
  album: string,
  owner: string,
): Promise<File[] | null> {
  if (!owner) return null;
  const kept = (await run("readonly", (store) => store.get(album))) as
    | Kept
    | null
    | undefined;
  if (!kept) return null;
  const stale = Date.now() - kept.at > KEEP_DAYS * 24 * 60 * 60 * 1000;
  if (kept.owner !== owner || stale) {
    await forgetHeldPicks(album);
    return null;
  }
  return kept.files.map(
    (f) =>
      new File([f.blob], f.name, {
        type: f.type,
        lastModified: f.lastModified,
      }),
  );
}

/** Put her choice for this album down: it has gone in, or the door it waited for has gone. */
export async function forgetHeldPicks(album: string): Promise<void> {
  await run("readwrite", (store) => store.delete(album));
}

/**
 * Whose choice this is: the account standing at the held door (a confirmed account's door, so a session is on the
 * device). Read locally, no network; null where there is none.
 */
export async function doorOwner(): Promise<string | null> {
  try {
    // The device's own session, read locally: an error is no session, and no session keeps nothing (the
    // choice then lives in the tab), so nothing is authorised by what this answers.
    const { data, error } = await createClient().auth.getSession();
    if (error) return null;
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}
