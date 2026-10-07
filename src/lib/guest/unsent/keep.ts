"use client";

/**
 * HER UNSENT FILES, KEPT ON HER PHONE UNTIL EACH LANDS (no-signal r1, Will's `carry=phone`): "A copy of each unsent file
 * waits in this browser for this album ... and goes when the line is back, or at her next open." The page's one queue
 * (`use-upload-queue.ts`) sends from memory as ever; this is the copy that outlives the page, in IndexedDB, as the held
 * door keeps her picks (`door/wait-picks-store.ts`, the precedent), one record a file so each comes and goes alone.
 *
 * ★ WHOLE, WHILE THE PHONE HAS ROOM: each file is copied as she sends it, and one the phone cannot hold (no room, no
 * IndexedDB, a private window that refuses it) simply waits in the page, as before, and says so (`paneNote`). A record
 * goes the moment its file lands, is stopped, or is refused for a reason of its own (the failure sheet has it then).
 *
 * ★ HERS, AND ONLY HERS (`keepOwner`): each record is filed under the album and the identity it goes up as (the host on
 * her own album, else the device's ticket), so a phone that now holds another ticket, or no host, never sends her
 * photographs under someone else's name: such a record is put down unread at the next open. The server's own owner rule
 * covers the rest (a ticket whose row is another account's is refused, and a file carried from an earlier page is then
 * put down, never re-sent on a fresh ticket: `use-upload-queue.ts`'s `restoredRef`).
 *
 * ★ ONE PAGE SENDS EACH (`TAB`, the per-page lock): two open pages of one album (her QR scanned twice, a link from a
 * message beside the tab she had) must never both send one photograph. Each page holds a lock of its own while it keeps
 * a file, and a page that opens takes only the records no live page holds (`liveTabs`), under a lock of the album's
 * own so two opening at once never take the same ones. A page iOS froze in the background still holds its lock, so its
 * files wait for it; one the phone discarded holds none, and its files are the next open's. Where the browser has no
 * Web Locks (Safari before 15.4), every record not in this page's queue is taken: a second open page there is the one
 * case that could send a file twice.
 *
 * ★ NEVER IN THE WAY: every call answers quietly (`false`, `[]`) and the file simply lives in the page, as it did.
 */
const DB_NAME = "partyreel-unsent";
const STORE = "files";
const BY_ALBUM = "album";

/** What a queue item carries beside its file, kept with it (a camera shot's moment, a clip's poster and its reel flag). */
export type KeptExtra = {
  takenAt?: number;
  reelEligible?: false;
  poster?: Blob;
};

/** One file, as the keep holds it. */
export type KeptRecord = KeptExtra & {
  /** The queue item's own id: the same file is the same item in whichever page sends it. */
  id: string;
  /** The album's link token. */
  album: string;
  /** Who it goes up as (`keepOwner`). */
  owner: string;
  /** The page that holds it now (`TAB`). */
  tab: string;
  /** When it was kept (epoch ms). */
  at: number;
  name: string;
  type: string;
  lastModified: number;
  blob: Blob;
};

/** A record handed back to the queue: its file, and what rode with it. */
export type RestoredFile = KeptExtra & { id: string; file: File };

/**
 * WHO A FILE GOES UP AS, the key it is filed under: the host on her own album (her event's id), else the device's
 * ticket for the album; null where the queue has neither yet (a first pick waiting on its join, a door that holds her),
 * and then nothing is kept (it lives in the page, as before).
 */
export function keepOwner(input: {
  ownerEventId: string | null;
  ticket: string | null;
}): string | null {
  if (input.ownerEventId) return `host:${input.ownerEventId}`;
  if (input.ticket) return `ticket:${input.ticket}`;
  return null;
}

/** This page's own name for its records and its lock: one per page load. */
let tabId: string | null = null;
export function thisTab(): string {
  tabId ??=
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return tabId;
}

const TAB_LOCK = "partyreel-unsent-tab:";
const ALBUM_LOCK = "partyreel-unsent-album:";

/**
 * HOW LONG A FILE WAITS FOR ITS NEXT OPEN: a party's photos are the album's for days after it (its link, a let-in mail),
 * and past two weeks a photograph nobody sent is put down rather than sent into an album that has moved on. Safari may
 * put it down sooner (seven days of Safari use with no visit to the site), which is why no word promises a length.
 */
export const UNSENT_KEEP_DAYS = 14;
const KEEP_MS = UNSENT_KEEP_DAYS * 24 * 60 * 60 * 1000;

/**
 * WHAT A PAGE THAT OPENS DOES WITH WHAT IS KEPT FOR ITS ALBUM, pure: it takes what is hers and held by no live page
 * (never what its own queue already holds), and puts down what is not hers or has waited too long. A record a live page
 * holds is left to that page.
 */
export function sortKept(
  records: readonly KeptRecord[],
  input: {
    owner: string;
    /** The pages holding a lock of their own now (`liveTabs`), or null where the browser cannot say. */
    liveTabs: ReadonlySet<string> | null;
    /** What this page's queue already holds. */
    held: ReadonlySet<string>;
    tab: string;
    now: number;
  },
): { take: KeptRecord[]; drop: string[] } {
  const take: KeptRecord[] = [];
  const drop: string[] = [];
  for (const r of records) {
    if (input.held.has(r.id)) continue;
    if (input.now - r.at > KEEP_MS || r.owner !== input.owner) {
      drop.push(r.id);
      continue;
    }
    // Another live page's: it sends it. (This page's own name never holds a record it does not hold in its queue.)
    if (r.tab !== input.tab && input.liveTabs?.has(r.tab)) continue;
    take.push(r);
  }
  return { take, drop };
}

/** A record as the queue takes it back: the very bytes, named and dated as they were picked. */
export function restoredFile(r: KeptRecord): RestoredFile {
  return {
    id: r.id,
    file: new File([r.blob], r.name, {
      type: r.type,
      lastModified: r.lastModified,
    }),
    ...(r.takenAt !== undefined ? { takenAt: r.takenAt } : {}),
    ...(r.reelEligible === false ? { reelEligible: false as const } : {}),
    ...(r.poster ? { poster: r.poster } : {}),
  };
}

/* ── IndexedDB, quietly ─────────────────────────────────────────────────── */

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex(BY_ALBUM, "album", { unique: false });
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

/** One transaction over the store, answered `true` once it commits (or `null`); the database closed after. */
async function transact(
  mode: IDBTransactionMode,
  act: (store: IDBObjectStore) => void,
): Promise<true | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      act(tx.objectStore(STORE));
      tx.oncomplete = () => {
        db.close();
        resolve(true);
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

/**
 * WHETHER THE PHONE HAS ROOM FOR THIS MANY BYTES, as the browser estimates it (an upper bound, never a promise: the
 * write itself is the answer). Unknown is room: the write tries, and a refusal is the page's keep.
 */
export async function hasRoomFor(bytes: number): Promise<boolean> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota) return true;
    // A margin past the file itself, so a copy never takes the last of the album's room on the phone.
    return (
      estimate.quota - (estimate.usage ?? 0) > bytes * 1.1 + 16 * 1024 ** 2
    );
  } catch {
    return true;
  }
}

/** Keep one file. True once it is on the phone. */
export async function keepFile(record: KeptRecord): Promise<boolean> {
  if (!(await hasRoomFor(record.blob.size + (record.poster?.size ?? 0)))) {
    return false;
  }
  return (await transact("readwrite", (store) => store.put(record))) !== null;
}

/** Put these files down: landed, stopped, refused, or not hers. */
export async function forgetFiles(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  await transact("readwrite", (store) => {
    for (const id of ids) store.delete(id);
  });
}

/** Everything kept for this album, any page's, any owner's (`sortKept` decides). */
export async function readKept(album: string): Promise<KeptRecord[]> {
  const db = await open();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).index(BY_ALBUM).getAll(album);
      let rows: KeptRecord[] = [];
      req.onsuccess = () => {
        rows = (req.result as KeptRecord[]).filter(isRecord);
      };
      tx.oncomplete = () => {
        db.close();
        resolve(rows);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

/**
 * Re-file these records, in one transaction: under this page (`tab`, a page taking what it will send) or under the
 * identity they go up as now (`owner`, a ticket the queue swapped mid-visit). A record gone meanwhile stays gone.
 */
export async function refile(
  ids: readonly string[],
  patch: Partial<Pick<KeptRecord, "tab" | "owner">>,
): Promise<boolean> {
  if (ids.length === 0) return true;
  const done = await transact("readwrite", (store) => {
    for (const id of ids) {
      const req = store.get(id);
      req.onsuccess = () => {
        const row = req.result as KeptRecord | undefined;
        if (row && isRecord(row)) store.put({ ...row, ...patch });
      };
    }
  });
  return done !== null;
}

/** A row read back is only a record whole (a store an older build wrote, a corrupted row: never a half file). */
function isRecord(value: unknown): value is KeptRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.album === "string" &&
    typeof r.owner === "string" &&
    typeof r.tab === "string" &&
    typeof r.at === "number" &&
    typeof r.name === "string" &&
    typeof r.type === "string" &&
    typeof r.lastModified === "number" &&
    r.blob instanceof Blob
  );
}

/* ── the locks: one page sends each ─────────────────────────────────────── */

function locks(): LockManager | null {
  try {
    return typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks
      : null;
  } catch {
    return null;
  }
}

/** The pages holding a lock of their own now, or null where the browser cannot say (no Web Locks). */
export async function liveTabs(): Promise<ReadonlySet<string> | null> {
  const lm = locks();
  if (!lm) return null;
  try {
    const { held = [] } = await lm.query();
    return new Set(
      held.flatMap((l) =>
        l.name?.startsWith(TAB_LOCK) ? [l.name.slice(TAB_LOCK.length)] : [],
      ),
    );
  } catch {
    return null;
  }
}

/** Runs `fn` alone among this album's opening pages (no Web Locks: at once). */
export async function aloneForAlbum<T>(
  album: string,
  fn: () => Promise<T>,
): Promise<T> {
  const lm = locks();
  if (!lm) return fn();
  try {
    return await lm.request(`${ALBUM_LOCK}${album}`, fn);
  } catch {
    return fn();
  }
}

/**
 * THIS PAGE'S OWN LOCK, held while it keeps a file (so a page that opens leaves those files to it), let go when it
 * keeps none: a page that keeps nothing holds nothing, so it stays one the browser may keep in its back-forward cache.
 * Returns the way to let it go.
 */
export function holdThisTab(): () => void {
  const lm = locks();
  if (!lm) return () => {};
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    void lm.request(`${TAB_LOCK}${thisTab()}`, () => held).catch(() => {});
  } catch {
    // No lock: the page's files are still its own; only a second open page could take them.
  }
  return release;
}
