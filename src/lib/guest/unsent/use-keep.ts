"use client";

/**
 * THE KEEP, KEPT IN STEP WITH THE QUEUE (no-signal r1, `carry=phone`; the store is `keep.ts`). The page's one queue sends
 * from memory; this copies each file the moment it is on its way (queued, or going up) and puts the copy down the moment
 * it is not (landed, stopped, refused, dismissed), so what the phone keeps is always exactly what has yet to land. And
 * once, as the page opens with an identity to send on, it hands the queue what an earlier page kept and never sent.
 *
 * ★ A COPY NEVER HOLDS A BYTE BACK: the copy and the upload run side by side (the uploader's rule: a byte never waits),
 * so a photograph that lands before its copy is written is put down as the copy ends. What could not be copied (no room,
 * no IndexedDB) is said to the queue (`onKept(id, false)`), whose stack then says "Keep this page open".
 *
 * ★ CARRIED UNTIL ITS BYTES ARE UP, NEVER PAST THEM: once a file's bytes are up its complete is asked (at its burst's end,
 * or at once as the page hides), and that complete is sent `keepalive`, so it outlives a closed page and very likely
 * records the row. A copy carried past that moment would go up again whole at the next open and land twice (the
 * uploader's kept complete, which asks again instead, is the page's alone), so the copy is put down the moment the bytes
 * are up, and a file whose complete then lost its answer waits in this page (it asks that very complete again), never
 * carried: nothing lands twice. A file is carried from her press until its bytes are up, which is where a dead zone
 * catches it.
 *
 * ★ FILED UNDER WHO IT GOES UP AS (`keepOwner`), and re-filed when the queue swaps her ticket mid-visit (a silent re-join
 * after the host's switch, a dead ticket put down), so the next open finds them under the ticket the device holds.
 * Nothing is written while there is no one to send as (a first pick waiting on its join, a door that holds her): the
 * held door keeps its own choice (`door/wait-picks-store.ts`), and those files live in the page.
 *
 * ★ AND WHAT A PAGE THAT CLOSED LEFT, ADOPTED BY ONE THAT STAYED OPEN (crumbs-93, red-team 58's LOW): a guest who scanned
 * the code twice and closed the tab she added from in a dead zone left copies that no page sent and none said, for as long
 * as the other tab stayed open (the adoption was the open's alone). An open page now looks again on its own line checks
 * (the phone's `online`, her return to the page, and the line's own cadence while it is shown), and what a CLOSED page left,
 * its lock free, comes into its queue as at an open, where the stack says them and the line carries them. The look is local
 * (IndexedDB and the lock table: no request, nothing billed). ★ IT NEEDS THE LOCKS TO TELL A CLOSED PAGE FROM A FROZEN ONE:
 * where the browser cannot say (no Web Locks) only the open takes, since a look every 20 s that took another open page's
 * files would be the one case that sends a file twice. And it never takes a record filed under this very page: that is
 * a copy this page is putting down.
 */
import { useEffect, useRef } from "react";

import type { QueueItem } from "@/lib/guest/use-upload-queue";
import { LINE_EVERY_MS } from "@/lib/guest/unsent/line";
import {
  aloneForAlbum,
  forgetFiles,
  holdThisTab,
  isRecord,
  keepFile,
  liveTabs,
  readKept,
  refile,
  restoredFile,
  sortKept,
  thisTab,
  type RestoredFile,
} from "@/lib/guest/unsent/keep";

/** The slice of a queue item the keep reads. */
type Keepable = Pick<
  QueueItem,
  "id" | "file" | "status" | "progress" | "takenAt" | "reelEligible" | "poster"
>;

/** Its bytes are up and it waits to be recorded with its burst (`queued` at 100): its complete is asked, or about to be. */
const bytesUp = (it: Pick<QueueItem, "status" | "progress">) =>
  it.status === "queued" && it.progress >= 100;

/** Whether an item is still on its way: queued (waiting its turn, or for the line) or going up. */
const onItsWay = (it: Pick<QueueItem, "status">) =>
  it.status === "queued" || it.status === "uploading";

/**
 * Where each copy stands: being written, on the phone, held by the page alone (the copy failed), or on the phone and
 * being handed back to the queue (an earlier page's, until the queue holds it).
 */
type CopyState = "writing" | "kept" | "page" | "restoring";

export function useUnsentKeep(input: {
  items: readonly Keepable[];
  /** The album's link token: the keep's shelf. */
  album: string;
  /** Who the files go up as now (`keepOwner`), or null: nothing is copied, and nothing comes back. */
  owner: string | null;
  /** Whether anything is copied at all: never in the demo, never while a door holds her. */
  enabled: boolean;
  /** A copy is on the phone (`true`), or the page alone holds the file (`false`). */
  onKept: (id: string, kept: boolean) => void;
  /** What an earlier page kept for this album and never sent, handed back once as this page opens. */
  onRestore: (files: RestoredFile[]) => void;
}): void {
  const { items, album, owner, enabled } = input;
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });
  const copies = useRef(new Map<string, CopyState>());
  /** The files whose bytes went up in this page: never carried again (the head note). */
  const upIds = useRef(new Set<string>());
  /** The owner the kept copies are filed under (they are re-filed when the queue's identity moves). */
  const filedAs = useRef<string | null>(null);
  const letGo = useRef<(() => void) | null>(null);

  /** Hold this page's lock while it keeps a copy, and let it go once it keeps none. */
  const holdWhileKept = () => {
    const keeps = [...copies.current.values()].some((s) => s !== "page");
    if (keeps && !letGo.current) letGo.current = holdThisTab();
    if (!keeps && letGo.current) {
      letGo.current();
      letGo.current = null;
    }
  };

  useEffect(
    () => () => {
      letGo.current?.();
      letGo.current = null;
    },
    [],
  );

  /* ── in step: a copy for each file on its way, none for anything else ─────────────────────────────────────────── */
  useEffect(() => {
    // A file whose bytes just went up: its copy goes, and the page alone holds it from here (the head note).
    for (const it of items) {
      if (!bytesUp(it) || upIds.current.has(it.id)) continue;
      upIds.current.add(it.id);
      latest.current.onKept(it.id, false);
    }
    const now = new Map(
      items
        .filter((it) => onItsWay(it) && !upIds.current.has(it.id))
        .map((it) => [it.id, it]),
    );
    // What is no longer on its way: its copy goes (one being written goes as its write ends).
    const gone: string[] = [];
    for (const [id, state] of copies.current) {
      if (now.has(id)) {
        // Handed back and now the queue's own: kept, as any copy of a file on its way.
        if (state === "restoring") copies.current.set(id, "kept");
        continue;
      }
      if (state === "writing" || state === "restoring") continue;
      copies.current.delete(id);
      if (state === "kept") gone.push(id);
    }
    if (gone.length > 0) void forgetFiles(gone);

    // Her ticket moved under the run (a re-join): what is kept goes up as the new one now, so it is filed so.
    if (owner && filedAs.current !== null && filedAs.current !== owner) {
      const keptIds = [...copies.current]
        .filter(([, s]) => s !== "page")
        .map(([id]) => id);
      void refile(keptIds, { owner });
    }
    if (owner) filedAs.current = owner;

    if (enabled && owner) {
      for (const it of now.values()) {
        if (copies.current.has(it.id)) continue;
        copies.current.set(it.id, "writing");
        void keepFile({
          id: it.id,
          album,
          owner,
          tab: thisTab(),
          at: Date.now(),
          name: it.file.name,
          type: it.file.type,
          lastModified: it.file.lastModified,
          blob: it.file,
          ...(it.takenAt !== undefined ? { takenAt: it.takenAt } : {}),
          ...(it.reelEligible === false
            ? { reelEligible: false as const }
            : {}),
          ...(it.poster ? { poster: it.poster } : {}),
        }).then((ok) => {
          const stillOnItsWay = latest.current.items.some(
            (q) => q.id === it.id && onItsWay(q) && !upIds.current.has(q.id),
          );
          if (!stillOnItsWay) {
            // It landed (or left) while its copy was written: the copy has nothing left to carry.
            copies.current.delete(it.id);
            if (ok) void forgetFiles([it.id]);
            holdWhileKept();
            return;
          }
          copies.current.set(it.id, ok ? "kept" : "page");
          // A ticket that moved while this one was written: the copy follows it.
          const filed = latest.current.owner;
          if (ok && filed && filed !== owner)
            void refile([it.id], { owner: filed });
          latest.current.onKept(it.id, ok);
          holdWhileKept();
        });
      }
    }
    holdWhileKept();
  }, [items, owner, enabled, album]);

  /* ── what an earlier page kept for this album, back in the queue: as the page opens, then on its own line checks ───── */
  const restored = useRef(false);
  /** One look at a time: a look that is still reading is not asked again. */
  const looking = useRef(false);
  const adopt = useRef(async (opening: boolean) => {
    const { enabled, owner, album } = latest.current;
    if (!enabled || !owner || looking.current) return;
    looking.current = true;
    try {
      // A cheap look first, outside the album's lock: where another page left nothing, a look every 20 s takes no lock.
      if (!opening) {
        const tab = thisTab();
        const there = await readKept(album);
        if (!there.some((r) => !(isRecord(r) && r.tab === tab))) return;
      }
      await aloneForAlbum(album, async () => {
        const records = await readKept(album);
        if (records.length === 0) return;
        const tab = thisTab();
        const tabs = await liveTabs();
        // After the open, only a lock table can tell a closed page from a frozen one (the head note).
        if (!opening && tabs === null) return;
        // After the open, a record filed under this page is its own copy in the middle of being put down, never a
        // closed page's. (At an open nothing is filed under it yet but what an earlier mount of this page load left.)
        const looked = opening
          ? records
          : records.filter((r) => !(isRecord(r) && r.tab === tab));
        const { take, drop } = sortKept(looked, {
          owner,
          liveTabs: tabs,
          held: new Set(latest.current.items.map((it) => it.id)),
          tab,
          now: Date.now(),
        });
        if (drop.length > 0) await forgetFiles(drop);
        if (take.length === 0) return;
        // Taken under this page, and its lock held, before the album's lock is let go: a page opening after this one
        // finds them held by a live page and leaves them.
        if (
          !(await refile(
            take.map((r) => r.id),
            { tab },
          ))
        )
          return;
        for (const r of take) copies.current.set(r.id, "restoring");
        holdWhileKept();
        latest.current.onRestore(take.map(restoredFile));
      });
    } finally {
      looking.current = false;
    }
  });
  useEffect(() => {
    if (!enabled || !owner || restored.current) return;
    restored.current = true;
    void adopt.current(true);
  }, [enabled, owner, album]);
  // ★ AND ON ITS OWN LINE CHECKS (the head note): when the phone says it is online, when she comes back to the page (a
  // hidden page's timers are frozen, so this is often the first moment it can look) and on the line's own cadence while
  // the page is shown, for as long as it has someone to send as.
  useEffect(() => {
    if (!enabled || !owner) return;
    const look = () => {
      if (document.visibilityState === "visible") void adopt.current(false);
    };
    const timer = setInterval(look, LINE_EVERY_MS);
    window.addEventListener("online", look);
    document.addEventListener("visibilitychange", look);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", look);
      document.removeEventListener("visibilitychange", look);
    };
  }, [enabled, owner, album]);
}
